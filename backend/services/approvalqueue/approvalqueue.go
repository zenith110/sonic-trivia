package approvalqueue

import (
	"context"
	"fmt"
	"log"

	"sonic-trivia/backend/database"
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

	res := connect.NewResponse(&pb.ApproveRequestResponse{
		Success: true,
	})

	return res, nil
}
