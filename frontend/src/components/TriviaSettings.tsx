import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";

interface TriviaSettingsProps {
  questionsPerRound: number;
  numberOfRounds: number;
  onQuestionsPerRoundChange: (value: number) => void;
  onNumberOfRoundsChange: (value: number) => void;
}

export function TriviaSettings({
  questionsPerRound,
  numberOfRounds,
  onQuestionsPerRoundChange,
  onNumberOfRoundsChange,
}: TriviaSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Trivia Configuration
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="questionsPerRound" className="text-base font-medium">
            Questions Per Round
          </Label>
          <Select
            value={questionsPerRound.toString()}
            onValueChange={(value) => onQuestionsPerRoundChange(parseInt(value))}
          >
            <SelectTrigger id="questionsPerRound" className="h-12">
              <SelectValue placeholder="Select questions per round" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">
                <div className="flex items-center justify-between w-full">
                  <span>5 Questions</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Quick
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="10">
                <div className="flex items-center justify-between w-full">
                  <span>10 Questions</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Standard
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="15">
                <div className="flex items-center justify-between w-full">
                  <span>15 Questions</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Extended
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="20">
                <div className="flex items-center justify-between w-full">
                  <span>20 Questions</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Long
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="25">
                <div className="flex items-center justify-between w-full">
                  <span>25 Questions</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Marathon
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Number of questions in each round
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfRounds" className="text-base font-medium">
            Number of Rounds
          </Label>
          <Select
            value={numberOfRounds.toString()}
            onValueChange={(value) => onNumberOfRoundsChange(parseInt(value))}
          >
            <SelectTrigger id="numberOfRounds" className="h-12">
              <SelectValue placeholder="Select number of rounds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Round</SelectItem>
              <SelectItem value="2">2 Rounds</SelectItem>
              <SelectItem value="3">3 Rounds</SelectItem>
              <SelectItem value="4">4 Rounds</SelectItem>
              <SelectItem value="5">5 Rounds</SelectItem>
              <SelectItem value="10">10 Rounds</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Total rounds in the game
          </p>
        </div>
      </div>

      {/* Game Info Summary */}
      <div className="bg-muted/50 rounded-lg p-3 border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Questions:</span>
          <span className="font-semibold">
            {questionsPerRound * numberOfRounds}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-muted-foreground">Estimated Time:</span>
          <span className="font-semibold">
            ~{Math.ceil((questionsPerRound * numberOfRounds * 30) / 60)} minutes
          </span>
        </div>
      </div>
    </div>
  );
}
