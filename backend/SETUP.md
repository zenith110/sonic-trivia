# Sonic Trivia Backend Setup Guide

## Overview

This document describes the database and storage setup for the Sonic Trivia backend application.

## Architecture

The backend has been updated to use:
- **PostgreSQL** with GORM for database operations
- **Cloudflare R2** (S3-compatible) for file storage (audio and images)
- **JWT** for authentication
- **Connect RPC** for service communication

## Project Structure

```
backend/
├── database/
│   ├── database.go       # Database connection and initialization
│   └── models.go         # Database models (Question, Song, User, etc.)
├── storage/
│   └── r2.go            # Cloudflare R2/S3 storage client
├── services/
│   ├── trivia/
│   │   ├── trivia.go    # Trivia service implementation
│   │   └── repository.go # Trivia database operations
│   ├── guessthatsong/
│   │   ├── guessthatsong.go # Song service implementation
│   │   └── repository.go    # Song database operations
│   ├── login/
│   │   ├── login.go     # Authentication service
│   │   └── repository.go # User authentication operations
│   └── leaderboard/
│       ├── leaderboard.go # Leaderboard service
│       └── repository.go  # Leaderboard database operations
└── main.go              # Application entry point
```

## Environment Variables

### Database Configuration

```bash
# PostgreSQL connection
DB_HOST=localhost          # Database host
DB_PORT=5432              # Database port
DB_USER=postgres          # Database user
DB_PASSWORD=postgres      # Database password
DB_NAME=sonic_trivia      # Database name
DB_SSLMODE=disable        # SSL mode (disable/require/verify-full)
```

### Storage Configuration (Cloudflare R2)

```bash
# R2 credentials
R2_ACCOUNT_ID=your_account_id           # Your Cloudflare account ID
R2_ACCESS_KEY_ID=your_access_key       # R2 access key
R2_SECRET_ACCESS_KEY=your_secret_key   # R2 secret access key
R2_BUCKET_NAME=sonic-trivia            # Your R2 bucket name
R2_PUBLIC_URL=https://cdn.example.com  # Optional: Public URL for files
```

### Authentication

```bash
# JWT configuration
JWT_SECRET=your-secret-key-change-this-in-production  # JWT signing secret
```

### Server Configuration

```bash
# Server port
GRPC_PORT=8080  # Default: 8080
```

## Database Setup

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Docker:**
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sonic_trivia \
  -p 5432:5432 \
  postgres:15
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE sonic_trivia;

# Create user (optional)
CREATE USER sonic_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sonic_trivia TO sonic_user;
```

### 3. Run Migrations

The application automatically runs migrations on startup. Database tables will be created automatically:

- `questions` - Trivia questions
- `answers` - Answers for questions
- `hints` - Hints for questions
- `songs` - Songs for "Guess That Song" mode
- `song_hints` - Hints for songs
- `users` - User accounts
- `user_answers` - User answer history
- `leaderboard_entries` - Leaderboard records

## Cloudflare R2 Setup

### 1. Create R2 Bucket

1. Log in to Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Create a new bucket (e.g., `sonic-trivia`)
4. Configure public access if needed

### 2. Generate API Tokens

1. Go to R2 settings
2. Create API token with:
   - Object Read & Write permissions
   - Bucket access to your bucket
3. Save the Access Key ID and Secret Access Key

### 3. Configure Public Access (Optional)

To serve files publicly:
1. Set up a custom domain in R2 settings
2. Add the domain to `R2_PUBLIC_URL` environment variable

## Running the Application

### 1. Install Dependencies

```bash
cd backend
go mod tidy
```

### 2. Set Environment Variables

Create a `.env` file or export variables:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=sonic_trivia
export DB_SSLMODE=disable

export R2_ACCOUNT_ID=your_account_id
export R2_ACCESS_KEY_ID=your_access_key
export R2_SECRET_ACCESS_KEY=your_secret_key
export R2_BUCKET_NAME=sonic-trivia

export JWT_SECRET=your-secret-key
export GRPC_PORT=8080
```

### 3. Build and Run

```bash
# Build
go build -o sonic-trivia-server

# Run
./sonic-trivia-server
```

Or run directly:

```bash
go run main.go
```

### 4. Verify Setup

Check that the server is running:

```bash
curl http://localhost:8080/health
# Should return: OK
```

View available services:

```bash
curl http://localhost:8080/
```

## Database Models

### Question
- Stores trivia questions with answers and hints
- Optional picture URL for visual questions
- Points value for scoring

### Song
- Stores song information for "Guess That Song" mode
- Audio file URL required
- Optional picture URL
- Configurable plays per round and clip duration

### User
- User accounts with authentication
- Tracks total score, games played, and statistics
- Password hashing with bcrypt

### UserAnswer
- Records user's answer history
- Tracks correctness and points earned
- Used for statistics and leaderboard calculations

### LeaderboardEntry
- Stores leaderboard snapshots for different periods
- Supports daily, weekly, monthly, and all-time leaderboards

## API Services

### TriviaService
- `CreateQuestion` - Create new trivia question (with optional picture)
- `GetQuestion` - Retrieve question by ID
- `GetRandomQuestion` - Get random question
- `UpdateQuestion` - Update existing question (with optional picture upload)
- `DeleteQuestion` - Delete question
- `GetAnsweredQuestions` - Get user's answered questions
- `CheckAnswer` - Validate answer correctness

### GuessThatSongService
- `CreateSong` - Create new song challenge (with optional picture)
- `GetSong` - Retrieve song by ID
- `GetRandomSong` - Get random song (optionally by category)
- `UpdateSong` - Update existing song (with optional picture)
- `DeleteSong` - Delete song
- `SearchSong` - Search songs by title, artist, or album

### LoginService
- `Login` - Authenticate user with email/password
- `SignUpUsernameOrEmail` - Register new user
- `SocialMediaLogin` - OAuth social login (placeholder)

### LeaderboardService
- `UpdateRoomLeaderboard` - Update room-specific scores
- `PaginateRoomLeaderboard` - Get paginated room leaderboard
- `UpdateGlobalLeaderboard` - Update global scores
- `PaginateGlobalLeaderboard` - Get paginated global leaderboard

## File Upload Flow

### Picture Upload (Questions & Songs)

1. Frontend sends picture file data in `picture_file` field (bytes)
2. Backend uploads to R2 storage in `images/` folder
3. R2 returns public URL
4. URL stored in database as `picture_url`
5. Frontend fetches pictures using the URL

### Audio Upload (Songs)

1. Frontend sends audio file data
2. Backend uploads to R2 storage in `audio/` folder
3. R2 returns public URL
4. URL stored in database as `audio_url`
5. Frontend streams audio using the URL

## Security Notes

1. **JWT Secret**: Use a strong, random secret in production
2. **Database Password**: Use strong passwords and restrict access
3. **R2 Credentials**: Keep API keys secure, never commit to version control
4. **CORS**: Configure appropriate CORS policies for production
5. **Rate Limiting**: Implement rate limiting for public endpoints
6. **Input Validation**: All user inputs are validated before database operations

## Development Tips

### Testing Database Connection

```go
package main

import (
    "sonic-trivia/backend/database"
)

func main() {
    if err := database.InitDB(); err != nil {
        panic(err)
    }
    defer database.CloseDB()
    
    db := database.GetDB()
    sqlDB, _ := db.DB()
    if err := sqlDB.Ping(); err != nil {
        panic(err)
    }
    println("Database connected successfully!")
}
```

### Testing R2 Upload

```go
package main

import (
    "context"
    "sonic-trivia/backend/storage"
)

func main() {
    client, err := storage.NewR2Client()
    if err != nil {
        panic(err)
    }
    
    testData := []byte("Hello, R2!")
    url, err := client.UploadFile(context.Background(), testData, "text/plain", "test")
    if err != nil {
        panic(err)
    }
    println("File uploaded:", url)
}
```

## Troubleshooting

### Database Connection Issues

- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in environment variables
- Check firewall rules allow port 5432
- Review database logs: `/var/log/postgresql/`

### R2 Upload Failures

- Verify R2 credentials are correct
- Check bucket name matches configuration
- Ensure bucket has write permissions
- Review Cloudflare R2 dashboard for errors

### Migration Errors

- Check database user has CREATE/ALTER permissions
- Review error logs for specific migration failures
- Manually verify table creation: `\dt` in psql

## Production Deployment

### Recommended Configuration

1. Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
2. Enable SSL for database connections (`DB_SSLMODE=require`)
3. Use environment-specific JWT secrets
4. Enable R2 bucket versioning for backups
5. Set up database backups
6. Configure monitoring and logging
7. Use connection pooling for database
8. Implement caching layer (Redis) for leaderboards

### Health Checks

The server provides a health endpoint at `/health` that returns `OK` when the service is healthy.

### Monitoring

Monitor these metrics:
- Database connection pool usage
- R2 upload success/failure rates
- API response times
- JWT token validation failures
- Database query performance

## Next Steps

1. Configure all environment variables
2. Run database migrations
3. Set up R2 bucket and credentials
4. Test API endpoints
5. Implement frontend integration
6. Set up monitoring and logging
7. Deploy to production

## Support

For issues or questions:
- Check logs: Application logs provide detailed error information
- Database logs: Review PostgreSQL logs for database issues
- R2 Dashboard: Check Cloudflare dashboard for storage issues