package approvalqueue

import (
	"context"
	"fmt"
	"log"
	"time"

	"sonic-trivia/backend/database"
	notification "sonic-trivia/backend/notifications"
	pb "sonic-trivia/backend/protos"

	"connectrpc.com/connect"
	"gorm.io/gorm"
)

// Server implements the ApprovalQueueService
type Server struct {
	repo *Repository
}

// NewServer creates a new approval queue service server
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

// AddToQueue adds a new approval request to the queue
func (s *Server) AddToQueue(
	ctx context.Context,
	req *connect.Request[pb.AddToQueueRequest],
) (*connect.Response[pb.AddToQueueResponse], error) {
	log.Printf("AddToQueue request received for user: %s", req.Msg.GetUserId())

	// Validate that at least one content ID is provided
	if req.Msg.QuestionId == nil &&
		req.Msg.QuestionCollectionId == nil &&
		req.Msg.SongId == nil &&
		req.Msg.SongCollectionId == nil {
		return nil, connect.NewError(connect.CodeInvalidArgument,
			fmt.Errorf("at least one content ID must be provided"))
	}

	// Convert proto to database model
	approvalRequest := ProtoToApprovalRequest(req.Msg)

	// Create in database
	err := s.repo.CreateApprovalRequest(ctx, approvalRequest)
	if err != nil {
		log.Printf("Error creating approval request: %v", err)
		return nil, connect.NewError(connect.CodeInternal,
			fmt.Errorf("failed to create approval request"))
	}

	res := connect.NewResponse(&pb.AddToQueueResponse{
		Success: true,
	})

	// Broadcast the update to all connected clients via global notification manager
	protoApprovalRequest := ApprovalRequestToProto(approvalRequest)
	update := &pb.ApprovalQueueUpdate{
		Action:          "added",
		ApprovalRequest: protoApprovalRequest,
		Timestamp:       time.Now().Format(time.RFC3339),
	}
	notification.GetGlobalManager().Broadcast(update)

	return res, nil
}

// RemoveFromQueue removes an approval request from the queue
func (s *Server) RemoveFromQueue(
	ctx context.Context,
	req *connect.Request[pb.RemoveFromQueueRequest],
) (*connect.Response[pb.RemoveFromQueueResponse], error) {
	log.Printf("RemoveFromQueue request received - user: %s, question: %s",
		req.Msg.GetUserId(), req.Msg.GetQuestionId())

	// Delete from database
	err := s.repo.DeleteApprovalRequest(ctx, req.Msg.GetUserId(), req.Msg.GetQuestionId())
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound,
				fmt.Errorf("approval request not found"))
		}
		log.Printf("Error deleting approval request: %v", err)
		return nil, connect.NewError(connect.CodeInternal,
			fmt.Errorf("failed to delete approval request"))
	}

	res := connect.NewResponse(&pb.RemoveFromQueueResponse{
		Success: true,
	})

	// Broadcast the removal to all connected clients via global notification manager
	update := &pb.ApprovalQueueUpdate{
		Action: "removed",
		ApprovalRequest: &pb.ApprovalRequest{
			UserId:     req.Msg.GetUserId(),
			QuestionId: &req.Msg.QuestionId,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	notification.GetGlobalManager().Broadcast(update)

	return res, nil
}

// GetAllApprovalRequests retrieves all approval requests with pagination
func (s *Server) GetAllApprovalRequests(
	ctx context.Context,
	req *connect.Request[pb.GetAllApprovalRequestsRequest],
) (*connect.Response[pb.GetAllApprovalRequestsResponse], error) {
	page := req.Msg.GetPage()
	pageSize := req.Msg.GetPageSize()

	// Set defaults
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	log.Printf("GetAllApprovalRequests request received - page: %d, pageSize: %d",
		page, pageSize)

	// Query database for approval requests
	approvalRequests, err := s.repo.GetAllApprovalRequests(ctx, int(page), int(pageSize))
	if err != nil {
		log.Printf("Error fetching approval requests: %v", err)
		return nil, connect.NewError(connect.CodeInternal,
			fmt.Errorf("failed to fetch approval requests"))
	}

	// Convert to proto
	protoApprovalRequests := make([]*pb.ApprovalRequest, len(approvalRequests))
	for i, ar := range approvalRequests {
		protoApprovalRequests[i] = ApprovalRequestToProto(&ar)
	}

	res := connect.NewResponse(&pb.GetAllApprovalRequestsResponse{
		ApprovalRequests: protoApprovalRequests,
	})

	return res, nil
}

// ApproveRequest approves a content item and sets is_under_review to false
func (s *Server) ApproveRequest(
	ctx context.Context,
	req *connect.Request[pb.ApproveRequestRequest],
) (*connect.Response[pb.ApproveRequestResponse], error) {
	log.Printf("ApproveRequest request received for user: %s", req.Msg.GetUserId())

	// Validate that at least one content ID is provided
	if req.Msg.QuestionId == nil &&
		req.Msg.QuestionCollectionId == nil &&
		req.Msg.SongId == nil &&
		req.Msg.SongCollectionId == nil {
		return nil, connect.NewError(connect.CodeInvalidArgument,
			fmt.Errorf("at least one content ID must be provided"))
	}

	// Approve the appropriate content type
	var err error
	if req.Msg.QuestionId != nil && *req.Msg.QuestionId != "" {
		err = s.repo.ApproveQuestion(ctx, *req.Msg.QuestionId)
	} else if req.Msg.QuestionCollectionId != nil && *req.Msg.QuestionCollectionId != "" {
		err = s.repo.ApproveQuestionCollection(ctx, *req.Msg.QuestionCollectionId)
	} else if req.Msg.SongId != nil && *req.Msg.SongId != "" {
		err = s.repo.ApproveSong(ctx, *req.Msg.SongId)
	} else if req.Msg.SongCollectionId != nil && *req.Msg.SongCollectionId != "" {
		err = s.repo.ApproveSongCollection(ctx, *req.Msg.SongCollectionId)
	}

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound,
				fmt.Errorf("content not found"))
		}
		log.Printf("Error approving content: %v", err)
		return nil, connect.NewError(connect.CodeInternal,
			fmt.Errorf("failed to approve content"))
	}

	// After approval, remove from approval queue if it exists
	if req.Msg.QuestionId != nil && *req.Msg.QuestionId != "" {
		_ = s.repo.DeleteApprovalRequest(ctx, req.Msg.GetUserId(), *req.Msg.QuestionId)
	}

	// Broadcast the approval to all connected clients
	protoApprovalRequest := &pb.ApprovalRequest{
		UserId:               req.Msg.GetUserId(),
		QuestionId:           req.Msg.QuestionId,
		QuestionCollectionId: req.Msg.QuestionCollectionId,
		SongId:               req.Msg.SongId,
		SongCollectionId:     req.Msg.SongCollectionId,
	}
	update := &pb.ApprovalQueueUpdate{
		Action:          "approved",
		ApprovalRequest: protoApprovalRequest,
		Timestamp:       time.Now().Format(time.RFC3339),
	}
	notification.GetGlobalManager().Broadcast(update)

	res := connect.NewResponse(&pb.ApproveRequestResponse{
		Success: true,
	})

	return res, nil
}

// StreamApprovalQueue streams real-time updates for the approval queue
func (s *Server) StreamApprovalQueue(
	ctx context.Context,
	req *connect.Request[pb.StreamApprovalQueueRequest],
	stream *connect.ServerStream[pb.ApprovalQueueUpdate],
) error {
	// Generate a unique client ID for this stream
	clientID := fmt.Sprintf("client-%d", time.Now().UnixNano())
	log.Printf("New approval queue stream connected: %s", clientID)

	// Register this client with the global notification manager
	notificationManager := notification.GetGlobalManager()
	updateChan := notificationManager.Register(clientID)
	defer notificationManager.Unregister(clientID)

	// Send initial state - get all current approval requests
	approvalRequests, err := s.repo.GetAllApprovalRequests(ctx, 1, 100)
	if err != nil {
		log.Printf("Error fetching initial approval requests for stream: %v", err)
	} else {
		// Send each existing approval request as an "added" update
		for _, ar := range approvalRequests {
			protoAR := ApprovalRequestToProto(&ar)
			initialUpdate := &pb.ApprovalQueueUpdate{
				Action:          "initial",
				ApprovalRequest: protoAR,
				Timestamp:       time.Now().Format(time.RFC3339),
			}
			if err := stream.Send(initialUpdate); err != nil {
				log.Printf("Error sending initial update to stream %s: %v", clientID, err)
				return err
			}
		}
	}

	// Keep streaming updates until context is canceled
	for {
		select {
		case <-ctx.Done():
			log.Printf("Stream %s context canceled", clientID)
			return ctx.Err()
		case update, ok := <-updateChan:
			if !ok {
				log.Printf("Stream %s channel closed", clientID)
				return nil
			}
			if err := stream.Send(update); err != nil {
				log.Printf("Error sending update to stream %s: %v", clientID, err)
				return err
			}
		}
	}
}
