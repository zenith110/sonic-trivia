import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Trophy, Zap, Target, Award, Coins } from "lucide-react";
import { usePlayer } from "@/hooks/usePlayer";
import { usePlayerStats } from "@/hooks/usePlayerStats";

export function PlayerProfile() {
  const { unlockedCharacters } = usePlayer();
  const {
    totalPoints,
    totalRings,
    totalAnswers,
    totalCorrectAnswers,
    accuracyRate,
    isLoading,
    error,
  } = usePlayerStats();

  if (isLoading)
    return <div className="text-center py-8">Loading stats...</div>;
  if (error)
    return (
      <div className="text-center py-8 text-red-500">Error loading stats</div>
    );

  const stats = [
    {
      icon: Trophy,
      label: "Total Score",
      value: totalPoints,
      color: "text-yellow-500",
    },
    {
      icon: Coins,
      label: "Total Rings",
      value: totalRings,
      color: "text-yellow-600",
    },
    {
      icon: Target,
      label: "Questions Answered",
      value: totalAnswers,
      color: "text-blue-500",
    },
    {
      icon: Award,
      label: "Correct Answers",
      value: totalCorrectAnswers,
      color: "text-green-500",
    },
    {
      icon: Zap,
      label: "Unlocked Characters",
      value: unlockedCharacters.length,
      color: "text-purple-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Player Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Accuracy Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg">
            <div className="text-center">
              <p className="text-sm opacity-90">Accuracy Rate</p>
              <p className="text-3xl font-bold">{accuracyRate}%</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className={`${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
