package player

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"sonic-trivia/backend/database"
)

// Repository handles database operations for player service
type Repository struct {
	db *gorm.DB
}

// NewRepository creates a new player repository
func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// CreatePlayer creates a new player in the database
func (r *Repository) CreatePlayer(ctx context.Context, player *database.Player) (*database.Player, error) {
	if err := r.db.WithContext(ctx).Create(player).Error; err != nil {
		return nil, fmt.Errorf("failed to create player: %w", err)
	}
	return player, nil
}

// GetPlayerByID retrieves a player by ID
func (r *Repository) GetPlayerByID(ctx context.Context, playerID string) (*database.Player, error) {
	var player database.Player
	err := r.db.WithContext(ctx).
		Preload("UnlockedCharacters.Character.Abilities").
		Preload("Friends.Friend").
		Where("id = ?", playerID).
		First(&player).Error

	if err != nil {
		return nil, err
	}
	return &player, nil
}

// GetPlayerByEmail retrieves a player by email
func (r *Repository) GetPlayerByEmail(ctx context.Context, email string) (*database.Player, error) {
	var player database.Player
	err := r.db.WithContext(ctx).
		Preload("UnlockedCharacters.Character.Abilities").
		Preload("Friends.Friend").
		Where("email = ?", email).
		First(&player).Error

	if err != nil {
		return nil, err
	}
	return &player, nil
}

// GetPlayerByUsername retrieves a player by username
func (r *Repository) GetPlayerByUsername(ctx context.Context, username string) (*database.Player, error) {
	var player database.Player
	err := r.db.WithContext(ctx).
		Preload("UnlockedCharacters.Character.Abilities").
		Preload("Friends.Friend").
		Where("username = ?", username).
		First(&player).Error

	if err != nil {
		return nil, err
	}
	return &player, nil
}

// UpdatePlayer updates an existing player
func (r *Repository) UpdatePlayer(ctx context.Context, player *database.Player) (*database.Player, error) {
	if err := r.db.WithContext(ctx).Save(player).Error; err != nil {
		return nil, fmt.Errorf("failed to update player: %w", err)
	}
	return player, nil
}

// DeletePlayer deletes a player by ID (soft delete)
func (r *Repository) DeletePlayer(ctx context.Context, playerID string) error {
	result := r.db.WithContext(ctx).
		Where("id = ?", playerID).
		Delete(&database.Player{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete player: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

// UpdateSelectedCharacter updates the player's selected character ID
func (r *Repository) UpdateSelectedCharacter(ctx context.Context, playerID string, characterID string) error {
	return r.db.WithContext(ctx).
		Model(&database.Player{}).
		Where("id = ?", playerID).
		Update("selected_character_id", characterID).Error
}

// UpdatePlayerStats updates player statistics
func (r *Repository) UpdatePlayerStats(ctx context.Context, playerID string, stats PlayerStats) error {
	updates := make(map[string]interface{})

	if stats.TotalScore != nil {
		updates["total_score"] = *stats.TotalScore
	}
	if stats.GamesPlayed != nil {
		updates["games_played"] = *stats.GamesPlayed
	}
	if stats.QuestionsAnswered != nil {
		updates["questions_answered"] = *stats.QuestionsAnswered
	}
	if stats.CorrectAnswers != nil {
		updates["correct_answers"] = *stats.CorrectAnswers
	}

	if len(updates) == 0 {
		return nil
	}

	return r.db.WithContext(ctx).
		Model(&database.Player{}).
		Where("id = ?", playerID).
		Updates(updates).Error
}

// IncrementPlayerScore increments a player's score
func (r *Repository) IncrementPlayerScore(ctx context.Context, playerID string, scoreToAdd int64) error {
	return r.db.WithContext(ctx).
		Model(&database.Player{}).
		Where("id = ?", playerID).
		Update("total_score", gorm.Expr("total_score + ?", scoreToAdd)).Error
}

// IncrementGamesPlayed increments the player's games played count
func (r *Repository) IncrementGamesPlayed(ctx context.Context, playerID string) error {
	return r.db.WithContext(ctx).
		Model(&database.Player{}).
		Where("id = ?", playerID).
		Update("games_played", gorm.Expr("games_played + ?", 1)).Error
}

// IncrementQuestionsAnswered increments questions answered count
func (r *Repository) IncrementQuestionsAnswered(ctx context.Context, playerID string, count int64) error {
	return r.db.WithContext(ctx).
		Model(&database.Player{}).
		Where("id = ?", playerID).
		Update("questions_answered", gorm.Expr("questions_answered + ?", count)).Error
}

// IncrementCorrectAnswers increments correct answers count
func (r *Repository) IncrementCorrectAnswers(ctx context.Context, playerID string, count int64) error {
	return r.db.WithContext(ctx).
		Model(&database.Player{}).
		Where("id = ?", playerID).
		Update("correct_answers", gorm.Expr("correct_answers + ?", count)).Error
}

// GetTopPlayers retrieves top N players by score
func (r *Repository) GetTopPlayers(ctx context.Context, limit int) ([]*database.Player, error) {
	var players []*database.Player
	err := r.db.WithContext(ctx).
		Order("total_score DESC").
		Limit(limit).
		Find(&players).Error

	if err != nil {
		return nil, err
	}
	return players, nil
}

// GetPlayerRank retrieves a player's rank based on score
func (r *Repository) GetPlayerRank(ctx context.Context, playerID string) (int64, error) {
	var player database.Player
	err := r.db.WithContext(ctx).
		Where("id = ?", playerID).
		First(&player).Error

	if err != nil {
		return 0, err
	}

	var rank int64
	err = r.db.WithContext(ctx).
		Model(&database.Player{}).
		Where("total_score > ?", player.TotalScore).
		Count(&rank).Error

	if err != nil {
		return 0, err
	}

	return rank + 1, nil
}

// ListPlayers retrieves all players with pagination
func (r *Repository) ListPlayers(ctx context.Context, offset, limit int) ([]*database.Player, error) {
	var players []*database.Player
	err := r.db.WithContext(ctx).
		Offset(offset).
		Limit(limit).
		Order("created_at DESC").
		Find(&players).Error

	if err != nil {
		return nil, err
	}
	return players, nil
}

// CountPlayers returns the total count of players
func (r *Repository) CountPlayers(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&database.Player{}).
		Count(&count).Error

	return count, err
}

// SearchPlayers searches players by username or display name
func (r *Repository) SearchPlayers(ctx context.Context, query string, limit int) ([]*database.Player, error) {
	var players []*database.Player
	searchPattern := "%" + query + "%"

	err := r.db.WithContext(ctx).
		Where("username ILIKE ? OR display_name ILIKE ?", searchPattern, searchPattern).
		Limit(limit).
		Find(&players).Error

	if err != nil {
		return nil, err
	}
	return players, nil
}

// PlayerStats holds optional player statistics for updates
type PlayerStats struct {
	TotalScore        *int64
	GamesPlayed       *int64
	QuestionsAnswered *int64
	CorrectAnswers    *int64
}

// UnlockCharacter unlocks a character for a player
func (r *Repository) UnlockCharacter(ctx context.Context, playerID, characterID string) error {
	playerChar := &database.PlayerCharacter{
		PlayerID:    playerID,
		CharacterID: characterID,
	}
	return r.db.WithContext(ctx).Create(playerChar).Error
}

// GetPlayerCharacters retrieves all characters unlocked by a player
func (r *Repository) GetPlayerCharacters(ctx context.Context, playerID string) ([]*database.PlayerCharacter, error) {
	var characters []*database.PlayerCharacter
	err := r.db.WithContext(ctx).
		Preload("Character.Abilities").
		Where("player_id = ?", playerID).
		Find(&characters).Error
	return characters, err
}

// AddFriend creates a friend request
func (r *Repository) AddFriend(ctx context.Context, playerID, friendID string) error {
	friendship := &database.Friendship{
		PlayerID: playerID,
		FriendID: friendID,
		Status:   "pending",
	}
	return r.db.WithContext(ctx).Create(friendship).Error
}

// AcceptFriendRequest accepts a friend request
func (r *Repository) AcceptFriendRequest(ctx context.Context, playerID, friendID string) error {
	return r.db.WithContext(ctx).
		Model(&database.Friendship{}).
		Where("player_id = ? AND friend_id = ?", friendID, playerID).
		Update("status", "accepted").Error
}

// GetFriends retrieves all accepted friends for a player
func (r *Repository) GetFriends(ctx context.Context, playerID string) ([]*database.Friendship, error) {
	var friendships []*database.Friendship
	err := r.db.WithContext(ctx).
		Preload("Friend").
		Where("player_id = ? AND status = ?", playerID, "accepted").
		Find(&friendships).Error
	return friendships, err
}

// GetPlayerSongStats retrieves song-specific statistics for a player
func (r *Repository) GetPlayerSongStats(ctx context.Context, playerID string) (totalSongAnswers, correctSongAnswers int64, err error) {
	// Get total song answers
	err = r.db.WithContext(ctx).
		Model(&database.PlayerSongAnswer{}).
		Where("player_id = ?", playerID).
		Count(&totalSongAnswers).Error
	if err != nil {
		return 0, 0, err
	}

	// Get correct song answers
	err = r.db.WithContext(ctx).
		Model(&database.PlayerSongAnswer{}).
		Where("player_id = ? AND is_correct = ?", playerID, true).
		Count(&correctSongAnswers).Error
	if err != nil {
		return 0, 0, err
	}

	return totalSongAnswers, correctSongAnswers, nil
}

// GetPlayerTriviaStats retrieves trivia-specific statistics for a player
func (r *Repository) GetPlayerTriviaStats(ctx context.Context, playerID string) (totalTriviaAnswers, correctTriviaAnswers int64, err error) {
	// Get total trivia answers
	err = r.db.WithContext(ctx).
		Model(&database.PlayerTriviaAnswer{}).
		Where("player_id = ?", playerID).
		Count(&totalTriviaAnswers).Error
	if err != nil {
		return 0, 0, err
	}

	// Get correct trivia answers
	err = r.db.WithContext(ctx).
		Model(&database.PlayerTriviaAnswer{}).
		Where("player_id = ? AND is_correct = ?", playerID, true).
		Count(&correctTriviaAnswers).Error
	if err != nil {
		return 0, 0, err
	}

	return totalTriviaAnswers, correctTriviaAnswers, nil
}
