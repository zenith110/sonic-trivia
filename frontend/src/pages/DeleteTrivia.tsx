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
import { Search, Trash2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { triviaClient } from "@/grpc";

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
}

export function DeleteTrivia() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] =
    useState<TriviaQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        };

        setSelectedQuestion(triviaQuestion);
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

  const handleDelete = async () => {
    if (!selectedQuestion) return;

    try {
      await triviaClient.deleteQuestion({ id: selectedQuestion.id });

      console.log("Question deleted successfully");
      alert("Trivia question deleted successfully!");
      setSelectedQuestion(null);
      setSearchQuery("");
    } catch (error) {
      console.error("Error deleting trivia question:", error);
      alert("Failed to delete trivia question. Please try again.");
    }
  };

  const handleReset = () => {
    setSelectedQuestion(null);
    setSearchQuery("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Delete Trivia Question</CardTitle>
          <CardDescription>
            Search for a question to delete it permanently
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
          </CardContent>
        </Card>
      )}

      {/* Question Preview & Delete */}
      {selectedQuestion && !isLoading && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-destructive">
                  Confirm Deletion
                </CardTitle>
                <CardDescription>
                  This action cannot be undone. The question will be permanently
                  removed from the database.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Question ID
                </Label>
                <p className="font-mono text-sm">{selectedQuestion.id}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Question
                </Label>
                <p className="text-sm">{selectedQuestion.question}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Category
                  </Label>
                  <p className="text-sm">{selectedQuestion.category}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Difficulty
                  </Label>
                  <p className="text-sm">{selectedQuestion.difficulty}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Answers</Label>
                <div className="space-y-2">
                  {selectedQuestion.answers.map((answer, index) => (
                    <div
                      key={answer.id}
                      className="flex items-center gap-2 rounded-md bg-background p-2 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span>{answer.text}</span>
                      {answer.isCorrect && (
                        <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                          Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuestion.hints && selectedQuestion.hints.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Hints</Label>
                  <div className="space-y-2">
                    {selectedQuestion.hints.map((hint, index) => (
                      <div
                        key={hint.id}
                        className="rounded-md bg-background p-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {index + 1}.
                        </span>{" "}
                        {hint.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Question
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the trivia question and all associated data from the
                    database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, delete question
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
