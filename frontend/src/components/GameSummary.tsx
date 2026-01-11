import { Zap } from "lucide-react";
import {
  TriviaCategories,
  GuessThatSongCategories,
} from "@/generated/gamemodes_pb";

type GameType = "trivia" | "guess-that-song";

interface GameSummaryProps {
  playerMode: "single" | "multiplayer";
  gameType: GameType;
  category: TriviaCategories | GuessThatSongCategories;
  questionsPerRound?: number;
  numberOfRounds?: number;
  songsPerRound?: number;
  songRounds?: number;
}

export function GameSummary({
  playerMode,
  gameType,
  category,
  questionsPerRound,
  numberOfRounds,
  songsPerRound,
  songRounds,
}: GameSummaryProps) {
  const getCategoryName = (
    cat: TriviaCategories | GuessThatSongCategories,
  ): string => {
    if (
      cat === TriviaCategories.SONIC_ADVENTURES_1_TRIVIA ||
      cat === GuessThatSongCategories.SONIC_ADVENTURES_1_GUESS_THAT_SONG
    ) {
      return "Sonic Adventure";
    } else if (
      cat === TriviaCategories.SONIC_ADVENTURES_2_TRIVIA ||
      cat === GuessThatSongCategories.SONIC_ADVENTURES_2_GUESS_THAT_SONG
    ) {
      return "Sonic Adventure 2";
    } else if (
      cat === TriviaCategories.SONIC_HEROES_TRIVIA ||
      cat === GuessThatSongCategories.SONIC_HEROES_GUESS_THAT_SONG
    ) {
      return "Sonic Heroes";
    }
    return "Unknown";
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-2">
      <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
        <Zap className="h-4 w-4" />
        Game Summary
      </p>
      <div className="text-sm text-blue-800 space-y-1">
        <p>
          <span className="font-medium">Mode:</span>{" "}
          {playerMode === "single" ? "Single Player" : "Multiplayer"}
        </p>
        <p>
          <span className="font-medium">Game:</span>{" "}
          {gameType === "trivia" ? "Trivia" : "Guess That Song"}
        </p>
        <p>
          <span className="font-medium">Category:</span>{" "}
          {getCategoryName(category)}
        </p>
        {gameType === "trivia" ? (
          <>
            <p>
              <span className="font-medium">Questions Per Round:</span>{" "}
              {questionsPerRound}
            </p>
            <p>
              <span className="font-medium">Number of Rounds:</span>{" "}
              {numberOfRounds}
            </p>
            <p>
              <span className="font-medium">Total Questions:</span>{" "}
              {(questionsPerRound || 0) * (numberOfRounds || 0)}
            </p>
          </>
        ) : (
          <>
            <p>
              <span className="font-medium">Songs Per Round:</span>{" "}
              {songsPerRound}
            </p>
            <p>
              <span className="font-medium">Number of Rounds:</span>{" "}
              {songRounds}
            </p>
            <p>
              <span className="font-medium">Total Songs:</span>{" "}
              {(songsPerRound || 0) * (songRounds || 0)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
