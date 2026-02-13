package trivia

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"sonic-trivia/backend/database"
	pb "sonic-trivia/backend/protos"
)

// Repository handles database operations for trivia questions
type Repository struct {
	db *gorm.DB
}

// NewRepository creates a new trivia repository
func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// Mapper functions to convert between models and proto messages

// QuestionToProto converts a Question model to a proto Question message
func QuestionToProto(q *database.Question) *pb.Question {
	if q == nil {
		return nil
	}

	protoQuestion := &pb.Question{
		Id:         q.ID,
		Text:       q.Text,
		Category:   q.Category,
		Difficulty: q.Difficulty,
		Points:     int64(q.Points),
		PictureUrl: q.PictureURL,
	}

	// Convert answers
	if len(q.Answers) > 0 {
		protoAnswers := make([]*pb.Answer, len(q.Answers))
		for i, a := range q.Answers {
			protoAnswers[i] = &pb.Answer{
				Id:        a.ID,
				Text:      a.Text,
				IsCorrect: a.IsCorrect,
			}
		}
		protoQuestion.AnswerOptions = &pb.AnswerOptions{
			Answers: protoAnswers,
		}
	}

	// Convert hints
	if len(q.Hints) > 0 {
		protoHints := make([]*pb.Hint, len(q.Hints))
		for i, h := range q.Hints {
			protoHints[i] = &pb.Hint{
				Id:   h.ID,
				Text: h.Text,
			}
		}
		protoQuestion.Hints = protoHints
	}

	return protoQuestion
}

// ProtoToQuestion converts a proto Question message to a Question model
func ProtoToQuestion(pq *pb.Question) *database.Question {
	if pq == nil {
		return nil
	}

	question := &database.Question{
		ID:         pq.GetId(),
		Text:       pq.GetText(),
		Category:   pq.GetCategory(),
		Difficulty: pq.GetDifficulty(),
		Points:     int32(pq.GetPoints()),
		PictureURL: pq.PictureUrl,
	}

	// Generate ID if not provided
	if question.ID == "" {
		question.ID = uuid.New().String()
	}

	// Convert answers
	if pq.AnswerOptions != nil && len(pq.AnswerOptions.GetAnswers()) > 0 {
		answers := make([]database.Answer, len(pq.AnswerOptions.GetAnswers()))
		for i, pa := range pq.AnswerOptions.GetAnswers() {
			answerID := pa.GetId()
			if answerID == "" {
				answerID = uuid.New().String()
			}
			answers[i] = database.Answer{
				ID:         answerID,
				QuestionID: question.ID,
				Text:       pa.GetText(),
				IsCorrect:  pa.GetIsCorrect(),
			}
		}
		question.Answers = answers
	}

	// Convert hints
	if len(pq.GetHints()) > 0 {
		hints := make([]database.Hint, len(pq.GetHints()))
		for i, ph := range pq.GetHints() {
			hintID := ph.GetId()
			if hintID == "" {
				hintID = uuid.New().String()
			}
			hints[i] = database.Hint{
				ID:         hintID,
				QuestionID: question.ID,
				Text:       ph.GetText(),
				Order:      i,
			}
		}
		question.Hints = hints
	}

	return question
}

// Repository methods for database operations

// CreateQuestion creates a new question in the database
func (r *Repository) CreateQuestion(ctx context.Context, question *database.Question) error {
	return r.db.WithContext(ctx).Create(question).Error
}

// GetQuestionByID retrieves a question by ID with all related data
func (r *Repository) GetQuestionByID(ctx context.Context, id string) (*database.Question, error) {
	var question database.Question
	err := r.db.WithContext(ctx).
		Preload("Answers").
		Preload("Hints").
		First(&question, "id = ?", id).Error

	if err != nil {
		return nil, err
	}
	return &question, nil
}

// GetRandomQuestion retrieves a random question from the database
func (r *Repository) GetRandomQuestion(ctx context.Context) (*database.Question, error) {
	var question database.Question
	err := r.db.WithContext(ctx).
		Preload("Answers").
		Preload("Hints").
		Order("RANDOM()").
		First(&question).Error

	if err != nil {
		return nil, err
	}
	return &question, nil
}

// GetRandomQuestions retrieves multiple random questions from the database
func (r *Repository) GetRandomQuestions(ctx context.Context, category string, difficulty string, limit int) ([]database.Question, error) {
	var questions []database.Question
	query := r.db.WithContext(ctx).
		Preload("Answers").
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

	err := query.Find(&questions).Error
	if err != nil {
		return nil, err
	}
	return questions, nil
}

// GetRandomQuestionsPaginated retrieves random questions with pagination
func (r *Repository) GetRandomQuestionsPaginated(ctx context.Context, category string, difficulty string, page, pageSize int32) ([]database.Question, int32, error) {
	var questions []database.Question
	var total int64

	// Build base query
	baseQuery := r.db.WithContext(ctx).Model(&database.Question{})

	if category != "" {
		baseQuery = baseQuery.Where("category = ?", category)
	}

	if difficulty != "" {
		baseQuery = baseQuery.Where("difficulty = ?", difficulty)
	}

	// Get total count
	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results with random ordering
	offset := (page - 1) * pageSize
	err := baseQuery.
		Preload("Answers").
		Preload("Hints").
		Order("RANDOM()").
		Offset(int(offset)).
		Limit(int(pageSize)).
		Find(&questions).Error

	if err != nil {
		return nil, 0, err
	}

	return questions, int32(total), nil
}

// GetQuestions retrieves questions with pagination
func (r *Repository) GetQuestions(ctx context.Context, userID string, page, pageSize int32) ([]database.Question, int32, error) {
	var questions []database.Question
	var total int64

	// Build base query
	baseQuery := r.db.WithContext(ctx).Model(&database.Question{})

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
		Preload("Answers").
		Preload("Hints").
		Offset(int(offset)).
		Limit(int(pageSize)).
		Order("created_at DESC").
		Find(&questions).Error

	if err != nil {
		return nil, 0, err
	}

	return questions, int32(total), nil
}

// UpdateQuestion updates an existing question in the database
func (r *Repository) UpdateQuestion(ctx context.Context, question *database.Question) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Update question basic fields
		if err := tx.Model(&database.Question{}).
			Where("id = ?", question.ID).
			Updates(map[string]interface{}{
				"text":        question.Text,
				"category":    question.Category,
				"difficulty":  question.Difficulty,
				"points":      question.Points,
				"picture_url": question.PictureURL,
			}).Error; err != nil {
			return err
		}

		// Delete old answers and hints
		if err := tx.Where("question_id = ?", question.ID).Delete(&database.Answer{}).Error; err != nil {
			return err
		}
		if err := tx.Where("question_id = ?", question.ID).Delete(&database.Hint{}).Error; err != nil {
			return err
		}

		// Create new answers and hints
		if len(question.Answers) > 0 {
			for i := range question.Answers {
				question.Answers[i].QuestionID = question.ID
			}
			if err := tx.Create(&question.Answers).Error; err != nil {
				return err
			}
		}
		if len(question.Hints) > 0 {
			for i := range question.Hints {
				question.Hints[i].QuestionID = question.ID
			}
			if err := tx.Create(&question.Hints).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// DeleteQuestion deletes a question from the database
func (r *Repository) DeleteQuestion(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&database.Question{}, "id = ?", id).Error
}

// GetAnsweredQuestions retrieves all questions answered by a specific user
func (r *Repository) GetAnsweredQuestions(ctx context.Context, userID string) ([]database.Question, error) {
	var questions []database.Question
	err := r.db.WithContext(ctx).
		Preload("Answers").
		Preload("Hints").
		Joins("JOIN user_answers ON user_answers.question_id = questions.id").
		Where("user_answers.user_id = ?", userID).
		Find(&questions).Error

	if err != nil {
		return nil, err
	}
	return questions, nil
}

// CheckAnswer validates if the provided answer is correct
func (r *Repository) CheckAnswer(ctx context.Context, questionID, answerID string) (bool, error) {
	var answer database.Answer
	err := r.db.WithContext(ctx).
		Where("id = ? AND question_id = ?", answerID, questionID).
		First(&answer).Error

	if err != nil {
		return false, err
	}
	return answer.IsCorrect, nil
}

// CreateQuestionCollection creates a new question collection in the database
func (r *Repository) CreateQuestionCollection(ctx context.Context, collection *database.QuestionCollection) error {
	return r.db.WithContext(ctx).Create(collection).Error
}

// GetQuestionCollectionByID retrieves a collection by ID with all related questions
func (r *Repository) GetQuestionCollectionByID(ctx context.Context, id string) (*database.QuestionCollection, error) {
	var collection database.QuestionCollection
	err := r.db.WithContext(ctx).
		Preload("Questions").
		Preload("Questions.Answers").
		Preload("Questions.Hints").
		First(&collection, "id = ?", id).Error

	if err != nil {
		return nil, err
	}
	return &collection, nil
}

// GetQuestionCollections retrieves collections with pagination
func (r *Repository) GetQuestionCollections(ctx context.Context, userID string, page, pageSize int) ([]database.QuestionCollection, int64, error) {
	var collections []database.QuestionCollection
	var total int64

	// Count total collections for this user
	countQuery := r.db.WithContext(ctx).Model(&database.QuestionCollection{})
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
		Preload("Questions").
		Preload("Questions.Answers").
		Preload("Questions.Hints").
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

// UpdateQuestionCollection updates an existing question collection
func (r *Repository) UpdateQuestionCollection(ctx context.Context, collection *database.QuestionCollection) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Update collection basic fields
		if err := tx.Model(&database.QuestionCollection{}).
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

// DeleteQuestionCollection deletes a question collection from the database
func (r *Repository) DeleteQuestionCollection(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&database.QuestionCollection{}, "id = ?", id).Error
}

// AddQuestionToCollection adds a question to a collection
func (r *Repository) AddQuestionToCollection(ctx context.Context, questionID, collectionID string) error {
	return r.db.WithContext(ctx).
		Model(&database.Question{}).
		Where("id = ?", questionID).
		Update("collection_id", collectionID).Error
}

// AddQuestionToApprovalQueue adds a question to the approval queue
func (r *Repository) AddQuestionToApprovalQueue(ctx context.Context, userID, questionID string) error {
	approvalRequest := &database.ApprovalRequest{
		UserID:     userID,
		QuestionID: &questionID,
	}
	return r.db.WithContext(ctx).Create(approvalRequest).Error
}

// AddQuestionCollectionToApprovalQueue adds a question collection to the approval queue
func (r *Repository) AddQuestionCollectionToApprovalQueue(ctx context.Context, userID, collectionID string) error {
	approvalRequest := &database.ApprovalRequest{
		UserID:               userID,
		QuestionCollectionID: &collectionID,
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
