import { useState } from "react";
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
import { Trophy, Medal, Crown, Users, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  answeredQuestions: number;
  accuracy: number;
}

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<"global" | "room">("global");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const mockLeaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      userId: "user1",
      username: "TriviaKing",
      score: 9850,
      answeredQuestions: 150,
      accuracy: 98.5,
    },
    {
      rank: 2,
      userId: "user2",
      username: "QuizMaster",
      score: 9200,
      answeredQuestions: 140,
      accuracy: 95.7,
    },
    {
      rank: 3,
      userId: "user3",
      username: "BrainBox",
      score: 8750,
      answeredQuestions: 135,
      accuracy: 94.2,
    },
    {
      rank: 4,
      userId: "user4",
      username: "SmartCookie",
      score: 8300,
      answeredQuestions: 128,
      accuracy: 92.8,
    },
    {
      rank: 5,
      userId: "user5",
      username: "KnowledgeNinja",
      score: 7900,
      answeredQuestions: 122,
      accuracy: 91.5,
    },
    {
      rank: 6,
      userId: "user6",
      username: "FactFinder",
      score: 7450,
      answeredQuestions: 115,
      accuracy: 89.3,
    },
    {
      rank: 7,
      userId: "user7",
      username: "WisdomWizard",
      score: 7100,
      answeredQuestions: 110,
      accuracy: 87.8,
    },
    {
      rank: 8,
      userId: "user8",
      username: "InfoGenius",
      score: 6800,
      answeredQuestions: 105,
      accuracy: 86.2,
    },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-semibold text-muted-foreground">{rank}</span>;
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // TODO: Implement refresh logic
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Score
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9,850</div>
            <p className="text-xs text-muted-foreground">
              By TriviaKing
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
            <div className="text-2xl font-bold">87.3%</div>
            <p className="text-xs text-muted-foreground">
              Across all players
            </p>
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
                  {mockLeaderboard.map((entry) => (
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
                      <TableCell className="text-right">
                        {entry.answeredQuestions}
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
