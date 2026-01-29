import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Plus, X, Upload, Image as ImageIcon, Music } from "lucide-react";
import { getSongCategoryOptions } from "@/lib/categories";

interface SongHint {
  id: string;
  text: string;
}

export interface Song {
  songTitle: string;
  artist: string;
  album: string;
  releaseYear: string;
  category: string;
  difficulty: string;
  playsPerRound: string;
  clipDuration: string;
  audioFile: File | null;
  audioPreview: string;
  hints: SongHint[];
  includePicture: boolean;
  pictureFile: File | null;
  picturePreview: string;
}

interface SongEditorProps {
  song: Song;
  songNumber?: number;
  totalSongs?: number;
  onUpdate: (updates: Partial<Song>) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
}

export function SongEditor({
  song,
  songNumber,
  totalSongs,
  onUpdate,
  onNext,
  onPrevious,
  showNavigation = false,
}: SongEditorProps) {
  const songCategories = getSongCategoryOptions();

  const addHint = () => {
    const newId = (song.hints.length + 1).toString();
    onUpdate({
      hints: [...song.hints, { id: newId, text: "" }],
    });
  };

  const removeHint = (id: string) => {
    if (song.hints.length <= 1) return;
    onUpdate({
      hints: song.hints.filter((hint) => hint.id !== id),
    });
  };

  const updateHint = (id: string, text: string) => {
    onUpdate({
      hints: song.hints.map((hint) =>
        hint.id === id ? { ...hint, text } : hint,
      ),
    });
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({
        audioFile: file,
        audioPreview: url,
      });
    }
  };

  const removeAudioFile = () => {
    if (song.audioPreview) {
      URL.revokeObjectURL(song.audioPreview);
    }
    onUpdate({
      audioFile: null,
      audioPreview: "",
    });
  };

  const handlePictureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdate({
        pictureFile: file,
        picturePreview: url,
      });
    }
  };

  const removePictureFile = () => {
    if (song.picturePreview) {
      URL.revokeObjectURL(song.picturePreview);
    }
    onUpdate({
      pictureFile: null,
      picturePreview: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {songNumber !== undefined && totalSongs !== undefined ? (
              <>
                <CardTitle>
                  Song {songNumber} of {totalSongs}
                </CardTitle>
                <CardDescription>
                  Fill in the details for this song
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle>Song Details</CardTitle>
                <CardDescription>
                  Fill in the details for your song
                </CardDescription>
              </>
            )}
          </div>
          {showNavigation && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={!onPrevious || songNumber === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={!onNext || songNumber === totalSongs}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Song Title and Artist */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="songTitle">Song Title</Label>
            <Input
              id="songTitle"
              placeholder="e.g., Green Hill Zone"
              value={song.songTitle}
              onChange={(e) => onUpdate({ songTitle: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Artist</Label>
            <Input
              id="artist"
              placeholder="e.g., Jun Senoue"
              value={song.artist}
              onChange={(e) => onUpdate({ artist: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Album and Release Year */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="album">Album</Label>
            <Input
              id="album"
              placeholder="e.g., Sonic Adventure 2"
              value={song.album}
              onChange={(e) => onUpdate({ album: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="releaseYear">Release Year</Label>
            <Input
              id="releaseYear"
              placeholder="e.g., 2001"
              value={song.releaseYear}
              onChange={(e) => onUpdate({ releaseYear: e.target.value })}
            />
          </div>
        </div>

        {/* Category and Difficulty */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={song.category}
              onValueChange={(value) => onUpdate({ category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {songCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Input
              id="difficulty"
              placeholder="e.g., Easy, Medium, Hard"
              value={song.difficulty}
              onChange={(e) => onUpdate({ difficulty: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Plays Per Round and Clip Duration */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="playsPerRound">Plays Per Round</Label>
            <Input
              id="playsPerRound"
              type="text"
              placeholder="3"
              value={song.playsPerRound}
              onChange={(e) => onUpdate({ playsPerRound: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clipDuration">Clip Duration (seconds)</Label>
            <Input
              id="clipDuration"
              type="text"
              placeholder="15"
              value={song.clipDuration}
              onChange={(e) => onUpdate({ clipDuration: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Audio File Upload */}
        <div className="space-y-2">
          <Label htmlFor="audioFile">Audio File (MP3, WAV, OGG)</Label>
          {!song.audioFile ? (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-6">
              <label
                htmlFor="audioFile"
                className="flex cursor-pointer flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload audio file
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
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <Music className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{song.audioFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(song.audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
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
              {song.audioPreview && (
                <div className="mt-4">
                  <audio src={song.audioPreview} controls className="w-full" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optional Picture Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includePicture"
              checked={song.includePicture}
              onCheckedChange={(checked: boolean) =>
                onUpdate({ includePicture: checked })
              }
            />
            <Label
              htmlFor="includePicture"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include picture with this song
            </Label>
          </div>

          {song.includePicture && (
            <div className="space-y-2">
              <Label htmlFor="pictureFile">
                Upload picture (JPG, PNG, GIF)
              </Label>
              {!song.pictureFile ? (
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
                      <p className="font-medium">{song.pictureFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(song.pictureFile.size / 1024 / 1024).toFixed(2)} MB
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
                  {song.picturePreview && (
                    <div className="mt-4">
                      <img
                        src={song.picturePreview}
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
              <Label>Hints (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Provide clues to help players guess the song
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addHint}>
              <Plus className="mr-2 h-4 w-4" />
              Add Hint
            </Button>
          </div>

          <div className="space-y-3">
            {song.hints.map((hint, index) => (
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
                  />
                </div>
                {song.hints.length > 1 && (
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
    </Card>
  );
}
