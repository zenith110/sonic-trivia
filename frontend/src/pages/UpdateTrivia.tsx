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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Search,
  Clock,
  Edit,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getTriviaCategoryOptions } from "@/lib/categories";
import { triviaClient } from "@/grpc";
import { create } from "@bufbuild/protobuf";
import {
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

interface TriviaQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  answers: Answer[];
  hints: Hint[];
  includePicture?: boolean;
  pictureUrl?: string;
  points?: string;
  ring?: string;
  isUnderReview?: boolean;
}

export function UpdateTrivia() {
  const triviaCategories = getTriviaCategoryOptions();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] =
    useState<TriviaQuestion | null>(null);
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [hints, setHints] = useState<Hint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [includePicture, setIncludePicture] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string>("");
  const [points, setPoints] = useState("100");
  const [ring, setRing] = useState("10");
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | undefined
  >();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a question ID to search");
      return;
    }

    setIsLoading(true);
    try {
      const response = await triviaClient.getQuestion({ id: searchQuery });

      if (response.question) {
        const q = response.question;
        const triviaQuestion: TriviaQuestion = {
          id: q.id,
          question: q.text,
          category: q.category,
          difficulty: q.difficulty,
          answers:
            q.answerOptions?.answers.map((a) => ({
              id: a.id,
              text: a.text,
              isCorrect: a.isCorrect,
            })) || [],
          hints: q.hints.map((h) => ({
            id: h.id,
            text: h.text,
          })),
          includePicture: !!q.pictureUrl,
          pictureUrl: q.pictureUrl,
          points: q.points ? q.points.toString() : "100",
          isUnderReview: q.isUnderReview,
        };

        setSelectedQuestion(triviaQuestion);
        setQuestion(triviaQuestion.question);
        setCategory(triviaQuestion.category);
        setDifficulty(triviaQuestion.difficulty);
        setAnswers(triviaQuestion.answers);
        setHints(triviaQuestion.hints);
        setIncludePicture(triviaQuestion.includePicture || false);
        setPoints(triviaQuestion.points || "100");

        if (triviaQuestion.pictureUrl) {
          setPicturePreview(triviaQuestion.pictureUrl);
        }
      } else {
        alert("Question not found");
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      alert("Failed to fetch question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
    if (picturePreview && picturePreview.startsWith("blob:")) {
      URL.revokeObjectURL(picturePreview);
      setPicturePreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedQuestion) {
      alert("Please search and select a question first");
      return;
    }

    try {
      // Convert picture file to bytes if updated
      let pictureBytes: Uint8Array | undefined;
      if (includePicture && pictureFile) {
        const reader = new FileReader();
        const arrayBuffer = await new Promise<ArrayBuffer>(
          (resolve, reject) => {
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(pictureFile);
          },
        );
        pictureBytes = new Uint8Array(arrayBuffer);
      }

      // Call the gRPC service
      const response = await triviaClient.updateQuestion({
        id: selectedQuestion.id,
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
        points: BigInt(parseInt(points) || 100),
        pictureFile: pictureBytes,
        collectionId: selectedCollectionId,
      });

      console.log("Question updated successfully:", response);
      alert("Trivia question updated successfully!");
      handleReset();
    } catch (error) {
      console.error("Error updating trivia question:", error);
      alert("Failed to update trivia question. Please try again.");
    }
  };

  const handleReset = () => {
    setSelectedQuestion(null);
    setQuestion("");
    setCategory("");
    setDifficulty("");
    setAnswers([]);
    setHints([]);
    setSearchQuery("");
    setIncludePicture(false);
    setPictureFile(null);
    setPicturePreview("");
    setPoints("100");
    setRing("10");
    setSelectedCollectionId(undefined);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Trivia Question</CardTitle>
          <CardDescription>
            Search by question ID, text, or category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter question ID or search text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={!searchQuery || isLoading}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Update Form */}
      {selectedQuestion && !isLoading && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Update Trivia Question</CardTitle>
                <CardDescription>
                  Modify the existing trivia question details
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Question ID:{" "}
                    <span className="font-mono">{selectedQuestion.id}</span>
                  </p>
                  {selectedQuestion.isUnderReview && (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Under Review
                    </Badge>
                  )}
                </div>
              </div>

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

              {/* Optional Picture Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePicture"
                    checked={includePicture}
                    onCheckedChange={(checked) =>
                      setIncludePicture(checked as boolean)
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
                    {!pictureFile && !picturePreview ? (
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
                            <p className="font-medium">
                              {pictureFile?.name || "Current picture"}
                            </p>
                            {pictureFile && (
                              <p className="text-xs text-muted-foreground">
                                {(pictureFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
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
                            onCheckedChange={() =>
                              toggleCorrectAnswer(answer.id)
                            }
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
              <Button type="button" variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button type="submit">
                <Edit className="mr-2 h-4 w-4" />
                Update Question
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
