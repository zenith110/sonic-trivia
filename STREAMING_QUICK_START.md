# Approval Queue Streaming - Quick Start Guide

## Overview

The Approval Queue now supports **real-time streaming** updates! Moderators and admins automatically receive live notifications when users submit content for approval, without needing to manually refresh the page.

## What's New?

### ✨ Features
- **Real-time Updates**: New approval requests appear instantly
- **Live Connection Indicator**: See connection status at a glance
- **Auto-Reconnection**: Automatically reconnects if connection is lost
- **Optimistic UI Updates**: Instant feedback when approving/rejecting
- **No Polling Required**: Efficient server-sent updates via gRPC streaming

## How It Works

### For End Users

When a regular user (with role "user") creates or updates content:
1. Question, Song, or Collection is marked as `is_under_review = true`
2. Item is added to the approval queue database
3. **All connected moderators/admins see the update instantly** 🎉

### For Moderators/Admins

When you open the Approval Queue page:
1. Connection is established automatically
2. You receive all pending approval requests
3. New requests appear in real-time as they're submitted
4. Approved/rejected items disappear instantly for all connected users

## User Guide

### Accessing the Approval Queue

1. Log in as a user with **admin** or **moderator** role
2. Navigate to **Dashboard** → **Approval Queue**
3. The page opens with a live connection (green indicator)

### Connection Status

| Indicator | Status | Meaning |
|-----------|--------|---------|
| 🟢 **Live** | Connected | Receiving real-time updates |
| 🔴 **Disconnected** | Not Connected | Updates paused, reconnecting... |

### Actions

- **Approve**: Approves content and makes it available in the game
- **Reject**: Removes content from the approval queue
- **Reconnect**: Manually reconnect if disconnected (also happens automatically)

### Filters

Apply filters to view specific types of content:
- **Content Type**: Trivia, Songs, or All
- **Status**: Pending (default)
- **User ID**: Filter by specific user

## Testing the Feature

### 1. Setup Two Browser Windows

**Window 1** - Moderator/Admin:
```bash
# Login as admin@sonictrivia.com or mod@sonictrivia.com
# Navigate to Approval Queue
```

**Window 2** - Regular User:
```bash
# Login as sonic@sonictrivia.com (or any user with role "user")
# Create a new question or song
```

### 2. Watch the Magic ✨

When the user creates content in Window 2:
- Window 1 **instantly** shows the new approval request
- No refresh needed!
- Connection indicator shows "Live" with green indicator

### 3. Test Approval

In Window 1, click **Approve** or **Reject**:
- Item disappears immediately (optimistic update)
- Server confirms the action
- All other connected moderators see the update too

## Technical Details

### Backend Components

1. **Global Notification Manager** (`backend/notification/manager.go`)
   - Singleton pattern managing all streaming connections
   - Broadcasts updates to all connected clients
   - Thread-safe with buffered channels

2. **Streaming RPC** (`ApprovalQueueService.StreamApprovalQueue`)
   - Server-side streaming endpoint
   - Sends initial state + live updates
   - Graceful reconnection handling

3. **Service Integrations**
   - Trivia Service: Notifies on question/collection create/update
   - GuessThatSong Service: Notifies on song/collection create/update
   - Approval Queue Service: Notifies on approve/reject

### Frontend Components

1. **Streaming Hook** (`useApprovalQueueStream`)
   - Manages WebSocket-like connection via gRPC
   - Handles initial state and live updates
   - Auto-reconnection with 5-second delay
   - Optimistic UI updates

2. **Updated UI** (`ApprovalQueue` page)
   - Real-time item list
   - Connection status dashboard
   - Manual reconnect button
   - Client-side filtering and pagination

### Update Flow

```
User Creates Content
        ↓
Backend Sets is_under_review=true
        ↓
Add to Approval Queue DB
        ↓
Notification Manager Broadcast
        ↓
All Connected Clients Receive Update
        ↓
UI Updates Instantly ✨
```

## Running the Application

### Start Backend
```bash
cd backend
go run .
# Or use Docker
cd ..
make docker-up
```

### Start Frontend
```bash
cd frontend
bun run dev
```

### Access Application
- Frontend: http://localhost:5173
- Backend: http://localhost:8080

## Development Tips

### Adding Streaming to New Content Types

```go
// In your service's create/update method
if userRole == "user" {
    // Add to approval queue
    err = s.repo.AddContentToApprovalQueue(ctx, userID, contentID)
    if err == nil {
        // Notify all connected clients
        notification.GetGlobalManager().NotifyContentAdded(userID, contentID)
    }
}
```

### Debugging

Enable verbose logging:
```go
// In notification/manager.go
log.Printf("Broadcasting to %d clients", len(m.clients))
```

Check connection count:
```go
count := notification.GetGlobalManager().GetClientCount()
log.Printf("Active connections: %d", count)
```

### Common Issues

**Issue**: Stream not connecting
```bash
# Check backend logs for errors
# Verify user has admin/moderator role
# Check browser console for connection errors
```

**Issue**: Updates not appearing
```bash
# Verify notification manager is initialized
# Check backend logs for broadcast messages
# Ensure content creator has role "user"
```

**Issue**: High latency
```bash
# Check network connection
# Verify backend is not overloaded
# Check client channel buffer size (default: 100)
```

## Performance Considerations

- **Buffered Channels**: 100-message buffer per client
- **Non-blocking Sends**: Skips slow clients (logged)
- **Client-side Filtering**: Reduces network traffic
- **Automatic Cleanup**: Channels closed on disconnect

## Security

- ✅ Authentication required to create content
- ✅ Only "user" role triggers approval workflow
- ✅ Only admin/moderator can access approval queue
- ✅ Only admin/moderator can approve/reject
- ✅ Stream access controlled by role

## Future Enhancements

- [ ] Browser notifications for new approvals
- [ ] Batch approve/reject operations
- [ ] Comment system for feedback
- [ ] Approval history and analytics
- [ ] Email notifications for content creators
- [ ] WebSocket fallback option

## Resources

- **Full Documentation**: `APPROVAL_QUEUE_STREAMING.md`
- **Proto Definition**: `protos/approvalqueue.proto`
- **Backend Implementation**: `backend/services/approvalqueue/`
- **Frontend Hook**: `frontend/src/hooks/useApprovalQueueStream.ts`
- **UI Component**: `frontend/src/pages/ApprovalQueue.tsx`

## Support

If you encounter issues:
1. Check backend logs for errors
2. Check browser console for connection errors
3. Try manual reconnect button
4. Restart backend service
5. Clear browser cache and reconnect

---

**Happy Streaming!** 🎉

For detailed technical documentation, see `APPROVAL_QUEUE_STREAMING.md`
