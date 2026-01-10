package trivia

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

// Server implements the TriviaService
type Server struct {
	repo    *Repository
	storage *storage.R2Client
}

// NewServer creates a new trivia service server
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

// GetQuestion retrieves a specific question by ID
func (s *Server) GetQuestion(
	ctx context.Context,
	req *connect.Request[pb.GetQuestionRequest],
) (*connect.Response[pb.GetQuestionResponse], error) {
	log.Printf("GetQuestion request received for ID: %s", req.Msg.GetId())

	// Query database for question
	question, err := s.repo.GetQuestionByID(ctx, req.Msg.GetId())
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("question not found"))
		}
		log.Printf("Error fetching question: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch question"))
	}

	// Convert to proto
	protoQuestion := QuestionToProto(question)

	res := connect.NewResponse(&pb.GetQuestionResponse{
		Question: protoQuestion,
	})

	return res, nil
}

// GetRandomQuestion retrieves a random question
func (s *Server) GetRandomQuestion(
	ctx context.Context,
	req *connect.Request[pb.GetRandomQuestionRequest],
) (*connect.Response[pb.GetQuestionResponse], error) {
	log.Printf("GetRandomQuestion request received")

	// Query database for random question
	question, err := s.repo.GetRandomQuestion(ctx)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("no questions available"))
		}
		log.Printf("Error fetching random question: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch random question"))
	}

	// Convert to proto
	protoQuestion := QuestionToProto(question)

	res := connect.NewResponse(&pb.GetQuestionResponse{
		Question: protoQuestion,
	})

	return res, nil
}

// GetRandomQuestions retrieves multiple random questions
func (s *Server) GetRandomQuestions(
	ctx context.Context,
	req *connect.Request[pb.GetRandomQuestionsRequest],
) (*connect.Response[pb.GetRandomQuestionsResponse], error) {
	category := req.Msg.GetCategory()
	difficulty := req.Msg.GetDifficulty()
	howManyRounds := req.Msg.GetHowManyRounds()

	log.Printf("GetRandomQuestions request received - category: %s, difficulty: %s, rounds: %d",
		category, difficulty, howManyRounds)

	// Default to 5 questions if not specified
	limit := int(howManyRounds)
	if limit <= 0 {
		limit = 5
	}

	// Query database for random questions
	questions, err := s.repo.GetRandomQuestions(ctx, category, difficulty, limit)
	if err != nil {
		log.Printf("Error fetching random questions: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch random questions"))
	}

	if len(questions) == 0 {
		return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("no questions available"))
	}

	// Convert to proto
	protoQuestions := make([]*pb.Question, len(questions))
	for i, q := range questions {
		protoQuestions[i] = QuestionToProto(&q)
	}

	res := connect.NewResponse(&pb.GetRandomQuestionsResponse{
		Questions: protoQuestions,
	})

	return res, nil
}

// UpdateQuestion updates an existing question
func (s *Server) UpdateQuestion(
	ctx context.Context,
	req *connect.Request[pb.UpdateQuestionRequest],
) (*connect.Response[pb.UpdateQuestionResponse], error) {
	log.Printf("UpdateQuestion request received for ID: %s", req.Msg.GetId())

	// Check if question exists
	existingQuestion, err := s.repo.GetQuestionByID(ctx, req.Msg.GetId())
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("question not found"))
		}
		log.Printf("Error fetching question: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch question"))
	}

	// Update fields
	existingQuestion.Text = req.Msg.GetText()
	existingQuestion.Category = req.Msg.GetCategory()
	existingQuestion.Difficulty = req.Msg.GetDifficulty()
	existingQuestion.Points = req.Msg.GetPoints()

	// Handle picture file upload if provided
	if len(req.Msg.PictureFile) > 0 && s.storage != nil {
		log.Printf("Picture file received for update, size: %d bytes", len(req.Msg.PictureFile))

		// Upload picture to R2
		pictureURL, err := s.storage.UploadImage(ctx, req.Msg.PictureFile, "image/jpeg")
		if err != nil {
			log.Printf("Error uploading picture: %v", err)
			return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to upload picture"))
		}

		existingQuestion.PictureURL = &pictureURL
	}

	// Convert answers from proto
	if req.Msg.GetAnswerOptions() != nil {
		answers := make([]database.Answer, len(req.Msg.GetAnswerOptions().GetAnswers()))
		for i, pa := range req.Msg.GetAnswerOptions().GetAnswers() {
			answers[i] = database.Answer{
				ID:         pa.GetId(),
				QuestionID: existingQuestion.ID,
				Text:       pa.GetText(),
				IsCorrect:  pa.GetIsCorrect(),
			}
		}
		existingQuestion.Answers = answers
	}

	// Convert hints from proto
	if len(req.Msg.GetHints()) > 0 {
		hints := make([]database.Hint, len(req.Msg.GetHints()))
		for i, ph := range req.Msg.GetHints() {
			hints[i] = database.Hint{
				ID:         ph.GetId(),
				QuestionID: existingQuestion.ID,
				Text:       ph.GetText(),
				Order:      i,
			}
		}
		existingQuestion.Hints = hints
	}

	// Update in database
	err = s.repo.UpdateQuestion(ctx, existingQuestion)
	if err != nil {
		log.Printf("Error updating question: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update question"))
	}

	// Convert to proto
	protoQuestion := QuestionToProto(existingQuestion)

	res := connect.NewResponse(&pb.UpdateQuestionResponse{
		Question: protoQuestion,
	})

	return res, nil
}

// DeleteQuestion deletes a question by ID
func (s *Server) DeleteQuestion(
	ctx context.Context,
	req *connect.Request[pb.DeleteQuestionRequest],
) (*connect.Response[pb.DeleteQuestionResponse], error) {
	log.Printf("DeleteQuestion request received for ID: %s", req.Msg.GetId())

	// Delete from database
	err := s.repo.DeleteQuestion(ctx, req.Msg.GetId())
	if err != nil {
		log.Printf("Error deleting question: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete question"))
	}

	res := connect.NewResponse(&pb.DeleteQuestionResponse{
		Success: true,
	})

	return res, nil
}

// CreateQuestion creates a new question
func (s *Server) CreateQuestion(
	ctx context.Context,
	req *connect.Request[pb.CreateQuestionRequest],
) (*connect.Response[pb.CreateQuestionResponse], error) {
	question := req.Msg.GetQuestion()
	log.Printf("CreateQuestion request received: %s", question.GetText())

	// Extract user ID from context
	userID, err := middleware.GetUserIDFromContext(ctx)
	if err != nil {
		log.Printf("Error extracting user ID: %v", err)
		return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("authentication required"))
	}

	// Convert proto to database model
	dbQuestion := ProtoToQuestion(question)

	// Set the creator
	dbQuestion.CreatedBy = userID
	log.Printf("Question will be created by user: %s", userID)

	// Handle picture if provided in the question object
	if question.PictureUrl != nil && *question.PictureUrl != "" && s.storage != nil {
		log.Printf("Picture URL provided in question")
		// Note: If picture data was sent, it would be uploaded here
		// For now, we just store the URL if provided
		dbQuestion.PictureURL = question.PictureUrl
	}

	// Create in database
	err = s.repo.CreateQuestion(ctx, dbQuestion)
	if err != nil {
		log.Printf("Error creating question: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create question"))
	}

	// Convert back to proto
	protoQuestion := QuestionToProto(dbQuestion)

	res := connect.NewResponse(&pb.CreateQuestionResponse{
		Question: protoQuestion,
	})

	return res, nil
}

// GetAnsweredQuestions retrieves all questions answered by a specific user
func (s *Server) GetAnsweredQuestions(
	ctx context.Context,
	req *connect.Request[pb.GetAnsweredQuestionsRequest],
) (*connect.Response[pb.GetAnsweredQuestionsResponse], error) {
	log.Printf("GetAnsweredQuestions request received for user: %s", req.Msg.GetUserId())

	// Query database for user's answered questions
	questions, err := s.repo.GetAnsweredQuestions(ctx, req.Msg.GetUserId())
	if err != nil {
		log.Printf("Error fetching answered questions: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch answered questions"))
	}

	// Convert to proto
	protoQuestions := make([]*pb.Question, len(questions))
	for i, q := range questions {
		protoQuestions[i] = QuestionToProto(&q)
	}

	res := connect.NewResponse(&pb.GetAnsweredQuestionsResponse{
		Questions: protoQuestions,
	})

	return res, nil
}

// CheckAnswer validates if the provided answer is correct for the question
func (s *Server) CheckAnswer(
	ctx context.Context,
	req *connect.Request[pb.CheckAnswerRequest],
) (*connect.Response[pb.CheckAnswerResponse], error) {
	log.Printf("CheckAnswer request received for question: %s, answer: %s",
		req.Msg.GetQuestionId(), req.Msg.GetAnswerId())

	// Check answer against database
	isCorrect, err := s.repo.CheckAnswer(ctx, req.Msg.GetQuestionId(), req.Msg.GetAnswerId())
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, connect.NewError(connect.CodeNotFound, fmt.Errorf("answer not found"))
		}
		log.Printf("Error checking answer: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to check answer"))
	}

	res := connect.NewResponse(&pb.CheckAnswerResponse{
		IsCorrect: isCorrect,
	})

	return res, nil
}
