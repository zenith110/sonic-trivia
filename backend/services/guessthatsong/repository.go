package guessthatsong

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"sonic-trivia/backend/database"
	pb "sonic-trivia/backend/protos"
)

// Repository handles database operations for songs
type Repository struct {
	db *gorm.DB
}

// NewRepository creates a new song repository
func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// Mapper functions to convert between models and proto messages

// SongToProto converts a Song model to a proto Song message
func SongToProto(s *database.Song) *pb.Song {
	if s == nil {
		return nil
	}

	protoSong := &pb.Song{
		Id:            s.ID,
		SongTitle:     s.SongTitle,
		Artist:        s.Artist,
		Album:         s.Album,
		ReleaseYear:   s.ReleaseYear,
		Category:      s.Category,
		Difficulty:    s.Difficulty,
		PlaysPerRound: s.PlaysPerRound,
		ClipDuration:  s.ClipDuration,
		AudioUrl:      s.AudioURL,
		PictureUrl:    s.PictureURL,
	}

	// Convert hints
	if len(s.Hints) > 0 {
		protoHints := make([]*pb.SongHint, len(s.Hints))
		for i, h := range s.Hints {
			protoHints[i] = &pb.SongHint{
				Id:   h.ID,
				Text: h.Text,
			}
		}
		protoSong.Hints = protoHints
	}

	return protoSong
}

// ProtoToSong converts a proto Song message to a Song model
func ProtoToSong(ps *pb.Song) *database.Song {
	if ps == nil {
		return nil
	}

	song := &database.Song{
		ID:            ps.GetId(),
		SongTitle:     ps.GetSongTitle(),
		Artist:        ps.GetArtist(),
		Album:         ps.GetAlbum(),
		ReleaseYear:   ps.GetReleaseYear(),
		Category:      ps.GetCategory(),
		Difficulty:    ps.GetDifficulty(),
		PlaysPerRound: ps.GetPlaysPerRound(),
		ClipDuration:  ps.GetClipDuration(),
		AudioURL:      ps.GetAudioUrl(),
		PictureURL:    ps.PictureUrl,
	}

	// Generate ID if not provided
	if song.ID == "" {
		song.ID = uuid.New().String()
	}

	// Convert hints
	if len(ps.GetHints()) > 0 {
		hints := make([]database.SongHint, len(ps.GetHints()))
		for i, ph := range ps.GetHints() {
			hintID := ph.GetId()
			if hintID == "" {
				hintID = uuid.New().String()
			}
			hints[i] = database.SongHint{
				ID:     hintID,
				SongID: song.ID,
				Text:   ph.GetText(),
				Order:  i,
			}
		}
		song.Hints = hints
	}

	return song
}

// Repository methods for database operations

// CreateSong creates a new song in the database
func (r *Repository) CreateSong(ctx context.Context, song *database.Song) error {
	return r.db.WithContext(ctx).Create(song).Error
}

// GetSongByID retrieves a song by ID with all related data
func (r *Repository) GetSongByID(ctx context.Context, id string) (*database.Song, error) {
	var song database.Song
	err := r.db.WithContext(ctx).
		Preload("Hints").
		First(&song, "id = ?", id).Error

	if err != nil {
		return nil, err
	}
	return &song, nil
}

// GetRandomSong retrieves a random song from the database
func (r *Repository) GetRandomSong(ctx context.Context, category string) (*database.Song, error) {
	var song database.Song
	query := r.db.WithContext(ctx).
		Preload("Hints").
		Order("RANDOM()")

	if category != "" {
		query = query.Where("category = ?", category)
	}

	err := query.First(&song).Error
	if err != nil {
		return nil, err
	}
	return &song, nil
}

// GetRandomSongs retrieves multiple random songs from the database
func (r *Repository) GetRandomSongs(ctx context.Context, category string, difficulty string, limit int) ([]database.Song, error) {
	var songs []database.Song
	query := r.db.WithContext(ctx).
		Preload("Hints").
		Order("RANDOM()")

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&songs).Error
	if err != nil {
		return nil, err
	}
	return songs, nil
}

// SearchSongs searches for songs by query string
func (r *Repository) SearchSongs(ctx context.Context, query string) ([]database.Song, error) {
	var songs []database.Song
	searchPattern := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Preload("Hints").
		Where("song_title ILIKE ? OR artist ILIKE ? OR album ILIKE ?",
			searchPattern, searchPattern, searchPattern).
		Find(&songs).Error

	if err != nil {
		return nil, err
	}
	return songs, nil
}

// UpdateSong updates an existing song in the database
func (r *Repository) UpdateSong(ctx context.Context, song *database.Song) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Update song basic fields
		if err := tx.Model(&database.Song{}).
			Where("id = ?", song.ID).
			Updates(map[string]interface{}{
				"song_title":      song.SongTitle,
				"artist":          song.Artist,
				"album":           song.Album,
				"release_year":    song.ReleaseYear,
				"category":        song.Category,
				"difficulty":      song.Difficulty,
				"plays_per_round": song.PlaysPerRound,
				"clip_duration":   song.ClipDuration,
				"audio_url":       song.AudioURL,
				"picture_url":     song.PictureURL,
			}).Error; err != nil {
			return err
		}

		// Delete old hints
		if err := tx.Where("song_id = ?", song.ID).Delete(&database.SongHint{}).Error; err != nil {
			return err
		}

		// Create new hints
		if len(song.Hints) > 0 {
			for i := range song.Hints {
				song.Hints[i].SongID = song.ID
			}
			if err := tx.Create(&song.Hints).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// DeleteSong deletes a song from the database
func (r *Repository) DeleteSong(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&database.Song{}, "id = ?", id).Error
}
