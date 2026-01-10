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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Music, Upload, X, Image as ImageIcon } from "lucide-react";
import { getSongCategoryOptions } from "@/lib/categories";
import { guessThatSongClient } from "@/grpc";
import { create } from "@bufbuild/protobuf";
import { SongSchema, SongHintSchema } from "@/generated/guessthatsong_pb";

interface SongHint {
  id: string;
  text: string;
}

export function CreateSong() {
  const songCategories = getSongCategoryOptions();

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
  const [hints, setHints] = useState<SongHint[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
    { id: "3", text: "" },
  ]);
  const [includePicture, setIncludePicture] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string>("");

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
    if (picturePreview) {
      URL.revokeObjectURL(picturePreview);
      setPicturePreview("");
    }
  };

  const addHint = () => {
    const newId = (hints.length + 1).toString();
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

    try {
      // Convert audio file to base64
      if (!audioFile) {
        alert("Please upload an audio file");
        return;
      }

      const audioReader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        audioReader.onload = () => {
          const base64 = audioReader.result as string;
          const base64Data = base64.split(",")[1];
          resolve(base64Data);
        };
        audioReader.onerror = reject;
        audioReader.readAsDataURL(audioFile);
      });

      // Convert picture file to base64 if included
      let pictureBase64 = "";
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
      const response = await guessThatSongClient.createSong({
        song: songProto,
      });

      console.log("Song created successfully:", response);
      alert("Song challenge created successfully!");

      // Reset form
      setSongTitle("");
      setArtist("");
      setAlbum("");
      setReleaseYear("");
      setCategory("");
      setDifficulty("");
      setPlaysPerRound("3");
      setClipDuration("15");
      removeAudioFile();
      setHints([
        { id: "1", text: "" },
        { id: "2", text: "" },
        { id: "3", text: "" },
      ]);
      setIncludePicture(false);
      removePictureFile();
    } catch (error) {
      console.error("Error creating song:", error);
      alert("Failed to create song challenge. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Create New Song Challenge
          </CardTitle>
          <CardDescription>
            Add a new song for players to guess with audio clip and hints
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
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
                  <Select value={category} onValueChange={setCategory} required>
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
                  <Input
                    id="difficulty"
                    placeholder="Easy, Medium, Hard"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    required
                  />
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
            </div>

            {/* Audio File Upload */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Audio Clip *</h3>
              <div className="space-y-2">
                <Label htmlFor="audioFile">
                  Upload audio file (MP3, WAV, OGG)
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
                        required
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
                  {!pictureFile ? (
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
                          <p className="font-medium">{pictureFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(pictureFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
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

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">
              <Music className="mr-2 h-4 w-4" />
              Create Song Challenge
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
