import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gamepad2, ListChecks, Music } from "lucide-react";

type GameType = "trivia" | "guess-that-song";

interface GameTypeSelectorProps {
  gameType: GameType;
  playerMode?: "single" | "multiplayer";
  onGameTypeChange: (type: GameType) => void;
}

export function GameTypeSelector({
  gameType,
  playerMode: _playerMode,
  onGameTypeChange,
}: GameTypeSelectorProps) {
  return (
    <Card className="border-2 hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Game Type
        </CardTitle>
        <CardDescription>
          Select the type of game you want to play
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={gameType}
          onValueChange={(value) => onGameTypeChange(value as GameType)}
          className="space-y-3"
        >
          <div
            className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
              gameType === "trivia"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-primary/30"
            }`}
            onClick={() => onGameTypeChange("trivia")}
          >
            <RadioGroupItem value="trivia" id="trivia" />
            <Label
              htmlFor="trivia"
              className="flex-1 cursor-pointer flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <ListChecks className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">Trivia</p>
                <p className="text-sm text-muted-foreground">
                  Answer Sonic trivia questions
                </p>
              </div>
            </Label>
          </div>

          <div
            className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
              gameType === "guess-that-song"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-primary/30"
            }`}
            onClick={() => onGameTypeChange("guess-that-song")}
          >
            <RadioGroupItem value="guess-that-song" id="guess-that-song" />
            <Label
              htmlFor="guess-that-song"
              className="flex-1 cursor-pointer flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                <Music className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="font-semibold">Guess That Song</p>
                <p className="text-sm text-muted-foreground">
                  Identify Sonic music tracks
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
