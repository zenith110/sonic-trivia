# Approval Queue Streaming Implementation

## Overview

This document describes the implementation of real-time streaming for the Approval Queue feature in Sonic Trivia. The system allows moderators and admins to receive live updates whenever content (questions, songs, or collections) is created or updated and requires approval.

## Architecture

### Backend Components

#### 1. Protocol Buffers Definition (`protos/approvalqueue.proto`)

The proto file defines the streaming RPC and messages:

```protobuf
service ApprovalQueueService {
  rpc StreamApprovalQueue(StreamApprovalQueueRequest) returns (stream ApprovalQueueUpdate) {}
  // ... other RPCs
}

message ApprovalQueueUpdate {
  string action = 1; // "added", "updated", "approved", "removed", "initial"
  ApprovalRequest approval_request = 2;
  string timestamp = 3;
}
```

#### 2. Global Notification Manager (`backend/notification/manager.go`)

A singleton manager that maintains all active streaming connections and broadcasts updates to connected clients.

**Key Features:**
- Thread-safe client registration/unregistration
- Buffered channels (100 updates) for each client
- Broadcast to all connected clients
- Convenience methods for different content types

**Methods:**
- `GetGlobalManager()` - Returns singleton instance
- `Register(clientID)` - Registers a new streaming client
- `Unregister(clientID)` - Removes a client
- `Broadcast(update)` - Sends update to all clients
- `NotifyQuestionAdded(userID, questionID)` - Helper for question additions
- `NotifyQuestionCollectionAdded(userID, collectionID)` - Helper for question collections
- `NotifySongAdded(userID, songID)` - Helper for song additions
- `NotifySongCollectionAdded(userID, collectionID)` - Helper for song collections
- `NotifyApproved(...)` - Helper for approvals
- `NotifyRemoved(...)` - Helper for removals

#### 3. Service Integrations

**Approval Queue Service** (`backend/services/approvalqueue/approvalqueue.go`):
- Implements `StreamApprovalQueue` RPC handler
- Sends initial state (all current approval requests) when client connects
- Broadcasts updates for approve/reject operations
- Uses global notification manager

**Trivia Service** (`backend/services/trivia/trivia.go`):
- Calls notification manager when questions/collections are added to queue
- Integrated in `CreateQuestion`, `UpdateQuestion`, `CreateQuestionCollection`, `UpdateQuestionCollection`

**Guess That Song Service** (`backend/services/guessthatsong/guessthatsong.go`):
- Calls notification manager when songs/collections are added to queue
- Integrated in `CreateSong`, `UpdateSong`, `CreateSongCollection`, `UpdateSongCollection`

### Frontend Components

#### 1. Streaming Hook (`frontend/src/hooks/useApprovalQueueStream.ts`)

A custom React hook that manages the streaming connection and state.

**Features:**
- Automatic connection on mount
- Receives initial state and live updates
- Handles connection errors with automatic reconnection (5-second delay)
- Manual reconnection support
- Optimistic updates on approve/reject
- Client-side filtering and pagination

**Return Values:**
```typescript
{
  items: ApprovalQueueItem[];     // Current approval queue items
  loading: boolean;                // Initial loading state
  error: string | null;            // Error message
  isConnected: boolean;            // Connection status
  reconnect: () => void;           // Manual reconnect function
  removeItem: (userId, itemId) => void; // Remove item from local state
}
```

#### 2. Updated Approval Queue Page (`frontend/src/pages/ApprovalQueue.tsx`)

The page now uses streaming instead of polling:

**Features:**
- Real-time updates without manual refresh
- Live connection indicator
- Connection stats in dashboard cards
- Manual reconnect button when disconnected
- Client-side filtering and pagination
- Optimistic UI updates

## Data Flow

### When Content is Created/Updated

1. User creates/updates a question, song, or collection
2. Backend service checks user role:
   - If role is "user", sets `is_under_review = true`
   - Creates approval request in database
   - Calls global notification manager
3. Notification manager broadcasts update to all connected clients
4. Frontend receives update via streaming connection
5. Hook updates state, triggering UI re-render
6. New item appears in approval queue instantly

### When Content is Approved/Rejected

1. Moderator/admin clicks approve or reject
2. Frontend makes RPC call to backend
3. Backend updates database
4. Backend broadcasts approval/removal to all clients
5. All connected clients see the update instantly
6. Item is removed from queue in UI

### Connection Lifecycle

1. **Initial Connection:**
   - Frontend calls `StreamApprovalQueue` RPC
   - Backend sends all current approval requests with action "initial"
   - Stream remains open for live updates

2. **Receiving Updates:**
   - Backend broadcasts update to all connected clients
   - Frontend receives update and updates state based on action:
     - `added`/`initial` - Add or update item in list
     - `updated` - Update existing item
     - `approved`/`removed` - Remove item from list

3. **Disconnection:**
   - If connection drops, frontend shows disconnected state
   - Automatic reconnection after 5 seconds
   - Manual reconnect button available
   - On reconnect, receives fresh initial state

## Update Actions

| Action | Description | Triggered By |
|--------|-------------|--------------|
| `initial` | Initial state when connecting | StreamApprovalQueue RPC |
| `added` | New item added to queue | Create/Update with user role |
| `updated` | Existing item updated | Update operations (future use) |
| `approved` | Item approved by mod/admin | ApproveRequest RPC |
| `removed` | Item removed from queue | RemoveFromQueue RPC |

## Performance Considerations

### Backend

- **Buffered Channels:** Each client has a 100-message buffer to handle bursts
- **Non-blocking Sends:** If a client's buffer is full, the update is skipped (logged)
- **Singleton Pattern:** Only one notification manager instance exists
- **Thread-safe Operations:** All operations use mutex locks

### Frontend

- **Optimistic Updates:** UI updates immediately, not waiting for server confirmation
- **Client-side Filtering:** Reduces network traffic, filtering happens locally
- **Client-side Pagination:** No need to request different pages from server
- **Automatic Reconnection:** Handles network issues gracefully

## Security

- **Authentication Required:** Users must be authenticated to create content
- **Role-based Access:** Only users with role "user" trigger approval workflow
- **Permission Checks:** Only admin/moderator can approve/reject
- **Stream Access Control:** Frontend checks permissions before connecting

## Error Handling

### Backend

- Logs all errors with context
- Gracefully handles client disconnections
- Continues broadcasting to remaining clients on individual send failures

### Frontend

- Displays error messages to users
- Provides manual reconnect option
- Shows connection status in UI
- Automatic reconnection with exponential backoff potential

## Testing

### Backend Testing

```bash
# Build backend
cd backend && go build -o sonic-trivia-backend .

# Run backend
./sonic-trivia-backend
```

### Frontend Testing

```bash
# Install dependencies
cd frontend && bun install

# Run development server
bun run dev
```

### Manual Testing Checklist

1. ✅ Create a question as a regular user
2. ✅ Verify it appears instantly in approval queue for mods/admins
3. ✅ Create multiple items, verify all appear
4. ✅ Approve an item, verify it disappears from all connected clients
5. ✅ Reject an item, verify it disappears from all connected clients
6. ✅ Disconnect network, verify reconnection
7. ✅ Have multiple mods/admins connected, verify all see updates
8. ✅ Test with questions, songs, and collections

## Future Enhancements

1. **Enhanced Filtering:** Server-side filtering to reduce data transfer
2. **Pagination on Server:** Server-side pagination for very large queues
3. **Notifications:** Browser notifications for new approval requests
4. **Action History:** Track who approved/rejected what and when
5. **Batch Operations:** Approve/reject multiple items at once
6. **Comments:** Allow mods to leave comments on submissions
7. **Analytics:** Track approval times, rejection rates, etc.
8. **WebSocket Alternative:** Offer WebSocket as alternative to gRPC streams

## Troubleshooting

### Issue: "Stream not connecting"

**Solution:**
- Check backend logs for errors
- Verify user has admin/moderator role
- Check network connectivity
- Try manual reconnect button

### Issue: "Updates not appearing"

**Solution:**
- Verify notification manager is initialized
- Check backend logs for broadcast messages
- Ensure content is created by user with "user" role
- Verify `is_under_review` is set to true

### Issue: "Multiple duplicate items"

**Solution:**
- Check unique key generation in `getItemKey()`
- Verify proper filtering in `handleUpdate()`
- Clear browser cache and reconnect

### Issue: "High memory usage"

**Solution:**
- Check number of connected clients (call `GetClientCount()`)
- Verify channels are properly closed on disconnect
- Check for channel buffer overflow (look for "channel full" logs)

## Code Examples

### Adding Notification to New Service

```go
// In your service create/update method
if userRole == "user" {
    err = s.repo.AddContentToApprovalQueue(ctx, userID, contentID)
    if err == nil {
        // Notify all connected clients
        notification.GetGlobalManager().NotifyQuestionAdded(userID, contentID)
    }
}
```

### Using the Stream in Frontend

```typescript
import { useApprovalQueueStream } from "@/hooks/useApprovalQueueStream";

function MyComponent() {
  const { items, loading, error, isConnected, reconnect } = 
    useApprovalQueueStream();

  if (!isConnected) {
    return <button onClick={reconnect}>Reconnect</button>;
  }

  return (
    <div>
      {items.map(item => (
        <div key={getItemKey(item)}>{item.displayName}</div>
      ))}
    </div>
  );
}
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ApprovalQueue Page                                   │  │
│  │    ├─ useApprovalQueueStream hook                    │  │
│  │    ├─ Real-time UI updates                           │  │
│  │    └─ Connection status indicator                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ gRPC Stream
                      │ (StreamApprovalQueue RPC)
┌─────────────────────▼───────────────────────────────────────┐
│                        Backend                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Approval Queue Service                               │  │
│  │    ├─ StreamApprovalQueue handler                    │  │
│  │    ├─ Approve/Reject handlers                        │  │
│  │    └─ Broadcast to global manager                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Global Notification Manager (Singleton)              │  │
│  │    ├─ Client registry (map[clientID]chan)           │  │
│  │    ├─ Register/Unregister clients                    │  │
│  │    └─ Broadcast to all clients                       │  │
│  └───────────▲──────────────────────────▲────────────────┘  │
│              │                          │                    │
│  ┌───────────┴────────┐    ┌───────────┴────────────────┐  │
│  │  Trivia Service    │    │  GuessThatSong Service     │  │
│  │  - CreateQuestion  │    │  - CreateSong              │  │
│  │  - UpdateQuestion  │    │  - UpdateSong              │  │
│  │  - Create/Update   │    │  - Create/Update           │  │
│  │    Collections     │    │    Collections             │  │
│  └────────────────────┘    └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Conclusion

The streaming implementation provides a seamless real-time experience for moderators and admins to manage content approval. The architecture is scalable, maintainable, and provides a foundation for future enhancements to the approval workflow.