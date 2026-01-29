package login

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"

	"sonic-trivia/backend/database"
	pb "sonic-trivia/backend/protos"

	"connectrpc.com/connect"
)

// Server implements the LoginService
type Server struct {
	repo      *Repository
	jwtSecret []byte
}

// NewServer creates a new login service server
func NewServer() *Server {
	// Get database connection
	db := database.GetDB()
	if db == nil {
		log.Fatal("Database not initialized")
	}

	// Initialize repository
	repo := NewRepository(db)

	// Get JWT secret from environment
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key-change-this-in-production"
		log.Printf("Warning: Using default JWT secret. Set JWT_SECRET environment variable in production!")
	}

	return &Server{
		repo:      repo,
		jwtSecret: []byte(jwtSecret),
	}
}

// playerToProto converts a database.Player to a pb.Player proto message
func playerToProto(player *database.Player) *pb.Player {
	return &pb.Player{
		Name:                   player.DisplayName,
		Email:                  player.Email,
		TotalPoints:            player.TotalScore,
		TotalSuccessfulAnswers: player.CorrectAnswers,
		TotalAnswers:           player.QuestionsAnswered,
		Role:                   player.Role,
		TotalRings:             player.TotalRings,
	}
}

// generateJWT generates a JWT token for a user
func (s *Server) generateJWT(userID, email, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"role":    role,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

// Login handles user login
func (s *Server) Login(
	ctx context.Context,
	req *connect.Request[pb.LoginRequest],
) (*connect.Response[pb.LoginResponse], error) {
	log.Printf("Login request received for email: %s", req.Msg.GetEmail())

	email := req.Msg.GetEmail()
	password := req.Msg.GetPassword()

	// Validate input
	if email == "" || password == "" {
		return connect.NewResponse(&pb.LoginResponse{
			Error: "Email and password are required",
		}), nil
	}

	// Get user by email
	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return connect.NewResponse(&pb.LoginResponse{
				Error: "Invalid email or password",
			}), nil
		}
		log.Printf("Error fetching user: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to fetch user"))
	}

	// Verify password
	if err := s.repo.VerifyPassword(user.PasswordHash, password); err != nil {
		return connect.NewResponse(&pb.LoginResponse{
			Error: "Invalid email or password",
		}), nil
	}

	// Update last login
	if err := s.repo.UpdateLastLogin(ctx, user.ID); err != nil {
		log.Printf("Warning: Failed to update last login: %v", err)
	}

	// Generate JWT token
	token, err := s.generateJWT(user.ID, user.Email, user.Role)
	if err != nil {
		log.Printf("Error generating JWT: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to generate token"))
	}

	res := connect.NewResponse(&pb.LoginResponse{
		Value: &pb.LoginResponse_Token{
			Token: token,
		},
		Player: playerToProto(user),
	})

	return res, nil
}

// SocialMediaLogin handles social media login
func (s *Server) SocialMediaLogin(
	ctx context.Context,
	req *connect.Request[pb.SocialMediaLoginRequest],
) (*connect.Response[pb.SocialMediaLoginResponse], error) {
	log.Printf("Social media login request received")

	token := req.Msg.GetToken()
	provider := req.Msg.GetProvider()

	// Validate input
	if token == "" || provider == "" {
		return connect.NewResponse(&pb.SocialMediaLoginResponse{
			Error: "Token and provider are required",
		}), nil
	}

	log.Printf("Social media login for provider: %s", provider)

	// Validate the social media token and get user info
	userInfo, err := ValidateSocialToken(token, provider)
	if err != nil {
		log.Printf("Error validating social token: %v", err)
		return connect.NewResponse(&pb.SocialMediaLoginResponse{
			Error: "Invalid token or provider",
		}), nil
	}

	// Create or update user
	user, err := s.repo.CreateOrUpdateSocialUser(ctx, userInfo.Email, userInfo.DisplayName, provider)
	if err != nil {
		log.Printf("Error creating/updating social user: %v", err)
		return connect.NewResponse(&pb.SocialMediaLoginResponse{
			Error: "Failed to authenticate with social provider",
		}), nil
	}

	// Update last login
	if err := s.repo.UpdateLastLogin(ctx, user.ID); err != nil {
		log.Printf("Warning: Failed to update last login: %v", err)
	}

	// Generate JWT token
	jwtToken, err := s.generateJWT(user.ID, user.Email, user.Role)
	if err != nil {
		log.Printf("Error generating JWT: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to generate token"))
	}

	res := connect.NewResponse(&pb.SocialMediaLoginResponse{
		Value: &pb.SocialMediaLoginResponse_ValidatedToken{
			ValidatedToken: jwtToken,
		},
		Player: playerToProto(user),
	})

	return res, nil
}

// SignUp handles user registration
func (s *Server) SignUpUsernameOrEmail(
	ctx context.Context,
	req *connect.Request[pb.SignUpUsernameOrEmailRequest],
) (*connect.Response[pb.SignUpUsernameOrEmailResponse], error) {
	log.Printf("SignUp request received")

	username := req.Msg.GetUsername()
	email := req.Msg.GetEmail()
	password := req.Msg.GetPassword()

	// Validate input
	if username == "" || email == "" || password == "" {
		return connect.NewResponse(&pb.SignUpUsernameOrEmailResponse{
			Error: "Username, email, and password are required",
		}), nil
	}

	// Validate password length
	if len(password) < 8 {
		return connect.NewResponse(&pb.SignUpUsernameOrEmailResponse{
			Error: "Password must be at least 8 characters long",
		}), nil
	}

	// Check if user already exists
	exists, err := s.repo.UserExists(ctx, email, username)
	if err != nil {
		log.Printf("Error checking user existence: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to check user existence"))
	}

	if exists {
		return connect.NewResponse(&pb.SignUpUsernameOrEmailResponse{
			Error: "User with this email or username already exists",
		}), nil
	}

	// Create user
	user, err := s.repo.CreateUser(ctx, username, email, password)
	if err != nil {
		log.Printf("Error creating user: %v", err)
		return connect.NewResponse(&pb.SignUpUsernameOrEmailResponse{
			Error: "Failed to create user account",
		}), nil
	}

	// Generate JWT token
	token, err := s.generateJWT(user.ID, user.Email, user.Role)
	if err != nil {
		log.Printf("Error generating JWT: %v", err)
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to generate token"))
	}

	res := connect.NewResponse(&pb.SignUpUsernameOrEmailResponse{
		Value: &pb.SignUpUsernameOrEmailResponse_Token{
			Token: token,
		},
		Player: playerToProto(user),
	})

	return res, nil
}
