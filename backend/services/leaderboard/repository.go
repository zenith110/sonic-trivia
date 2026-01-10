package leaderboard

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"

	"sonic-trivia/backend/database"
)

// Repository handles database operations for leaderboards
type Repository struct {
	db *gorm.DB
}

// NewRepository creates a new leaderboard repository
func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// RoomLeaderboardEntry represents a player's score in a room
type RoomLeaderboardEntry struct {
	UserID   string
	Username string
	Score    int64
	Rank     int
}

// UpdateUserScore updates a user's score
func (r *Repository) UpdateUserScore(ctx context.Context, userID string, scoreToAdd int64) error {
	return r.db.WithContext(ctx).
		Model(&database.User{}).
		Where("id = ?", userID).
		Update("total_score", gorm.Expr("total_score + ?", scoreToAdd)).Error
}

// GetGlobalLeaderboard retrieves the global leaderboard with pagination
func (r *Repository) GetGlobalLeaderboard(ctx context.Context, page, limit int) ([]database.User, error) {
	var users []database.User
	offset := (page - 1) * limit

	err := r.db.WithContext(ctx).
		Order("total_score DESC, created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&users).Error

	if err != nil {
		return nil, err
	}

	return users, nil
}

// GetUserRank retrieves a user's rank in the global leaderboard
func (r *Repository) GetUserRank(ctx context.Context, userID string) (int, error) {
	var user database.User
	err := r.db.WithContext(ctx).
		Where("id = ?", userID).
		First(&user).Error

	if err != nil {
		return 0, err
	}

	var rank int64
	err = r.db.WithContext(ctx).
		Model(&database.User{}).
		Where("total_score > ? OR (total_score = ? AND created_at < ?)",
			user.TotalScore, user.TotalScore, user.CreatedAt).
		Count(&rank).Error

	if err != nil {
		return 0, err
	}

	return int(rank) + 1, nil
}

// GetTopPlayers retrieves the top N players globally
func (r *Repository) GetTopPlayers(ctx context.Context, limit int) ([]database.User, error) {
	var users []database.User

	err := r.db.WithContext(ctx).
		Order("total_score DESC, created_at ASC").
		Limit(limit).
		Find(&users).Error

	if err != nil {
		return nil, err
	}

	return users, nil
}

// CreateLeaderboardEntry creates a leaderboard entry for a specific period
func (r *Repository) CreateLeaderboardEntry(ctx context.Context, userID string, score int64, period string, periodStart, periodEnd time.Time) error {
	// Get current rank
	rank, err := r.GetUserRank(ctx, userID)
	if err != nil {
		rank = 0
	}

	entry := &database.LeaderboardEntry{
		UserID:      userID,
		Score:       score,
		Rank:        rank,
		Period:      period,
		PeriodStart: periodStart,
		PeriodEnd:   periodEnd,
	}

	return r.db.WithContext(ctx).Create(entry).Error
}

// GetLeaderboardByPeriod retrieves leaderboard entries for a specific period
func (r *Repository) GetLeaderboardByPeriod(ctx context.Context, period string, periodStart, periodEnd time.Time, page, limit int) ([]database.LeaderboardEntry, error) {
	var entries []database.LeaderboardEntry
	offset := (page - 1) * limit

	err := r.db.WithContext(ctx).
		Preload("User").
		Where("period = ? AND period_start = ? AND period_end = ?", period, periodStart, periodEnd).
		Order("score DESC, created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&entries).Error

	if err != nil {
		return nil, err
	}

	return entries, nil
}

// UpdateLeaderboardRanks updates all ranks for a specific period
func (r *Repository) UpdateLeaderboardRanks(ctx context.Context, period string, periodStart, periodEnd time.Time) error {
	// Get all entries for the period ordered by score
	var entries []database.LeaderboardEntry
	err := r.db.WithContext(ctx).
		Where("period = ? AND period_start = ? AND period_end = ?", period, periodStart, periodEnd).
		Order("score DESC, created_at ASC").
		Find(&entries).Error

	if err != nil {
		return err
	}

	// Update ranks
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for i, entry := range entries {
			if err := tx.Model(&database.LeaderboardEntry{}).
				Where("id = ?", entry.ID).
				Update("rank", i+1).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// GetUserLeaderboardHistory retrieves a user's leaderboard history
func (r *Repository) GetUserLeaderboardHistory(ctx context.Context, userID string, period string, limit int) ([]database.LeaderboardEntry, error) {
	var entries []database.LeaderboardEntry

	query := r.db.WithContext(ctx).
		Where("user_id = ?", userID)

	if period != "" {
		query = query.Where("period = ?", period)
	}

	err := query.
		Order("period_start DESC").
		Limit(limit).
		Find(&entries).Error

	if err != nil {
		return nil, err
	}

	return entries, nil
}

// IncrementCorrectAnswers increments the user's correct answers count
func (r *Repository) IncrementCorrectAnswers(ctx context.Context, userID string) error {
	return r.db.WithContext(ctx).
		Model(&database.User{}).
		Where("id = ?", userID).
		Updates(map[string]interface{}{
			"correct_answers":    gorm.Expr("correct_answers + ?", 1),
			"questions_answered": gorm.Expr("questions_answered + ?", 1),
		}).Error
}

// IncrementQuestionsAnswered increments the user's questions answered count
func (r *Repository) IncrementQuestionsAnswered(ctx context.Context, userID string) error {
	return r.db.WithContext(ctx).
		Model(&database.User{}).
		Where("id = ?", userID).
		Update("questions_answered", gorm.Expr("questions_answered + ?", 1)).Error
}

// GetUserStats retrieves a user's statistics
func (r *Repository) GetUserStats(ctx context.Context, userID string) (*database.User, error) {
	var user database.User
	err := r.db.WithContext(ctx).
		Where("id = ?", userID).
		First(&user).Error

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// GetLeaderboardForDateRange retrieves leaderboard entries within a date range
func (r *Repository) GetLeaderboardForDateRange(ctx context.Context, startDate, endDate time.Time, page, limit int) ([]database.User, error) {
	var users []database.User
	offset := (page - 1) * limit

	// Get users who answered questions in the date range
	subQuery := r.db.
		Select("user_id, SUM(points_earned) as score").
		Table("user_answers").
		Where("answered_at BETWEEN ? AND ?", startDate, endDate).
		Group("user_id")

	err := r.db.WithContext(ctx).
		Table("users").
		Joins("JOIN (?) as scores ON users.id = scores.user_id", subQuery).
		Order("scores.score DESC").
		Limit(limit).
		Offset(offset).
		Find(&users).Error

	if err != nil {
		return nil, err
	}

	return users, nil
}

// RecordUserAnswer records a user's answer and updates statistics
func (r *Repository) RecordUserAnswer(ctx context.Context, userID, questionID, answerID string, isCorrect bool, pointsEarned int32) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Create user answer record
		userAnswer := &database.UserAnswer{
			UserID:       userID,
			QuestionID:   questionID,
			AnswerID:     answerID,
			IsCorrect:    isCorrect,
			PointsEarned: pointsEarned,
			AnsweredAt:   time.Now(),
		}

		if err := tx.Create(userAnswer).Error; err != nil {
			return err
		}

		// Update user statistics
		updates := map[string]interface{}{
			"questions_answered": gorm.Expr("questions_answered + ?", 1),
		}

		if isCorrect {
			updates["correct_answers"] = gorm.Expr("correct_answers + ?", 1)
			updates["total_score"] = gorm.Expr("total_score + ?", pointsEarned)
		}

		return tx.Model(&database.User{}).
			Where("id = ?", userID).
			Updates(updates).Error
	})
}

// GetTotalUserCount returns the total number of users
func (r *Repository) GetTotalUserCount(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&database.User{}).
		Count(&count).Error

	return count, err
}

// GetLeaderboardTotalPages calculates the total number of pages for leaderboard
func (r *Repository) GetLeaderboardTotalPages(ctx context.Context, limit int) (int, error) {
	total, err := r.GetTotalUserCount(ctx)
	if err != nil {
		return 0, err
	}

	pages := int(total) / limit
	if int(total)%limit != 0 {
		pages++
	}

	return pages, nil
}

// ClearLeaderboardForPeriod clears leaderboard entries for a specific period
func (r *Repository) ClearLeaderboardForPeriod(ctx context.Context, period string, periodStart, periodEnd time.Time) error {
	return r.db.WithContext(ctx).
		Where("period = ? AND period_start = ? AND period_end = ?", period, periodStart, periodEnd).
		Delete(&database.LeaderboardEntry{}).Error
}

// GenerateDailyLeaderboard generates daily leaderboard entries
func (r *Repository) GenerateDailyLeaderboard(ctx context.Context) error {
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	// Get top users for the day
	users, err := r.GetLeaderboardForDateRange(ctx, startOfDay, endOfDay, 1, 100)
	if err != nil {
		return fmt.Errorf("failed to get daily leaderboard: %w", err)
	}

	// Create leaderboard entries
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for i, user := range users {
			entry := &database.LeaderboardEntry{
				UserID:      user.ID,
				Score:       user.TotalScore,
				Rank:        i + 1,
				Period:      "daily",
				PeriodStart: startOfDay,
				PeriodEnd:   endOfDay,
			}
			if err := tx.Create(entry).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
