package leaderboard

import (
	"context"
	"log"

	"sonic-trivia/backend/database"
	pb "sonic-trivia/backend/protos"

	"connectrpc.com/connect"
)

// Server implements the LeaderboardService
type Server struct {
	repo *Repository
}

// NewServer creates a new leaderboard service server
func NewServer() *Server {
	db := database.GetDB()
	if db == nil {
		log.Fatal("Database not initialized")
	}

	return &Server{
		repo: NewRepository(db),
	}
}

// UpdateRoomLeaderboard updates a player's score in the room leaderboard
func (s *Server) UpdateRoomLeaderboard(
	ctx context.Context,
	req *connect.Request[pb.UpdateRoomLeaderboardRequest],
) (*connect.Response[pb.UpdateRoomLeaderboardResponse], error) {
	log.Printf("UpdateRoomLeaderboard request received")

	// TODO: Implement actual update logic
	// - Validate user identifier (email or username)
	// - Update player's score in the room leaderboard
	// - Update placement
	// - Store in database

	res := connect.NewResponse(&pb.UpdateRoomLeaderboardResponse{
		Score:              req.Msg.Score,
		PlaceInLeaderBoard: req.Msg.PlaceInLeaderBoard,
	})

	return res, nil
}

// PaginateRoomLeaderboard retrieves paginated room leaderboard data
func (s *Server) PaginateRoomLeaderboard(
	ctx context.Context,
	req *connect.Request[pb.PaginateRoomLeaderboardRequest],
) (*connect.Response[pb.PaginateRoomLeaderboardResponse], error) {
	log.Printf("PaginateRoomLeaderboard request received for room: %s, page: %d", req.Msg.RoomId, req.Msg.Page)

	// TODO: Implement actual pagination logic
	// - Query database for room leaderboard
	// - Apply pagination (page, limit)
	// - Fetch player scores and rankings
	// - Sort by score
	// - Return paginated leaderboard data

	res := connect.NewResponse(&pb.PaginateRoomLeaderboardResponse{
		Leaderboards: []*pb.RoomLeaderboard{
			{
				Name: req.Msg.RoomId,
				Players: []*pb.LeaderboardPlayer{
					{
						Name:  "Player 1",
						Score: 100,
						PlaceInLeaderBoardForEachRound: []*pb.LeaderboardHistoryPlayer{
							{
								PlaceInLeaderBoardForEachRound: "1",
								Event:                          "Round 1",
							},
						},
					},
					{
						Name:  "Player 2",
						Score: 90,
						PlaceInLeaderBoardForEachRound: []*pb.LeaderboardHistoryPlayer{
							{
								PlaceInLeaderBoardForEachRound: "2",
								Event:                          "Round 1",
							},
						},
					},
				},
			},
		},
	})

	return res, nil
}

// UpdateGlobalLeaderboard updates a player's score in the global leaderboard
func (s *Server) UpdateGlobalLeaderboard(
	ctx context.Context,
	req *connect.Request[pb.UpdateGlobalLeaderboardRequest],
) (*connect.Response[pb.UpdateGlobalLeaderboardResponse], error) {
	log.Printf("UpdateGlobalLeaderboard request received")

	// TODO: Implement actual update logic
	// - Validate user identifier (email or username)
	// - Update player's total points in global leaderboard
	// - Update placement
	// - Store in database

	res := connect.NewResponse(&pb.UpdateGlobalLeaderboardResponse{
		Value: &pb.UpdateGlobalLeaderboardResponse_TotalPoints{
			TotalPoints: req.Msg.Score,
		},
	})

	return res, nil
}

// PaginateGlobalLeaderboard retrieves paginated global leaderboard data
func (s *Server) PaginateGlobalLeaderboard(
	ctx context.Context,
	req *connect.Request[pb.PaginateGlobalLeaderboardRequest],
) (*connect.Response[pb.PaginateGlobalLeaderboardResponse], error) {
	page := int(req.Msg.Page)
	if page < 1 {
		page = 1
	}
	limit := 10 // Default page size

	log.Printf("PaginateGlobalLeaderboard request received, page: %d", page)

	// Query database for global leaderboard
	players, err := s.repo.GetGlobalLeaderboard(ctx, page, limit)
	if err != nil {
		log.Printf("Error fetching global leaderboard: %v", err)
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	// Convert to proto format
	pbPlayers := make([]*pb.LeaderboardPlayer, len(players))
	for i, player := range players {
		pbPlayers[i] = &pb.LeaderboardPlayer{
			Name:  player.DisplayName,
			Score: int32(player.TotalScore),
		}
	}

	res := connect.NewResponse(&pb.PaginateGlobalLeaderboardResponse{
		Players: pbPlayers,
	})

	return res, nil
}
