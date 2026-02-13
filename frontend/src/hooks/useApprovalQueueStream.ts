import { useState, useEffect, useRef, useCallback } from "react";
import { create } from "@bufbuild/protobuf";
import { approvalQueueServiceClient } from "@/grpc";
import {
  StreamApprovalQueueRequestSchema,
  type ApprovalQueueUpdate,
  type ApprovalRequest,
} from "@/generated/approvalqueue_pb";
import { useAuth } from "./useAuth";

export interface ApprovalQueueItem {
  userId: string;
  questionId?: string;
  questionCollectionId?: string;
  songId?: string;
  songCollectionId?: string;
  createdAt: string;
  type: "trivia" | "song" | "collection";
  displayName: string;
  action?: "added" | "updated" | "approved" | "removed" | "initial";
}

export interface UseApprovalQueueStreamResult {
  items: ApprovalQueueItem[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  reconnect: () => void;
  removeItem: (userId: string, itemId: string) => void;
}

const transformApprovalRequest = (
  request: ApprovalRequest,
  action?: string,
): ApprovalQueueItem => {
  let type: "trivia" | "song" | "collection";
  let displayName: string;

  if (request.questionId) {
    type = "trivia";
    displayName = `Trivia Question`;
  } else if (request.questionCollectionId) {
    type = "collection";
    displayName = `Trivia Collection`;
  } else if (request.songId) {
    type = "song";
    displayName = `Song`;
  } else if (request.songCollectionId) {
    type = "collection";
    displayName = `Song Collection`;
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
    createdAt: request.createdAt || new Date().toISOString(),
    type,
    displayName,
    action: action as
      | "added"
      | "updated"
      | "approved"
      | "removed"
      | "initial"
      | undefined,
  };
};

export const useApprovalQueueStream = (): UseApprovalQueueStreamResult => {
  const { user } = useAuth();
  const [items, setItems] = useState<ApprovalQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Check if user has admin/moderator permissions
  const hasApprovalPermissions =
    user?.role === "admin" || user?.role === "moderator";

  const getItemKey = (item: ApprovalQueueItem): string => {
    if (item.questionId) return `question-${item.questionId}`;
    if (item.questionCollectionId)
      return `question-collection-${item.questionCollectionId}`;
    if (item.songId) return `song-${item.songId}`;
    if (item.songCollectionId)
      return `song-collection-${item.songCollectionId}`;
    return `unknown-${item.userId}`;
  };

  const removeItem = useCallback((userId: string, itemId: string) => {
    setItems((prevItems) => {
      return prevItems.filter((item) => {
        // Check if this is the item to remove (matching both userId and itemId)
        const isMatchingItem =
          item.userId === userId &&
          (item.questionId === itemId ||
            item.questionCollectionId === itemId ||
            item.songId === itemId ||
            item.songCollectionId === itemId);
        return !isMatchingItem;
      });
    });
  }, []);

  const handleUpdate = useCallback((update: ApprovalQueueUpdate) => {
    console.log("Received approval queue update:", update.action);

    if (!update.approvalRequest) {
      console.warn("Update missing approval request data");
      return;
    }

    const item = transformApprovalRequest(
      update.approvalRequest,
      update.action,
    );
    const itemKey = getItemKey(item);

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (prevItem) => getItemKey(prevItem) === itemKey,
      );

      switch (update.action) {
        case "initial":
        case "added":
          // Add new item or update existing one
          if (existingIndex >= 0) {
            // Update existing item
            const newItems = [...prevItems];
            newItems[existingIndex] = item;
            return newItems;
          } else {
            // Add new item to the beginning
            return [item, ...prevItems];
          }

        case "updated":
          // Update existing item
          if (existingIndex >= 0) {
            const newItems = [...prevItems];
            newItems[existingIndex] = item;
            return newItems;
          }
          return prevItems;

        case "approved":
        case "removed":
          // Remove item from queue
          if (existingIndex >= 0) {
            return prevItems.filter((_, index) => index !== existingIndex);
          }
          return prevItems;

        default:
          console.warn("Unknown action:", update.action);
          return prevItems;
      }
    });
  }, []);

  // Use ref to store handleUpdate so it doesn't cause reconnections
  const handleUpdateRef = useRef(handleUpdate);
  useEffect(() => {
    handleUpdateRef.current = handleUpdate;
  }, [handleUpdate]);

  const connectStream = useCallback(async () => {
    if (!hasApprovalPermissions) {
      setError("Insufficient permissions to access approval queue");
      setLoading(false);
      return;
    }

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this stream
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      const request = create(StreamApprovalQueueRequestSchema, {});

      console.log("Connecting to approval queue stream...");

      const stream = approvalQueueServiceClient.streamApprovalQueue(request, {
        signal,
      });

      setIsConnected(true);
      setLoading(false);

      // Process incoming updates
      for await (const update of stream) {
        if (signal.aborted) {
          console.log("Stream aborted by client");
          break;
        }

        handleUpdateRef.current(update);
      }

      console.log("Stream ended normally");
      setIsConnected(false);
    } catch (err) {
      console.error("Stream error:", err);

      // Don't show error if stream was intentionally aborted
      if (signal.aborted) {
        console.log("Stream was aborted, not showing error");
        setIsConnected(false);
        setLoading(false);
        return;
      }

      setError(
        err instanceof Error ? err.message : "Failed to connect to stream",
      );
      setIsConnected(false);
      setLoading(false);

      // Attempt to reconnect after a delay
      if (hasApprovalPermissions) {
        console.log("Scheduling reconnect in 5 seconds...");
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connectStream();
        }, 5000);
      }
    }
  }, [hasApprovalPermissions]);

  const reconnect = useCallback(() => {
    console.log("Manual reconnect requested");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setItems([]); // Clear items on manual reconnect
    connectStream();
  }, [connectStream]);

  // Connect to stream on mount
  useEffect(() => {
    if (!hasApprovalPermissions) {
      console.log("No approval permissions, skipping stream connection");
      return;
    }

    let isActive = true;
    console.log("Setting up approval queue stream");

    // Initial connection with small delay to avoid React Strict Mode race condition
    const initialConnect = async () => {
      // Small delay to let any pending cleanup finish (React Strict Mode)
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Check if effect is still active (handles React Strict Mode)
      if (!isActive) {
        console.log("Effect no longer active, skipping connection");
        return;
      }

      // Create new abort controller for this stream
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const signal = abortController.signal;

      setLoading(true);
      setError(null);

      try {
        const request = create(StreamApprovalQueueRequestSchema, {});

        console.log("Connecting to approval queue stream...");

        const stream = approvalQueueServiceClient.streamApprovalQueue(request, {
          signal,
        });

        setIsConnected(true);
        setLoading(false);
        console.log("Stream connected successfully");

        // Process incoming updates
        for await (const update of stream) {
          if (signal.aborted || !isActive) {
            console.log("Stream aborted by client or effect cleaned up");
            break;
          }

          console.log("Received update:", update.action);
          handleUpdateRef.current(update);
        }

        console.log("Stream ended normally");
        if (isActive) {
          setIsConnected(false);
        }
      } catch (err) {
        console.error("Stream error:", err);

        // Don't show error if stream was intentionally aborted or effect cleaned up
        if (signal.aborted || !isActive) {
          console.log("Stream was aborted, not showing error");
          if (isActive) {
            setIsConnected(false);
            setLoading(false);
          }
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to connect to stream",
        );
        setIsConnected(false);
        setLoading(false);

        // Attempt to reconnect after a delay
        if (isActive) {
          console.log("Scheduling reconnect in 5 seconds...");
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isActive) {
              console.log("Attempting to reconnect...");
              connectStream();
            }
          }, 5000);
        }
      }
    };

    initialConnect();

    // Cleanup on unmount or when hasApprovalPermissions changes
    return () => {
      console.log("Cleaning up approval queue stream");
      isActive = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApprovalPermissions]);

  return {
    items,
    loading,
    error,
    isConnected,
    reconnect,
    removeItem,
  };
};
