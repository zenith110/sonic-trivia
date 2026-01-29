import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { triviaClient } from "@/grpc";
import { create } from "@bufbuild/protobuf";
import {
  QuestionSchema,
  AnswerSchema,
  AnswerOptionsSchema,
  HintSchema,
  CreateQuestionCollectionRequestSchema,
} from "@/generated/trivia_pb";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CollectionsList } from "@/components/trivia/CollectionsList";
import { CollectionForm } from "@/components/trivia/CollectionForm";
import { QuestionEditor } from "@/components/trivia/QuestionEditor";
import type { TriviaQuestion } from "@/components/trivia/QuestionEditor";

interface Collection {
  id: string;
  name: string;
  description: string;
  sizeOfCollection: string;
  createdBy: string;
  isUnderReview?: boolean;
}

type ViewMode = "list" | "create" | "edit";

export function TriviaCollections() {
  const { user } = useAuth();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCollections, setTotalCollections] = useState(0);
  const pageSize = 5;

  // Collection form state
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [collectionSize, setCollectionSize] = useState("10");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(
    null,
  );

  // Load collections when view changes to list or page changes
  useEffect(() => {
    if (viewMode === "list") {
      loadCollections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentPage, user]);

  const loadCollections = async () => {
    if (!user) return;

    setIsLoadingCollections(true);
    try {
      const response = await triviaClient.getQuestionCollections({
        userId: user.id || user.username,
        page: currentPage,
        pageSize: pageSize,
      });

      if (response.collections) {
        const collectionsList: Collection[] = response.collections.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          sizeOfCollection: c.questions?.length.toString() || "0",
          createdBy: c.createdBy,
          isUnderReview: c.isUnderReview,
        }));
        setCollections(collectionsList);
        setTotalCollections(response.total);
        setTotalPages(Math.ceil(response.total / pageSize));
      }
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setIsLoadingCollections(false);
    }
  };

  // Initialize questions when creating collection
  useEffect(() => {
    if (viewMode === "create" && questions.length === 0) {
      const size = parseInt(collectionSize) || 1;
      const initialQuestions: TriviaQuestion[] = Array.from(
        { length: size },
        () => createEmptyQuestion(),
      );
      setQuestions(initialQuestions);
    }
  }, [viewMode, collectionSize, questions.length]);

  const createEmptyQuestion = (): TriviaQuestion => ({
    question: "",
    category: "",
    difficulty: "",
    answers: [
      { id: "1", text: "", isCorrect: false },
      { id: "2", text: "", isCorrect: false },
    ],
    hints: [
      { id: "1", text: "" },
      { id: "2", text: "" },
    ],
    includePicture: false,
    pictureFile: null,
    picturePreview: "",
    points: "100",
    ring: "10",
  });

  const currentQuestion = questions[currentQuestionIndex] || null;

  const updateCurrentQuestion = (updates: Partial<TriviaQuestion>) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[currentQuestionIndex] = {
        ...newQuestions[currentQuestionIndex],
        ...updates,
      };
      return newQuestions;
    });
  };

  const handleSizeChange = (newSize: string) => {
    const size = parseInt(newSize) || 1;
    setCollectionSize(newSize);

    // Adjust questions array when size changes
    if (size > questions.length) {
      const additionalQuestions = Array.from(
        { length: size - questions.length },
        () => createEmptyQuestion(),
      );
      setQuestions([...questions, ...additionalQuestions]);
    } else if (size < questions.length) {
      setQuestions(questions.slice(0, size));
      if (currentQuestionIndex >= size) {
        setCurrentQuestionIndex(size - 1);
      }
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitCollection = async () => {
    try {
      if (!user) {
        alert("You must be logged in to create a collection");
        return;
      }

      // Validate collection metadata
      if (!collectionName || !collectionDescription) {
        alert("Please fill in collection name and description");
        return;
      }

      // Create all questions first and collect their IDs
      const questionIds: string[] = [];

      for (const q of questions) {
        // Validate question
        if (!q.question || !q.category || !q.difficulty) {
          alert("Please fill in all required fields for all questions");
          return;
        }

        if (q.answers.filter((a) => a.isCorrect).length === 0) {
          alert("Each question must have at least one correct answer");
          return;
        }

        // Convert picture file to base64 if included
        let pictureBase64 = "";
        if (q.includePicture && q.pictureFile) {
          const reader = new FileReader();
          pictureBase64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const base64 = reader.result as string;
              const base64Data = base64.split(",")[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            if (q.pictureFile) {
              reader.readAsDataURL(q.pictureFile);
            }
          });
        }

        // Create the question proto message
        const questionProto = create(QuestionSchema, {
          text: q.question,
          category: q.category,
          difficulty: q.difficulty,
          answerOptions: create(AnswerOptionsSchema, {
            answers: q.answers.map((answer) =>
              create(AnswerSchema, {
                id: answer.id,
                text: answer.text,
                isCorrect: answer.isCorrect,
              }),
            ),
          }),
          hints: q.hints
            .filter((hint) => hint.text.trim() !== "")
            .map((hint) =>
              create(HintSchema, {
                id: hint.id,
                text: hint.text,
              }),
            ),
          pictureForQuestion: pictureBase64,
          points: BigInt(parseInt(q.points) || 100),
        });

        // Create each question
        const response = await triviaClient.createQuestion({
          question: questionProto,
        });

        if (response.question?.id) {
          questionIds.push(response.question.id);
        }
      }

      // Create the collection with all question IDs
      const collectionRequest = create(CreateQuestionCollectionRequestSchema, {
        name: collectionName,
        description: collectionDescription,
        createdBy: user.username || user.email,
        sizeOfCollection: collectionSize,
        questionIds: questionIds,
      });

      const collectionResponse =
        await triviaClient.createQuestionCollection(collectionRequest);

      console.log("Collection created successfully:", collectionResponse);
      alert(
        `Collection "${collectionName}" created successfully with ${questionIds.length} questions!`,
      );

      // Reset form and go back to list view
      resetForm();
      setViewMode("list");
      // Reload collections list
      await loadCollections();
    } catch (error) {
      console.error("Error creating collection:", error);
      alert("Failed to create collection. Please try again.");
    }
  };

  const resetForm = () => {
    setCollectionName("");
    setCollectionDescription("");
    setCollectionSize("10");
    setCurrentQuestionIndex(0);
    setQuestions([]);
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await triviaClient.deleteQuestionCollection({ id });
      alert("Collection deleted successfully");
      // Reload collections after deletion
      await loadCollections();
    } catch (error) {
      console.error("Error deleting collection:", error);
      alert("Failed to delete collection");
    } finally {
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setCollectionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCreateClick = () => {
    setViewMode("create");
  };

  const handleEditClick = (id: string) => {
    // TODO: Load collection data and set viewMode to "edit"
    console.log("Edit collection:", id);
    alert("Edit functionality coming soon!");
  };

  const handleBackToList = () => {
    resetForm();
    setViewMode("list");
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Render list view
  const renderListView = () => (
    <CollectionsList
      collections={collections}
      onCreateClick={handleCreateClick}
      onEditClick={handleEditClick}
      onDeleteClick={openDeleteDialog}
      isLoading={isLoadingCollections}
      currentPage={currentPage}
      totalPages={totalPages}
      totalCollections={totalCollections}
      onPreviousPage={handlePreviousPage}
      onNextPage={handleNextPage}
    />
  );

  // Render create/edit view
  const renderCreateView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBackToList}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Create Trivia Collection</h2>
          <p className="text-sm text-muted-foreground">
            Create multiple trivia questions in one collection
          </p>
        </div>
      </div>

      {/* Collection Info */}
      <CollectionForm
        name={collectionName}
        description={collectionDescription}
        size={collectionSize}
        onNameChange={setCollectionName}
        onDescriptionChange={setCollectionDescription}
        onSizeChange={handleSizeChange}
      />

      {/* Question Editor */}
      {currentQuestion && (
        <QuestionEditor
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onUpdate={updateCurrentQuestion}
          onNext={goToNextQuestion}
          onPrevious={goToPreviousQuestion}
          showNavigation={true}
        />
      )}

      {/* Navigation and Submit */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Progress: {currentQuestionIndex + 1} of {questions.length}{" "}
              questions
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBackToList}>
                Cancel
              </Button>
              <Button onClick={handleSubmitCollection}>
                Create Collection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <div className="mx-auto max-w-6xl">
        {viewMode === "list" && renderListView()}
        {viewMode === "create" && renderCreateView()}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this collection? This action
              cannot be undone and will remove all questions in the collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                collectionToDelete && handleDeleteCollection(collectionToDelete)
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
