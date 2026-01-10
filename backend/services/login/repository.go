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

// CreateUser creates a new user in the database
func (r *Repository) CreateUser(ctx context.Context, username, email, password string) (*database.User, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &database.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
		DisplayName:  username,
		TotalScore:   0,
		GamesPlayed:  0,
	}

	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

// GetUserByEmail retrieves a user by email
func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*database.User, error) {
	var user database.User
	err := r.db.WithContext(ctx).
		Where("email = ?", email).
		First(&user).Error

	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByUsername retrieves a user by username
func (r *Repository) GetUserByUsername(ctx context.Context, username string) (*database.User, error) {
	var user database.User
	err := r.db.WithContext(ctx).
		Where("username = ?", username).
		First(&user).Error

	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByID retrieves a user by ID
func (r *Repository) GetUserByID(ctx context.Context, userID string) (*database.User, error) {
	var user database.User
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

// UserExists checks if a user exists by email or username
func (r *Repository) UserExists(ctx context.Context, email, username string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&database.User{}).
		Where("email = ? OR username = ?", email, username).
		Count(&count).Error

	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// UpdateUser updates user information
func (r *Repository) UpdateUser(ctx context.Context, user *database.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

// CreateOrUpdateSocialUser creates or updates a user from social media login
func (r *Repository) CreateOrUpdateSocialUser(ctx context.Context, email, displayName, provider string) (*database.User, error) {
	var user database.User

	// Try to find existing user by email
	err := r.db.WithContext(ctx).
		Where("email = ?", email).
		First(&user).Error

	if err == gorm.ErrRecordNotFound {
		// Create new user
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

		user = database.User{
			Username:     email, // Use email as username for social login
			Email:        email,
			DisplayName:  displayName,
			PasswordHash: string(hashedPassword),
			TotalScore:   0,
			GamesPlayed:  0,
		}

		if err := r.db.WithContext(ctx).Create(&user).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	} else {
		// Update existing user's display name if changed
		if user.DisplayName != displayName {
			user.DisplayName = displayName
			if err := r.db.WithContext(ctx).Save(&user).Error; err != nil {
				return nil, err
			}
		}
	}

	return &user, nil
}

// UpdateLastLogin updates the user's last login timestamp
func (r *Repository) UpdateLastLogin(ctx context.Context, userID string) error {
	return r.db.WithContext(ctx).
		Model(&database.User{}).
		Where("id = ?", userID).
		Update("updated_at", time.Now()).Error
}

// IncrementGamesPlayed increments the user's games played count
func (r *Repository) IncrementGamesPlayed(ctx context.Context, userID string) error {
	return r.db.WithContext(ctx).
		Model(&database.User{}).
		Where("id = ?", userID).
		Update("games_played", gorm.Expr("games_played + ?", 1)).Error
}

// UpdateUserScore updates the user's total score
func (r *Repository) UpdateUserScore(ctx context.Context, userID string, scoreToAdd int64) error {
	return r.db.WithContext(ctx).
		Model(&database.User{}).
		Where("id = ?", userID).
		Updates(map[string]interface{}{
			"total_score": gorm.Expr("total_score + ?", scoreToAdd),
		}).Error
}

// RecordAnswer records a user's answer to a question
func (r *Repository) RecordAnswer(ctx context.Context, userID, questionID, answerID string, isCorrect bool, pointsEarned int32) error {
	userAnswer := &database.UserAnswer{
		UserID:       userID,
		QuestionID:   questionID,
		AnswerID:     answerID,
		IsCorrect:    isCorrect,
		PointsEarned: pointsEarned,
		AnsweredAt:   time.Now(),
	}

	return r.db.WithContext(ctx).Create(userAnswer).Error
}
