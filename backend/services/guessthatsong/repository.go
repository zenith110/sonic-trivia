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

// CreateSongCollection creates a new song collection in the database
func (r *Repository) CreateSongCollection(ctx context.Context, collection *database.SongCollection) error {
	return r.db.WithContext(ctx).Create(collection).Error
}

// GetSongCollectionByID retrieves a collection by ID with all related songs
func (r *Repository) GetSongCollectionByID(ctx context.Context, id string) (*database.SongCollection, error) {
	var collection database.SongCollection
	err := r.db.WithContext(ctx).
		Preload("Songs").
		Preload("Songs.Hints").
		First(&collection, "id = ?", id).Error

	if err != nil {
		return nil, err
	}
	return &collection, nil
}

// UpdateSongCollection updates an existing song collection
func (r *Repository) UpdateSongCollection(ctx context.Context, collection *database.SongCollection) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Update collection basic fields
		if err := tx.Model(&database.SongCollection{}).
			Where("id = ?", collection.ID).
			Updates(map[string]interface{}{
				"name":        collection.Name,
				"description": collection.Description,
			}).Error; err != nil {
			return err
		}

		return nil
	})
}

// DeleteSongCollection deletes a song collection from the database
func (r *Repository) DeleteSongCollection(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&database.SongCollection{}, "id = ?", id).Error
}

// AddSongToCollection adds a song to a collection
func (r *Repository) AddSongToCollection(ctx context.Context, songID, collectionID string) error {
	return r.db.WithContext(ctx).
		Model(&database.Song{}).
		Where("id = ?", songID).
		Update("collection_id", collectionID).Error
}

// GetSongCollections retrieves collections with pagination
func (r *Repository) GetSongCollections(ctx context.Context, userID string, page, pageSize int) ([]database.SongCollection, int64, error) {
	var collections []database.SongCollection
	var total int64

	// Count total collections for this user
	countQuery := r.db.WithContext(ctx).Model(&database.SongCollection{})
	if userID != "" {
		countQuery = countQuery.Where("created_by = ?", userID)
	}
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Calculate offset
	offset := (page - 1) * pageSize
	if offset < 0 {
		offset = 0
	}

	// Fetch paginated collections
	query := r.db.WithContext(ctx).
		Preload("Songs").
		Preload("Songs.Hints").
		Order("created_at DESC")

	if userID != "" {
		query = query.Where("created_by = ?", userID)
	}

	err := query.
		Limit(pageSize).
		Offset(offset).
		Find(&collections).Error

	if err != nil {
		return nil, 0, err
	}

	return collections, total, nil
}

// AddSongToApprovalQueue adds a song to the approval queue
func (r *Repository) AddSongToApprovalQueue(ctx context.Context, userID, songID string) error {
	approvalRequest := &database.ApprovalRequest{
		UserID: userID,
		SongID: &songID,
	}
	return r.db.WithContext(ctx).Create(approvalRequest).Error
}

// AddSongCollectionToApprovalQueue adds a song collection to the approval queue
func (r *Repository) AddSongCollectionToApprovalQueue(ctx context.Context, userID, collectionID string) error {
	approvalRequest := &database.ApprovalRequest{
		UserID:           userID,
		SongCollectionID: &collectionID,
	}
	return r.db.WithContext(ctx).Create(approvalRequest).Error
}

// GetUserRole gets a user's role from the database
func (r *Repository) GetUserRole(ctx context.Context, userID string) (string, error) {
	var player database.Player
	err := r.db.WithContext(ctx).
		Select("role").
		Where("id = ?", userID).
		First(&player).Error

	if err != nil {
		return "", err
	}
	return player.Role, nil
}

// GetSongs retrieves songs with pagination

// GetSongs retrieves songs with pagination
func (r *Repository) GetSongs(ctx context.Context, userID string, page, pageSize int32) ([]database.Song, int32, error) {
	var songs []database.Song
	var total int64

	// Build base query
	baseQuery := r.db.WithContext(ctx).Model(&database.Song{})

	// If userID is provided, filter by created_by
	if userID != "" {
		baseQuery = baseQuery.Where("created_by = ?", userID)
	}

	// Get total count
	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	err := baseQuery.
		Preload("Hints").
		Offset(int(offset)).
		Limit(int(pageSize)).
		Order("created_at DESC").
		Find(&songs).Error

	if err != nil {
		return nil, 0, err
	}

	return songs, int32(total), nil
}
