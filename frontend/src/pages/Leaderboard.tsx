import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  Medal,
  Crown,
  Users,
  Globe,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { create } from "@bufbuild/protobuf";
import { leaderboardClient } from "@/grpc";
import { PaginateGlobalLeaderboardRequestSchema } from "@/generated/leaderboard_pb";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  answeredQuestions: number;
  accuracy: number;
}

interface LeaderboardProps {
  onBack?: () => void;
}

export function Leaderboard({ onBack }: LeaderboardProps = {}) {
  const [activeTab, setActiveTab] = useState<"global" | "room">("global");
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [hasMorePages, setHasMorePages] = useState(true);
  const itemsPerPage = 10; // Default page size

  // Fetch leaderboard data
  const fetchLeaderboard = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const request = create(PaginateGlobalLeaderboardRequestSchema, {
        page: page,
      });

      const response =
        await leaderboardClient.paginateGlobalLeaderboard(request);

      // Convert response to LeaderboardEntry format
      const entries: LeaderboardEntry[] = response.players.map(
        (player, index) => ({
          rank: (page - 1) * 50 + index + 1,
          userId: `user${index + 1}`,
          username: player.name || "Unknown",
          score: Number(player.score) || 0,
          answeredQuestions: 0, // Not available in current proto
          accuracy: 0, // Not available in current proto
        }),
      );

      setLeaderboardData(entries);
      setCurrentPage(page);
      // If we received less than a full page, there are no more pages
      setHasMorePages(entries.length === itemsPerPage);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      setError("Failed to load leaderboard data");
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(1);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="text-sm font-semibold text-muted-foreground">
            {rank}
          </span>
        );
    }
  };

  const handleRefresh = () => {
    fetchLeaderboard(currentPage);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchLeaderboard(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMorePages) {
      fetchLeaderboard(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header with Back Button */}
      {onBack && (
        <header className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            </div>
          </div>
        </header>
      )}

      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Players
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaderboardData.length}</div>
              <p className="text-xs text-muted-foreground">On this page</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Score</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaderboardData.length > 0
                  ? leaderboardData[0].score.toLocaleString()
                  : "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                {leaderboardData.length > 0
                  ? `By ${leaderboardData[0].username}`
                  : "No data"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Accuracy
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaderboardData.length > 0
                  ? `${Math.round(leaderboardData.reduce((acc, p) => acc + p.accuracy, 0) / leaderboardData.length)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-muted-foreground">Average accuracy</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Leaderboard
                </CardTitle>
                <CardDescription>
                  Top performers ranked by score and accuracy
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="flex rounded-lg border p-1">
                  <Button
                    variant={activeTab === "global" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("global")}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Global
                  </Button>
                  <Button
                    variant={activeTab === "room" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("room")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Room
                  </Button>
                </div>
                <Button onClick={handleRefresh} disabled={isLoading}>
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={handleRefresh}>Try Again</Button>
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No leaderboard data available
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Questions</TableHead>
                      <TableHead className="text-right">Accuracy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboardData.map((entry) => (
                      <TableRow
                        key={entry.userId}
                        className={entry.rank <= 3 ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getRankIcon(entry.rank)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {entry.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{entry.username}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {entry.userId}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {entry.score.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {entry.answeredQuestions || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.accuracy > 0 ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                entry.accuracy >= 95
                                  ? "bg-green-100 text-green-800"
                                  : entry.accuracy >= 85
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {entry.accuracy}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && !error && leaderboardData.length > 0 && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {(currentPage - 1) * itemsPerPage + leaderboardData.length}{" "}
                  players
                  {currentPage > 1 && ` (Page ${currentPage})`}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm font-medium">{currentPage}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!hasMorePages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
