import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PlayerProfile } from "@/components/PlayerProfile";
import { FriendsList } from "@/components/FriendsList";
import { usePlayer } from "@/hooks/usePlayer";

interface ProfilePageProps {
  onBack: () => void;
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { friends } = usePlayer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <h1 className="ml-4 text-xl font-bold text-gray-900">
              Player Profile
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlayerProfile />
          <FriendsList friends={friends} />
        </div>
      </div>
    </div>
  );
}
