import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Trophy } from "lucide-react";
import type { FriendList } from "@/generated/player_pb";

interface FriendsListProps {
  friends: FriendList[];
  onAddFriend?: () => void;
}

export function FriendsList({ friends, onAddFriend }: FriendsListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Friends</CardTitle>
          </div>
          {onAddFriend && (
            <Button size="sm" variant="outline" onClick={onAddFriend}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No friends yet</p>
            <p className="text-sm">Add friends to compete together!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {friend.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{friend.username}</p>
                    <p className="text-sm text-muted-foreground">Friend</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Trophy className="h-4 w-4 mr-2" />
                  View Stats
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
