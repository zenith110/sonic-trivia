module sonic-trivia/backend/services/login

go 1.24.0

require (
	connectrpc.com/connect v1.19.1
	github.com/golang-jwt/jwt/v5 v5.3.0
	golang.org/x/crypto v0.46.0
	gorm.io/gorm v1.31.1
	sonic-trivia/backend/database v0.0.0-00010101000000-000000000000
	sonic-trivia/backend/protos v0.0.0-00010101000000-000000000000
)

require (
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/pgx/v5 v5.6.0 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	golang.org/x/sync v0.19.0 // indirect
	golang.org/x/text v0.32.0 // indirect
	google.golang.org/protobuf v1.36.11 // indirect
	gorm.io/driver/postgres v1.6.0 // indirect
)

replace sonic-trivia/backend/protos => ../../protos

replace sonic-trivia/backend/database => ../../database
