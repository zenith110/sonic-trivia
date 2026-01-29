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
	CreatedBy          string  `gorm:"type:uuid;index"`                                   // Player ID who created the question
	Creator            Player  `gorm:"foreignKey:CreatedBy;constraint:OnDelete:SET NULL"` // Foreign key to Player
	IsUnderReview      bool    `gorm:"not null;default:false"`                            // Whether the question is under review
	CreatedAt          time.Time
	UpdatedAt          time.Time
	DeletedAt          gorm.DeletedAt `gorm:"index"`
	Answers            []Answer       `gorm:"foreignKey:QuestionID;constraint:OnDelete:CASCADE"`
	Hints              []Hint         `gorm:"foreignKey:QuestionID;constraint:OnDelete:CASCADE"`
	CollectionID       *string        `gorm:"type:uuid;index"` // Optional collection this question belongs to
}

// QuestionCollection represents a collection of trivia questions
type QuestionCollection struct {
	ID            string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name          string     `gorm:"not null;type:varchar(255)"`
	Description   string     `gorm:"type:text"`
	CreatedBy     string     `gorm:"type:uuid;index;not null"`
	Creator       Player     `gorm:"foreignKey:CreatedBy;constraint:OnDelete:CASCADE"`
	Questions     []Question `gorm:"foreignKey:CollectionID;constraint:OnDelete:SET NULL"`
	IsUnderReview bool       `gorm:"not null;default:false"` // Whether the collection is under review
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
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
	CreatedBy     string  `gorm:"type:uuid;index"`                                   // Player ID who created the song
	Creator       Player  `gorm:"foreignKey:CreatedBy;constraint:OnDelete:SET NULL"` // Foreign key to Player
	IsUnderReview bool    `gorm:"not null;default:false"`                            // Whether the song is under review
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
	Hints         []SongHint     `gorm:"foreignKey:SongID;constraint:OnDelete:CASCADE"`
	CollectionID  *string        `gorm:"type:uuid;index"` // Optional collection this song belongs to
}

// SongCollection represents a collection of songs
type SongCollection struct {
	ID            string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name          string `gorm:"not null;type:varchar(255)"`
	Description   string `gorm:"type:text"`
	CreatedBy     string `gorm:"type:uuid;index;not null"`
	Creator       Player `gorm:"foreignKey:CreatedBy;constraint:OnDelete:CASCADE"`
	Songs         []Song `gorm:"foreignKey:CollectionID;constraint:OnDelete:SET NULL"`
	IsUnderReview bool   `gorm:"not null;default:false"` // Whether the collection is under review
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
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

// SonicCharacter represents a Sonic character that players can unlock
type SonicCharacter struct {
	ID             string             `gorm:"primaryKey;type:varchar(100)"` // e.g., "sonic", "tails", "knuckles"
	Name           string             `gorm:"not null;type:varchar(100)"`
	Description    string             `gorm:"type:text"`
	ProfilePicture string             `gorm:"type:text"`
	Speed          int32              `gorm:"not null;default:0"`
	Power          int32              `gorm:"not null;default:0"`
	Technique      int32              `gorm:"not null;default:0"`
	Rarity         string             `gorm:"not null;type:varchar(50)"` // "common", "rare", "epic", "legendary"
	Game           string             `gorm:"type:varchar(255)"`
	Quote          string             `gorm:"type:text"`
	Color          string             `gorm:"type:varchar(50)"`
	Abilities      []CharacterAbility `gorm:"foreignKey:CharacterID;constraint:OnDelete:CASCADE"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// CharacterAbility represents an ability for a Sonic character
type CharacterAbility struct {
	ID          string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	CharacterID string `gorm:"not null;type:varchar(100);index"`
	Name        string `gorm:"not null;type:varchar(255)"`
	Description string `gorm:"type:text"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// Player represents a player in the system
type Player struct {
	ID                  string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Username            string `gorm:"uniqueIndex;not null;type:varchar(100)"`
	Email               string `gorm:"uniqueIndex;not null;type:varchar(255)"`
	PasswordHash        string `gorm:"not null;type:text"`
	DisplayName         string `gorm:"type:varchar(100)"`
	Role                string `gorm:"not null;default:'player';type:varchar(50)"` // Role: "admin", "player", etc.
	SelectedCharacterID string `gorm:"type:varchar(100)"`                          // Currently selected Sonic character ID
	TotalScore          int64  `gorm:"not null;default:0"`
	TotalRings          int64  `gorm:"not null;default:0"` // Total rings collected
	GamesPlayed         int64  `gorm:"not null;default:0"`
	QuestionsAnswered   int64  `gorm:"not null;default:0"`
	CorrectAnswers      int64  `gorm:"not null;default:0"`
	CreatedAt           time.Time
	UpdatedAt           time.Time
	DeletedAt           gorm.DeletedAt    `gorm:"index"`
	AnsweredQuestions   []PlayerAnswer    `gorm:"foreignKey:PlayerID;constraint:OnDelete:CASCADE"`
	UnlockedCharacters  []PlayerCharacter `gorm:"foreignKey:PlayerID;constraint:OnDelete:CASCADE"`
	Friends             []Friendship      `gorm:"foreignKey:PlayerID;constraint:OnDelete:CASCADE"`
}

// PlayerCharacter represents a many-to-many relationship between players and characters
type PlayerCharacter struct {
	ID            string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	PlayerID      string         `gorm:"not null;type:uuid;index:idx_player_character,unique"`
	CharacterID   string         `gorm:"not null;type:varchar(100);index:idx_player_character,unique"`
	Character     SonicCharacter `gorm:"foreignKey:CharacterID;references:ID"`
	UnlockedAt    time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP"`
	LastUsed      *time.Time
	GamesPlayedAs int64 `gorm:"not null;default:0"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// Friendship represents a friendship between two players
type Friendship struct {
	ID        string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	PlayerID  string `gorm:"not null;type:uuid;index:idx_friendship,unique"` // The player who initiated or owns this friendship record
	FriendID  string `gorm:"not null;type:uuid;index:idx_friendship,unique"` // The friend's player ID
	Friend    Player `gorm:"foreignKey:FriendID;references:ID"`
	Status    string `gorm:"not null;type:varchar(50);default:'pending'"` // "pending", "accepted", "blocked"
	CreatedAt time.Time
	UpdatedAt time.Time
}

// PlayerAnswer represents a player's answer to a question
type PlayerAnswer struct {
	ID           string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	PlayerID     string    `gorm:"not null;type:uuid;index"`
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
	PlayerID    string    `gorm:"not null;type:uuid;index"`
	Player      Player    `gorm:"foreignKey:PlayerID"`
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

func (SonicCharacter) TableName() string {
	return "sonic_characters"
}

func (CharacterAbility) TableName() string {
	return "character_abilities"
}

func (Player) TableName() string {
	return "players"
}

func (PlayerCharacter) TableName() string {
	return "player_characters"
}

func (Friendship) TableName() string {
	return "friendships"
}

func (PlayerAnswer) TableName() string {
	return "player_answers"
}

func (LeaderboardEntry) TableName() string {
	return "leaderboard_entries"
}

// ApprovalRequest represents a request for content approval
type ApprovalRequest struct {
	ID                   string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID               string  `gorm:"not null;type:uuid;index"`
	User                 Player  `gorm:"foreignKey:UserID"`
	QuestionID           *string `gorm:"type:uuid;index"`
	QuestionCollectionID *string `gorm:"type:uuid;index"`
	SongID               *string `gorm:"type:uuid;index"`
	SongCollectionID     *string `gorm:"type:uuid;index"`
	CreatedAt            time.Time
	UpdatedAt            time.Time
	DeletedAt            gorm.DeletedAt `gorm:"index"`
}

func (ApprovalRequest) TableName() string {
	return "approval_requests"
}
