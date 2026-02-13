import { useState, useMemo } from "react";
import { Shield, AlertTriangle, Users, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ApprovalQueueFilters,
  ApprovalQueueList,
} from "@/components/approval-queue";
import { useApprovalQueueStream } from "@/hooks/useApprovalQueueStream";
import { useAuth } from "@/hooks/useAuth";
import { create } from "@bufbuild/protobuf";
import { approvalQueueServiceClient } from "@/grpc";
import {
  ApproveRequestRequestSchema,
  RemoveFromQueueRequestSchema,
} from "@/generated/approvalqueue_pb";

export interface ApprovalQueueFiltersType {
  type?: "all" | "trivia" | "song";
  status?: "pending" | "approved" | "rejected";
  userId?: string;
}

export function ApprovalQueue() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ApprovalQueueFiltersType>({
    type: "all",
    status: "pending",
    userId: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Use the streaming hook for real-time updates
  const {
    items: allItems,
    loading,
    error,
    isConnected,
    reconnect,
    removeItem,
  } = useApprovalQueueStream();

  // Check if user has appropriate permissions
  const hasPermissions = user?.role === "admin" || user?.role === "moderator";

  // Apply filters to the items
  const filteredItems = useMemo(() => {
    let result = [...allItems];

    // Filter by type
    if (filters.type && filters.type !== "all") {
      if (filters.type === "trivia") {
        result = result.filter(
          (item) =>
            item.type === "trivia" ||
            (item.type === "collection" && item.questionCollectionId),
        );
      } else if (filters.type === "song") {
        result = result.filter(
          (item) =>
            item.type === "song" ||
            (item.type === "collection" && item.songCollectionId),
        );
      }
    }

    // Filter by userId
    if (filters.userId) {
      result = result.filter((item) => item.userId === filters.userId);
    }

    return result;
  }, [allItems, filters]);

  // Apply pagination
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, pageSize]);

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const handleFiltersChange = (newFilters: ApprovalQueueFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const approveRequest = async (
    userId: string,
    itemId: string,
    itemType: "trivia" | "song" | "collection",
  ) => {
    try {
      const requestData: {
        userId: string;
        questionId?: string;
        questionCollectionId?: string;
        songId?: string;
        songCollectionId?: string;
      } = { userId };

      if (itemType === "trivia") {
        requestData.questionId = itemId;
      } else if (itemType === "song") {
        requestData.songId = itemId;
      } else if (itemType === "collection") {
        // Determine if it's a trivia or song collection
        const item = allItems.find(
          (i) =>
            i.questionCollectionId === itemId || i.songCollectionId === itemId,
        );
        if (item?.questionCollectionId) {
          requestData.questionCollectionId = itemId;
        } else if (item?.songCollectionId) {
          requestData.songCollectionId = itemId;
        }
      }

      const request = create(ApproveRequestRequestSchema, requestData);
      await approvalQueueServiceClient.approveRequest(request);

      // Remove item from local state immediately (optimistic update)
      removeItem(userId, itemId);
    } catch (err) {
      console.error("Failed to approve request:", err);
      throw err;
    }
  };

  const rejectRequest = async (userId: string, itemId: string) => {
    try {
      const request = create(RemoveFromQueueRequestSchema, {
        userId,
        questionId: itemId,
      });

      await approvalQueueServiceClient.removeFromQueue(request);

      // Remove item from local state immediately (optimistic update)
      removeItem(userId, itemId);
    } catch (err) {
      console.error("Failed to reject request:", err);
      throw err;
    }
  };

  const getStatsCards = () => {
    const triviaCount = filteredItems.filter(
      (item) =>
        item.type === "trivia" ||
        (item.type === "collection" && item.questionCollectionId),
    ).length;
    const songCount = filteredItems.filter(
      (item) =>
        item.type === "song" ||
        (item.type === "collection" && item.songCollectionId),
    ).length;

    return [
      {
        title: "Total Requests",
        value: totalItems,
        icon: <Users className="h-4 w-4" />,
        color: "text-blue-600",
      },
      {
        title: "Connection",
        value: isConnected ? "Live" : "Disconnected",
        icon: isConnected ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        ),
        color: isConnected ? "text-green-600" : "text-red-600",
      },
      {
        title: "Trivia Items",
        value: triviaCount,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "text-purple-600",
      },
      {
        title: "Song Items",
        value: songCount,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "text-green-600",
      },
    ];
  };

  if (!hasPermissions) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You need admin or moderator privileges to access the approval
              queue.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Approval Queue
              {isConnected && (
                <span className="text-sm font-normal text-green-600 flex items-center gap-1">
                  <Wifi className="h-4 w-4" /> Live
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">
              Review and approve pending content submissions from community
              members. Updates in real-time.
            </p>
          </div>
          {!isConnected && (
            <Button onClick={reconnect} variant="outline" size="sm">
              <WifiOff className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getStatsCards().map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={stat.color}>{stat.icon}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {!isConnected && (
              <Button
                onClick={reconnect}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                Retry Connection
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <ApprovalQueueFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalCount={allItems.length}
        filteredCount={totalItems}
        loading={loading}
      />

      <Separator />

      {/* Main Content */}
      <ApprovalQueueList
        items={paginatedItems}
        loading={loading}
        error={error}
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onRefresh={reconnect}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onApprove={approveRequest}
        onReject={rejectRequest}
      />

      {/* Helper Text */}
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <h4 className="font-medium text-foreground">
              Approval Guidelines:
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Review content for appropriateness and accuracy</li>
              <li>Ensure trivia questions have correct answers</li>
              <li>Verify song information and audio quality</li>
              <li>Reject spam, inappropriate, or low-quality submissions</li>
              <li>Use your best judgment as a {user?.role}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
