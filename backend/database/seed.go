package database

import (
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
)

// SeedDevData seeds the database with development data
func SeedDevData() error {
	if DB == nil {
		return nil
	}

	// Only seed in development mode
	env := os.Getenv("ENVIRONMENT")
	if env != "development" && env != "dev" {
		log.Println("Skipping seed data - not in development mode")
		return nil
	}

	log.Println("Seeding development data...")

	// Check if we already have players
	var count int64
	if err := DB.Model(&Player{}).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		log.Println("Database already has players, skipping seed")
		return nil
	}

	// Create test players with different roles
	players := []Player{
		{
			Username:          "admin",
			Email:             "admin@sonictrivia.com",
			DisplayName:       "Admin User",
			Role:              "admin",
			TotalScore:        1000,
			GamesPlayed:       10,
			QuestionsAnswered: 50,
			CorrectAnswers:    45,
		},
		{
			Username:          "sonic_fan",
			Email:             "sonic@sonictrivia.com",
			DisplayName:       "Sonic Fan",
			Role:              "player",
			TotalScore:        500,
			GamesPlayed:       5,
			QuestionsAnswered: 25,
			CorrectAnswers:    20,
		},
		{
			Username:          "tails_lover",
			Email:             "tails@sonictrivia.com",
			DisplayName:       "Tails Lover",
			Role:              "player",
			TotalScore:        750,
			GamesPlayed:       8,
			QuestionsAnswered: 40,
			CorrectAnswers:    35,
		},
		{
			Username:          "knuckles_master",
			Email:             "knuckles@sonictrivia.com",
			DisplayName:       "Knuckles Master",
			Role:              "player",
			TotalScore:        300,
			GamesPlayed:       3,
			QuestionsAnswered: 15,
			CorrectAnswers:    12,
		},
		{
			Username:          "shadow_edge",
			Email:             "shadow@sonictrivia.com",
			DisplayName:       "Shadow Edge",
			Role:              "player",
			TotalScore:        900,
			GamesPlayed:       9,
			QuestionsAnswered: 45,
			CorrectAnswers:    42,
		},
		{
			Username:          "moderator",
			Email:             "mod@sonictrivia.com",
			DisplayName:       "Moderator",
			Role:              "moderator",
			TotalScore:        600,
			GamesPlayed:       6,
			QuestionsAnswered: 30,
			CorrectAnswers:    27,
		},
	}

	// Hash password for all players (using "password123" as default)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	for i := range players {
		players[i].PasswordHash = string(hashedPassword)
	}

	// Insert players into database
	if err := DB.Create(&players).Error; err != nil {
		return err
	}

	log.Printf("Successfully seeded %d players", len(players))
	log.Println("Development credentials:")
	log.Println("  Admin: admin@sonictrivia.com / password123")
	log.Println("  Moderator: mod@sonictrivia.com / password123")
	log.Println("  Players: sonic@sonictrivia.com, tails@sonictrivia.com, etc. / password123")

	return nil
}
