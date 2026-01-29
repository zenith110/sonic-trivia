import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  Music,
} from "lucide-react";
import { guessThatSongClient } from "@/grpc";
import { useAuth } from "@/hooks/useAuth";

interface SongCollection {
  id: string;
  name: string;
  description: string;
  createdBy: string;
}

interface SongCollectionSelectorProps {
  selectedCollectionId?: string;
  onCollectionChange: (collectionId: string | undefined) => void;
}

export function SongCollectionSelector({
  selectedCollectionId,
  onCollectionChange,
}: SongCollectionSelectorProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<SongCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage]);

  const loadCollections = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await guessThatSongClient.getSongCollections({
        userId: user.id || user.username,
        page: currentPage,
        pageSize: pageSize,
      });

      if (response.collections) {
        const collectionsList: SongCollection[] = response.collections.map(
          (c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            createdBy: c.createdBy,
          }),
        );
        setCollections(collectionsList);
        setTotal(response.total);
        setTotalPages(Math.ceil(response.total / pageSize));
      }
    } catch (err) {
      console.error("Error loading song collections:", err);
      setError("Failed to load song collections");
    } finally {
      setIsLoading(false);
    }
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

  const handleValueChange = (value: string) => {
    if (value === "none") {
      onCollectionChange(undefined);
    } else {
      onCollectionChange(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Add to Collection (Optional)
        </CardTitle>
        <CardDescription>
          Select a song collection to add this song to
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading collections...
            </span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCollections}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : collections.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <FolderPlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No song collections found. Create a collection first to add songs
              to it.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="collection">Select Collection</Label>
              {total > 0 && (
                <span className="text-xs text-muted-foreground">
                  {total} collection{total !== 1 ? "s" : ""} total
                </span>
              )}
            </div>
            <Select
              value={selectedCollectionId || "none"}
              onValueChange={handleValueChange}
            >
              <SelectTrigger id="collection">
                <SelectValue placeholder="Choose a collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">
                    Don't add to collection
                  </span>
                </SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{collection.name}</span>
                      {collection.description && (
                        <span className="text-xs text-muted-foreground">
                          {collection.description.length > 50
                            ? `${collection.description.substring(0, 50)}...`
                            : collection.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCollectionId && (
              <p className="text-xs text-muted-foreground">
                This song will be added to the selected collection
              </p>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
