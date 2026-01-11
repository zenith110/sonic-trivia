import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings, Sparkles, Music } from "lucide-react";
import {
  TriviaCategories,
  GuessThatSongCategories,
} from "@/generated/gamemodes_pb";

type GameType = "trivia" | "guess-that-song";

interface CategorySelectorProps {
  gameType: GameType;
  triviaCategory: TriviaCategories;
  songCategory: GuessThatSongCategories;
  onTriviaCategoryChange: (category: TriviaCategories) => void;
  onSongCategoryChange: (category: GuessThatSongCategories) => void;
}

export function CategorySelector({
  gameType,
  triviaCategory,
  songCategory,
  onTriviaCategoryChange,
  onSongCategoryChange,
}: CategorySelectorProps) {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Game Settings
        </CardTitle>
        <CardDescription>Choose a category for your game</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-base font-medium">
            Category
          </Label>
          {gameType === "trivia" ? (
            <Select
              value={triviaCategory.toString()}
              onValueChange={(value) =>
                onTriviaCategoryChange(parseInt(value) as TriviaCategories)
              }
            >
              <SelectTrigger id="category" className="h-12">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value={TriviaCategories.SONIC_ADVENTURES_1_TRIVIA.toString()}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    Sonic Adventure
                  </div>
                </SelectItem>
                <SelectItem
                  value={TriviaCategories.SONIC_ADVENTURES_2_TRIVIA.toString()}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Sonic Adventure 2
                  </div>
                </SelectItem>
                <SelectItem
                  value={TriviaCategories.SONIC_HEROES_TRIVIA.toString()}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Sonic Heroes
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={songCategory.toString()}
              onValueChange={(value) =>
                onSongCategoryChange(
                  parseInt(value) as GuessThatSongCategories,
                )
              }
            >
              <SelectTrigger id="category" className="h-12">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value={GuessThatSongCategories.SONIC_ADVENTURES_1_GUESS_THAT_SONG.toString()}
                >
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-blue-500" />
                    Sonic Adventure
                  </div>
                </SelectItem>
                <SelectItem
                  value={GuessThatSongCategories.SONIC_ADVENTURES_2_GUESS_THAT_SONG.toString()}
                >
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-indigo-500" />
                    Sonic Adventure 2
                  </div>
                </SelectItem>
                <SelectItem
                  value={GuessThatSongCategories.SONIC_HEROES_GUESS_THAT_SONG.toString()}
                >
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-purple-500" />
                    Sonic Heroes
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
