package login

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"sonic-trivia/backend/database"
)

// Repository handles database operations for user authentication
type Repository struct {
	db *gorm.DB
}

// NewRepository creates a new login repository
func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// CreateUser creates a new player in the database
func (r *Repository) CreateUser(ctx context.Context, username, email, password string) (*database.Player, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &database.Player{
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
		DisplayName:  username,
		Role:         "player",
		TotalScore:   0,
		GamesPlayed:  0,
	}

	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		return nil, err
	}

	// Unlock default characters for new player
	if err := r.UnlockCharactersForNewPlayer(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to unlock characters: %w", err)
	}

	return user, nil
}

// GetUserByEmail retrieves a player by email
func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*database.Player, error) {
	var user database.Player
	err := r.db.WithContext(ctx).
		Where("email = ?", email).
		First(&user).Error

	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByUsername retrieves a player by username
func (r *Repository) GetUserByUsername(ctx context.Context, username string) (*database.Player, error) {
	var user database.Player
	err := r.db.WithContext(ctx).
		Where("username = ?", username).
		First(&user).Error

	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByID retrieves a player by ID
func (r *Repository) GetUserByID(ctx context.Context, userID string) (*database.Player, error) {
	var user database.Player
	err := r.db.WithContext(ctx).
		Where("id = ?", userID).
		First(&user).Error

	if err != nil {
		return nil, err
	}
	return &user, nil
}

// VerifyPassword checks if the provided password matches the stored hash
func (r *Repository) VerifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// UserExists checks if a player exists by email or username
func (r *Repository) UserExists(ctx context.Context, email, username string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&database.Player{}).
		Where("email = ? OR username = ?", email, username).
		Count(&count).Error

	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// UpdateUser updates player information
func (r *Repository) UpdateUser(ctx context.Context, user *database.Player) error {
	return r.db.WithContext(ctx).Save(user).Error
}

// CreateOrUpdateSocialUser creates or updates a player from social media login
func (r *Repository) CreateOrUpdateSocialUser(ctx context.Context, email, displayName, provider string) (*database.Player, error) {
	var user database.Player

	// Try to find existing player by email
	err := r.db.WithContext(ctx).
		Where("email = ?", email).
		First(&user).Error

	if err == gorm.ErrRecordNotFound {
		// Create new player
		// Generate a random password hash (won't be used for social login)
		randomBytes := make([]byte, 32)
		if _, err := rand.Read(randomBytes); err != nil {
			return nil, fmt.Errorf("failed to generate random password: %w", err)
		}
		randomPassword := base64.StdEncoding.EncodeToString(randomBytes)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(randomPassword), bcrypt.DefaultCost)
		if err != nil {
			return nil, fmt.Errorf("failed to hash password: %w", err)
		}

		user = database.Player{
			Username:     email, // Use email as username for social login
			Email:        email,
			DisplayName:  displayName,
			PasswordHash: string(hashedPassword),
			Role:         "player",
			TotalScore:   0,
			GamesPlayed:  0,
		}

		if err := r.db.WithContext(ctx).Create(&user).Error; err != nil {
			return nil, err
		}

		// Unlock default characters for new social login user
		if err := r.UnlockCharactersForNewPlayer(ctx, &user); err != nil {
			return nil, fmt.Errorf("failed to unlock characters: %w", err)
		}
	} else if err != nil {
		return nil, err
	} else {
		// Update existing player's display name if changed
		if user.DisplayName != displayName {
			user.DisplayName = displayName
			if err := r.db.WithContext(ctx).Save(&user).Error; err != nil {
				return nil, err
			}
		}
	}

	return &user, nil
}

// UpdateLastLogin updates the player's last login timestamp
func (r *Repository) UpdateLastLogin(ctx context.Context, userID string) error {
	return r.db.WithContext(ctx).
		Model(&database.Player{}).
		Where("id = ?", userID).
		Update("updated_at", time.Now()).Error
}

// IncrementGamesPlayed increments the player's games played count
func (r *Repository) IncrementGamesPlayed(ctx context.Context, userID string) error {
	return r.db.WithContext(ctx).
		Model(&database.Player{}).
		Where("id = ?", userID).
		Update("games_played", gorm.Expr("games_played + ?", 1)).Error
}

// UpdateUserScore updates the player's total score
func (r *Repository) UpdateUserScore(ctx context.Context, userID string, scoreToAdd int64) error {
	return r.db.WithContext(ctx).
		Model(&database.Player{}).
		Where("id = ?", userID).
		Updates(map[string]interface{}{
			"total_score": gorm.Expr("total_score + ?", scoreToAdd),
		}).Error
}

// RecordAnswer records a player's answer to a question
func (r *Repository) RecordAnswer(ctx context.Context, userID, questionID, answerID string, isCorrect bool, pointsEarned int32) error {
	userAnswer := &database.PlayerAnswer{
		PlayerID:     userID,
		QuestionID:   questionID,
		AnswerID:     answerID,
		IsCorrect:    isCorrect,
		PointsEarned: pointsEarned,
		AnsweredAt:   time.Now(),
	}

	return r.db.WithContext(ctx).Create(userAnswer).Error
}

// UnlockCharactersForNewPlayer unlocks characters for a newly created player
// Admin users get all characters, regular players get sonic, tails, and knuckles
func (r *Repository) UnlockCharactersForNewPlayer(ctx context.Context, player *database.Player) error {
	var charactersToUnlock []string

	if player.Role == "admin" {
		// Get all character IDs for admin users
		var allCharacters []database.SonicCharacter
		if err := r.db.WithContext(ctx).Select("id").Find(&allCharacters).Error; err != nil {
			return fmt.Errorf("failed to fetch characters: %w", err)
		}

		for _, char := range allCharacters {
			charactersToUnlock = append(charactersToUnlock, char.ID)
		}
	} else {
		// Default characters for regular players
		charactersToUnlock = []string{"sonic", "tails", "knuckles"}
	}

	// Unlock the characters
	for _, charID := range charactersToUnlock {
		playerChar := &database.PlayerCharacter{
			PlayerID:    player.ID,
			CharacterID: charID,
		}
		if err := r.db.WithContext(ctx).Create(playerChar).Error; err != nil {
			return fmt.Errorf("failed to unlock character %s: %w", charID, err)
		}
	}

	// Set Sonic as the default selected character
	player.SelectedCharacterID = "sonic"
	if err := r.db.WithContext(ctx).Save(player).Error; err != nil {
		return fmt.Errorf("failed to set selected character: %w", err)
	}

	return nil
}
