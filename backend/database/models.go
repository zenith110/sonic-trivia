package database

import (
	"time"

	"gorm.io/gorm"
)

// Question represents a trivia question in the database
type Question struct {
	ID                 string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Text               string  `gorm:"not null;type:text"`
	Category           string  `gorm:"not null;type:varchar(100)"`
	Difficulty         string  `gorm:"not null;type:varchar(50)"`
	Points             int32   `gorm:"not null;default:10"`
	PictureForQuestion string  `gorm:"type:text"`                                         // Legacy field
	PictureURL         *string `gorm:"type:text"`                                         // Optional picture URL
	CreatedBy          string  `gorm:"type:uuid;index"`                                   // User ID who created the question
	Creator            User    `gorm:"foreignKey:CreatedBy;constraint:OnDelete:SET NULL"` // Foreign key to User
	CreatedAt          time.Time
	UpdatedAt          time.Time
	DeletedAt          gorm.DeletedAt `gorm:"index"`
	Answers            []Answer       `gorm:"foreignKey:QuestionID;constraint:OnDelete:CASCADE"`
	Hints              []Hint         `gorm:"foreignKey:QuestionID;constraint:OnDelete:CASCADE"`
}

// Answer represents a possible answer for a question
type Answer struct {
	ID         string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	QuestionID string `gorm:"not null;type:uuid;index"`
	Text       string `gorm:"not null;type:text"`
	IsCorrect  bool   `gorm:"not null;default:false"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// Hint represents a hint for a question
type Hint struct {
	ID         string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	QuestionID string `gorm:"not null;type:uuid;index"`
	Text       string `gorm:"not null;type:text"`
	Order      int    `gorm:"not null;default:0"` // Order in which hints are revealed
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// Song represents a song for the guess that song game mode
type Song struct {
	ID            string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SongTitle     string  `gorm:"not null;type:varchar(255)"`
	Artist        string  `gorm:"not null;type:varchar(255)"`
	Album         string  `gorm:"type:varchar(255)"`
	ReleaseYear   string  `gorm:"type:varchar(4)"`
	Category      string  `gorm:"not null;type:varchar(100)"`
	Difficulty    string  `gorm:"not null;type:varchar(50)"`
	PlaysPerRound int32   `gorm:"not null;default:3"`
	ClipDuration  int32   `gorm:"not null;default:15"` // Duration in seconds
	AudioURL      string  `gorm:"not null;type:text"`
	PictureURL    *string `gorm:"type:text"`                                         // Optional picture URL
	CreatedBy     string  `gorm:"type:uuid;index"`                                   // User ID who created the song
	Creator       User    `gorm:"foreignKey:CreatedBy;constraint:OnDelete:SET NULL"` // Foreign key to User
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
	Hints         []SongHint     `gorm:"foreignKey:SongID;constraint:OnDelete:CASCADE"`
}

// SongHint represents a hint for a song
type SongHint struct {
	ID        string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	SongID    string `gorm:"not null;type:uuid;index"`
	Text      string `gorm:"not null;type:text"`
	Order     int    `gorm:"not null;default:0"` // Order in which hints are revealed
	CreatedAt time.Time
	UpdatedAt time.Time
}

// User represents a player in the system
type User struct {
	ID                string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Username          string `gorm:"uniqueIndex;not null;type:varchar(100)"`
	Email             string `gorm:"uniqueIndex;not null;type:varchar(255)"`
	PasswordHash      string `gorm:"not null;type:text"`
	DisplayName       string `gorm:"type:varchar(100)"`
	TotalScore        int64  `gorm:"not null;default:0"`
	GamesPlayed       int64  `gorm:"not null;default:0"`
	QuestionsAnswered int64  `gorm:"not null;default:0"`
	CorrectAnswers    int64  `gorm:"not null;default:0"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	DeletedAt         gorm.DeletedAt `gorm:"index"`
	AnsweredQuestions []UserAnswer   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

// UserAnswer represents a user's answer to a question
type UserAnswer struct {
	ID           string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       string    `gorm:"not null;type:uuid;index"`
	QuestionID   string    `gorm:"not null;type:uuid;index"`
	AnswerID     string    `gorm:"not null;type:uuid"`
	IsCorrect    bool      `gorm:"not null"`
	PointsEarned int32     `gorm:"not null;default:0"`
	AnsweredAt   time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// LeaderboardEntry represents a leaderboard entry
type LeaderboardEntry struct {
	ID          string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID      string    `gorm:"not null;type:uuid;index"`
	User        User      `gorm:"foreignKey:UserID"`
	Score       int64     `gorm:"not null;default:0"`
	Rank        int       `gorm:"not null;default:0"`
	Period      string    `gorm:"not null;type:varchar(50);index"` // "daily", "weekly", "monthly", "all-time"
	PeriodStart time.Time `gorm:"not null;index"`
	PeriodEnd   time.Time `gorm:"not null;index"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// TableName overrides for custom table names (optional)
func (Question) TableName() string {
	return "questions"
}

func (Answer) TableName() string {
	return "answers"
}

func (Hint) TableName() string {
	return "hints"
}

func (Song) TableName() string {
	return "songs"
}

func (SongHint) TableName() string {
	return "song_hints"
}

func (User) TableName() string {
	return "users"
}

func (UserAnswer) TableName() string {
	return "user_answers"
}

func (LeaderboardEntry) TableName() string {
	return "leaderboard_entries"
}
