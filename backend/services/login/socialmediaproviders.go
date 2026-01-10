package login

import (
	"fmt"
	"log"
	pb "sonic-trivia/backend/protos"
)

// GoogleLogin validates a Google OAuth token and returns user information
func GoogleLogin(token string, provider string) (*pb.SocialUserInfo, error) {
	log.Printf("Google login validation for token")

	// Validate input
	if token == "" {
		return nil, fmt.Errorf("token is required")
	}

	// TODO: Implement actual OAuth token verification with Google
	// For now, this is a placeholder that assumes the token is valid
	// In production, you would:
	// 1. Verify the token with Google's OAuth API
	// 2. Extract the user's email and name from the verified token
	// 3. Return that information

	// Mock user info from Google
	// In production, fetch this from Google's OAuth API after token verification
	userInfo := &pb.SocialUserInfo{
		Email:       "user@example.com", // Would come from Google token validation
		DisplayName: "Google User",      // Would come from Google token validation
		Provider:    provider,
	}

	log.Printf("Google login successful for email: %s", userInfo.Email)

	return userInfo, nil
}

// FacebookLogin validates a Facebook OAuth token and returns user information
func FacebookLogin(token string, provider string) (*pb.SocialUserInfo, error) {
	log.Printf("Facebook login validation for token")

	// Validate input
	if token == "" {
		return nil, fmt.Errorf("token is required")
	}

	// TODO: Implement actual OAuth token verification with Facebook
	// Similar to GoogleLogin, this would verify the token with Facebook's API

	userInfo := &pb.SocialUserInfo{
		Email:       "user@example.com",
		DisplayName: "Facebook User",
		Provider:    provider,
	}

	log.Printf("Facebook login successful for email: %s", userInfo.Email)

	return userInfo, nil
}

// ValidateSocialToken validates a social media OAuth token and returns user information
func ValidateSocialToken(token string, provider string) (*pb.SocialUserInfo, error) {
	switch provider {
	case "google":
		return GoogleLogin(token, provider)
	case "facebook":
		return FacebookLogin(token, provider)
	default:
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}
}
