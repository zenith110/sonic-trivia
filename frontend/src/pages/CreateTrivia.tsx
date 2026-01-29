import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { getTriviaCategoryOptions } from "@/lib/categories";
import { triviaClient } from "@/grpc";
import { create } from "@bufbuild/protobuf";
import {
  QuestionSchema,
  AnswerSchema,
  AnswerOptionsSchema,
  HintSchema,
} from "@/generated/trivia_pb";
import { CollectionSelector } from "@/components/trivia/CollectionSelector";
interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Hint {
  id: string;
  text: string;
}

export function CreateTrivia() {
  const triviaCategories = getTriviaCategoryOptions();

  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([
    { id: "1", text: "", isCorrect: false },
    { id: "2", text: "", isCorrect: false },
  ]);
  const [hints, setHints] = useState<Hint[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ]);
  const [includePicture, setIncludePicture] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string>("");
  const [points, setPoints] = useState("100");
  const [ring, setRing] = useState("10");
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | undefined
  >();

  const addAnswer = () => {
    const newId = (answers.length + 1).toString();
    setAnswers([...answers, { id: newId, text: "", isCorrect: false }]);
  };

  const removeAnswer = (id: string) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((answer) => answer.id !== id));
    }
  };

  const updateAnswer = (id: string, text: string) => {
    setAnswers(
      answers.map((answer) =>
        answer.id === id ? { ...answer, text } : answer,
      ),
    );
  };

  const toggleCorrectAnswer = (id: string) => {
    setAnswers(
      answers.map((answer) =>
        answer.id === id ? { ...answer, isCorrect: !answer.isCorrect } : answer,
      ),
    );
  };

  const addHint = () => {
    const newId = (hints.length + 1).toString();
    setHints([...hints, { id: newId, text: "" }]);
  };

  const removeHint = (id: string) => {
    if (hints.length > 1) {
      setHints(hints.filter((hint) => hint.id !== id));
    }
  };

  const updateHint = (id: string, text: string) => {
    setHints(hints.map((hint) => (hint.id === id ? { ...hint, text } : hint)));
  };

  const handlePictureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPictureFile(file);
      const url = URL.createObjectURL(file);
      setPicturePreview(url);
    }
  };

  const removePictureFile = () => {
    setPictureFile(null);
    if (picturePreview) {
      URL.revokeObjectURL(picturePreview);
      setPicturePreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert picture file to base64 if included
      let pictureBase64 = "";
      if (includePicture && pictureFile) {
        const reader = new FileReader();
        pictureBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix
            const base64Data = base64.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pictureFile);
        });
      }

      // Create the question proto message
      const questionProto = create(QuestionSchema, {
        text: question,
        category: category,
        difficulty: difficulty,
        answerOptions: create(AnswerOptionsSchema, {
          answers: answers.map((answer) =>
            create(AnswerSchema, {
              id: answer.id,
              text: answer.text,
              isCorrect: answer.isCorrect,
            }),
          ),
        }),
        hints: hints
          .filter((hint) => hint.text.trim() !== "")
          .map((hint) =>
            create(HintSchema, {
              id: hint.id,
              text: hint.text,
            }),
          ),
        pictureForQuestion: pictureBase64,
        points: BigInt(parseInt(points) || 100),
      });

      // Call the gRPC service
      const response = await triviaClient.createQuestion({
        question: questionProto,
        collectionId: selectedCollectionId,
      });

      console.log("Question created successfully:", response);
      alert("Trivia question created successfully!");

      // Reset form
      setQuestion("");
      setCategory("");
      setDifficulty("");
      setAnswers([
        { id: "1", text: "", isCorrect: false },
        { id: "2", text: "", isCorrect: false },
      ]);
      setHints([
        { id: "1", text: "" },
        { id: "2", text: "" },
      ]);
      setIncludePicture(false);
      removePictureFile();
      setPoints("100");
      setRing("10");
      setSelectedCollectionId(undefined);
    } catch (error) {
      console.error("Error creating trivia question:", error);
      alert("Failed to create trivia question. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Trivia Question</CardTitle>
          <CardDescription>
            Add a new trivia question with multiple choice answers
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                placeholder="Enter your trivia question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="text"
                  placeholder="100"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ring">Ring</Label>
                <Input
                  id="ring"
                  type="text"
                  placeholder="10"
                  value={ring}
                  onChange={(e) => setRing(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
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
                <Input
                  id="difficulty"
                  placeholder="e.g., Easy, Medium, Hard"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Optional Picture Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePicture"
                  checked={includePicture}
                  onCheckedChange={(checked: boolean) =>
                    setIncludePicture(checked)
                  }
                />
                <Label
                  htmlFor="includePicture"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include picture with this trivia question
                </Label>
              </div>

              {includePicture && (
                <div className="space-y-2">
                  <Label htmlFor="pictureFile">
                    Upload picture (JPG, PNG, GIF)
                  </Label>
                  {!pictureFile ? (
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
                          <p className="font-medium">{pictureFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(pictureFile.size / 1024 / 1024).toFixed(2)} MB
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
                      {picturePreview && (
                        <div className="mt-4">
                          <img
                            src={picturePreview}
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
                {answers.map((answer, index) => (
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
                        onChange={(e) =>
                          updateAnswer(answer.id, e.target.value)
                        }
                        required
                      />
                    </div>
                    {answers.length > 2 && (
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addHint}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Hint
                </Button>
              </div>

              <div className="space-y-3">
                {hints.map((hint, index) => (
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
                    {hints.length > 1 && (
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

          {/* Collection Selector */}
          <CollectionSelector
            selectedCollectionId={selectedCollectionId}
            onCollectionChange={setSelectedCollectionId}
          />

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Create Question</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
