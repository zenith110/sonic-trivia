import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, LogIn } from "lucide-react";

interface JoinRoomDialogProps {
  onJoinRoom: (roomCode: string) => void;
  onCancel: () => void;
}

export function JoinRoomDialog({ onJoinRoom, onCancel }: JoinRoomDialogProps) {
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoinRoom = async () => {
    setError("");

    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    if (roomCode.length < 6) {
      setError("Room code must be at least 6 characters");
      return;
    }

    setIsJoining(true);

    // TODO: Call backend API to validate and join room
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock validation
    const isValidCode = /^[A-Z0-9]{6}$/.test(roomCode.toUpperCase());
    if (!isValidCode) {
      setError("Invalid room code format. Please use 6 alphanumeric characters.");
      setIsJoining(false);
      return;
    }

    // Mock room existence check
    const roomExists = true; // Replace with actual API call
    if (!roomExists) {
      setError("Room not found. Please check the code and try again.");
      setIsJoining(false);
      return;
    }

    setIsJoining(false);
    onJoinRoom(roomCode.toUpperCase());
  };

  const handleInputChange = (value: string) => {
    // Auto-uppercase and limit to 6 characters
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setRoomCode(formatted);
    setError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && roomCode.length === 6) {
      handleJoinRoom();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Join Room
          </CardTitle>
          <CardDescription>
            Enter the 6-character room code to join a game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomCode">Room Code</Label>
            <Input
              id="roomCode"
              value={roomCode}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="ABC123"
              className="h-14 text-center text-2xl font-mono font-bold tracking-widest uppercase"
              maxLength={6}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-character code shared by the host
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={onCancel}
              disabled={isJoining}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={handleJoinRoom}
              disabled={isJoining || roomCode.length < 6}
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Join Room
                </>
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Tips:</p>
            <ul className="text-xs space-y-1 ml-4 list-disc">
              <li>Room codes are case-insensitive</li>
              <li>Make sure the host has created the room</li>
              <li>Private rooms require the exact code</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
