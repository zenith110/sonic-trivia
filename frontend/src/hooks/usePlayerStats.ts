import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { create } from "@bufbuild/protobuf";
import { playerClient } from "@/grpc";
import { GetPlayerStatsRequestSchema } from "@/generated/player_pb";
import { AuthContext } from "@/contexts/AuthContext";

export const PLAYER_STATS_QUERY_KEY = ["playerStats"];

export function usePlayerStats() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  // Query to fetch detailed player statistics
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...PLAYER_STATS_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const request = create(GetPlayerStatsRequestSchema, {
        playerId: user.id,
      });

      const response = await playerClient.getPlayerStats(request);
      return response;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes (stats change more frequently than profile)
  });

  // Helper functions to convert bigint to number for display
  const toNumber = (value: bigint | undefined): number => {
    return value ? Number(value) : 0;
  };

  // Calculate derived statistics
  const totalAnswers = toNumber(stats?.totalTriviaAnswers) + toNumber(stats?.totalSongAnswers);
  const totalCorrectAnswers = toNumber(stats?.totalSuccessfulTriviaAnswers) + toNumber(stats?.totalSuccessfulSongAnswers);

  // Use the accuracy rate from the backend, but fall back to calculation if needed
  const accuracyRate = stats?.accuracyRate ? toNumber(stats.accuracyRate) :
    (totalAnswers > 0 ? Math.round((totalCorrectAnswers / totalAnswers) * 100) : 0);

  return {
    // Raw stats
    stats,
    isLoading,
    error,
    refetch,

    // Processed numbers for display
    totalPoints: toNumber(stats?.totalPoints),
    totalRings: toNumber(stats?.totalRings),
    accuracyRate,

    // Trivia stats
    totalTriviaAnswers: toNumber(stats?.totalTriviaAnswers),
    totalSuccessfulTriviaAnswers: toNumber(stats?.totalSuccessfulTriviaAnswers),

    // Song stats
    totalSongAnswers: toNumber(stats?.totalSongAnswers),
    totalSuccessfulSongAnswers: toNumber(stats?.totalSuccessfulSongAnswers),

    // Combined stats
    totalAnswers,
    totalCorrectAnswers,

    // Derived percentages
    triviaAccuracy: toNumber(stats?.totalTriviaAnswers) > 0 ?
      Math.round((toNumber(stats?.totalSuccessfulTriviaAnswers) / toNumber(stats?.totalTriviaAnswers)) * 100) : 0,
    songAccuracy: toNumber(stats?.totalSongAnswers) > 0 ?
      Math.round((toNumber(stats?.totalSuccessfulSongAnswers) / toNumber(stats?.totalSongAnswers)) * 100) : 0,
  };
}
