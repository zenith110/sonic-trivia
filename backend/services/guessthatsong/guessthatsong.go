package guessthatsong

import (
	"context"
	"fmt"
	"log"

	"sonic-trivia/backend/database"
	"sonic-trivia/backend/middleware"
	"sonic-trivia/backend/notification"
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

	// Handle collection_id if provided
	if req.Msg.CollectionId != nil && *req.Msg.CollectionId != "" {
		dbSong.CollectionID = req.Msg.CollectionId
		log.Printf("Song will be added to collection: %s", *req.Msg.CollectionId)
	}

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

	// Extract user role from context
	userRole, err := middleware.GetRoleFromContext(ctx)
	if err != nil {
		// If role is not in context, fetch from database
		userRole, err = s.repo.GetUserRole(ctx, userID)
		if err != nil {
			log.Printf("Error fetching user role: %v", err)
			userRole = "player" // Default to player role
		}
	}

	// If user has "player" role, set is_under_review to true
	if userRole == "player" {
		dbSong.IsUnderReview = true
		log.Printf("Song marked for review as user has 'player' role")
	}

	// Create in database
	err = s.repo.CreateSong(ctx, dbSong)
	if err != nil {
		log.Printf("Error creating song: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create song"))
	}

	// If user has "player" role, add to approval queue
	if userRole == "player" {
		err = s.repo.AddSongToApprovalQueue(ctx, userID, dbSong.ID)
		if err != nil {
			log.Printf("Warning: Failed to add song to approval queue: %v", err)
			// Don't fail the request if approval queue addition fails
		} else {
			// Notify all connected clients via global notification manager
			notification.GetGlobalManager().NotifySongAdded(userID, dbSong.ID)
		}
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
	page := req.Msg.GetPage()
	pageSize := req.Msg.GetPageSize()

	log.Printf("GetRandomSongs request received - category: %s, difficulty: %s, rounds: %d, page: %d, pageSize: %d",
		category, difficulty, howManyRounds, page, pageSize)

	// Check if pagination is requested
	if page > 0 && pageSize > 0 {
		// Use paginated approach
		songs, total, err := s.repo.GetRandomSongsPaginated(ctx, category, difficulty, page, pageSize)
		if err != nil {
			log.Printf("Error fetching random songs: %v", err)
			return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch random songs"))
		}

		// Convert to proto
		protoSongs := make([]*pb.Song, len(songs))
		for i, song := range songs {
			protoSongs[i] = SongToProto(&song)
		}

		// Calculate pagination metadata
		hasMore := int32(page*pageSize) < total

		res := connect.NewResponse(&pb.GetRandomSongsResponse{
			Songs:    protoSongs,
			Total:    total,
			Page:     page,
			PageSize: pageSize,
			HasMore:  hasMore,
		})

		return res, nil
	}

	// Legacy behavior: use howManyRounds as limit
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

// GetSongs retrieves songs with pagination
func (s *Server) GetSongs(
	ctx context.Context,
	req *connect.Request[pb.GetSongsRequest],
) (*connect.Response[pb.GetSongsResponse], error) {
	userID := req.Msg.GetUserId()
	page := req.Msg.GetPage()
	pageSize := req.Msg.GetPageSize()

	log.Printf("GetSongs request received - userID: %s, page: %d, pageSize: %d", userID, page, pageSize)

	// Set defaults
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	// Query database for songs with pagination
	songs, total, err := s.repo.GetSongs(ctx, userID, page, pageSize)
	if err != nil {
		log.Printf("Error fetching songs: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch songs"))
	}

	// Convert to proto
	protoSongs := make([]*pb.Song, len(songs))
	for i, s := range songs {
		protoSongs[i] = SongToProto(&s)
	}

	// Calculate pagination metadata
	hasMore := int32(page*pageSize) < total

	res := connect.NewResponse(&pb.GetSongsResponse{
		Songs:    protoSongs,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
		HasMore:  hasMore,
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

	// Extract user ID from context
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		log.Printf("Error extracting user ID: %v", err)
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("authentication required"))
	}

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

	// Handle collection_id if provided
	if req.Msg.CollectionId != nil && *req.Msg.CollectionId != "" {
		existingSong.CollectionID = req.Msg.CollectionId
		log.Printf("Song will be added to collection: %s", *req.Msg.CollectionId)
	}

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

	// Extract user role from context
	userRole, err := middleware.GetRoleFromContext(ctx)
	if err != nil {
		// If role is not in context, fetch from database
		userRole, err = s.repo.GetUserRole(ctx, userID)
		if err != nil {
			log.Printf("Error fetching user role: %v", err)
			userRole = "player" // Default to player role
		}
	}

	// Track if song was already under review
	wasUnderReview := existingSong.IsUnderReview

	// If user has "player" role, set is_under_review to true
	if userRole == "player" {
		existingSong.IsUnderReview = true
		log.Printf("Song marked for review as user has 'player' role")
	}

	// Update in database
	err = s.repo.UpdateSong(ctx, existingSong)
	if err != nil {
		log.Printf("Error updating song: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update song"))
	}

	// If user has "player" role and song wasn't already under review, add to approval queue
	if userRole == "player" && !wasUnderReview {
		err = s.repo.AddSongToApprovalQueue(ctx, userID, existingSong.ID)
		if err != nil {
			log.Printf("Warning: Failed to add song to approval queue: %v", err)
			// Don't fail the request if approval queue addition fails
		} else {
			// Notify all connected clients via global notification manager
			notification.GetGlobalManager().NotifySongAdded(userID, existingSong.ID)
		}
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

// CreateSongCollection creates a new song collection
func (s *Server) CreateSongCollection(
	ctx context.Context,
	req *connect.Request[pb.CreateSongCollectionRequest],
) (*connect.Response[pb.CreateSongCollectionResponse], error) {
	log.Printf("CreateSongCollection request received: %s", req.Msg.GetName())

	// Extract user ID from context
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		log.Printf("Error extracting user ID: %v", err)
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("authentication required"))
	}

	// Extract user role from context
	userRole, err := middleware.GetRoleFromContext(ctx)
	if err != nil {
		// If role is not in context, fetch from database
		userRole, err = s.repo.GetUserRole(ctx, userID)
		if err != nil {
			log.Printf("Error fetching user role: %v", err)
			userRole = "player" // Default to player role
		}
	}

	// Create collection
	collection := &database.SongCollection{
		Name:          req.Msg.GetName(),
		Description:   req.Msg.GetDescription(),
		CreatedBy:     userID,
		IsUnderReview: userRole == "player",
	}

	if userRole == "player" {
		log.Printf("Song collection marked for review as user has 'player' role")
	}

	err = s.repo.CreateSongCollection(ctx, collection)
	if err != nil {
		log.Printf("Error creating song collection: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create song collection"))
	}

	// If user has "player" role, add to approval queue
	if userRole == "player" {
		err = s.repo.AddSongCollectionToApprovalQueue(ctx, userID, collection.ID)
		if err != nil {
			log.Printf("Warning: Failed to add song collection to approval queue: %v", err)
			// Don't fail the request if approval queue addition fails
		} else {
			// Notify all connected clients via global notification manager
			notification.GetGlobalManager().NotifySongCollectionAdded(userID, collection.ID)
		}
	}

	// Add songs to collection if song IDs provided
	for _, songID := range req.Msg.GetSongIds() {
		if songID != "" {
			err = s.repo.AddSongToCollection(ctx, songID, collection.ID)
			if err != nil {
				log.Printf("Warning: Failed to add song %s to collection: %v", songID, err)
			}
		}
	}

	res := connect.NewResponse(&pb.CreateSongCollectionResponse{
		Id: collection.ID,
	})

	return res, nil
}

// UpdateSongCollection updates an existing song collection
func (s *Server) UpdateSongCollection(
	ctx context.Context,
	req *connect.Request[pb.UpdateSongCollectionRequest],
) (*connect.Response[pb.UpdateSongCollectionResponse], error) {
	log.Printf("UpdateSongCollection request received for ID: %s", req.Msg.GetId())

	// Extract user ID from context
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		log.Printf("Error extracting user ID: %v", err)
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("authentication required"))
	}

	// Check if collection exists
	existingCollection, err := s.repo.GetSongCollectionByID(ctx, req.Msg.GetId())
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("collection not found"))
		}
		log.Printf("Error fetching collection: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch collection"))
	}

	// Update fields
	existingCollection.Name = req.Msg.GetName()
	existingCollection.Description = req.Msg.GetDescription()

	// Extract user role from context
	userRole, err := middleware.GetRoleFromContext(ctx)
	if err != nil {
		// If role is not in context, fetch from database
		userRole, err = s.repo.GetUserRole(ctx, userID)
		if err != nil {
			log.Printf("Error fetching user role: %v", err)
			userRole = "player" // Default to player role
		}
	}

	// Track if collection was already under review
	wasUnderReview := existingCollection.IsUnderReview

	// If user has "player" role, set is_under_review to true
	if userRole == "player" {
		existingCollection.IsUnderReview = true
		log.Printf("Song collection marked for review as user has 'player' role")
	}

	// Update in database
	err = s.repo.UpdateSongCollection(ctx, existingCollection)
	if err != nil {
		log.Printf("Error updating collection: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update collection"))
	}

	// If user has "player" role and collection wasn't already under review, add to approval queue
	if userRole == "player" && !wasUnderReview {
		err = s.repo.AddSongCollectionToApprovalQueue(ctx, userID, existingCollection.ID)
		if err != nil {
			log.Printf("Warning: Failed to add song collection to approval queue: %v", err)
			// Don't fail the request if approval queue addition fails
		} else {
			// Notify all connected clients via global notification manager
			notification.GetGlobalManager().NotifySongCollectionAdded(userID, existingCollection.ID)
		}
	}

	res := connect.NewResponse(&pb.UpdateSongCollectionResponse{
		IsSuccess: true,
	})

	return res, nil
}

// GetSongCollections retrieves song collections with pagination
func (s *Server) GetSongCollections(
	ctx context.Context,
	req *connect.Request[pb.GetSongCollectionsRequest],
) (*connect.Response[pb.GetSongCollectionsResponse], error) {
	userID := req.Msg.GetUserId()
	page := req.Msg.GetPage()
	pageSize := req.Msg.GetPageSize()

	// Set defaults
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 5
	}

	log.Printf("GetSongCollections request received - userID: %s, page: %d, pageSize: %d",
		userID, page, pageSize)

	// Query database for collections
	collections, total, err := s.repo.GetSongCollections(ctx, userID, int(page), int(pageSize))
	if err != nil {
		log.Printf("Error fetching song collections: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch song collections"))
	}

	// Convert to proto
	protoCollections := make([]*pb.SongCollection, len(collections))
	for i, c := range collections {
		protoSongs := make([]*pb.Song, len(c.Songs))
		for j, s := range c.Songs {
			protoSongs[j] = SongToProto(&s)
		}

		protoCollections[i] = &pb.SongCollection{
			Id:          c.ID,
			Name:        c.Name,
			Description: c.Description,
			CreatedBy:   c.CreatedBy,
			Songs:       protoSongs,
		}
	}

	res := connect.NewResponse(&pb.GetSongCollectionsResponse{
		Collections: protoCollections,
		Total:       int32(total),
		Page:        page,
		PageSize:    pageSize,
	})

	return res, nil
}

// DeleteSongCollection deletes a song collection
func (s *Server) DeleteSongCollection(
	ctx context.Context,
	req *connect.Request[pb.DeleteSongCollectionRequest],
) (*connect.Response[pb.DeleteSongCollectionResponse], error) {
	log.Printf("DeleteSongCollection request received for ID: %s", req.Msg.GetId())

	// Delete from database
	err := s.repo.DeleteSongCollection(ctx, req.Msg.GetId())
	if err != nil {
		log.Printf("Error deleting collection: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete collection"))
	}

	res := connect.NewResponse(&pb.DeleteSongCollectionResponse{
		IsSuccess: true,
	})

	return res, nil
}
