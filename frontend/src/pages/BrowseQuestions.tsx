import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { create } from "@bufbuild/protobuf";
import { triviaClient } from "@/grpc";
import { GetQuestionsRequestSchema } from "@/generated/trivia_pb";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  User,

  AlertCircle,
  Eye,
  Star,
  Coins
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BrowseQuestions() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["questions", user?.id, page, pageSize],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const request = create(GetQuestionsRequestSchema, {
        userId: user.id,
        page: page,
        pageSize: pageSize,
      });

      return await triviaClient.getQuestions(request);
    },
    enabled: !!user?.id,
  });

  const questions = data?.questions || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;
  const totalPages = Math.ceil(total / pageSize);

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setPage(page + 1);
    }
  };

  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "default";
      case "medium":
        return "secondary";
      case "hard":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-teal-100 text-teal-800"
    ];
    const hash = category.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Questions</h1>
            <p className="text-gray-600">Explore your trivia questions</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load questions. Please try again.
          </AlertDescription>
        </Alert>

        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Questions</h1>
          <p className="text-gray-600">
            {total > 0 ? `${total} question${total === 1 ? '' : 's'} found` : 'No questions yet'}
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(pageSize)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No questions found
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't created any trivia questions yet.
            </p>
            <Button onClick={() => window.location.reload()}>
              Create Your First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Questions List */}
          <div className="grid gap-4">
            {questions.map((question) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-6 mb-2">
                        {question.text}
                      </CardTitle>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={getCategoryColor(question.category)}
                        >
                          {question.category}
                        </Badge>

                        <Badge variant={getDifficultyBadgeVariant(question.difficulty)}>
                          {question.difficulty}
                        </Badge>

                        {question.isUnderReview && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            <Eye className="w-3 h-3 mr-1" />
                            Under Review
                          </Badge>
                        )}

                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Coins className="w-3 h-3" />
                          {question.points} points
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>You</span>
                      </div>
                      {question.pictureUrl && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Has Image
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Answer Options */}
                    {question.answerOptions?.answers && question.answerOptions.answers.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Answer Options:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {question.answerOptions.answers.map((answer, index) => (
                            <div
                              key={answer.id}
                              className={`p-2 rounded-md text-sm border ${
                                answer.isCorrect
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <span className="font-medium">
                                {String.fromCharCode(65 + index)}:
                              </span>{" "}
                              {answer.text}
                              {answer.isCorrect && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 text-xs">
                                  Correct
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hints */}
                    {question.hints && question.hints.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Hints ({question.hints.length}):
                        </p>
                        <div className="space-y-1">
                          {question.hints.slice(0, 2).map((hint, index) => (
                            <p key={hint.id} className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                              <span className="font-medium">Hint {index + 1}:</span> {hint.text}
                            </p>
                          ))}
                          {question.hints.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{question.hints.length - 2} more hints
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page <= 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                Page {page} of {totalPages} • Showing {questions.length} of {total} questions
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
