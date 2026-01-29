import { Button } from "@/components/ui/button";
import {
  Gamepad2,
  Trophy,
  Shield,
  LogOut,
  DoorOpen,
  Coins,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MainMenuHeaderProps {
  onNavigateToDashboard: () => void;
  onNavigateToLeaderboard: () => void;
  onJoinRoom: () => void;
  onNavigateToProfile?: () => void;
}

export function MainMenuHeader({
  onNavigateToDashboard,
  onNavigateToLeaderboard,
  onJoinRoom,
  onNavigateToProfile,
}: MainMenuHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Sonic Trivia</h1>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {user.username}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Score: {user.totalScore}</span>
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-yellow-500" />
                      {user.totalRings}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={onJoinRoom}>
              <DoorOpen className="h-4 w-4 mr-2" />
              Join Room
            </Button>

            {onNavigateToProfile && (
              <Button variant="outline" size="sm" onClick={onNavigateToProfile}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToLeaderboard}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </Button>

            <Button variant="outline" size="sm" onClick={onNavigateToDashboard}>
              <Shield className="h-4 w-4 mr-2" />
              Dashboard
            </Button>

            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
