package approvalqueue

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"sonic-trivia/backend/database"
	pb "sonic-trivia/backend/protos"
)

// Repository handles database operations for approval queue
type Repository struct {
	db *gorm.DB
}

// NewRepository creates a new approval queue repository
func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// Mapper functions to convert between models and proto messages

// ApprovalRequestToProto converts an ApprovalRequest model to a proto ApprovalRequest message
func ApprovalRequestToProto(ar *database.ApprovalRequest) *pb.ApprovalRequest {
	if ar == nil {
		return nil
	}

	protoApprovalRequest := &pb.ApprovalRequest{
		UserId:               ar.UserID,
		QuestionId:           ar.QuestionID,
		QuestionCollectionId: ar.QuestionCollectionID,
		SongId:               ar.SongID,
		SongCollectionId:     ar.SongCollectionID,
		CreatedAt:            ar.CreatedAt.Format(time.RFC3339),
	}

	return protoApprovalRequest
}

// ProtoToApprovalRequest converts a proto AddToQueueRequest message to an ApprovalRequest model
func ProtoToApprovalRequest(req *pb.AddToQueueRequest) *database.ApprovalRequest {
	if req == nil {
		return nil
	}

	// Parse created_at time
	createdAt := time.Now()
	if req.GetCreatedAt() != "" {
		if parsedTime, err := time.Parse(time.RFC3339, req.GetCreatedAt()); err == nil {
			createdAt = parsedTime
		}
	}

	approvalRequest := &database.ApprovalRequest{
		ID:                   uuid.New().String(),
		UserID:               req.GetUserId(),
		QuestionID:           req.QuestionId,
		QuestionCollectionID: req.QuestionCollectionId,
		SongID:               req.SongId,
		SongCollectionID:     req.SongCollectionId,
		CreatedAt:            createdAt,
	}

	return approvalRequest
}

// Repository methods for database operations

// CreateApprovalRequest creates a new approval request in the database
func (r *Repository) CreateApprovalRequest(ctx context.Context, approvalRequest *database.ApprovalRequest) error {
	return r.db.WithContext(ctx).Create(approvalRequest).Error
}

// GetAllApprovalRequests retrieves all approval requests with pagination
func (r *Repository) GetAllApprovalRequests(ctx context.Context, page, pageSize int) ([]database.ApprovalRequest, error) {
	var approvalRequests []database.ApprovalRequest

	// Calculate offset
	offset := (page - 1) * pageSize
	if offset < 0 {
		offset = 0
	}

	// Fetch paginated approval requests
	err := r.db.WithContext(ctx).
		Preload("User").
		Order("created_at DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&approvalRequests).Error

	if err != nil {
		return nil, err
	}

	return approvalRequests, nil
}

// DeleteApprovalRequest deletes an approval request from the database
func (r *Repository) DeleteApprovalRequest(ctx context.Context, userID, questionID string) error {
	result := r.db.WithContext(ctx).
		Where("user_id = ? AND question_id = ?", userID, questionID).
		Delete(&database.ApprovalRequest{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

// GetApprovalRequestByID retrieves an approval request by ID
func (r *Repository) GetApprovalRequestByID(ctx context.Context, id string) (*database.ApprovalRequest, error) {
	var approvalRequest database.ApprovalRequest
	err := r.db.WithContext(ctx).
		Preload("User").
		First(&approvalRequest, "id = ?", id).Error

	if err != nil {
		return nil, err
	}
	return &approvalRequest, nil
}

// GetApprovalRequestsByUserID retrieves all approval requests for a specific user
func (r *Repository) GetApprovalRequestsByUserID(ctx context.Context, userID string) ([]database.ApprovalRequest, error) {
	var approvalRequests []database.ApprovalRequest
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&approvalRequests).Error

	if err != nil {
		return nil, err
	}
	return approvalRequests, nil
}

// ApproveQuestion sets is_under_review to false for a question
func (r *Repository) ApproveQuestion(ctx context.Context, questionID string) error {
	result := r.db.WithContext(ctx).
		Model(&database.Question{}).
		Where("id = ?", questionID).
		Update("is_under_review", false)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

// ApproveQuestionCollection sets is_under_review to false for a question collection
func (r *Repository) ApproveQuestionCollection(ctx context.Context, collectionID string) error {
	result := r.db.WithContext(ctx).
		Model(&database.QuestionCollection{}).
		Where("id = ?", collectionID).
		Update("is_under_review", false)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

// ApproveSong sets is_under_review to false for a song
func (r *Repository) ApproveSong(ctx context.Context, songID string) error {
	result := r.db.WithContext(ctx).
		Model(&database.Song{}).
		Where("id = ?", songID).
		Update("is_under_review", false)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

// ApproveSongCollection sets is_under_review to false for a song collection
func (r *Repository) ApproveSongCollection(ctx context.Context, collectionID string) error {
	result := r.db.WithContext(ctx).
		Model(&database.SongCollection{}).
		Where("id = ?", collectionID).
		Update("is_under_review", false)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}
