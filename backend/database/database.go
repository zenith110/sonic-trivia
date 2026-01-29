package database

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB initializes the database connection
func InitDB() error {
	var dsn string

	// Try to use DATABASE_URL first
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		dsn = databaseURL
		log.Println("Using DATABASE_URL for database connection")
	} else {
		// Fall back to individual environment variables
		log.Println("DATABASE_URL not found, using individual DB environment variables")

		host := os.Getenv("DB_HOST")
		if host == "" {
			host = "postgres"
		}

		port := os.Getenv("DB_PORT")
		if port == "" {
			port = "5432"
		}

		user := os.Getenv("DB_USER")
		if user == "" {
			user = "sonic_trivia"
		}

		password := os.Getenv("DB_PASSWORD")
		if password == "" {
			password = "sonic_trivia_pass"
		}

		dbname := os.Getenv("DB_NAME")
		if dbname == "" {
			dbname = "sonic_trivia"
		}

		sslmode := os.Getenv("DB_SSLMODE")
		if sslmode == "" {
			sslmode = "disable"
		}

		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
			host, user, password, dbname, port, sslmode)
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection established")
	return nil
}

// AutoMigrate runs database migrations
func AutoMigrate() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	log.Println("Running database migrations...")
	err := DB.AutoMigrate(
		&Player{},
		&QuestionCollection{},
		&SongCollection{},
		&Question{},
		&Answer{},
		&Hint{},
		&Song{},
		&SongHint{},
		&SonicCharacter{},
		&CharacterAbility{},
		&PlayerCharacter{},
		&Friendship{},
		&PlayerAnswer{},
		&LeaderboardEntry{},
	)

	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// CloseDB closes the database connection
func CloseDB() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
