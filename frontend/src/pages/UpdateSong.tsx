import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateUUID } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Edit,
  Music,
  Upload,
  X,
  Image as ImageIcon,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getSongCategoryOptions, getDifficultyOptions } from "@/lib/categories";
import { guessThatSongClient } from "@/grpc";
import { create } from "@bufbuild/protobuf";
import { SongSchema, SongHintSchema } from "@/generated/guessthatsong_pb";
import { SongCollectionSelector } from "@/components/song/SongCollectionSelector";

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
  includePicture?: boolean;
  pictureUrl?: string;
  isUnderReview?: boolean;
}

export function UpdateSong() {
  const songCategories = getSongCategoryOptions();
  const difficultyOptions = getDifficultyOptions();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [playsPerRound, setPlaysPerRound] = useState("3");
  const [clipDuration, setClipDuration] = useState("15");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string>("");
  const [hints, setHints] = useState<SongHint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [includePicture, setIncludePicture] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string>("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | undefined
  >();

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
          includePicture: !!s.pictureUrl,
          pictureUrl: s.pictureUrl,
          isUnderReview: s.isUnderReview,
        };

        setSelectedSong(song);
        setSongTitle(song.songTitle);
        setArtist(song.artist);
        setAlbum(song.album);
        setReleaseYear(song.releaseYear);
        setCategory(song.category);
        setDifficulty(song.difficulty);
        setPlaysPerRound(song.playsPerRound);
        setClipDuration(song.clipDuration);
        setHints(song.hints);
        setIncludePicture(song.includePicture || false);

        if (song.pictureUrl) {
          setPicturePreview(song.pictureUrl);
        }
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

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioPreview(url);
    }
  };

  const removeAudioFile = () => {
    setAudioFile(null);
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
      setAudioPreview("");
    }
  };

  const handlePictureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPictureFile(file);
      const url = URL.createObjectURL(file);
      setPicturePreview(url);
    }
  };

  const removePictureFile = () => {
    setPictureFile(null);
    if (picturePreview && picturePreview.startsWith("blob:")) {
      URL.revokeObjectURL(picturePreview);
      setPicturePreview("");
    }
  };

  const addHint = () => {
    const newId = generateUUID();
    setHints([...hints, { id: newId, text: "" }]);
  };

  const removeHint = (id: string) => {
    if (hints.length > 1) {
      setHints(hints.filter((hint) => hint.id !== id));
    }
  };

  const updateHint = (id: string, text: string) => {
    setHints(hints.map((hint) => (hint.id === id ? { ...hint, text } : hint)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSong) {
      alert("Please search and select a song first");
      return;
    }

    try {
      // Convert audio file to base64 if updated
      let audioBase64 = selectedSong.audioUrl;
      if (audioFile) {
        const audioReader = new FileReader();
        audioBase64 = await new Promise<string>((resolve, reject) => {
          audioReader.onload = () => {
            const base64 = audioReader.result as string;
            const base64Data = base64.split(",")[1];
            resolve(base64Data);
          };
          audioReader.onerror = reject;
          audioReader.readAsDataURL(audioFile);
        });
      }

      // Convert picture file to base64 if updated
      let pictureBase64 = selectedSong.pictureUrl;
      if (includePicture && pictureFile) {
        const pictureReader = new FileReader();
        pictureBase64 = await new Promise<string>((resolve, reject) => {
          pictureReader.onload = () => {
            const base64 = pictureReader.result as string;
            const base64Data = base64.split(",")[1];
            resolve(base64Data);
          };
          pictureReader.onerror = reject;
          pictureReader.readAsDataURL(pictureFile);
        });
      }

      // Create the song proto message
      const songProto = create(SongSchema, {
        id: selectedSong.id,
        songTitle: songTitle,
        artist: artist,
        album: album,
        releaseYear: releaseYear,
        category: category,
        difficulty: difficulty,
        playsPerRound: parseInt(playsPerRound),
        clipDuration: parseInt(clipDuration),
        audioUrl: audioBase64,
        hints: hints
          .filter((hint) => hint.text.trim() !== "")
          .map((hint) =>
            create(SongHintSchema, {
              id: hint.id,
              text: hint.text,
            }),
          ),
        pictureUrl: pictureBase64 || undefined,
      });

      // Call the gRPC service
      const response = await guessThatSongClient.updateSong({
        song: songProto,
        collectionId: selectedCollectionId,
      });

      console.log("Song updated successfully:", response);
      alert("Song updated successfully!");
      handleReset();
    } catch (error) {
      console.error("Error updating song:", error);
      alert("Failed to update song. Please try again.");
    }
  };

  const handleReset = () => {
    setSelectedSong(null);
    setSongTitle("");
    setArtist("");
    setAlbum("");
    setReleaseYear("");
    setCategory("");
    setDifficulty("");
    setPlaysPerRound("3");
    setClipDuration("15");
    setAudioFile(null);
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
      setAudioPreview("");
    }
    setHints([]);
    setSearchQuery("");
    setSelectedCollectionId(undefined);
    setIncludePicture(false);
    setPictureFile(null);
    setPicturePreview("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Song</CardTitle>
          <CardDescription>
            Search by song ID, title, or artist name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter song ID or search text..."
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
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Update Form */}
      {selectedSong && !isLoading && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Update Song Challenge
                </CardTitle>
                <CardDescription>
                  Modify the existing song challenge details
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Song ID:{" "}
                    <span className="font-mono">{selectedSong.id}</span>
                  </p>
                  {selectedSong.isUnderReview && (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Under Review
                    </Badge>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Song Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="songTitle">Song Title *</Label>
                  <Input
                    id="songTitle"
                    placeholder="Enter song title..."
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="artist">Artist *</Label>
                    <Input
                      id="artist"
                      placeholder="Enter artist name..."
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="album">Album</Label>
                    <Input
                      id="album"
                      placeholder="Enter album name..."
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="releaseYear">Release Year</Label>
                    <Input
                      id="releaseYear"
                      type="number"
                      placeholder="e.g., 2024"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value)}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Question Category *</Label>
                    <Select
                      value={category}
                      onValueChange={setCategory}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {songCategories.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <Select
                      value={difficulty}
                      onValueChange={setDifficulty}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty level" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="playsPerRound">Plays Per Round *</Label>
                  <Input
                    id="playsPerRound"
                    type="number"
                    placeholder="Number of times song can be played"
                    value={playsPerRound}
                    onChange={(e) => setPlaysPerRound(e.target.value)}
                    min="1"
                    max="10"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    How many times players can listen to the song clip per round
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clipDuration">
                    Clip Duration (seconds) *
                  </Label>
                  <Input
                    id="clipDuration"
                    type="number"
                    placeholder="e.g., 15"
                    value={clipDuration}
                    onChange={(e) => setClipDuration(e.target.value)}
                    min="5"
                    max="60"
                    step="1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Duration of audio clip played each time (e.g., 15s per play)
                  </p>
                </div>
              </div>

              {/* Current Audio File */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Audio Clip</h3>
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-sm">
                    Current audio URL:{" "}
                    <span className="font-mono text-xs">
                      {selectedSong.audioUrl}
                    </span>
                  </p>
                  {selectedSong.audioUrl && (
                    <audio
                      controls
                      src={selectedSong.audioUrl}
                      className="mt-2 w-full"
                    />
                  )}
                </div>

                {/* Optional: Upload new audio file */}
                <div className="space-y-2">
                  <Label htmlFor="audioFile">
                    Upload new audio file (optional)
                  </Label>
                  {!audioFile ? (
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-6">
                      <label
                        htmlFor="audioFile"
                        className="flex cursor-pointer flex-col items-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-muted-foreground">
                          MP3, WAV, OGG (Max 10MB)
                        </span>
                        <Input
                          id="audioFile"
                          type="file"
                          accept="audio/*"
                          onChange={handleAudioFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
                      <Music className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{audioFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {audioPreview && (
                          <audio
                            controls
                            src={audioPreview}
                            className="mt-2 w-full"
                          />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeAudioFile}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Picture Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePicture"
                    checked={includePicture}
                    onCheckedChange={(checked: boolean) =>
                      setIncludePicture(checked)
                    }
                  />
                  <Label
                    htmlFor="includePicture"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include picture with this song challenge
                  </Label>
                </div>

                {includePicture && (
                  <div className="space-y-2">
                    <Label htmlFor="pictureFile">
                      Upload picture (JPG, PNG, GIF)
                    </Label>
                    {!pictureFile && !picturePreview ? (
                      <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-6">
                        <label
                          htmlFor="pictureFile"
                          className="flex cursor-pointer flex-col items-center gap-2"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-xs text-muted-foreground">
                            JPG, PNG, GIF (Max 5MB)
                          </span>
                          <Input
                            id="pictureFile"
                            type="file"
                            accept="image/*"
                            onChange={handlePictureFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-8 w-8 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">
                              {pictureFile?.name || "Current picture"}
                            </p>
                            {pictureFile && (
                              <p className="text-xs text-muted-foreground">
                                {(pictureFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removePictureFile}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {picturePreview && (
                          <div className="mt-4">
                            <img
                              src={picturePreview}
                              alt="Preview"
                              className="max-h-64 w-full rounded-lg object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hints Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Hints</h3>
                    <p className="text-xs text-muted-foreground">
                      Provide clues to help players guess the song
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addHint}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Add Hint
                  </Button>
                </div>

                <div className="space-y-3">
                  {hints.map((hint, index) => (
                    <div
                      key={hint.id}
                      className="flex items-start gap-2 rounded-lg border p-3"
                    >
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Hint {index + 1}
                        </Label>
                        <Textarea
                          placeholder="Enter a hint..."
                          value={hint.text}
                          onChange={(e) => updateHint(hint.id, e.target.value)}
                          rows={2}
                          required
                        />
                      </div>
                      {hints.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHint(hint.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            {/* Collection Selector */}
            <SongCollectionSelector
              selectedCollectionId={selectedCollectionId}
              onCollectionChange={setSelectedCollectionId}
            />

            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button type="submit">
                <Edit className="mr-2 h-4 w-4" />
                Update Song Challenge
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
