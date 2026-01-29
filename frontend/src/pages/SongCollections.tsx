import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { guessThatSongClient } from "@/grpc";
import { create } from "@bufbuild/protobuf";
import {
  SongSchema,
  SongHintSchema,
  CreateSongCollectionRequestSchema,
} from "@/generated/guessthatsong_pb";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SongCollectionsList } from "@/components/song/SongCollectionsList";
import { SongCollectionForm } from "@/components/song/SongCollectionForm";
import { SongEditor } from "@/components/song/SongEditor";
import type { Song } from "@/components/song/SongEditor";

interface SongCollection {
  id: string;
  name: string;
  description: string;
  sizeOfCollection: string;
  createdBy: string;
  isUnderReview?: boolean;
}

type ViewMode = "list" | "create" | "edit";

export function SongCollections() {
  const { user } = useAuth();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [collections, setCollections] = useState<SongCollection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCollections, setTotalCollections] = useState(0);

  // Collection form state
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [collectionSize, setCollectionSize] = useState("10");
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [songs, setSongs] = useState<Song[]>([]);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(
    null,
  );

  // Load collections when view changes to list or page changes
  useEffect(() => {
    if (viewMode === "list") {
      loadCollections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentPage, user]);

  const loadCollections = async () => {
    if (!user) return;

    setIsLoadingCollections(true);
    try {
      const response = await guessThatSongClient.getSongCollections({
        userId: user.id || user.username,
        page: currentPage,
        pageSize: 5,
      });

      if (response.collections) {
        const collectionsList: SongCollection[] = response.collections.map(
          (c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            sizeOfCollection: c.songs?.length.toString() || "0",
            createdBy: c.createdBy,
            isUnderReview: c.isUnderReview,
          }),
        );
        setCollections(collectionsList);
        setTotalCollections(response.total);
        setTotalPages(Math.ceil(response.total / 5));
      }
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setIsLoadingCollections(false);
    }
  };

  // Initialize songs when creating collection
  useEffect(() => {
    if (viewMode === "create" && songs.length === 0) {
      const size = parseInt(collectionSize) || 1;
      const initialSongs: Song[] = Array.from({ length: size }, () =>
        createEmptySong(),
      );
      setSongs(initialSongs);
    }
  }, [viewMode, collectionSize, songs.length]);

  const createEmptySong = (): Song => ({
    songTitle: "",
    artist: "",
    album: "",
    releaseYear: "",
    category: "",
    difficulty: "",
    playsPerRound: "3",
    clipDuration: "15",
    audioFile: null,
    audioPreview: "",
    hints: [
      { id: "1", text: "" },
      { id: "2", text: "" },
      { id: "3", text: "" },
    ],
    includePicture: false,
    pictureFile: null,
    picturePreview: "",
  });

  const currentSong = songs[currentSongIndex] || null;

  const updateCurrentSong = (updates: Partial<Song>) => {
    setSongs((prev) => {
      const newSongs = [...prev];
      newSongs[currentSongIndex] = {
        ...newSongs[currentSongIndex],
        ...updates,
      };
      return newSongs;
    });
  };

  const handleSizeChange = (newSize: string) => {
    const size = parseInt(newSize) || 1;
    setCollectionSize(newSize);

    // Adjust songs array when size changes
    if (size > songs.length) {
      const additionalSongs = Array.from({ length: size - songs.length }, () =>
        createEmptySong(),
      );
      setSongs([...songs, ...additionalSongs]);
    } else if (size < songs.length) {
      setSongs(songs.slice(0, size));
      if (currentSongIndex >= size) {
        setCurrentSongIndex(size - 1);
      }
    }
  };

  const goToNextSong = () => {
    if (currentSongIndex < songs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
    }
  };

  const goToPreviousSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
    }
  };

  const handleSubmitCollection = async () => {
    try {
      if (!user) {
        alert("You must be logged in to create a collection");
        return;
      }

      // Validate collection metadata
      if (!collectionName || !collectionDescription) {
        alert("Please fill in collection name and description");
        return;
      }

      // Create all songs first and collect their IDs
      const songIds: string[] = [];

      for (const s of songs) {
        // Validate song
        if (!s.songTitle || !s.artist || !s.category || !s.difficulty) {
          alert("Please fill in all required fields for all songs");
          return;
        }

        if (!s.audioFile) {
          alert("Each song must have an audio file");
          return;
        }

        // TODO: Upload audio file and get URL
        // For now, using a placeholder URL
        const audioURL = "placeholder-audio-url";

        // Handle picture if included
        let pictureURL: string | undefined;
        if (s.includePicture && s.pictureFile) {
          // TODO: Upload picture and get URL
          pictureURL = "placeholder-picture-url";
        }

        // Create the song proto message
        const songProto = create(SongSchema, {
          songTitle: s.songTitle,
          artist: s.artist,
          album: s.album,
          releaseYear: s.releaseYear,
          category: s.category,
          difficulty: s.difficulty,
          playsPerRound: parseInt(s.playsPerRound) || 3,
          clipDuration: parseInt(s.clipDuration) || 15,
          audioUrl: audioURL,
          pictureUrl: pictureURL,
          hints: s.hints
            .filter((hint) => hint.text.trim() !== "")
            .map((hint) =>
              create(SongHintSchema, {
                id: hint.id,
                text: hint.text,
              }),
            ),
        });

        // Create each song
        const response = await guessThatSongClient.createSong({
          song: songProto,
        });

        if (response.song?.id) {
          songIds.push(response.song.id);
        }
      }

      // Create the collection with all song IDs
      const collectionRequest = create(CreateSongCollectionRequestSchema, {
        name: collectionName,
        description: collectionDescription,
        createdBy: user.username || user.email,
        sizeOfCollection: collectionSize,
        songIds: songIds,
      });

      const collectionResponse =
        await guessThatSongClient.createSongCollection(collectionRequest);

      console.log("Collection created successfully:", collectionResponse);
      alert(
        `Collection "${collectionName}" created successfully with ${songIds.length} songs!`,
      );

      // Reset form and go back to list view
      resetForm();
      setViewMode("list");
      // Reload collections list
      await loadCollections();
    } catch (error) {
      console.error("Error creating collection:", error);
      alert("Failed to create collection. Please try again.");
    }
  };

  const resetForm = () => {
    setCollectionName("");
    setCollectionDescription("");
    setCollectionSize("10");
    setCurrentSongIndex(0);
    setSongs([]);
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await guessThatSongClient.deleteSongCollection({ id });
      alert("Collection deleted successfully");
      // Reload collections after deletion
      await loadCollections();
    } catch (error) {
      console.error("Error deleting collection:", error);
      alert("Failed to delete collection");
    } finally {
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setCollectionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCreateClick = () => {
    setViewMode("create");
  };

  const handleEditClick = (id: string) => {
    // TODO: Load collection data and set viewMode to "edit"
    console.log("Edit collection:", id);
    alert("Edit functionality coming soon!");
  };

  const handleBackToList = () => {
    resetForm();
    setViewMode("list");
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Render list view
  const renderListView = () => (
    <SongCollectionsList
      collections={collections}
      onCreateClick={handleCreateClick}
      onEditClick={handleEditClick}
      onDeleteClick={openDeleteDialog}
      isLoading={isLoadingCollections}
      currentPage={currentPage}
      totalPages={totalPages}
      totalCollections={totalCollections}
      onPreviousPage={handlePreviousPage}
      onNextPage={handleNextPage}
    />
  );

  // Render create/edit view
  const renderCreateView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBackToList}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Create Song Collection</h2>
          <p className="text-sm text-muted-foreground">
            Create multiple songs in one collection for Guess That Song
          </p>
        </div>
      </div>

      {/* Collection Info */}
      <SongCollectionForm
        name={collectionName}
        description={collectionDescription}
        size={collectionSize}
        onNameChange={setCollectionName}
        onDescriptionChange={setCollectionDescription}
        onSizeChange={handleSizeChange}
      />

      {/* Song Editor */}
      {currentSong && (
        <SongEditor
          song={currentSong}
          songNumber={currentSongIndex + 1}
          totalSongs={songs.length}
          onUpdate={updateCurrentSong}
          onNext={goToNextSong}
          onPrevious={goToPreviousSong}
          showNavigation={true}
        />
      )}

      {/* Navigation and Submit */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Progress: {currentSongIndex + 1} of {songs.length} songs
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBackToList}>
                Cancel
              </Button>
              <Button onClick={handleSubmitCollection}>
                Create Collection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <div className="mx-auto max-w-6xl">
        {viewMode === "list" && renderListView()}
        {viewMode === "create" && renderCreateView()}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this collection? This action
              cannot be undone and will remove all songs in the collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                collectionToDelete && handleDeleteCollection(collectionToDelete)
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
