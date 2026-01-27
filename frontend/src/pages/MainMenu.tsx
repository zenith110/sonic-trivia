import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gamepad2, Play, Users as UsersIcon } from "lucide-react";
import {
  IndividualGameModes,
  TriviaCategories,
  GuessThatSongCategories,
} from "@/generated/gamemodes_pb";
import { MainMenuHeader } from "@/components/MainMenuHeader";
import { PlayerModeSelector } from "@/components/PlayerModeSelector";
import { GameTypeSelector } from "@/components/GameTypeSelector";
import { CategorySelector } from "@/components/CategorySelector";
import { TriviaSettings } from "@/components/TriviaSettings";
import { GuessThatSongSettings } from "@/components/GuessThatSongSettings";
import { GameSummary } from "@/components/GameSummary";
import { MultiplayerLobby } from "./MultiplayerLobby";
import { JoinRoomDialog } from "@/components/JoinRoomDialog";
import { CharacterGallery } from "@/components/CharacterGallery";
import { usePlayer } from "@/hooks/usePlayer";

type PlayerMode = "single" | "multiplayer";
type GameType = "trivia" | "guess-that-song";

interface MainMenuProps {
  onNavigateToDashboard: () => void;
  onNavigateToLeaderboard: () => void;
  onNavigateToProfile?: () => void;
}

export function MainMenu({
  onNavigateToDashboard,
  onNavigateToLeaderboard,
  onNavigateToProfile,
}: MainMenuProps) {
  const {
    selectedCharacterId,
    selectCharacter,
    isSelectingCharacter,
    unlockedCharacters,
  } = usePlayer();

  const [playerMode, setPlayerMode] = useState<PlayerMode>("single");
  const [gameType, setGameType] = useState<GameType>("trivia");
  const [triviaCategory, setTriviaCategory] = useState<TriviaCategories>(
    TriviaCategories.SONIC_ADVENTURES_2_TRIVIA,
  );
  const [songCategory, setSongCategory] = useState<GuessThatSongCategories>(
    GuessThatSongCategories.SONIC_ADVENTURES_2_GUESS_THAT_SONG,
  );
  const [questionsPerRound, setQuestionsPerRound] = useState(10);
  const [numberOfRounds, setNumberOfRounds] = useState(3);
  const [songsPerRound, setSongsPerRound] = useState(5);
  const [songRounds, setSongRounds] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
  const [showJoinRoomDialog, setShowJoinRoomDialog] = useState(false);
  const [showCharacterGallery, setShowCharacterGallery] = useState(false);

  const handleStartGame = async () => {
    setIsLoading(true);

    // Determine the game mode based on selections
    let gameMode: IndividualGameModes;

    if (playerMode === "single") {
      if (gameType === "trivia") {
        gameMode = IndividualGameModes.SINGLE_PLAYER_TRIVIA;
      } else {
        gameMode = IndividualGameModes.SINGLE_PLAYER_GUESS_THAT_SONG;
      }

      // For single player, start game directly
      // TODO: Implement single player game start logic
      console.log("Starting single player game:", {
        gameMode,
        category: gameType === "trivia" ? triviaCategory : songCategory,
        playerMode,
        gameType,
        questionsPerRound:
          gameType === "trivia" ? questionsPerRound : undefined,
        numberOfRounds: gameType === "trivia" ? numberOfRounds : undefined,
        songsPerRound:
          gameType === "guess-that-song" ? songsPerRound : undefined,
        songRounds: gameType === "guess-that-song" ? songRounds : undefined,
      });

      setTimeout(() => {
        setIsLoading(false);
        // TODO: Navigate to single player game screen
      }, 1000);
    } else {
      // Multiplayer - show lobby
      if (gameType === "trivia") {
        gameMode = IndividualGameModes.MULTIPLAYER_TRIVIA;
      } else {
        gameMode = IndividualGameModes.MULTIPLAYER_GUESS_THAT_SONG;
      }

      setIsLoading(false);
      setShowMultiplayerLobby(true);
    }
  };

  const handleJoinRoom = (roomCode: string) => {
    setShowJoinRoomDialog(false);
    // TODO: Call backend API to join room and get room details
    console.log("Joining room with code:", roomCode);
    // For now, just show the multiplayer lobby
    setShowMultiplayerLobby(true);
  };

  const handleSelectCharacter = async (characterId: string) => {
    selectCharacter(characterId);
  };

  // Show multiplayer lobby if user chose multiplayer
  if (showMultiplayerLobby) {
    const gameMode =
      gameType === "trivia"
        ? IndividualGameModes.MULTIPLAYER_TRIVIA
        : IndividualGameModes.MULTIPLAYER_GUESS_THAT_SONG;

    return (
      <MultiplayerLobby
        gameMode={gameMode}
        category={gameType === "trivia" ? triviaCategory : songCategory}
        gameType={gameType}
        questionsPerRound={
          gameType === "trivia" ? questionsPerRound : undefined
        }
        numberOfRounds={gameType === "trivia" ? numberOfRounds : undefined}
        songsPerRound={
          gameType === "guess-that-song" ? songsPerRound : undefined
        }
        songRounds={gameType === "guess-that-song" ? songRounds : undefined}
        onBack={() => setShowMultiplayerLobby(false)}
        onStartGame={() => {
          // TODO: Navigate to actual game screen
          console.log("Starting multiplayer game");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MainMenuHeader
        onNavigateToDashboard={onNavigateToDashboard}
        onNavigateToLeaderboard={onNavigateToLeaderboard}
        onJoinRoom={() => setShowJoinRoomDialog(true)}
        onNavigateToProfile={onNavigateToProfile}
      />

      {/* Main Content */}
      <div className="flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-4xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Game Setup
            </h1>
            <p className="text-muted-foreground text-lg">
              Choose your game mode and get ready to play!
            </p>

            {/* Character Selection Button */}
            <div className="pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowCharacterGallery(true)}
                className="h-12"
              >
                <UsersIcon className="h-5 w-5 mr-2" />
                Select Character
                {selectedCharacterId && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {unlockedCharacters.find(
                      (char) => char.id === selectedCharacterId,
                    )?.name || "Selected"}
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <PlayerModeSelector
              playerMode={playerMode}
              onPlayerModeChange={setPlayerMode}
            />

            <GameTypeSelector
              gameType={gameType}
              playerMode={playerMode}
              onGameTypeChange={setGameType}
            />
          </div>

          <CategorySelector
            gameType={gameType}
            triviaCategory={triviaCategory}
            songCategory={songCategory}
            onTriviaCategoryChange={setTriviaCategory}
            onSongCategoryChange={setSongCategory}
          />

          <div className="space-y-4">
            {/* Trivia Settings - Questions and Rounds */}
            {gameType === "trivia" && (
              <TriviaSettings
                questionsPerRound={questionsPerRound}
                numberOfRounds={numberOfRounds}
                onQuestionsPerRoundChange={setQuestionsPerRound}
                onNumberOfRoundsChange={setNumberOfRounds}
              />
            )}

            {/* Guess That Song Settings - Songs and Rounds */}
            {gameType === "guess-that-song" && (
              <GuessThatSongSettings
                songsPerRound={songsPerRound}
                numberOfRounds={songRounds}
                onSongsPerRoundChange={setSongsPerRound}
                onNumberOfRoundsChange={setSongRounds}
              />
            )}

            <GameSummary
              playerMode={playerMode}
              gameType={gameType}
              category={gameType === "trivia" ? triviaCategory : songCategory}
              questionsPerRound={
                gameType === "trivia" ? questionsPerRound : undefined
              }
              numberOfRounds={
                gameType === "trivia" ? numberOfRounds : undefined
              }
              songsPerRound={
                gameType === "guess-that-song" ? songsPerRound : undefined
              }
              songRounds={
                gameType === "guess-that-song" ? songRounds : undefined
              }
            />
          </div>

          {/* Start Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className="w-full md:w-auto min-w-[300px] h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/50 transition-all duration-200 hover:scale-105"
              onClick={handleStartGame}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Starting Game...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Start Game
                </span>
              )}
            </Button>
          </div>

          <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
        `}</style>
        </div>
      </div>

      {/* Join Room Dialog */}
      {showJoinRoomDialog && (
        <JoinRoomDialog
          onJoinRoom={handleJoinRoom}
          onCancel={() => setShowJoinRoomDialog(false)}
        />
      )}

      {/* Character Gallery */}
      {showCharacterGallery && (
        <CharacterGallery
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={handleSelectCharacter}
          onClose={() => setShowCharacterGallery(false)}
          isSelecting={isSelectingCharacter}
          unlockedCharacters={unlockedCharacters}
        />
      )}
    </div>
  );
}
