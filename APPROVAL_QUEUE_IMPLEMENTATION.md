# Approval Queue Backend Implementation

## Overview
Scaffolded a complete backend implementation for the approval queue system that automatically manages content review for users with the "user" role.

## Files Created/Modified

### 1. Database Models (`backend/database/models.go`)
- **Added `ApprovalRequest` model** with fields:
  - `ID`, `UserID`, `QuestionID`, `QuestionCollectionID`, `SongID`, `SongCollectionID`
  - Timestamps: `CreatedAt`, `UpdatedAt`, `DeletedAt`
- **Added `IsUnderReview` field** to:
  - `Question`
  - `QuestionCollection`
  - `Song`
  - `SongCollection`

### 2. Approval Queue Service
Created new service at `backend/services/approvalqueue/`:

#### `approvalqueue.go`
Implements `ApprovalQueueService` with 4 RPC methods:
- **`AddToQueue`**: Adds content to approval queue
- **`RemoveFromQueue`**: Removes content from approval queue
- **`GetAllApprovalRequests`**: Retrieves all approval requests (paginated)
- **`ApproveRequest`**: Approves content and sets `is_under_review = false`

#### `repository.go`
Database operations including:
- CRUD operations for approval requests
- Approval methods for each content type:
  - `ApproveQuestion`
  - `ApproveQuestionCollection`
  - `ApproveSong`
  - `ApproveSongCollection`
- Mapper functions between proto and database models

#### `go.mod`
Module definition with dependencies

### 3. Authentication Updates

#### `backend/middleware/auth.go`
- Added `RoleKey` context key
- Updated JWT extraction to include user role
- Added `GetRoleFromContext()` helper function

#### `backend/services/login/login.go`
- Updated `generateJWT()` to include role in JWT claims
- All login/signup methods now include role in generated tokens

### 4. Trivia Service Updates (`backend/services/trivia/`)

#### `trivia.go`
Updated methods to support approval workflow:
- **`CreateQuestion`**: 
  - Checks user role
  - Sets `is_under_review = true` for "user" role
  - Adds to approval queue
- **`UpdateQuestion`**: Same approval logic as create
- **`CreateQuestionCollection`**: Same approval logic as create
- **`UpdateQuestionCollection`**: Same approval logic as create

#### `repository.go`
Added helper methods:
- `AddQuestionToApprovalQueue()`
- `AddQuestionCollectionToApprovalQueue()`
- `GetUserRole()` - fetches user role from database

### 5. Guess That Song Service Updates (`backend/services/guessthatsong/`)

#### `guessthatsong.go`
Updated methods to support approval workflow:
- **`CreateSong`**: 
  - Checks user role
  - Sets `is_under_review = true` for "user" role
  - Adds to approval queue
- **`UpdateSong`**: Same approval logic as create
- **`CreateSongCollection`**: Same approval logic as create
- **`UpdateSongCollection`**: Same approval logic as create

#### `repository.go`
Added helper methods:
- `AddSongToApprovalQueue()`
- `AddSongCollectionToApprovalQueue()`
- `GetUserRole()` - fetches user role from database

### 6. Main Application (`backend/main.go`)
- Imported approval queue service
- Created service instance
- Registered service handler with authentication middleware

### 7. Go Module Configuration (`backend/go.mod`)
- Added approval queue service as a dependency
- Added replace directive for local module

## Workflow

### Content Creation/Update by User Role "user":
1. User creates/updates content (question, song, collection)
2. System checks user role from JWT or database
3. If role is "user":
   - Sets `is_under_review = true` on the content
   - Adds entry to `approval_requests` table
4. Content is saved to database
5. Admin can view approval queue via `GetAllApprovalRequests`

### Content Approval by Admin:
1. Admin calls `ApproveRequest` with content ID
2. System identifies content type (question/song/collection)
3. Sets `is_under_review = false` on the content
4. Removes entry from approval queue
5. Content becomes publicly available

### Content Creation/Update by Other Roles:
- Content created by non-"user" roles (e.g., "admin")
- `is_under_review` remains false
- No approval queue entry created
- Content immediately available

## API Endpoints

All endpoints available at `/protos.ApprovalQueueService/`:
- `/AddToQueue` - Add content to approval queue
- `/RemoveFromQueue` - Remove content from approval queue
- `/GetAllApprovalRequests` - List all pending approvals (with pagination)
- `/ApproveRequest` - Approve content and mark as reviewed

## Proto Definition

Located at `protos/approvalqueue.proto` with messages:
- `ApprovalRequest`
- `AddToQueueRequest/Response`
- `RemoveFromQueueRequest/Response`
- `GetAllApprovalRequestsRequest/Response`
- `ApproveRequestRequest/Response`

## Testing

Build command:
```bash
cd backend && go build
```

All changes compile successfully with no errors.
