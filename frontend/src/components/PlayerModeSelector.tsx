import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, User } from "lucide-react";

type PlayerMode = "single" | "multiplayer";

interface PlayerModeSelectorProps {
  playerMode: PlayerMode;
  onPlayerModeChange: (mode: PlayerMode) => void;
}

export function PlayerModeSelector({
  playerMode,
  onPlayerModeChange,
}: PlayerModeSelectorProps) {
  return (
    <Card className="border-2 hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Player Mode
        </CardTitle>
        <CardDescription>
          Choose between single player or multiplayer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={playerMode}
          onValueChange={(value) => onPlayerModeChange(value as PlayerMode)}
          className="space-y-3"
        >
          <div
            className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
              playerMode === "single"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-primary/30"
            }`}
            onClick={() => onPlayerModeChange("single")}
          >
            <RadioGroupItem value="single" id="single" />
            <Label
              htmlFor="single"
              className="flex-1 cursor-pointer flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">Single Player</p>
                <p className="text-sm text-muted-foreground">
                  Play solo and beat your high score
                </p>
              </div>
            </Label>
          </div>

          <div
            className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
              playerMode === "multiplayer"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-primary/30"
            }`}
            onClick={() => onPlayerModeChange("multiplayer")}
          >
            <RadioGroupItem value="multiplayer" id="multiplayer" />
            <Label
              htmlFor="multiplayer"
              className="flex-1 cursor-pointer flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Multiplayer</p>
                <p className="text-sm text-muted-foreground">
                  Compete with other players
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
