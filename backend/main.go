package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	"connectrpc.com/connect"

	"sonic-trivia/backend/database"
	"sonic-trivia/backend/middleware"
	"sonic-trivia/backend/protos/protosconnect"
	"sonic-trivia/backend/services/approvalqueue"
	"sonic-trivia/backend/services/guessthatsong"
	"sonic-trivia/backend/services/leaderboard"
	"sonic-trivia/backend/services/login"
	"sonic-trivia/backend/services/player"
	"sonic-trivia/backend/services/trivia"
)

func main() {
	// Initialize database
	log.Println("Initializing database connection...")
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

	// Run migrations
	log.Println("Running database migrations...")
	if err := database.AutoMigrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Seed development data
	if err := database.SeedDevData(); err != nil {
		log.Printf("Warning: Failed to seed development data: %v", err)
	}

	port := os.Getenv("GRPC_PORT")
	if port == "" {
		port = "8080"
		log.Printf("GRPC_PORT not set, defaulting to %s", port)
	}

	// Configure CORS
	corsConfig := middleware.DefaultCORSConfig()

	// Allow specific origins from environment variable
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins != "" {
		// Split by comma for multiple origins
		corsConfig.AllowedOrigins = []string{}
		origins := strings.Split(allowedOrigins, ",")
		for _, origin := range origins {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				corsConfig.AllowedOrigins = append(corsConfig.AllowedOrigins, origin)
			}
		}
		log.Printf("CORS allowed origins: %v", corsConfig.AllowedOrigins)
	} else {
		log.Printf("ALLOWED_ORIGINS not set, using default: %v", corsConfig.AllowedOrigins)
	}

	corsMiddleware := middleware.CORS(corsConfig)

	// Create service instances
	loginServer := login.NewServer()
	leaderboardServer := leaderboard.NewServer()
	triviaServer := trivia.NewServer()
	guessThatSongServer := guessthatsong.NewServer()
	playerServer := player.NewServer()
	approvalQueueServer := approvalqueue.NewServer()

	// Create authentication interceptor
	authInterceptor := middleware.AuthInterceptor()
	interceptors := connect.WithInterceptors(authInterceptor)

	// Create a new ServeMux
	mux := http.NewServeMux()

	// Register Connect handlers with authentication middleware
	loginPath, loginHandler := protosconnect.NewLoginServiceHandler(loginServer)
	mux.Handle(loginPath, loginHandler)
	log.Printf("Registered LoginService at %s", loginPath)

	leaderboardPath, leaderboardHandler := protosconnect.NewLeaderboardServiceHandler(leaderboardServer, interceptors)
	mux.Handle(leaderboardPath, leaderboardHandler)
	log.Printf("Registered LeaderboardService at %s", leaderboardPath)

	triviaPath, triviaHandler := protosconnect.NewTriviaServiceHandler(triviaServer, interceptors)
	mux.Handle(triviaPath, triviaHandler)
	log.Printf("Registered TriviaService at %s", triviaPath)

	guessThatSongPath, guessThatSongHandler := protosconnect.NewGuessThatSongServiceHandler(guessThatSongServer, interceptors)
	mux.Handle(guessThatSongPath, guessThatSongHandler)
	log.Printf("Registered GuessThatSongService at %s", guessThatSongPath)

	playerPath, playerHandler := protosconnect.NewPlayerServiceHandler(playerServer, interceptors)
	mux.Handle(playerPath, playerHandler)
	log.Printf("Registered PlayerService at %s", playerPath)

	approvalQueuePath, approvalQueueHandler := protosconnect.NewApprovalQueueServiceHandler(approvalQueueServer, interceptors)
	mux.Handle(approvalQueuePath, approvalQueueHandler)
	log.Printf("Registered ApprovalQueueService at %s", approvalQueuePath)

	// Add a health check endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Add a root endpoint with service info
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)
	})

	// Create HTTP server with h2c (HTTP/2 Cleartext) support
	// This allows HTTP/2 without TLS, which Connect can use
	// Wrap with CORS middleware
	addr := fmt.Sprintf(":%s", port)
	server := &http.Server{
		Addr:    addr,
		Handler: corsMiddleware(h2c.NewHandler(mux, &http2.Server{})),
	}

	log.Printf("Connect RPC server listening on %s", addr)
	log.Printf("Health check available at http://localhost%s/health", addr)

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
