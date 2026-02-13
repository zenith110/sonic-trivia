import { useState, useEffect, useCallback } from "react";
import { create } from "@bufbuild/protobuf";
import { approvalQueueServiceClient } from "@/grpc";
import {
  GetAllApprovalRequestsRequestSchema,
  ApproveRequestRequestSchema,
  RemoveFromQueueRequestSchema,
  type ApprovalRequest,
} from "@/generated/approvalqueue_pb";
import { useAuth } from "./useAuth";

export interface ApprovalQueueFilters {
  type?: "all" | "trivia" | "song";
  status?: "pending" | "approved" | "rejected";
  userId?: string;
}

export interface ApprovalQueueItem {
  userId: string;
  questionId?: string;
  questionCollectionId?: string;
  songId?: string;
  songCollectionId?: string;
  createdAt: string;
  type: "trivia" | "song" | "collection";
  displayName: string;
}

export interface UseApprovalQueueResult {
  items: ApprovalQueueItem[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchApprovalRequests: (
    page?: number,
    filters?: ApprovalQueueFilters,
  ) => Promise<void>;
  approveRequest: (
    userId: string,
    itemId: string,
    itemType: "trivia" | "song" | "collection",
  ) => Promise<void>;
  rejectRequest: (userId: string, itemId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

interface ApproveRequestData {
  userId: string;
  questionId?: string;
  questionCollectionId?: string;
  songId?: string;
  songCollectionId?: string;
}

export const useApprovalQueue = (): UseApprovalQueueResult => {
  const { user } = useAuth();
  const [items, setItems] = useState<ApprovalQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Check if user has admin/moderator permissions
  const hasApprovalPermissions =
    user?.role === "admin" || user?.role === "moderator";

  const transformApprovalRequest = (
    request: ApprovalRequest,
  ): ApprovalQueueItem => {
    let type: "trivia" | "song" | "collection";
    let displayName: string;

    if (request.questionId) {
      type = "trivia";
      displayName = `Trivia Question (ID: ${request.questionId.substring(0, 8)}...)`;
    } else if (request.questionCollectionId) {
      type = "collection";
      displayName = `Trivia Collection (ID: ${request.questionCollectionId.substring(0, 8)}...)`;
    } else if (request.songId) {
      type = "song";
      displayName = `Song (ID: ${request.songId.substring(0, 8)}...)`;
    } else if (request.songCollectionId) {
      type = "collection";
      displayName = `Song Collection (ID: ${request.songCollectionId.substring(0, 8)}...)`;
    } else {
      type = "trivia";
      displayName = "Unknown Item";
    }

    return {
      userId: request.userId,
      questionId: request.questionId,
      questionCollectionId: request.questionCollectionId,
      songId: request.songId,
      songCollectionId: request.songCollectionId,
      createdAt: request.createdAt,
      type,
      displayName,
    };
  };

  const fetchApprovalRequests = useCallback(
    async (page = currentPage, filters?: ApprovalQueueFilters) => {
      if (!hasApprovalPermissions) {
        setError("Insufficient permissions to access approval queue");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const request = create(GetAllApprovalRequestsRequestSchema, {
          page: page,
          pageSize: pageSize,
        });

        const response =
          await approvalQueueServiceClient.getAllApprovalRequests(request);

        if (response.approvalRequests) {
          let transformedItems = response.approvalRequests.map(
            transformApprovalRequest,
          );

          // Apply client-side filters if needed
          if (filters?.type && filters.type !== "all") {
            if (filters.type === "trivia") {
              transformedItems = transformedItems.filter(
                (item) =>
                  item.type === "trivia" ||
                  (item.type === "collection" && item.questionCollectionId),
              );
            } else if (filters.type === "song") {
              transformedItems = transformedItems.filter(
                (item) =>
                  item.type === "song" ||
                  (item.type === "collection" && item.songCollectionId),
              );
            }
          }

          if (filters?.userId) {
            transformedItems = transformedItems.filter(
              (item) => item.userId === filters.userId,
            );
          }

          setItems(transformedItems);
          setTotalItems(transformedItems.length);
          setCurrentPage(page);
        } else {
          setItems([]);
          setTotalItems(0);
        }
      } catch (err) {
        console.error("Failed to fetch approval requests:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch approval requests",
        );
        setItems([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    },
    [hasApprovalPermissions, pageSize, currentPage],
  );

  const refreshData = useCallback(async () => {
    await fetchApprovalRequests(currentPage);
  }, [fetchApprovalRequests, currentPage]);

  const approveRequest = useCallback(
    async (
      userId: string,
      itemId: string,
      itemType: "trivia" | "song" | "collection",
    ) => {
      if (!hasApprovalPermissions) {
        throw new Error("Insufficient permissions to approve requests");
      }

      setLoading(true);
      setError(null);

      try {
        // Inline the request data creation
        const requestData: ApproveRequestData = { userId };

        if (itemType === "trivia") {
          requestData.questionId = itemId;
        } else if (itemType === "song") {
          requestData.songId = itemId;
        } else if (itemType === "collection") {
          // Determine if it's a trivia or song collection
          const item = items.find(
            (i) =>
              i.questionCollectionId === itemId ||
              i.songCollectionId === itemId,
          );
          if (item?.questionCollectionId) {
            requestData.questionCollectionId = itemId;
          } else if (item?.songCollectionId) {
            requestData.songCollectionId = itemId;
          }
        }

        const request = create(ApproveRequestRequestSchema, requestData);
        await approvalQueueServiceClient.approveRequest(request);

        // Refresh the data after successful approval
        await refreshData();
      } catch (err) {
        console.error("Failed to approve request:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to approve request";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [hasApprovalPermissions, items, refreshData],
  );

  const rejectRequest = useCallback(
    async (userId: string, itemId: string) => {
      if (!hasApprovalPermissions) {
        throw new Error("Insufficient permissions to reject requests");
      }

      setLoading(true);
      setError(null);

      try {
        const request = create(RemoveFromQueueRequestSchema, {
          userId,
          questionId: itemId, // The API seems to use questionId as a generic item identifier
        });

        await approvalQueueServiceClient.removeFromQueue(request);

        // Refresh the data after successful rejection
        await refreshData();
      } catch (err) {
        console.error("Failed to reject request:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to reject request";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [hasApprovalPermissions, refreshData],
  );

  const setPage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchApprovalRequests(page);
    },
    [fetchApprovalRequests],
  );

  const handleSetPageSize = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when changing page size
      fetchApprovalRequests(1);
    },
    [fetchApprovalRequests],
  );

  // Load data on mount
  useEffect(() => {
    if (hasApprovalPermissions) {
      fetchApprovalRequests();
    }
  }, [hasApprovalPermissions, fetchApprovalRequests]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return {
    items,
    loading,
    error,
    totalItems,
    currentPage,
    pageSize,
    hasNextPage,
    hasPreviousPage,
    fetchApprovalRequests,
    approveRequest,
    rejectRequest,
    refreshData,
    setPage,
    setPageSize: handleSetPageSize,
  };
};
