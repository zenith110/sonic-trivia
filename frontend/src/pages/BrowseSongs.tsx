import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { create } from "@bufbuild/protobuf";
import { guessThatSongClient } from "@/grpc";
import { GetSongsRequestSchema } from "@/generated/guessthatsong_pb";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  Music,
  User,
  AlertCircle,
  Eye,
  Calendar,
  Disc3,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BrowseSongs() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["songs", user?.id, page, pageSize],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const request = create(GetSongsRequestSchema, {
        userId: user.id,
        page: page,
        pageSize: pageSize,
      });

      return await guessThatSongClient.getSongs(request);
    },
    enabled: !!user?.id,
  });

  const songs = data?.songs || [];
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
            <h1 className="text-3xl font-bold text-gray-900">Browse Songs</h1>
            <p className="text-gray-600">Explore your songs</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load songs. Please try again.
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
          <h1 className="text-3xl font-bold text-gray-900">Browse Songs</h1>
          <p className="text-gray-600">
            {total > 0
              ? `${total} song${total === 1 ? "" : "s"} found`
              : "No songs yet"}
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
      ) : songs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Music className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No songs found
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't created any songs yet.
            </p>
            <Button onClick={() => window.location.reload()}>
              Create Your First Song
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Songs List */}
          <div className="grid gap-4">
            {songs.map((song) => (
              <Card key={song.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-6 mb-2">
                        {song.songTitle}
                      </CardTitle>

                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User className="w-3 h-3" />
                          <span className="font-medium">{song.artist}</span>
                        </div>

                        {song.album && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Disc3 className="w-3 h-3" />
                            <span>{song.album}</span>
                          </div>
                        )}

                        {song.releaseYear && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>{song.releaseYear}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={getCategoryColor(song.category)}
                        >
                          {song.category}
                        </Badge>

                        <Badge
                          variant={getDifficultyBadgeVariant(song.difficulty)}
                        >
                          {song.difficulty}
                        </Badge>

                        {song.isUnderReview && (
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
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>You</span>
                      </div>
                      {song.pictureUrl && (
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
                        <span className="text-gray-600">Plays per round:</span>
                        <span className="font-medium">
                          {song.playsPerRound}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Clip duration:</span>
                        <span className="font-medium">
                          {song.clipDuration}s
                        </span>
                      </div>
                    </div>

                    {/* Hints */}
                    {song.hints && song.hints.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Hints ({song.hints.length}):
                        </p>
                        <div className="space-y-1">
                          {song.hints.slice(0, 2).map((hint, index) => (
                            <p
                              key={hint.id}
                              className="text-sm text-gray-600 bg-blue-50 p-2 rounded"
                            >
                              <span className="font-medium">
                                Hint {index + 1}:
                              </span>{" "}
                              {hint.text}
                            </p>
                          ))}
                          {song.hints.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{song.hints.length - 2} more hints
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Audio Preview */}
                    {song.audioUrl && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Audio Preview:
                        </p>
                        <audio
                          controls
                          className="w-full h-8"
                          preload="metadata"
                        >
                          <source src={song.audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
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
                Page {page} of {totalPages} • Showing {songs.length} of {total}{" "}
                songs
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
