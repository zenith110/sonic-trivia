import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Copy,
  Check,
  Shuffle,
  UserPlus,
  ArrowLeft,
  Crown,
  Play,
  Loader2,
  Settings,
  Lock,
  Globe,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  IndividualGameModes,
  TriviaCategories,
  GuessThatSongCategories,
} from "@/generated/gamemodes_pb";
import { useAuth } from "@/hooks/useAuth";

interface MultiplayerLobbyProps {
  gameMode: IndividualGameModes;
  category: TriviaCategories | GuessThatSongCategories;
  gameType: "trivia" | "guess-that-song";
  questionsPerRound?: number;
  numberOfRounds?: number;
  songsPerRound?: number;
  songRounds?: number;
  onBack: () => void;
  onStartGame: () => void;
}

interface Player {
  id: string;
  username: string;
  isHost: boolean;
  isReady: boolean;
}

export function MultiplayerLobby({
  gameMode,
  category,
  gameType,
  questionsPerRound,
  numberOfRounds,
  songsPerRound,
  songRounds,
  onBack,
  onStartGame,
}: MultiplayerLobbyProps) {
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState<string>("");
  const [roomCreated, setRoomCreated] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSearchingRandom, setIsSearchingRandom] = useState(false);
  const [roomName, setRoomName] = useState(`${user?.username}'s Room`);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(true);

  // Mock players data - replace with actual room data
  const [players, setPlayers] = useState<Player[]>([
    {
      id: user?.id || "1",
      username: user?.username || "Player 1",
      isHost: true,
      isReady: true,
    },
  ]);

  const isHost = players.find((p) => p.id === user?.id)?.isHost || false;
  const allPlayersReady = players.every((p) => p.isReady);
  const canStartGame = isHost && players.length >= 2 && allPlayersReady;

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);

    // TODO: Call backend API to create room
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const code = generateRoomCode();
    setRoomCode(code);
    setRoomCreated(true);
    setIsCreatingRoom(false);

    console.log("Room created:", {
      code,
      roomName,
      maxPlayers,
      isPrivate,
      gameMode,
      category,
    });
  };

  const handleRandomMatch = async () => {
    setIsSearchingRandom(true);

    // TODO: Call backend API to find random room or create one
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const code = generateRoomCode();
    setRoomCode(code);
    setRoomCreated(true);
    setIsSearchingRandom(false);

    // Mock: Add random players
    setPlayers([
      ...players,
      {
        id: "2",
        username: "Sonic_Fan_92",
        isHost: false,
        isReady: true,
      },
    ]);
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStartGameClick = () => {
    // TODO: Send start game signal to all players
    console.log("Starting game for room:", roomCode);
    onStartGame();
  };

  const getCategoryName = () => {
    const categoryMap: Record<number, string> = {
      1: "Sonic Adventure 2",
      2: "Sonic Adventure",
      3: "Sonic Heroes",
    };
    return categoryMap[category] || "Unknown";
  };

  if (!roomCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Top Navigation Bar */}
        <header className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <h1 className="text-xl font-bold text-gray-900">
                  Multiplayer Setup
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex items-center justify-center p-6 py-12">
          <div className="w-full max-w-2xl space-y-6">
            {/* Game Info Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Game Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Game Type:</span>
                    <p className="font-semibold">
                      {gameType === "trivia" ? "Trivia" : "Guess That Song"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-semibold">{getCategoryName()}</p>
                  </div>
                  {gameType === "trivia" ? (
                    <>
                      <div>
                        <span className="text-muted-foreground">
                          Questions/Round:
                        </span>
                        <p className="font-semibold">{questionsPerRound}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rounds:</span>
                        <p className="font-semibold">{numberOfRounds}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-muted-foreground">
                          Songs/Round:
                        </span>
                        <p className="font-semibold">{songsPerRound}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rounds:</span>
                        <p className="font-semibold">{songRounds}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Create Room Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Create Private Room
                </CardTitle>
                <CardDescription>
                  Create a room and invite your friends to join
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter room name"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPlayers">Max Players</Label>
                  <select
                    id="maxPlayers"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    className="w-full h-12 px-3 rounded-md border border-input bg-background"
                  >
                    <option value={2}>2 Players</option>
                    <option value={3}>3 Players</option>
                    <option value={4}>4 Players</option>
                    <option value={6}>6 Players</option>
                    <option value={8}>8 Players</option>
                    <option value={10}>10 Players</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomType">Room Privacy</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={isPrivate ? "default" : "outline"}
                      className="flex-1 h-12"
                      onClick={() => setIsPrivate(true)}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Private
                    </Button>
                    <Button
                      type="button"
                      variant={!isPrivate ? "default" : "outline"}
                      className="flex-1 h-12"
                      onClick={() => setIsPrivate(false)}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Public
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isPrivate
                      ? "Only players with the room code can join"
                      : "Anyone can find and join this room"}
                  </p>
                </div>

                <Button
                  className="w-full h-12"
                  onClick={handleCreateRoom}
                  disabled={isCreatingRoom || !roomName.trim()}
                >
                  {isCreatingRoom ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Room...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Room & Get Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gradient-to-br from-slate-50 to-slate-100 px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* Random Match Card */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Quick Match
                </CardTitle>
                <CardDescription>
                  Find and join a random public game instantly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full h-12 bg-green-600 hover:bg-green-700"
                  onClick={handleRandomMatch}
                  disabled={isSearchingRandom}
                >
                  {isSearchingRandom ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finding Players...
                    </>
                  ) : (
                    <>
                      <Shuffle className="h-4 w-4 mr-2" />
                      Find Random Game
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Room Created - Lobby View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Leave Room
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-bold text-gray-900">{roomName}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                Waiting for players
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Room Info & Players */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Code Card */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Invite Friends
                </CardTitle>
                <CardDescription>
                  Share this code with your friends to join
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted rounded-lg p-4 font-mono text-3xl font-bold text-center tracking-wider">
                    {roomCode}
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleCopyRoomCode}
                    className="h-auto"
                  >
                    {isCopied ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Players can join using the "Join Room" option from the main
                  menu
                </p>
              </CardContent>
            </Card>

            {/* Players List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Players ({players.length}/{maxPlayers})
                  </div>
                  {isHost && (
                    <Button
                      size="sm"
                      onClick={handleStartGameClick}
                      disabled={!canStartGame}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Game
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        player.isReady
                          ? "bg-green-50 border-green-200"
                          : "bg-muted border-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                          {player.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {player.username}
                            </span>
                            {player.isHost && (
                              <Crown className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {player.isHost ? "Host" : "Player"}
                          </span>
                        </div>
                      </div>
                      <div>
                        {player.isReady ? (
                          <div className="flex items-center gap-2 text-green-600 font-medium">
                            <Check className="h-4 w-4" />
                            Ready
                          </div>
                        ) : (
                          <div className="text-muted-foreground">Not Ready</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty Slots */}
                  {Array.from({ length: maxPlayers - players.length }).map(
                    (_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-muted bg-muted/30"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-muted-foreground">
                          Waiting for player...
                        </span>
                      </div>
                    ),
                  )}
                </div>

                {!canStartGame && isHost && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    💡 You need at least 2 players and all players ready to
                    start the game
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Game Settings Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Game Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Game Type</span>
                  <p className="font-semibold">
                    {gameType === "trivia" ? "Trivia" : "Guess That Song"}
                  </p>
                </div>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <p className="font-semibold">{getCategoryName()}</p>
                </div>
                <Separator />
                {gameType === "trivia" ? (
                  <>
                    <div>
                      <span className="text-muted-foreground">
                        Questions Per Round
                      </span>
                      <p className="font-semibold">{questionsPerRound}</p>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground">Rounds</span>
                      <p className="font-semibold">{numberOfRounds}</p>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground">
                        Total Questions
                      </span>
                      <p className="font-semibold">
                        {(questionsPerRound || 0) * (numberOfRounds || 0)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-muted-foreground">
                        Songs Per Round
                      </span>
                      <p className="font-semibold">{songsPerRound}</p>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground">Rounds</span>
                      <p className="font-semibold">{songRounds}</p>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground">Total Songs</span>
                      <p className="font-semibold">
                        {(songsPerRound || 0) * (songRounds || 0)}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base">Room Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Code</span>
                  <span className="font-mono font-semibold">{roomCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Type</span>
                  <span className="font-semibold">
                    {isPrivate ? "Private" : "Public"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Players</span>
                  <span className="font-semibold">{maxPlayers}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
