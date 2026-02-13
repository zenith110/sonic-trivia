import { useState } from "react";
import {
  Clock,
  User,
  Music,
  Brain,
  FolderOpen,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { toast } from "@/hooks/use-toast";
import { type ApprovalQueueItem } from "@/hooks/useApprovalQueue";

interface ApprovalQueueItemProps {
  item: ApprovalQueueItem;
  onApprove: (
    userId: string,
    itemId: string,
    itemType: "trivia" | "song" | "collection",
  ) => Promise<void>;
  onReject: (userId: string, itemId: string) => Promise<void>;
  isLoading?: boolean;
}

export function ApprovalQueueItemComponent({
  item,
  onApprove,
  onReject,
  isLoading = false,
}: ApprovalQueueItemProps) {
  const [actionLoading, setActionLoading] = useState<
    "approve" | "reject" | null
  >(null);

  const getItemIcon = () => {
    switch (item.type) {
      case "trivia":
        return <Brain className="h-4 w-4" />;
      case "song":
        return <Music className="h-4 w-4" />;
      case "collection":
        return <FolderOpen className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getItemId = () => {
    return (
      item.questionId ||
      item.questionCollectionId ||
      item.songId ||
      item.songCollectionId ||
      ""
    );
  };

  const getTypeColor = () => {
    switch (item.type) {
      case "trivia":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "song":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "collection":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const handleApprove = async () => {
    setActionLoading("approve");
    try {
      await onApprove(item.userId, getItemId(), item.type);
      toast({
        title: "Request Approved",
        description: `Successfully approved ${item.displayName}`,
      });
    } catch (error) {
      toast({
        title: "Approval Failed",
        description:
          error instanceof Error ? error.message : "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading("reject");
    try {
      await onReject(item.userId, getItemId());
      toast({
        title: "Request Rejected",
        description: `Successfully rejected ${item.displayName}`,
      });
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description:
          error instanceof Error ? error.message : "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const isDisabled = isLoading || actionLoading !== null;

  return (
    <Card className="w-full transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              {getItemIcon()}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">{item.displayName}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={getTypeColor()}>
                  {item.type}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDate(item.createdAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDisabled}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  {actionLoading === "approve" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Approve
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve Request</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to approve "{item.displayName}"? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDisabled}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {actionLoading === "reject" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Request</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reject "{item.displayName}"? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReject}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Reject
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Separator className="mb-3" />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Submitted by:</span>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="font-medium">
                {item.userId.substring(0, 8)}...
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Item ID:</span>
            <span className="font-mono text-xs">
              {getItemId().substring(0, 12)}...
            </span>
          </div>
        </div>

        {item.type === "collection" && (
          <div className="mt-3 p-2 bg-muted/50 rounded-md">
            <div className="text-xs text-muted-foreground mb-1">
              Collection Type:
            </div>
            <div className="text-sm font-medium">
              {item.questionCollectionId
                ? "Trivia Collection"
                : "Song Collection"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
