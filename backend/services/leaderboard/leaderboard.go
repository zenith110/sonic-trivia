package leaderboard

import (
	"context"
	"log"

	pb "sonic-trivia/backend/protos"

	"connectrpc.com/connect"
)

// Server implements the LeaderboardService
type Server struct{}

// NewServer creates a new leaderboard service server
func NewServer() *Server {
	return &Server{}
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
		Score:                req.Msg.Score,
		PlaceInLeaderBoard:   req.Msg.PlaceInLeaderBoard,
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
	log.Printf("PaginateGlobalLeaderboard request received, page: %d", req.Msg.Page)

	// TODO: Implement actual pagination logic
	// - Query database for global leaderboard
	// - Apply pagination (page, limit)
	// - Fetch all players' scores
	// - Sort by total score
	// - Return paginated leaderboard data

	res := connect.NewResponse(&pb.PaginateGlobalLeaderboardResponse{
		Players: []*pb.LeaderboardPlayer{
			{
				Name:  "Global Player 1",
				Score: 500,
			},
			{
				Name:  "Global Player 2",
				Score: 450,
			},
			{
				Name:  "Global Player 3",
				Score: 400,
			},
		},
	})

	return res, nil
}
