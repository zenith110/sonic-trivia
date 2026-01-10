package guessthatsong

import (
	"context"
	"fmt"
	"log"

	"sonic-trivia/backend/database"
	"sonic-trivia/backend/middleware"
	pb "sonic-trivia/backend/protos"
	"sonic-trivia/backend/storage"

	"connectrpc.com/connect"
	"gorm.io/gorm"
)

// Server implements the GuessThatSongService
type Server struct {
	repo    *Repository
	storage *storage.R2Client
}

// NewServer creates a new guess that song service server
func NewServer() *Server {
	// Get database connection
	db := database.GetDB()
	if db == nil {
		log.Fatal("Database not initialized")
	}

	// Initialize repository
	repo := NewRepository(db)

	// Initialize storage client (optional)
	storageClient, err := storage.NewR2Client()
	if err != nil {
		log.Printf("Warning: R2 storage not configured: %v", err)
		storageClient = nil
	}

	return &Server{
		repo:    repo,
		storage: storageClient,
	}
}

// CreateSong creates a new song challenge
func (s *Server) CreateSong(
	ctx context.Context,
	req *connect.Request[pb.CreateSongRequest],
) (*connect.Response[pb.CreateSongResponse], error) {
	song := req.Msg.GetSong()
	log.Printf("CreateSong request received: %s by %s", song.GetSongTitle(), song.GetArtist())

	// Extract user ID from context
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		log.Printf("Error extracting user ID: %v", err)
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("authentication required"))
	}

	// Convert proto to database model
	dbSong := ProtoToSong(song)

	// Set the creator
	dbSong.CreatedBy = userID
	log.Printf("Song will be created by user: %s", userID)

	// Handle audio URL - in production, upload audio file to storage
	// For now, we assume audio_url is already set in the proto
	if dbSong.AudioURL == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("audio URL is required"))
	}

	// Handle picture if provided
	if song.PictureUrl != nil && *song.PictureUrl != "" {
		log.Printf("Picture URL provided for song")
		dbSong.PictureURL = song.PictureUrl
	}

	// Create in database
	err = s.repo.CreateSong(ctx, dbSong)
	if err != nil {
		log.Printf("Error creating song: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create song"))
	}

	// Convert back to proto
	protoSong := SongToProto(dbSong)

	res := connect.NewResponse(&pb.CreateSongResponse{
		Song: protoSong,
	})

	return res, nil
}

// GetSong retrieves a specific song by ID
func (s *Server) GetSong(
	ctx context.Context,
	req *connect.Request[pb.GetSongRequest],
) (*connect.Response[pb.GetSongResponse], error) {
	log.Printf("GetSong request received for ID: %s", req.Msg.GetId())

	// Query database for song
	song, err := s.repo.GetSongByID(ctx, req.Msg.GetId())
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("song not found"))
		}
		log.Printf("Error fetching song: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch song"))
	}

	// Convert to proto
	protoSong := SongToProto(song)

	res := connect.NewResponse(&pb.GetSongResponse{
		Song: protoSong,
	})

	return res, nil
}

// GetRandomSong retrieves a random song from a specific category
func (s *Server) GetRandomSong(
	ctx context.Context,
	req *connect.Request[pb.GetRandomSongRequest],
) (*connect.Response[pb.GetRandomSongResponse], error) {
	log.Printf("GetRandomSong request received for category: %s", req.Msg.GetCategory())

	// Query database for random song
	song, err := s.repo.GetRandomSong(ctx, req.Msg.GetCategory())
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("no songs available"))
		}
		log.Printf("Error fetching random song: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch random song"))
	}

	// Convert to proto
	protoSong := SongToProto(song)

	res := connect.NewResponse(&pb.GetRandomSongResponse{
		Song: protoSong,
	})

	return res, nil
}

// GetRandomSongs retrieves multiple random songs
func (s *Server) GetRandomSongs(
	ctx context.Context,
	req *connect.Request[pb.GetRandomSongsRequest],
) (*connect.Response[pb.GetRandomSongsResponse], error) {
	category := req.Msg.GetCategory()
	difficulty := req.Msg.GetDifficulty()
	howManyRounds := req.Msg.GetHowManyRounds()

	log.Printf("GetRandomSongs request received - category: %s, difficulty: %s, rounds: %d",
		category, difficulty, howManyRounds)

	// Default to 5 songs if not specified
	limit := int(howManyRounds)
	if limit <= 0 {
		limit = 5
	}

	// Query database for random songs
	songs, err := s.repo.GetRandomSongs(ctx, category, difficulty, limit)
	if err != nil {
		log.Printf("Error fetching random songs: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch random songs"))
	}

	if len(songs) == 0 {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("no songs available"))
	}

	// Convert to proto
	protoSongs := make([]*pb.Song, len(songs))
	for i, song := range songs {
		protoSongs[i] = SongToProto(&song)
	}

	res := connect.NewResponse(&pb.GetRandomSongsResponse{
		Songs: protoSongs,
	})

	return res, nil
}

// UpdateSong updates an existing song
func (s *Server) UpdateSong(
	ctx context.Context,
	req *connect.Request[pb.UpdateSongRequest],
) (*connect.Response[pb.UpdateSongResponse], error) {
	song := req.Msg.GetSong()
	log.Printf("UpdateSong request received for ID: %s", song.GetId())

	// Check if song exists
	existingSong, err := s.repo.GetSongByID(ctx, song.GetId())
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("song not found"))
		}
		log.Printf("Error fetching song: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch song"))
	}

	// Update fields
	existingSong.SongTitle = song.GetSongTitle()
	existingSong.Artist = song.GetArtist()
	existingSong.Album = song.GetAlbum()
	existingSong.ReleaseYear = song.GetReleaseYear()
	existingSong.Category = song.GetCategory()
	existingSong.Difficulty = song.GetDifficulty()
	existingSong.PlaysPerRound = song.GetPlaysPerRound()
	existingSong.ClipDuration = song.GetClipDuration()

	// Update audio URL if provided
	if song.GetAudioUrl() != "" {
		existingSong.AudioURL = song.GetAudioUrl()
	}

	// Handle picture if provided
	if song.PictureUrl != nil && *song.PictureUrl != "" {
		log.Printf("Picture URL provided for song update")
		existingSong.PictureURL = song.PictureUrl
	}

	// Convert hints from proto
	if len(song.GetHints()) > 0 {
		hints := make([]database.SongHint, len(song.GetHints()))
		for i, ph := range song.GetHints() {
			hints[i] = database.SongHint{
				ID:     ph.GetId(),
				SongID: existingSong.ID,
				Text:   ph.GetText(),
				Order:  i,
			}
		}
		existingSong.Hints = hints
	}

	// Update in database
	err = s.repo.UpdateSong(ctx, existingSong)
	if err != nil {
		log.Printf("Error updating song: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update song"))
	}

	// Convert back to proto
	protoSong := SongToProto(existingSong)

	res := connect.NewResponse(&pb.UpdateSongResponse{
		Song: protoSong,
	})

	return res, nil
}

// DeleteSong deletes a song by ID
func (s *Server) DeleteSong(
	ctx context.Context,
	req *connect.Request[pb.DeleteSongRequest],
) (*connect.Response[pb.DeleteSongResponse], error) {
	log.Printf("DeleteSong request received for ID: %s", req.Msg.GetId())

	// Delete from database
	err := s.repo.DeleteSong(ctx, req.Msg.GetId())
	if err != nil {
		log.Printf("Error deleting song: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete song"))
	}

	res := connect.NewResponse(&pb.DeleteSongResponse{
		Success: true,
	})

	return res, nil
}

// SearchSong searches for songs by query string
func (s *Server) SearchSong(
	ctx context.Context,
	req *connect.Request[pb.SearchSongRequest],
) (*connect.Response[pb.SearchSongResponse], error) {
	log.Printf("SearchSong request received with query: %s", req.Msg.GetQuery())

	// Search database for songs
	songs, err := s.repo.SearchSongs(ctx, req.Msg.GetQuery())
	if err != nil {
		log.Printf("Error searching songs: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to search songs"))
	}

	// Convert to proto
	protoSongs := make([]*pb.Song, len(songs))
	for i, song := range songs {
		protoSongs[i] = SongToProto(&song)
	}

	res := connect.NewResponse(&pb.SearchSongResponse{
		Songs: protoSongs,
	})

	return res, nil
}
