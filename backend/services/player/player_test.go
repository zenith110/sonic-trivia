package player

import (
	"context"
	"testing"

	"connectrpc.com/connect"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"sonic-trivia/backend/database"
	pb "sonic-trivia/backend/protos"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	// Run migrations
	err = db.AutoMigrate(&database.Player{})
	if err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}

	return db
}

// createTestPlayer creates a test player in the database
func createTestPlayer(t *testing.T, db *gorm.DB, email string) *database.Player {
	player := &database.Player{
		Username:          email,
		Email:             email,
		DisplayName:       "Test Player",
		PasswordHash:      "test_hash",
		Role:              "player",
		TotalScore:        100,
		GamesPlayed:       5,
		QuestionsAnswered: 50,
		CorrectAnswers:    40,
	}

	if err := db.Create(player).Error; err != nil {
		t.Fatalf("Failed to create test player: %v", err)
	}

	return player
}

func TestCreatePlayer(t *testing.T) {
	db := setupTestDB(t)
	repo := NewRepository(db)
	server := &Server{repo: repo}

	tests := []struct {
		name      string
		request   *pb.Player
		wantError bool
		errorCode connect.Code
	}{
		{
			name: "valid player creation",
			request: &pb.Player{
				Name:  "Sonic",
				Email: "sonic@sega.com",
				Role:  "player",
			},
			wantError: false,
		},
		{
			name: "missing name",
			request: &pb.Player{
				Email: "test@example.com",
			},
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
		{
			name: "missing email",
			request: &pb.Player{
				Name: "Test",
			},
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := connect.NewRequest(tt.request)
			resp, err := server.CreatePlayer(context.Background(), req)

			if tt.wantError {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if connect.CodeOf(err) != tt.errorCode {
					t.Errorf("Expected error code %v, got %v", tt.errorCode, connect.CodeOf(err))
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
				if resp.Msg.GetEmail() != tt.request.GetEmail() {
					t.Errorf("Expected email %s, got %s", tt.request.GetEmail(), resp.Msg.GetEmail())
				}
			}
		})
	}
}

func TestGetPlayer(t *testing.T) {
	db := setupTestDB(t)
	repo := NewRepository(db)
	server := &Server{repo: repo}

	// Create a test player
	testPlayer := createTestPlayer(t, db, "test@example.com")

	tests := []struct {
		name      string
		playerID  string
		wantError bool
		errorCode connect.Code
	}{
		{
			name:      "valid player retrieval",
			playerID:  testPlayer.ID,
			wantError: false,
		},
		{
			name:      "player not found",
			playerID:  "non-existent-id",
			wantError: true,
			errorCode: connect.CodeNotFound,
		},
		{
			name:      "empty player ID",
			playerID:  "",
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := connect.NewRequest(&pb.GetPlayerRequest{
				Id: tt.playerID,
			})

			resp, err := server.GetPlayer(context.Background(), req)

			if tt.wantError {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if connect.CodeOf(err) != tt.errorCode {
					t.Errorf("Expected error code %v, got %v", tt.errorCode, connect.CodeOf(err))
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
				if resp.Msg.GetPlayer().GetEmail() != testPlayer.Email {
					t.Errorf("Expected email %s, got %s", testPlayer.Email, resp.Msg.GetPlayer().GetEmail())
				}
			}
		})
	}
}

func TestUpdatePlayer(t *testing.T) {
	db := setupTestDB(t)
	repo := NewRepository(db)
	server := &Server{repo: repo}

	// Create a test player
	testPlayer := createTestPlayer(t, db, "update@example.com")

	tests := []struct {
		name      string
		request   *pb.Player
		wantError bool
		errorCode connect.Code
	}{
		{
			name: "valid player update",
			request: &pb.Player{
				Email:       testPlayer.Email,
				Name:        "Updated Name",
				Role:        "admin",
				TotalPoints: 200,
			},
			wantError: false,
		},
		{
			name: "player not found",
			request: &pb.Player{
				Email: "nonexistent@example.com",
				Name:  "Test",
			},
			wantError: true,
			errorCode: connect.CodeNotFound,
		},
		{
			name: "missing email",
			request: &pb.Player{
				Name: "Test",
			},
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := connect.NewRequest(tt.request)
			resp, err := server.UpdatePlayer(context.Background(), req)

			if tt.wantError {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if connect.CodeOf(err) != tt.errorCode {
					t.Errorf("Expected error code %v, got %v", tt.errorCode, connect.CodeOf(err))
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
				if resp.Msg.GetName() != tt.request.GetName() {
					t.Errorf("Expected name %s, got %s", tt.request.GetName(), resp.Msg.GetName())
				}
			}
		})
	}
}

func TestDeletePlayer(t *testing.T) {
	db := setupTestDB(t)
	repo := NewRepository(db)
	server := &Server{repo: repo}

	// Create test players
	testPlayer := createTestPlayer(t, db, "delete@example.com")

	tests := []struct {
		name      string
		playerID  string
		wantError bool
		errorCode connect.Code
	}{
		{
			name:      "valid player deletion",
			playerID:  testPlayer.ID,
			wantError: false,
		},
		{
			name:      "player not found",
			playerID:  "non-existent-id",
			wantError: true,
			errorCode: connect.CodeNotFound,
		},
		{
			name:      "empty player ID",
			playerID:  "",
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := connect.NewRequest(&pb.DeletePlayerRequest{
				Id: tt.playerID,
			})

			resp, err := server.DeletePlayer(context.Background(), req)

			if tt.wantError {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if connect.CodeOf(err) != tt.errorCode {
					t.Errorf("Expected error code %v, got %v", tt.errorCode, connect.CodeOf(err))
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
				if resp.Msg.GetMessage() == "" {
					t.Errorf("Expected success message but got empty string")
				}
			}
		})
	}
}

func TestRepositoryIncrementPlayerScore(t *testing.T) {
	db := setupTestDB(t)
	repo := NewRepository(db)

	// Create a test player
	testPlayer := createTestPlayer(t, db, "score@example.com")
	initialScore := testPlayer.TotalScore

	// Increment score
	err := repo.IncrementPlayerScore(context.Background(), testPlayer.ID, 50)
	if err != nil {
		t.Fatalf("Failed to increment score: %v", err)
	}

	// Verify score was incremented
	updated, err := repo.GetPlayerByID(context.Background(), testPlayer.ID)
	if err != nil {
		t.Fatalf("Failed to get updated player: %v", err)
	}

	expectedScore := initialScore + 50
	if updated.TotalScore != expectedScore {
		t.Errorf("Expected score %d, got %d", expectedScore, updated.TotalScore)
	}
}

func TestRepositoryGetTopPlayers(t *testing.T) {
	db := setupTestDB(t)
	repo := NewRepository(db)

	// Create multiple test players with different scores
	players := []struct {
		email string
		score int64
	}{
		{"player1@example.com", 100},
		{"player2@example.com", 200},
		{"player3@example.com", 150},
		{"player4@example.com", 300},
		{"player5@example.com", 50},
	}

	for _, p := range players {
		player := &database.Player{
			Username:     p.email,
			Email:        p.email,
			DisplayName:  p.email,
			PasswordHash: "test_hash",
			Role:         "player",
			TotalScore:   p.score,
		}
		db.Create(player)
	}

	// Get top 3 players
	topPlayers, err := repo.GetTopPlayers(context.Background(), 3)
	if err != nil {
		t.Fatalf("Failed to get top players: %v", err)
	}

	if len(topPlayers) != 3 {
		t.Errorf("Expected 3 players, got %d", len(topPlayers))
	}

	// Verify they are in descending order
	if topPlayers[0].TotalScore < topPlayers[1].TotalScore {
		t.Errorf("Players are not in descending score order")
	}

	// Verify the top player has the highest score
	if topPlayers[0].TotalScore != 300 {
		t.Errorf("Expected top score to be 300, got %d", topPlayers[0].TotalScore)
	}
}

func TestRepositorySearchPlayers(t *testing.T) {
	db := setupTestDB(t)
	repo := NewRepository(db)

	// Create test players with different names
	players := []struct {
		email       string
		displayName string
	}{
		{"sonic@example.com", "Sonic the Hedgehog"},
		{"tails@example.com", "Tails"},
		{"knuckles@example.com", "Knuckles"},
		{"shadow@example.com", "Shadow the Hedgehog"},
	}

	for _, p := range players {
		player := &database.Player{
			Username:     p.email,
			Email:        p.email,
			DisplayName:  p.displayName,
			PasswordHash: "test_hash",
			Role:         "player",
		}
		db.Create(player)
	}

	// Search for "hedgehog"
	results, err := repo.SearchPlayers(context.Background(), "hedgehog", 10)
	if err != nil {
		t.Fatalf("Failed to search players: %v", err)
	}

	if len(results) != 2 {
		t.Errorf("Expected 2 results for 'hedgehog', got %d", len(results))
	}

	// Search for "Sonic"
	results, err = repo.SearchPlayers(context.Background(), "Sonic", 10)
	if err != nil {
		t.Fatalf("Failed to search players: %v", err)
	}

	if len(results) != 1 {
		t.Errorf("Expected 1 result for 'Sonic', got %d", len(results))
	}
}
