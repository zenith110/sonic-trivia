import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { create } from "@bufbuild/protobuf";
import { triviaClient, guessThatSongClient } from "@/grpc";
import {
  GetRandomQuestionsRequestSchema,
  GetQuestionsRequestSchema,
} from "@/generated/trivia_pb";
import {
  GetRandomSongsRequestSchema,
  GetSongsRequestSchema,
} from "@/generated/guessthatsong_pb";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Music,
  User,
  AlertCircle,
  Eye,
  Star,
  Coins,
  Calendar,
  Disc3,
  Search,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SearchMode = "questions" | "songs";

export function SearchPage() {
  const { user } = useAuth();
  const [searchMode, setSearchMode] = useState<SearchMode>("questions");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [category, setCategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [searchType, setSearchType] = useState<"all" | "random">("all");

  // Reset page when filters change
  const handleFilterChange = () => {
    setPage(1);
  };

  // Questions Query
  const questionsQuery = useQuery({
    queryKey: [
      "search-questions",
      searchType,
      user?.id,
      page,
      pageSize,
      category,
      difficulty,
    ],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      if (searchType === "random") {
        const request = create(GetRandomQuestionsRequestSchema, {
          category: category || "",
          difficulty: difficulty || "",
          howManyRounds: 0,
          page: page,
          pageSize: pageSize,
        });
        return await triviaClient.getRandomQuestions(request);
      } else {
        const request = create(GetQuestionsRequestSchema, {
          userId: user.id,
          page: page,
          pageSize: pageSize,
        });
        return await triviaClient.getQuestions(request);
      }
    },
    enabled: !!user?.id && searchMode === "questions",
  });

  // Songs Query
  const songsQuery = useQuery({
    queryKey: [
      "search-songs",
      searchType,
      user?.id,
      page,
      pageSize,
      category,
      difficulty,
    ],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      if (searchType === "random") {
        const request = create(GetRandomSongsRequestSchema, {
          category: category || "",
          difficulty: difficulty || "",
          howManyRounds: 0,
          page: page,
          pageSize: pageSize,
        });
        return await guessThatSongClient.getRandomSongs(request);
      } else {
        const request = create(GetSongsRequestSchema, {
          userId: user.id,
          page: page,
          pageSize: pageSize,
        });
        return await guessThatSongClient.getSongs(request);
      }
    },
    enabled: !!user?.id && searchMode === "songs",
  });

  const activeQuery = searchMode === "questions" ? questionsQuery : songsQuery;
  const { data, isLoading, error, refetch } = activeQuery;

  const items =
    searchMode === "questions"
      ? (data as { questions?: unknown[] })?.questions || []
      : (data as { songs?: unknown[] })?.songs || [];
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
      "bg-teal-100 text-teal-800",
    ];
    const hash = category.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Search {searchMode === "questions" ? "Questions" : "Songs"}
            </h1>
            <p className="text-gray-600">Search and filter your {searchMode}</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load {searchMode}. Please try again.
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
          <h1 className="text-3xl font-bold text-gray-900">Search & Browse</h1>
          <p className="text-gray-600">
            Search and filter questions and songs with pagination
          </p>
        </div>
      </div>

      {/* Search Mode Tabs */}
      <Tabs
        value={searchMode}
        onValueChange={(value: string) => {
          setSearchMode(value as SearchMode);
          setPage(1);
        }}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="songs" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Songs
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Search Type
                </label>
                <Select
                  value={searchType}
                  onValueChange={(value) => {
                    setSearchType(value as "all" | "random");
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">My Items</SelectItem>
                    <SelectItem value="random">Random (All Users)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter (only for random) */}
              {searchType === "random" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      <SelectItem value="Sonic the Hedgehog">
                        Sonic the Hedgehog
                      </SelectItem>
                      <SelectItem value="Gaming">Gaming</SelectItem>
                      <SelectItem value="Music">Music</SelectItem>
                      <SelectItem value="Movies">Movies</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Difficulty Filter (only for random) */}
              {searchType === "random" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Difficulty
                  </label>
                  <Select
                    value={difficulty}
                    onValueChange={(value) => {
                      setDifficulty(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Difficulties</SelectItem>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-gray-600">
                {total > 0
                  ? `${total} ${searchMode === "questions" ? "question" : "song"}${total === 1 ? "" : "s"} found`
                  : `No ${searchMode} found`}
              </p>
              {(category || difficulty) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCategory("");
                    setDifficulty("");
                    handleFilterChange();
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <TabsContent value="questions" className="space-y-4">
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
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No questions found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search filters or create a new question.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(items as Array<Record<string, unknown>>).map((question) => (
                <Card
                  key={question.id as string}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-6 mb-2">
                          {question.text as string}
                        </CardTitle>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={getCategoryColor(
                              question.category as string,
                            )}
                          >
                            {question.category as string}
                          </Badge>

                          <Badge
                            variant={getDifficultyBadgeVariant(
                              question.difficulty as string,
                            )}
                          >
                            {question.difficulty as string}
                          </Badge>

                          {(question.isUnderReview as boolean) && (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-100 text-yellow-800 border-yellow-300"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Under Review
                            </Badge>
                          )}

                          {question.points !== undefined && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Coins className="w-3 h-3" />
                              {question.points as number} points
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {(question.pictureUrl as string) && (
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
                      {(question.answerOptions as { answers?: unknown[] })
                        ?.answers &&
                        (question.answerOptions as { answers: unknown[] })
                          .answers.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Answer Options:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(
                                question.answerOptions as {
                                  answers: Array<Record<string, unknown>>;
                                }
                              ).answers.map(
                                (
                                  answer: Record<string, unknown>,
                                  index: number,
                                ) => (
                                  <div
                                    key={answer.id as string}
                                    className={`p-2 rounded-md text-sm border ${
                                      (answer.isCorrect as boolean)
                                        ? "bg-green-50 border-green-200 text-green-800"
                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                    }`}
                                  >
                                    <span className="font-medium">
                                      {String.fromCharCode(65 + index)}:
                                    </span>{" "}
                                    {answer.text as string}
                                    {(answer.isCorrect as boolean) && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 bg-green-100 text-green-800 text-xs"
                                      >
                                        Correct
                                      </Badge>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* Hints */}
                      {(question.hints as unknown[]) &&
                        (question.hints as unknown[]).length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Hints ({(question.hints as unknown[]).length}):
                            </p>
                            <div className="space-y-1">
                              {(
                                question.hints as Array<Record<string, unknown>>
                              )
                                .slice(0, 2)
                                .map(
                                  (
                                    hint: Record<string, unknown>,
                                    index: number,
                                  ) => (
                                    <p
                                      key={hint.id as string}
                                      className="text-sm text-gray-600 bg-blue-50 p-2 rounded"
                                    >
                                      <span className="font-medium">
                                        Hint {index + 1}:
                                      </span>{" "}
                                      {hint.text as string}
                                    </p>
                                  ),
                                )}
                              {(question.hints as unknown[]).length > 2 && (
                                <p className="text-xs text-gray-500">
                                  +{(question.hints as unknown[]).length - 2}{" "}
                                  more hints
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
          )}
        </TabsContent>

        <TabsContent value="songs" className="space-y-4">
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
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Music className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No songs found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search filters or create a new song.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(items as Array<Record<string, unknown>>).map((song) => (
                <Card
                  key={song.id as string}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-6 mb-2">
                          {song.songTitle as string}
                        </CardTitle>

                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <User className="w-3 h-3" />
                            <span className="font-medium">
                              {song.artist as string}
                            </span>
                          </div>

                          {(song.album as string) && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Disc3 className="w-3 h-3" />
                              <span>{song.album as string}</span>
                            </div>
                          )}

                          {(song.releaseYear as string) && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="w-3 h-3" />
                              <span>{song.releaseYear as string}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={getCategoryColor(
                              song.category as string,
                            )}
                          >
                            {song.category as string}
                          </Badge>

                          <Badge
                            variant={getDifficultyBadgeVariant(
                              song.difficulty as string,
                            )}
                          >
                            {song.difficulty as string}
                          </Badge>

                          {(song.isUnderReview as boolean) && (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-100 text-yellow-800 border-yellow-300"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Under Review
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {(song.pictureUrl as string) && (
                          <Badge variant="outline" className="text-xs">
                            Has Image
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {/* Song Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">
                            Plays per round:
                          </span>
                          <span className="font-medium">
                            {song.playsPerRound as number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Clip duration:</span>
                          <span className="font-medium">
                            {song.clipDuration as number}s
                          </span>
                        </div>
                      </div>

                      {/* Hints */}
                      {(song.hints as unknown[]) &&
                        (song.hints as unknown[]).length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Hints ({(song.hints as unknown[]).length}):
                            </p>
                            <div className="space-y-1">
                              {(song.hints as Array<Record<string, unknown>>)
                                .slice(0, 2)
                                .map(
                                  (
                                    hint: Record<string, unknown>,
                                    index: number,
                                  ) => (
                                    <p
                                      key={hint.id as string}
                                      className="text-sm text-gray-600 bg-blue-50 p-2 rounded"
                                    >
                                      <span className="font-medium">
                                        Hint {index + 1}:
                                      </span>{" "}
                                      {hint.text as string}
                                    </p>
                                  ),
                                )}
                              {(song.hints as unknown[]).length > 2 && (
                                <p className="text-xs text-gray-500">
                                  +{(song.hints as unknown[]).length - 2} more
                                  hints
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Audio Preview */}
                      {(song.audioUrl as string) && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Audio Preview:
                          </p>
                          <audio
                            controls
                            className="w-full h-8"
                            preload="metadata"
                          >
                            <source
                              src={song.audioUrl as string}
                              type="audio/mpeg"
                            />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
            Page {page} of {totalPages} • Showing {items.length} of {total}{" "}
            {searchMode}
          </div>
        </div>
      )}
    </div>
  );
}
