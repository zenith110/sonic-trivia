package middleware

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"connectrpc.com/connect"
	"github.com/golang-jwt/jwt/v5"
)

// ContextKey is a type for context keys
type ContextKey string

const (
	// UserIDKey is the context key for user ID
	UserIDKey ContextKey = "user_id"
	// EmailKey is the context key for email
	EmailKey ContextKey = "email"
)

// AuthInterceptor creates a Connect interceptor for JWT authentication
func AuthInterceptor() connect.UnaryInterceptorFunc {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key-change-this-in-production"
		log.Printf("Warning: Using default JWT secret. Set JWT_SECRET environment variable in production!")
	}

	interceptor := func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
			// Get the authorization header
			authHeader := req.Header().Get("Authorization")

			// If no auth header, continue without authentication
			// (some endpoints like login/signup don't require auth)
			if authHeader == "" {
				return next(ctx, req)
			}

			// Extract token from "Bearer <token>" format
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("invalid authorization header format"))
			}

			tokenString := parts[1]

			// Parse and validate the token
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				// Verify signing method
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(jwtSecret), nil
			})

			if err != nil {
				log.Printf("JWT parse error: %v", err)
				return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("invalid token"))
			}

			if !token.Valid {
				return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("invalid token"))
			}

			// Extract claims
			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("invalid token claims"))
			}

			// Extract user ID and email from claims
			userID, ok := claims["user_id"].(string)
			if !ok {
				return nil, connect.NewError(connect.CodeUnauthenticated, fmt.Errorf("user_id not found in token"))
			}

			email, _ := claims["email"].(string)

			// Add user info to context
			ctx = context.WithValue(ctx, UserIDKey, userID)
			ctx = context.WithValue(ctx, EmailKey, email)

			// Continue with the authenticated context
			return next(ctx, req)
		}
	}

	return interceptor
}

// GetUserIDFromContext extracts the user ID from the context
func GetUserIDFromContext(ctx context.Context) (string, error) {
	userID, ok := ctx.Value(UserIDKey).(string)
	if !ok || userID == "" {
		return "", fmt.Errorf("user not authenticated")
	}
	return userID, nil
}

// GetEmailFromContext extracts the email from the context
func GetEmailFromContext(ctx context.Context) (string, error) {
	email, ok := ctx.Value(EmailKey).(string)
	if !ok || email == "" {
		return "", fmt.Errorf("email not found in context")
	}
	return email, nil
}

// RequireAuth is a helper to ensure a user is authenticated
func RequireAuth(ctx context.Context) (string, error) {
	return GetUserIDFromContext(ctx)
}
