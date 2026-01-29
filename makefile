# Variables
PROTO_DIR = protos
GO_OUT = backend/protos
TS_OUT = frontend/src/generated
GO_BIN = $(shell go env GOPATH)/bin





# Targets
.PHONY: all export-protos export-protos-backend export-protos-frontend clean help install-deps \
	docker-build docker-up docker-down docker-logs docker-clean docker-rebuild docker-ps \
	docker-backend-logs docker-db-shell docker-db-backup docker-db-reset docker-fresh-start

# Default target
all: export-protos

# =================================
# Proto Generation Commands
# =================================

# Install required protobuf plugins
install-deps:
	@echo "Checking for buf CLI..."
	@command -v buf >/dev/null 2>&1 || { \
		echo "buf not found, installing..."; \
		if command -v go >/dev/null 2>&1; then \
			echo "Installing buf via Go..."; \
			go install github.com/bufbuild/buf/cmd/buf@latest; \
		elif command -v bun >/dev/null 2>&1; then \
			echo "Installing buf via Bun..."; \
			bun install -g @bufbuild/buf; \
		else \
			echo "Error: Neither Go nor Bun found. Please install one of them first."; \
			exit 1; \
		fi; \
	}
	@echo "Installing protobuf Go plugins..."
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest
	@echo "Go plugins installation complete!"
	@echo ""
	@echo "Installing frontend dependencies..."
	cd frontend && bun install
	@echo "Installation complete!"

# Export all proto files for both backend and frontend
export-protos: export-protos-backend export-protos-frontend

# Export proto files for backend (Go) using buf
export-protos-backend:
	@echo "Compiling proto files for backend (Go)..."
	@cd backend && PATH="$(GO_BIN):$$PATH" buf generate
	@echo "Creating go.mod files..."
	@printf "module sonic-trivia/backend/protos\n\ngo 1.23\n\nrequire google.golang.org/protobuf v1.36.11\n" > $(GO_OUT)/go.mod
	@printf "module sonic-trivia/backend/protos/protosconnect\n\ngo 1.23\n\nrequire (\n\tconnectrpc.com/connect v1.19.1\n\tsonic-trivia/backend/protos v0.0.0-00010101000000-000000000000\n)\n\nrequire google.golang.org/protobuf v1.36.11 // indirect\n\nreplace sonic-trivia/backend/protos => ...\n" > $(GO_OUT)/protosconnect/go.mod
	@echo "Backend proto compilation complete! Generated files are in $(GO_OUT)"

# Export proto files for frontend (TypeScript) using buf
export-protos-frontend:
	@echo ""
	@echo "Compiling proto files for frontend (TypeScript)..."
	@powershell -Command "if (-not (Test-Path '$(TS_OUT)')) { New-Item -ItemType Directory -Path '$(TS_OUT)' -Force | Out-Null }"
	@powershell -Command "Set-Content -Path '$(TS_OUT)/.gitkeep' -Value '# Generated files'"
	@cd frontend && PATH="$$PATH:./node_modules/.bin" buf generate
	@echo "Frontend proto compilation complete! Generated files are in $(TS_OUT)"

# Clean generated proto files
clean:
	@echo "Cleaning generated proto files..."
	@rm -f $(GO_OUT)/*.pb.go || true
	@rm -f $(GO_OUT)/protosconnect/*.connect.go || true
	@rm -f $(GO_OUT)/go.mod || true
	@rm -f $(GO_OUT)/protosconnect/go.mod || true
	@rm -rf $(TS_OUT) || true
	@echo "Clean complete!"

# =================================
# Docker Commands
# =================================

# Build Docker images
docker-build:
	@echo "Building Docker images..."
	docker-compose build

# Start all services
docker-up:
	@echo "Starting services..."
	docker-compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "   Backend:  http://localhost:8080"
	@echo "   Health:   http://localhost:8080/health"
	@echo "   pgAdmin:  http://localhost:5050"
	@echo ""
	@echo "Use 'make docker-logs' to view logs"
dev-db-reset: ## Reset database with docker-compose (remove volume and restart)
	@echo "🐳 Resetting database with docker-compose..."
	docker-compose down -v --remove-orphans
	@echo "Removing database volume..."
	docker volume rm sonic-trivia_postgres_data 2>/dev/null || echo "Volume already removed"
	@echo "Starting fresh services..."
	docker-compose up --build
	@echo "✅ Database reset complete"
# Stop all services
docker-down:
	@echo "Stopping services..."
	docker-compose down
	@echo "Services stopped!"

# View all logs
docker-logs:
	@echo "Following logs (Ctrl+C to exit)..."
	docker-compose logs -f

# View backend logs only
docker-backend-logs:
	@echo "Following backend logs (Ctrl+C to exit)..."
	docker-compose logs -f backend

# View service status
docker-ps:
	@echo "Service status:"
	@docker-compose ps

# Rebuild and restart backend container
docker-rebuild:
	@echo "Rebuilding backend container..."
	docker-compose build backend
	docker-compose up -d backend
	@echo "✅ Backend rebuilt and restarted!"
	@echo "View logs with: make docker-backend-logs"

# Clean up containers, volumes, and images
docker-clean:
	@echo "⚠️  WARNING: This will remove all containers, volumes, and images!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	@echo "Cleaning up Docker resources..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Docker cleanup complete!"

# =================================
# Database Commands
# =================================

# Open PostgreSQL shell
docker-db-shell:
	@echo "Opening PostgreSQL shell..."
	@echo "Type \\q to exit"
	@docker-compose exec postgres psql -U sonic_trivia -d sonic_trivia

# Backup database
docker-db-backup:
	@echo "Backing up database..."
	@mkdir -p backups
	@docker-compose exec postgres pg_dump -U sonic_trivia sonic_trivia > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backed up to backups/ directory"

# Reset database (drop and recreate)
docker-db-reset:
	@echo "⚠️  WARNING: This will DELETE ALL DATA in the database!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	@echo "Resetting database..."
	@docker-compose exec postgres psql -U sonic_trivia -c "DROP DATABASE IF EXISTS sonic_trivia;"
	@docker-compose exec postgres psql -U sonic_trivia -c "CREATE DATABASE sonic_trivia;"
	@echo "✅ Database reset complete!"
	@echo "Restarting backend to run migrations..."
	@docker-compose restart backend
	@sleep 3
	@echo "✅ Migrations complete! Database is ready."

# =================================
# Combined Commands
# =================================

# Fresh start: stop, reset DB, rebuild, and start
docker-fresh-start:
	@echo "🚀 Starting fresh deployment..."
	@echo ""
	@echo "Step 1/4: Stopping services..."
	@$(MAKE) docker-down
	@echo ""
	@echo "Step 2/4: Resetting database..."
	@docker-compose up -d postgres
	@sleep 5
	@docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS sonic_trivia;"
	@docker-compose exec postgres psql -U postgres -c "CREATE DATABASE sonic_trivia OWNER sonic_trivia;"
	@echo ""
	@echo "Step 3/4: Rebuilding backend container..."
	@docker-compose build backend
	@echo ""
	@echo "Step 4/4: Starting all services..."
	@docker-compose up -d
	@sleep 5
	@echo ""
	@echo "✅ Fresh start complete!"
	@echo ""
	@echo "Services:"
	@echo "   Backend:  http://localhost:8080"
	@echo "   Health:   http://localhost:8080/health"
	@echo "   pgAdmin:  http://localhost:5050"
	@echo ""
	@echo "Check status: make docker-ps"
	@echo "View logs:    make docker-logs"

# Quick restart: rebuild backend and restart
docker-quick-restart:
	@echo "Quick restarting backend..."
	@$(MAKE) docker-rebuild
	@$(MAKE) docker-backend-logs

# =================================
# Help
# =================================

help:
	@echo "Sonic Trivia - Available Make Targets"
	@echo "======================================"
	@echo ""
	@echo "Proto Generation:"
	@echo "  make install-deps           - Install required Go/npm dependencies"
	@echo "  make export-protos          - Compile all proto files (backend + frontend)"
	@echo "  make export-protos-backend  - Compile proto files for backend only"
	@echo "  make export-protos-frontend - Compile proto files for frontend only"
	@echo "  make clean                  - Remove all generated proto files"
	@echo ""
	@echo "Docker - Basic:"
	@echo "  make docker-build           - Build Docker images"
	@echo "  make docker-up              - Start all services"
	@echo "  make docker-down            - Stop all services"
	@echo "  make docker-ps              - Show service status"
	@echo "  make docker-logs            - View all logs (live)"
	@echo "  make docker-backend-logs    - View backend logs only (live)"
	@echo ""
	@echo "Docker - Advanced:"
	@echo "  make docker-rebuild         - Rebuild and restart backend"
	@echo "  make docker-quick-restart   - Rebuild backend and show logs"
	@echo "  make docker-clean           - Clean up all Docker resources (⚠️  destructive)"
	@echo ""
	@echo "Database:"
	@echo "  make docker-db-shell        - Open PostgreSQL shell"
	@echo "  make docker-db-backup       - Backup database to backups/ folder"
	@echo "  make docker-db-reset        - Reset database (⚠️  deletes all data)"
	@echo ""
	@echo "Combined:"
	@echo "  make docker-fresh-start     - Stop, reset DB, rebuild, start (⚠️  full reset)"
	@echo ""
	@echo "Common Workflows:"
	@echo "  First time setup:    make docker-up"
	@echo "  After code changes:  make docker-rebuild"
	@echo "  Fresh development:   make docker-fresh-start"
	@echo "  View backend logs:   make docker-backend-logs"
	@echo ""
	@echo "For detailed Docker documentation, see DOCKER_SETUP.md"
