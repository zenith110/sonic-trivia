import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, Trash2, AlertTriangle, Music } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { guessThatSongClient } from "@/grpc";

interface SongHint {
  id: string;
  text: string;
}

interface Song {
  id: string;
  songTitle: string;
  artist: string;
  album: string;
  releaseYear: string;
  category: string;
  difficulty: string;
  playsPerRound: string;
  clipDuration: string;
  audioUrl: string;
  hints: SongHint[];
}

export function DeleteSong() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a song ID to search");
      return;
    }

    setIsLoading(true);
    try {
      const response = await guessThatSongClient.getSong({ id: searchQuery });

      if (response.song) {
        const s = response.song;
        const song: Song = {
          id: s.id,
          songTitle: s.songTitle,
          artist: s.artist,
          album: s.album,
          releaseYear: s.releaseYear,
          category: s.category,
          difficulty: s.difficulty,
          playsPerRound: s.playsPerRound.toString(),
          clipDuration: s.clipDuration.toString(),
          audioUrl: s.audioUrl,
          hints: s.hints.map((h) => ({
            id: h.id,
            text: h.text,
          })),
        };

        setSelectedSong(song);
      } else {
        alert("Song not found");
      }
    } catch (error) {
      console.error("Error fetching song:", error);
      alert("Failed to fetch song. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSong) return;

    try {
      await guessThatSongClient.deleteSong({ id: selectedSong.id });

      console.log("Song deleted successfully");
      alert("Song deleted successfully!");
      setSelectedSong(null);
      setSearchQuery("");
    } catch (error) {
      console.error("Error deleting song:", error);
      alert("Failed to delete song. Please try again.");
    }
  };

  const handleReset = () => {
    setSelectedSong(null);
    setSearchQuery("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Delete Song Challenge</CardTitle>
          <CardDescription>
            Search for a song to delete it permanently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter song ID, title, or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={!searchQuery || isLoading}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Song Preview & Delete */}
      {selectedSong && !isLoading && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-destructive">
                  Confirm Deletion
                </CardTitle>
                <CardDescription>
                  This action cannot be undone. The song challenge will be
                  permanently removed from the database.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Song ID</Label>
                <p className="font-mono text-sm">{selectedSong.id}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Song Title
                </Label>
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {selectedSong.songTitle}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Artist
                  </Label>
                  <p className="text-sm">{selectedSong.artist}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Album</Label>
                  <p className="text-sm">{selectedSong.album || "N/A"}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Release Year
                  </Label>
                  <p className="text-sm">{selectedSong.releaseYear || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Question Category
                  </Label>
                  <p className="text-sm">{selectedSong.category}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Difficulty
                  </Label>
                  <p className="text-sm">{selectedSong.difficulty}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Plays Per Round
                  </Label>
                  <p className="text-sm">{selectedSong.playsPerRound} times</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Clip Duration
                  </Label>
                  <p className="text-sm">{selectedSong.clipDuration} seconds</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Audio URL
                </Label>
                <div className="rounded-md bg-background p-2">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      {selectedSong.audioUrl}
                    </span>
                  </div>
                  {selectedSong.audioUrl && (
                    <audio
                      controls
                      src={selectedSong.audioUrl}
                      className="mt-2 w-full"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Hints</Label>
                <div className="space-y-2">
                  {selectedSong.hints.map((hint, index) => (
                    <div
                      key={hint.id}
                      className="rounded-md bg-background p-2 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {index + 1}.
                      </span>{" "}
                      {hint.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Song Challenge
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the song challenge "{selectedSong.songTitle}" by{" "}
                    {selectedSong.artist} and all associated data from the
                    database, including the audio file.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, delete song challenge
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
