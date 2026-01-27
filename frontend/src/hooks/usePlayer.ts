import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { create } from "@bufbuild/protobuf";
import { playerClient } from "@/grpc";
import {
  GetPlayerRequestSchema,
  SelectCharacterRequestSchema,
  type SonicCharacter,
  type FriendList,
} from "@/generated/player_pb";
import { AuthContext } from "@/contexts/AuthContext";

export const PLAYER_QUERY_KEY = ["player"];

export function usePlayer() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const queryClient = useQueryClient();

  // Query to fetch player data
  const {
    data: player,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...PLAYER_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const request = create(GetPlayerRequestSchema, {
        id: user.id,
      });

      const response = await playerClient.getPlayer(request);
      return response.player;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to select a character
  const selectCharacterMutation = useMutation({
    mutationFn: async (characterId: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const request = create(SelectCharacterRequestSchema, {
        playerId: user.id,
        characterId: characterId,
      });

      const response = await playerClient.selectCharacter(request);
      return response;
    },
    onSuccess: (response) => {
      // Update the player query cache
      if (response.player) {
        queryClient.setQueryData(
          [...PLAYER_QUERY_KEY, user?.id],
          response.player,
        );

        // Also update the auth context
        if (authContext?.updateUser && user) {
          authContext.updateUser({
            ...user,
            selectedCharacterId: response.player.selectedCharacterId,
          });
        }
      }
    },
    onError: (error) => {
      console.error("Failed to select character:", error);
    },
  });

  return {
    player,
    isLoading,
    error,
    refetch,
    selectedCharacterId: player?.selectedCharacterId || "sonic",
    unlockedCharacters: (player?.unlockedCharacters as SonicCharacter[]) || [],
    friends: (player?.friends as FriendList[]) || [],
    selectCharacter: selectCharacterMutation.mutate,
    isSelectingCharacter: selectCharacterMutation.isPending,
    selectCharacterError: selectCharacterMutation.error,
  };
}
