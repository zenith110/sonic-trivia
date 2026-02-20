import { Button } from "@/components/ui/button";
import { generateUUID } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Upload, Image as ImageIcon } from "lucide-react";
import {
  getTriviaCategoryOptions,
  getDifficultyOptions,
} from "@/lib/categories";

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Hint {
  id: string;
  text: string;
}

export interface TriviaQuestion {
  question: string;
  category: string;
  difficulty: string;
  answers: Answer[];
  hints: Hint[];
  includePicture: boolean;
  pictureFile: File | null;
  picturePreview: string;
  points: string;
  ring: string;
}

interface QuestionEditorProps {
  question: TriviaQuestion;
  questionNumber?: number;
  totalQuestions?: number;
  onUpdate: (updates: Partial<TriviaQuestion>) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
}

export function QuestionEditor({
  question,
  questionNumber,
  totalQuestions,
  onUpdate,
  onNext,
  onPrevious,
  showNavigation = false,
}: QuestionEditorProps) {
  const triviaCategories = getTriviaCategoryOptions();
  const difficultyOptions = getDifficultyOptions();

  const addAnswer = () => {
    const newId = generateUUID();
    onUpdate({
      answers: [...question.answers, { id: newId, text: "", isCorrect: false }],
    });
  };

  const removeAnswer = (id: string) => {
    if (question.answers.length <= 2) return;
    onUpdate({
      answers: question.answers.filter((answer) => answer.id !== id),
    });
  };

  const updateAnswer = (id: string, text: string) => {
    onUpdate({
      answers: question.answers.map((answer) =>
        answer.id === id ? { ...answer, text } : answer,
      ),
    });
  };

  const toggleCorrectAnswer = (id: string) => {
    onUpdate({
      answers: question.answers.map((answer) =>
        answer.id === id ? { ...answer, isCorrect: !answer.isCorrect } : answer,
      ),
    });
  };

  const addHint = () => {
    const newId = generateUUID();
    onUpdate({
      hints: [...question.hints, { id: newId, text: "" }],
    });
  };

  const removeHint = (id: string) => {
    if (question.hints.length <= 1) return;
    onUpdate({
      hints: question.hints.filter((hint) => hint.id !== id),
    });
  };

  const updateHint = (id: string, text: string) => {
    onUpdate({
      hints: question.hints.map((hint) =>
        hint.id === id ? { ...hint, text } : hint,
      ),
    });
  };

  const handlePictureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({
        pictureFile: file,
        picturePreview: url,
      });
    }
  };

  const removePictureFile = () => {
    if (question.picturePreview) {
      URL.revokeObjectURL(question.picturePreview);
    }
    onUpdate({
      pictureFile: null,
      picturePreview: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {questionNumber !== undefined && totalQuestions !== undefined ? (
              <>
                <CardTitle>
                  Question {questionNumber} of {totalQuestions}
                </CardTitle>
                <CardDescription>
                  Fill in the details for this trivia question
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle>Question Details</CardTitle>
                <CardDescription>
                  Fill in the details for your trivia question
                </CardDescription>
              </>
            )}
          </div>
          {showNavigation && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={!onPrevious || questionNumber === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={!onNext || questionNumber === totalQuestions}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="question">Question</Label>
          <Textarea
            id="question"
            placeholder="Enter your trivia question..."
            value={question.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            required
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={question.category}
              onValueChange={(value) => onUpdate({ category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {triviaCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={question.difficulty}
              onValueChange={(value) => onUpdate({ difficulty: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="text"
              placeholder="100"
              value={question.points}
              onChange={(e) => onUpdate({ points: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ring">Ring</Label>
            <Input
              id="ring"
              type="text"
              placeholder="10"
              value={question.ring}
              onChange={(e) => onUpdate({ ring: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Optional Picture Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includePicture"
              checked={question.includePicture}
              onCheckedChange={(checked: boolean) =>
                onUpdate({ includePicture: checked })
              }
            />
            <Label
              htmlFor="includePicture"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include picture with this trivia question
            </Label>
          </div>

          {question.includePicture && (
            <div className="space-y-2">
              <Label htmlFor="pictureFile">
                Upload picture (JPG, PNG, GIF)
              </Label>
              {!question.pictureFile ? (
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-6">
                  <label
                    htmlFor="pictureFile"
                    className="flex cursor-pointer flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground">
                      JPG, PNG, GIF (Max 5MB)
                    </span>
                    <Input
                      id="pictureFile"
                      type="file"
                      accept="image/*"
                      onChange={handlePictureFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{question.pictureFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(question.pictureFile.size / 1024 / 1024).toFixed(2)}{" "}
                        MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removePictureFile}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {question.picturePreview && (
                    <div className="mt-4">
                      <img
                        src={question.picturePreview}
                        alt="Preview"
                        className="max-h-64 w-full rounded-lg object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Answers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Answers</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAnswer}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Answer
            </Button>
          </div>

          <div className="space-y-3">
            {question.answers.map((answer, index) => (
              <div
                key={answer.id}
                className="flex items-start gap-2 rounded-lg border p-3"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Answer {index + 1}
                    </Label>
                    <Checkbox
                      checked={answer.isCorrect}
                      onCheckedChange={() => toggleCorrectAnswer(answer.id)}
                    />
                    <span className="text-xs text-muted-foreground">
                      Correct
                    </span>
                  </div>
                  <Input
                    placeholder="Enter answer..."
                    value={answer.text}
                    onChange={(e) => updateAnswer(answer.id, e.target.value)}
                    required
                  />
                </div>
                {question.answers.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAnswer(answer.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hints Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Hints (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Provide clues to help players answer the question
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addHint}>
              <Plus className="mr-2 h-4 w-4" />
              Add Hint
            </Button>
          </div>

          <div className="space-y-3">
            {question.hints.map((hint, index) => (
              <div
                key={hint.id}
                className="flex items-start gap-2 rounded-lg border p-3"
              >
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Hint {index + 1}
                  </Label>
                  <Textarea
                    placeholder="Enter a hint..."
                    value={hint.text}
                    onChange={(e) => updateHint(hint.id, e.target.value)}
                    rows={2}
                  />
                </div>
                {question.hints.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHint(hint.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
