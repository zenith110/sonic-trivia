package player

import (
	"context"
	"fmt"
	"log"

	"strings"

	"connectrpc.com/connect"

	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"

	"sonic-trivia/backend/database"
	pb "sonic-trivia/backend/protos"
)

// Server implements the PlayerService
type Server struct {
	repo *Repository
}

// NewServer creates a new player service server
func NewServer() *Server {
	// Get database connection
	db := database.GetDB()
	if db == nil {
		log.Fatal("Database not initialized")
	}

	// Initialize repository
	repo := NewRepository(db)

	return &Server{
		repo: repo,
	}
}

// playerToProto converts a database.Player to a pb.Player proto message
func playerToProto(player *database.Player) *pb.Player {
	if player == nil {
		return nil
	}

	// Convert unlocked characters
	var unlockedCharacters []*pb.SonicCharacter
	for _, pc := range player.UnlockedCharacters {
		// Convert character abilities
		var abilities []*pb.Ability
		for _, ability := range pc.Character.Abilities {
			abilities = append(abilities, &pb.Ability{
				Name:        ability.Name,
				Description: ability.Description,
			})
		}

		unlockedAt := timestamppb.New(pc.UnlockedAt)
		var lastUsed *timestamppb.Timestamp
		if pc.LastUsed != nil {
			lastUsed = timestamppb.New(*pc.LastUsed)
		}

		unlockedCharacters = append(unlockedCharacters, &pb.SonicCharacter{
			Id:              pc.Character.ID,
			Name:            pc.Character.Name,
			Description:     pc.Character.Description,
			ProfilePicture:  pc.Character.ProfilePicture,
			Abilities:       abilities,
			Speed:           pc.Character.Speed,
			Power:           pc.Character.Power,
			Technique:       pc.Character.Technique,
			Rarity:          pb.CharacterRarity(pb.CharacterRarity_value["CHARACTER_RARITY_"+strings.ToUpper(pc.Character.Rarity)]),
			Game:            pc.Character.Game,
			Quote:           pc.Character.Quote,
			Color:           pc.Character.Color,
			Unlocked:        true,
			UnlockedAt:      unlockedAt,
			LastUsed:        lastUsed,
			GamesPlayedWith: pc.GamesPlayedAs,
		})
	}

	// Convert friends
	var friends []*pb.FriendList
	for _, friendship := range player.Friends {
		if friendship.Status == "accepted" {
			friends = append(friends, &pb.FriendList{
				Username: friendship.Friend.Username,
			})
		}
	}

	return &pb.Player{
		Name:                   player.DisplayName,
		Email:                  player.Email,
		SelectedCharacterId:    player.SelectedCharacterID,
		UnlockedCharacters:     unlockedCharacters,
		TotalPoints:            player.TotalScore,
		TotalSuccessfulAnswers: player.CorrectAnswers,
		TotalAnswers:           player.QuestionsAnswered,
		Role:                   player.Role,
		TotalRings:             player.TotalRings,
		Friends:                friends,
	}
}

// protoToPlayer converts a pb.Player to a database.Player
func protoToPlayer(pbPlayer *pb.Player) *database.Player {
	if pbPlayer == nil {
		return nil
	}

	return &database.Player{
		DisplayName:         pbPlayer.GetName(),
		Email:               pbPlayer.GetEmail(),
		SelectedCharacterID: pbPlayer.GetSelectedCharacterId(),
		TotalScore:          pbPlayer.GetTotalPoints(),
		CorrectAnswers:      pbPlayer.GetTotalSuccessfulAnswers(),
		QuestionsAnswered:   pbPlayer.GetTotalAnswers(),
		Role:                pbPlayer.GetRole(),
		TotalRings:          pbPlayer.GetTotalRings(),
	}
}

// CreatePlayer creates a new player
func (s *Server) CreatePlayer(
	ctx context.Context,
	req *connect.Request[pb.Player],
) (*connect.Response[pb.Player], error) {
	log.Printf("CreatePlayer request received for: %s", req.Msg.GetName())

	// Validate input
	if req.Msg.GetName() == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("player name is required"))
	}

	if req.Msg.GetEmail() == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("player email is required"))
	}

	// Convert proto to database model
	player := protoToPlayer(req.Msg)

	// Set default values if not provided
	if player.Role == "" {
		player.Role = "player"
	}

	// Username is required for database, use email if not provided
	player.Username = player.Email

	// PasswordHash is required but not in proto, generate a placeholder
	// In production, this should be handled by the login service
	player.PasswordHash = "social_login_user"

	// Create player in database
	createdPlayer, err := s.repo.CreatePlayer(ctx, player)
	if err != nil {
		log.Printf("Error creating player: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create player"))
	}

	// Convert back to proto
	pbPlayer := playerToProto(createdPlayer)

	return connect.NewResponse(pbPlayer), nil
}

// GetPlayer retrieves a player by ID
func (s *Server) GetPlayer(
	ctx context.Context,
	req *connect.Request[pb.GetPlayerRequest],
) (*connect.Response[pb.GetPlayerResponse], error) {
	log.Printf("GetPlayer request received for ID: %s", req.Msg.GetId())

	playerID := req.Msg.GetId()
	if playerID == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("player ID is required"))
	}

	// Get player from database
	player, err := s.repo.GetPlayerByID(ctx, playerID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("player not found"))
		}
		log.Printf("Error fetching player: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch player"))
	}

	// Convert to proto
	pbPlayer := playerToProto(player)

	res := connect.NewResponse(&pb.GetPlayerResponse{
		Player: pbPlayer,
	})

	return res, nil
}

// UpdatePlayer updates an existing player
func (s *Server) UpdatePlayer(
	ctx context.Context,
	req *connect.Request[pb.Player],
) (*connect.Response[pb.Player], error) {
	log.Printf("UpdatePlayer request received for: %s", req.Msg.GetEmail())

	// Validate input
	if req.Msg.GetEmail() == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("player email is required"))
	}

	// Get existing player by email
	existingPlayer, err := s.repo.GetPlayerByEmail(ctx, req.Msg.GetEmail())
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("player not found"))
		}
		log.Printf("Error fetching player: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch player"))
	}

	// Update fields from proto
	if req.Msg.GetName() != "" {
		existingPlayer.DisplayName = req.Msg.GetName()
	}
	if req.Msg.GetRole() != "" {
		existingPlayer.Role = req.Msg.GetRole()
	}
	if req.Msg.GetSelectedCharacterId() != "" {
		existingPlayer.SelectedCharacterID = req.Msg.GetSelectedCharacterId()
	}
	if req.Msg.GetTotalPoints() > 0 {
		existingPlayer.TotalScore = req.Msg.GetTotalPoints()
	}
	if req.Msg.GetTotalSuccessfulAnswers() > 0 {
		existingPlayer.CorrectAnswers = req.Msg.GetTotalSuccessfulAnswers()
	}
	if req.Msg.GetTotalAnswers() > 0 {
		existingPlayer.QuestionsAnswered = req.Msg.GetTotalAnswers()
	}

	// Update player in database
	updatedPlayer, err := s.repo.UpdatePlayer(ctx, existingPlayer)
	if err != nil {
		log.Printf("Error updating player: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update player"))
	}

	// Convert back to proto
	pbPlayer := playerToProto(updatedPlayer)

	return connect.NewResponse(pbPlayer), nil
}

// DeletePlayer deletes a player by ID
func (s *Server) DeletePlayer(
	ctx context.Context,
	req *connect.Request[pb.DeletePlayerRequest],
) (*connect.Response[pb.DeletePlayerResponse], error) {
	log.Printf("DeletePlayer request received for ID: %s", req.Msg.GetId())

	playerID := req.Msg.GetId()
	if playerID == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("player ID is required"))
	}

	// Delete player from database
	err := s.repo.DeletePlayer(ctx, playerID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("player not found"))
		}
		log.Printf("Error deleting player: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete player"))
	}

	res := connect.NewResponse(&pb.DeletePlayerResponse{
		Message: "Player deleted successfully",
	})

	return res, nil
}

// UpdateSonicCharacter updates a Sonic character (placeholder for future implementation)
func (s *Server) UpdateSonicCharacter(
	ctx context.Context,
	req *connect.Request[pb.SonicCharacter],
) (*connect.Response[pb.SonicCharacter], error) {
	log.Printf("UpdateSonicCharacter request received for character: %s", req.Msg.GetName())

	// TODO: Implement Sonic character storage and updates
	// This would require a separate database table for characters
	// For now, return the character as-is
	return connect.NewResponse(req.Msg), nil
}

// GetSonicCharacters retrieves Sonic characters for a user (placeholder for future implementation)
func (s *Server) GetSonicCharacters(
	ctx context.Context,
	req *connect.Request[pb.GetSonicCharactersRequest],
) (*connect.Response[pb.GetSonicCharactersResponse], error) {
	log.Printf("GetSonicCharacters request received for user ID: %s", req.Msg.GetUserId())

	// TODO: Implement Sonic character retrieval from database
	// This would require a separate database table for characters
	// For now, return an empty list
	res := connect.NewResponse(&pb.GetSonicCharactersResponse{
		Characters: []*pb.SonicCharacter{},
	})

	return res, nil
}

// SelectCharacter updates the player's currently selected Sonic character
func (s *Server) SelectCharacter(
	ctx context.Context,
	req *connect.Request[pb.SelectCharacterRequest],
) (*connect.Response[pb.SelectCharacterResponse], error) {
	log.Printf("SelectCharacter request received for player ID: %s, character ID: %s",
		req.Msg.GetPlayerId(), req.Msg.GetCharacterId())

	playerID := req.Msg.GetPlayerId()
	characterID := req.Msg.GetCharacterId()

	// Validate input
	if playerID == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("player ID is required"))
	}

	if characterID == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("character ID is required"))
	}

	// Verify player exists
	_, err := s.repo.GetPlayerByID(ctx, playerID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("player not found"))
		}
		log.Printf("Error fetching player: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch player"))
	}

	// Update the selected character
	err = s.repo.UpdateSelectedCharacter(ctx, playerID, characterID)
	if err != nil {
		log.Printf("Error updating selected character: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update selected character"))
	}

	// Fetch updated player
	updatedPlayer, err := s.repo.GetPlayerByID(ctx, playerID)
	if err != nil {
		log.Printf("Error fetching updated player: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch updated player"))
	}

	// Convert to proto
	pbPlayer := playerToProto(updatedPlayer)

	res := connect.NewResponse(&pb.SelectCharacterResponse{
		Player:  pbPlayer,
		Message: fmt.Sprintf("Character %s selected successfully", characterID),
	})

	return res, nil
}
