import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderPlus,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
} from "lucide-react";

interface Collection {
  id: string;
  name: string;
  description: string;
  sizeOfCollection: string;
  createdBy: string;
  isUnderReview?: boolean;
}

interface CollectionsListProps {
  collections: Collection[];
  onCreateClick: () => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCollections?: number;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
}

export function CollectionsList({
  collections,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  totalCollections = 0,
  onPreviousPage,
  onNextPage,
}: CollectionsListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trivia Collections</h2>
          <p className="text-sm text-muted-foreground">
            Manage your trivia question collections
            {totalCollections > 0 && (
              <span className="ml-1">({totalCollections} total)</span>
            )}
          </p>
        </div>
        <Button onClick={onCreateClick} disabled={isLoading}>
          <FolderPlus className="mr-2 h-4 w-4" />
          Create Collection
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">
              Loading collections...
            </h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we fetch your collections
            </p>
          </CardContent>
        </Card>
      ) : collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {totalCollections > 0
                ? "No collections on this page"
                : "No collections yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {totalCollections > 0
                ? "Try navigating to a different page"
                : "Create your first trivia collection to get started"}
            </p>
            <Button onClick={onCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{collection.name}</CardTitle>
                  {collection.isUnderReview && (
                    <Badge variant="secondary" className="ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      Under Review
                    </Badge>
                  )}
                </div>
                <CardDescription>{collection.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions:</span>
                    <span className="font-medium">
                      {collection.sizeOfCollection}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created by:</span>
                    <span className="font-medium">{collection.createdBy}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEditClick(collection.id)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteClick(collection.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && !isLoading && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousPage}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextPage}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
