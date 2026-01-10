# Variables
PROTO_DIR = protos
GO_OUT = backend/protos
TS_OUT = frontend/src/generated
GO_BIN = $(shell go env GOPATH)/bin

# Targets
.PHONY: all export-protos export-protos-backend export-protos-frontend clean help install-deps

# Default target
all: export-protos

# Install required protobuf plugins
install-deps:
	@echo "Installing protobuf Go plugins..."
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest
	@echo "Go plugins installation complete!"
	@echo ""
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installation complete!"

# Export all proto files for both backend and frontend
export-protos: export-protos-backend export-protos-frontend

# Export proto files for backend (Go) using buf
export-protos-backend:
	@echo "Compiling proto files for backend (Go)..."
	@mkdir -p $(GO_OUT)
	@mkdir -p $(GO_OUT)/protosconnect
	@cd backend && PATH="$(GO_BIN):$$PATH" buf generate
	@echo "Creating go.mod files..."
	@echo "module sonic-trivia/backend/protos\n\ngo 1.25.5\n\nrequire google.golang.org/protobuf v1.36.11" > $(GO_OUT)/go.mod
	@echo "module sonic-trivia/backend/protos/protosconnect\n\ngo 1.25.5\n\nrequire (\n\tconnectrpc.com/connect v1.19.1\n\tsonic-trivia/backend/protos v0.0.0-00010101000000-000000000000\n)\n\nrequire google.golang.org/protobuf v1.36.11 // indirect\n\nreplace sonic-trivia/backend/protos => ../" > $(GO_OUT)/protosconnect/go.mod
	@echo "Backend proto compilation complete! Generated files are in $(GO_OUT)"

# Export proto files for frontend (TypeScript) using buf
export-protos-frontend:
	@echo ""
	@echo "Compiling proto files for frontend (TypeScript)..."
	@rm -rf $(TS_OUT)
	@mkdir -p $(TS_OUT)
	@cd frontend && PATH="$$PATH:$$(pwd)/node_modules/.bin" buf generate
	@echo "Frontend proto compilation complete! Generated files are in $(TS_OUT)"

# Clean generated proto files
clean:
	@echo "Cleaning generated proto files..."
	@rm -rf $(GO_OUT)/*.pb.go
	@rm -rf $(GO_OUT)/protosconnect/*.connect.go
	@rm -rf $(GO_OUT)/go.mod
	@rm -rf $(GO_OUT)/protosconnect/go.mod
	@rm -rf $(TS_OUT)
	@echo "Clean complete!"

# Help target
help:
	@echo "Available targets:"
	@echo "  make install-deps           - Install required Go protobuf plugins and npm dependencies"
	@echo "  make export-protos          - Compile all proto files for backend and frontend"
	@echo "  make export-protos-backend  - Compile proto files for backend only"
	@echo "  make export-protos-frontend - Compile proto files for frontend only"
	@echo "  make clean                  - Remove all generated proto files"
	@echo "  make help                   - Show this help message"
	@echo ""
	@echo "Example usage:"
	@echo "  make install-deps"
	@echo "  make export-protos"
