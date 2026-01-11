# Player Service

The Player Service provides CRUD operations for managing players in the Sonic Trivia application. It implements the `PlayerService` RPC interface defined in the `player.proto` protobuf file.

## Overview

This service handles:
- Creating new players
- Retrieving player information
- Updating player data
- Deleting players
- Managing player statistics (scores, games played, etc.)
- Sonic character management (placeholder for future implementation)

## API Methods

### CreatePlayer
Creates a new player in the system.

**Request:** `Player`
- `name` (string): Display name of the player
- `email` (string): Email address (required, used as username)
- `role` (string): Player role (defaults to "player")
- `total_points` (int64): Initial score (optional)
- `total_successful_answers` (int64): Initial correct answers count (optional)
- `total_answers` (int64): Initial total answers count (optional)

**Response:** `Player`
- Returns the created player with generated ID

**Example:**
```json
{
  "name": "Sonic",
  "email": "sonic@sega.com",
  "role": "player"
}
```

### GetPlayer
Retrieves a player by their unique ID.

**Request:** `GetPlayerRequest`
- `id` (string): Player UUID

**Response:** `GetPlayerResponse`
- `player` (Player): The requested player object

**Errors:**
- `NotFound`: Player with given ID does not exist
- `InvalidArgument`: ID is empty or invalid

### UpdatePlayer
Updates an existing player's information.

**Request:** `Player`
- `email` (string): Required to identify the player
- Other fields to update (name, role, stats, etc.)

**Response:** `Player`
- Returns the updated player object

**Notes:**
- Email is used to identify which player to update
- Only provided fields will be updated
- Cannot update email address itself

### DeletePlayer
Soft deletes a player from the system.

**Request:** `DeletePlayerRequest`
- `id` (string): Player UUID to delete

**Response:** `DeletePlayerResponse`
- `message` (string): Success confirmation message

**Notes:**
- This is a soft delete (record is marked as deleted but not removed from database)
- Related data (answers, leaderboard entries) may be affected based on foreign key constraints

### UpdateSonicCharacter
Updates a Sonic character (placeholder implementation).

**Request:** `SonicCharacter`
- Character data to update

**Response:** `SonicCharacter`
- Returns the updated character

**Status:** Not yet implemented - requires character database table

### GetSonicCharacters
Retrieves Sonic characters for a user (placeholder implementation).

**Request:** `GetSonicCharactersRequest`
- `user_id` (string): Player UUID

**Response:** `GetSonicCharactersResponse`
- `characters` (repeated SonicCharacter): List of characters

**Status:** Not yet implemented - requires character database table

## Repository Methods

The `Repository` provides additional database operations:

### Statistics Management
- `IncrementPlayerScore(playerID, scoreToAdd)`: Add points to player's score
- `IncrementGamesPlayed(playerID)`: Increment games played counter
- `IncrementQuestionsAnswered(playerID, count)`: Increment questions answered
- `IncrementCorrectAnswers(playerID, count)`: Increment correct answers
- `UpdatePlayerStats(playerID, stats)`: Batch update multiple statistics

### Query Operations
- `GetTopPlayers(limit)`: Get top N players by score
- `GetPlayerRank(playerID)`: Get player's rank based on score
- `ListPlayers(offset, limit)`: Paginated list of all players
- `CountPlayers()`: Total count of players
- `SearchPlayers(query, limit)`: Search by username or display name

## Database Schema

The service uses the `players` table with the following fields:
- `id` (UUID): Primary key
- `username` (string): Unique username
- `email` (string): Unique email address
- `password_hash` (string): Hashed password
- `display_name` (string): Display name
- `role` (string): User role (admin, player, etc.)
- `total_score` (int64): Cumulative score
- `games_played` (int64): Total games played
- `questions_answered` (int64): Total questions answered
- `correct_answers` (int64): Total correct answers
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp
- `deleted_at` (timestamp): Soft delete timestamp (nullable)

## Usage Example

```go
import (
    "sonic-trivia/backend/services/player"
    "sonic-trivia/backend/protos/protosconnect"
)

// Create server
playerServer := player.NewServer()

// Register with HTTP router
path, handler := protosconnect.NewPlayerServiceHandler(playerServer)
mux.Handle(path, handler)
```

## Dependencies

- `connectrpc.com/connect`: Connect RPC framework
- `gorm.io/gorm`: ORM for database operations
- `sonic-trivia/backend/database`: Database models and connection
- `sonic-trivia/backend/protos`: Protocol buffer definitions

## Future Enhancements

1. **Sonic Character System**
   - Create `sonic_characters` database table
   - Implement character unlocking logic
   - Track character usage statistics
   - Character selection and customization

2. **Friends System**
   - Create `friendships` table
   - Implement friend requests and management
   - Friend activity feed

3. **Social Integration**
   - Link social media accounts
   - Track social login providers
   - Social sharing features

4. **Enhanced Statistics**
   - Win/loss ratios
   - Category-specific performance
   - Time-based achievements
   - Streak tracking

5. **Profile Customization**
   - Avatar uploads
   - Profile themes
   - Custom badges and achievements

## Error Handling

The service uses Connect's standard error codes:
- `InvalidArgument`: Invalid or missing required parameters
- `NotFound`: Requested resource does not exist
- `Internal`: Database or server error
- `AlreadyExists`: Duplicate email/username (for creates)

## Testing

To test the service:
```bash
cd backend/services/player
go test ./...
```

## Notes

- Player creation through this service is mainly for administrative purposes
- Normal user registration should use the Login Service
- The service assumes database connection is initialized via `database.GetDB()`
- Email is used as the unique identifier for updates (ID is used for gets/deletes)