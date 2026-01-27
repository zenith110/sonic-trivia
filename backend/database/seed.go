package database

import (
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
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

	// Seed Sonic characters first
	if err := seedSonicCharacters(); err != nil {
		return err
	}

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
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	// Hash password for all players (using "password123" as default)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
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

	// Unlock default characters for all players
	if err := unlockDefaultCharacters(players); err != nil {
		return err
	}

	return nil
}

// seedSonicCharacters seeds the Sonic characters into the database
func seedSonicCharacters() error {
	// Check if characters already exist
	var count int64
	if err := DB.Model(&SonicCharacter{}).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		log.Println("Sonic characters already exist, skipping seed")
		return nil
	}

	log.Println("Seeding Sonic characters...")

	characters := []SonicCharacter{
		{ID: "sonic", Name: "Sonic the Hedgehog", Description: "The fastest thing alive!", Speed: 100, Power: 60, Technique: 70, Rarity: "legendary", Game: "Sonic Adventure 2", Quote: "Gotta go fast!", Color: "blue"},
		{ID: "tails", Name: "Miles 'Tails' Prower", Description: "Sonic's best friend and mechanical genius", Speed: 70, Power: 50, Technique: 95, Rarity: "epic", Game: "Sonic Adventure 2", Quote: "I can fly if I try!", Color: "yellow"},
		{ID: "knuckles", Name: "Knuckles the Echidna", Description: "Guardian of the Master Emerald", Speed: 60, Power: 100, Technique: 70, Rarity: "epic", Game: "Sonic Adventure 2", Quote: "Here I come, rougher than the rest!", Color: "red"},
		{ID: "shadow", Name: "Shadow the Hedgehog", Description: "The ultimate life form", Speed: 95, Power: 85, Technique: 80, Rarity: "legendary", Game: "Sonic Adventure 2", Quote: "I am the ultimate life form!", Color: "black"},
		{ID: "rouge", Name: "Rouge the Bat", Description: "Treasure hunter and government spy", Speed: 75, Power: 65, Technique: 90, Rarity: "rare", Game: "Sonic Adventure 2", Quote: "A treasure hunter always gets her prize!", Color: "purple"},
		{ID: "amy", Name: "Amy Rose", Description: "Sonic's self-proclaimed girlfriend", Speed: 70, Power: 80, Technique: 60, Rarity: "rare", Game: "Sonic Heroes", Quote: "I'll show you what I'm made of!", Color: "pink"},
		{ID: "cream", Name: "Cream the Rabbit", Description: "A polite young rabbit", Speed: 65, Power: 45, Technique: 85, Rarity: "common", Game: "Sonic Heroes", Quote: "I'll do my best!", Color: "cream"},
		{ID: "big", Name: "Big the Cat", Description: "A large, gentle cat who loves fishing", Speed: 40, Power: 90, Technique: 50, Rarity: "common", Game: "Sonic Adventure", Quote: "Froggy, where are you?", Color: "purple"},
		{ID: "omega", Name: "E-123 Omega", Description: "A powerful robot with a vendetta", Speed: 50, Power: 100, Technique: 75, Rarity: "epic", Game: "Sonic Heroes", Quote: "Worthless consumer models!", Color: "red"},
		{ID: "blaze", Name: "Blaze the Cat", Description: "Princess from another dimension", Speed: 85, Power: 75, Technique: 90, Rarity: "legendary", Game: "Sonic Rush", Quote: "I will protect the Sol Emeralds!", Color: "purple"},
		{ID: "silver", Name: "Silver the Hedgehog", Description: "A hedgehog from the future", Speed: 70, Power: 75, Technique: 95, Rarity: "epic", Game: "Sonic '06", Quote: "It's no use!", Color: "silver"},
		{ID: "espio", Name: "Espio the Chameleon", Description: "A ninja chameleon", Speed: 75, Power: 70, Technique: 90, Rarity: "rare", Game: "Sonic Heroes", Quote: "A ninja's work is never done!", Color: "purple"},
		{ID: "vector", Name: "Vector the Crocodile", Description: "Leader of the Chaotix", Speed: 55, Power: 90, Technique: 60, Rarity: "common", Game: "Sonic Heroes", Quote: "We're Chaotix, and we're here to help!", Color: "green"},
		{ID: "charmy", Name: "Charmy Bee", Description: "An energetic young bee", Speed: 80, Power: 40, Technique: 70, Rarity: "common", Game: "Sonic Heroes", Quote: "Yeah! Let's do it!", Color: "yellow"},
		{ID: "metal-sonic", Name: "Metal Sonic", Description: "A robotic duplicate of Sonic", Speed: 100, Power: 80, Technique: 85, Rarity: "legendary", Game: "Sonic Heroes", Quote: "...", Color: "blue"},
	}

	if err := DB.Create(&characters).Error; err != nil {
		return err
	}

	log.Printf("Successfully seeded %d Sonic characters", len(characters))

	// Seed character abilities
	abilities := []CharacterAbility{
		{CharacterID: "sonic", Name: "Speed up the clock", Description: "Allows Sonic to speed up the timer."},
		{CharacterID: "tails", Name: "Flight", Description: "Tails can fly using his twin tails."},
		{CharacterID: "tails", Name: "Mech Walker", Description: "Pilot a powerful mech suit."},
		{CharacterID: "tails", Name: "Energy Cannon", Description: "Fire energy projectiles at enemies."},
		{CharacterID: "knuckles", Name: "Glide", Description: "Glide through the air using dreadlocks."},
		{CharacterID: "knuckles", Name: "Climb", Description: "Climb walls and ceilings."},
		{CharacterID: "knuckles", Name: "Dig", Description: "Dig through the ground to find treasures."},
		{CharacterID: "shadow", Name: "Chaos Control", Description: "Manipulate time and space."},
		{CharacterID: "shadow", Name: "Chaos Spear", Description: "Launch energy projectiles."},
		{CharacterID: "rouge", Name: "Flight", Description: "Fly using her wings."},
		{CharacterID: "rouge", Name: "Treasure Scope", Description: "Detect hidden treasures."},
		{CharacterID: "amy", Name: "Piko Piko Hammer", Description: "Wield a giant hammer in combat."},
		{CharacterID: "cream", Name: "Ear Flight", Description: "Fly using her large ears."},
		{CharacterID: "cream", Name: "Chao Attack", Description: "Command Cheese to attack enemies."},
		{CharacterID: "big", Name: "Fishing Rod", Description: "Use a fishing rod to catch items."},
		{CharacterID: "omega", Name: "Heavy Machine Gun", Description: "Rapid fire weapon."},
		{CharacterID: "blaze", Name: "Fire Control", Description: "Control and manipulate fire."},
		{CharacterID: "silver", Name: "Psychokinesis", Description: "Move objects with the mind."},
		{CharacterID: "espio", Name: "Invisibility", Description: "Turn invisible to enemies."},
		{CharacterID: "vector", Name: "Breath Fire", Description: "Exhale a stream of fire."},
		{CharacterID: "charmy", Name: "Flight", Description: "Fly freely through the air."},
		{CharacterID: "metal-sonic", Name: "Maximum Overdrive", Description: "Extreme speed boost."},
	}

	if err := DB.Create(&abilities).Error; err != nil {
		return err
	}

	log.Printf("Successfully seeded %d character abilities", len(abilities))
	return nil
}

// unlockDefaultCharacters unlocks Sonic, Tails, and Knuckles for all players by default
// Admin users get all characters unlocked
func unlockDefaultCharacters(players []Player) error {
	log.Println("Unlocking default characters for players...")

	for _, player := range players {
		if err := UnlockCharactersForPlayer(DB, &player); err != nil {
			return err
		}
	}

	log.Println("Successfully unlocked characters for all players")
	return nil
}

// UnlockCharactersForPlayer unlocks characters for a player
// Admin users get all characters, regular players get sonic, tails, and knuckles
func UnlockCharactersForPlayer(db *gorm.DB, player *Player) error {
	var charactersToUnlock []string

	if player.Role == "admin" {
		// Get all character IDs for admin users
		var allCharacters []SonicCharacter
		if err := db.Select("id").Find(&allCharacters).Error; err != nil {
			return err
		}

		for _, char := range allCharacters {
			charactersToUnlock = append(charactersToUnlock, char.ID)
		}
		log.Printf("Unlocking all %d characters for admin user: %s", len(charactersToUnlock), player.Username)
	} else {
		// Default characters for regular players
		charactersToUnlock = []string{"sonic", "tails", "knuckles"}
	}

	// Unlock the characters
	for _, charID := range charactersToUnlock {
		playerChar := PlayerCharacter{
			PlayerID:    player.ID,
			CharacterID: charID,
		}
		if err := db.Create(&playerChar).Error; err != nil {
			return err
		}
	}

	// Set Sonic as the default selected character
	player.SelectedCharacterID = "sonic"
	if err := db.Save(player).Error; err != nil {
		return err
	}

	return nil
}

// UnlockAllCharactersForPlayer unlocks all characters for a specific player (admin utility)
func UnlockAllCharactersForPlayer(db *gorm.DB, playerID string) error {
	// Get all character IDs
	var allCharacters []SonicCharacter
	if err := db.Select("id").Find(&allCharacters).Error; err != nil {
		return err
	}

	// Get already unlocked characters
	var unlockedChars []PlayerCharacter
	if err := db.Where("player_id = ?", playerID).Find(&unlockedChars).Error; err != nil {
		return err
	}

	// Create a map of already unlocked character IDs
	unlockedMap := make(map[string]bool)
	for _, uc := range unlockedChars {
		unlockedMap[uc.CharacterID] = true
	}

	// Unlock any characters that aren't already unlocked
	for _, char := range allCharacters {
		if !unlockedMap[char.ID] {
			playerChar := PlayerCharacter{
				PlayerID:    playerID,
				CharacterID: char.ID,
			}
			if err := db.Create(&playerChar).Error; err != nil {
				return err
			}
		}
	}

	log.Printf("Successfully unlocked all characters for player: %s", playerID)
	return nil
}
