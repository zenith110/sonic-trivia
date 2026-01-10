package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	"connectrpc.com/connect"

	"sonic-trivia/backend/database"
	"sonic-trivia/backend/middleware"
	"sonic-trivia/backend/protos/protosconnect"
	"sonic-trivia/backend/services/guessthatsong"
	"sonic-trivia/backend/services/leaderboard"
	"sonic-trivia/backend/services/login"
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

	port := os.Getenv("GRPC_PORT")
	if port == "" {
		port = "8080"
		log.Printf("GRPC_PORT not set, defaulting to %s", port)
	}

	// Create service instances
	loginServer := login.NewServer()
	leaderboardServer := leaderboard.NewServer()
	triviaServer := trivia.NewServer()
	guessThatSongServer := guessthatsong.NewServer()

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

	// Add a health check endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Add a root endpoint with service info
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Sonic Trivia Connect RPC Server\n\n")
		fmt.Fprintf(w, "Available services:\n")
		fmt.Fprintf(w, "- %s\n", loginPath)
		fmt.Fprintf(w, "- %s\n", leaderboardPath)
		fmt.Fprintf(w, "- %s\n", triviaPath)
		fmt.Fprintf(w, "- %s\n", guessThatSongPath)
		fmt.Fprintf(w, "\nHealth check: /health\n")
	})

	// Create HTTP server with h2c (HTTP/2 Cleartext) support
	// This allows HTTP/2 without TLS, which Connect can use
	addr := fmt.Sprintf(":%s", port)
	server := &http.Server{
		Addr:    addr,
		Handler: h2c.NewHandler(mux, &http2.Server{}),
	}

	log.Printf("Connect RPC server listening on %s", addr)
	log.Printf("Health check available at http://localhost%s/health", addr)

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
