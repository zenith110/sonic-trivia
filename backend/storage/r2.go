package storage

import (
	"context"
	"fmt"
	"io"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

// R2Client wraps the S3 client for Cloudflare R2 operations
type R2Client struct {
	client     *s3.Client
	bucketName string
	publicURL  string
}

// NewR2Client creates a new R2 storage client
func NewR2Client() (*R2Client, error) {
	// Get R2 credentials from environment variables
	accountID := os.Getenv("R2_ACCOUNT_ID")
	accessKeyID := os.Getenv("R2_ACCESS_KEY_ID")
	secretAccessKey := os.Getenv("R2_SECRET_ACCESS_KEY")
	bucketName := os.Getenv("R2_BUCKET_NAME")
	publicURL := os.Getenv("R2_PUBLIC_URL")

	if accountID == "" || accessKeyID == "" || secretAccessKey == "" || bucketName == "" {
		return nil, fmt.Errorf("R2 credentials not configured")
	}

	// Construct R2 endpoint
	r2Endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)

	// Create custom resolver for R2
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL:               r2Endpoint,
			SigningRegion:     "auto",
			HostnameImmutable: true,
		}, nil
	})

	// Load AWS config with R2 credentials
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithEndpointResolverWithOptions(customResolver),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			accessKeyID,
			secretAccessKey,
			"",
		)),
		config.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load R2 config: %w", err)
	}

	// Create S3 client
	client := s3.NewFromConfig(cfg)

	return &R2Client{
		client:     client,
		bucketName: bucketName,
		publicURL:  publicURL,
	}, nil
}

// UploadFile uploads a file to R2 and returns the public URL
func (r *R2Client) UploadFile(ctx context.Context, fileData []byte, contentType, folder string) (string, error) {
	// Generate unique filename
	filename := uuid.New().String()

	// Determine file extension based on content type
	ext := getExtensionFromContentType(contentType)
	if ext != "" {
		filename = filename + ext
	}

	// Construct key with folder
	key := fmt.Sprintf("%s/%s", folder, filename)

	// Upload to R2
	_, err := r.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(r.bucketName),
		Key:         aws.String(key),
		Body:        io.NopCloser(io.Reader(newBytesReader(fileData))),
		ContentType: aws.String(contentType),
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload file to R2: %w", err)
	}

	// Return public URL
	if r.publicURL != "" {
		return fmt.Sprintf("%s/%s", r.publicURL, key), nil
	}

	// Fallback to R2 URL
	return fmt.Sprintf("https://%s/%s", r.bucketName, key), nil
}

// UploadImage uploads an image file to R2
func (r *R2Client) UploadImage(ctx context.Context, imageData []byte, contentType string) (string, error) {
	return r.UploadFile(ctx, imageData, contentType, "images")
}

// UploadAudio uploads an audio file to R2
func (r *R2Client) UploadAudio(ctx context.Context, audioData []byte, contentType string) (string, error) {
	return r.UploadFile(ctx, audioData, contentType, "audio")
}

// DeleteFile deletes a file from R2
func (r *R2Client) DeleteFile(ctx context.Context, key string) error {
	_, err := r.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		return fmt.Errorf("failed to delete file from R2: %w", err)
	}

	return nil
}

// GetFileURL returns the public URL for a file
func (r *R2Client) GetFileURL(key string) string {
	if r.publicURL != "" {
		return fmt.Sprintf("%s/%s", r.publicURL, key)
	}
	return fmt.Sprintf("https://%s/%s", r.bucketName, key)
}

// Helper functions

type bytesReader struct {
	data []byte
	pos  int
}

func newBytesReader(data []byte) *bytesReader {
	return &bytesReader{data: data, pos: 0}
}

func (r *bytesReader) Read(p []byte) (n int, err error) {
	if r.pos >= len(r.data) {
		return 0, io.EOF
	}
	n = copy(p, r.data[r.pos:])
	r.pos += n
	return n, nil
}

func getExtensionFromContentType(contentType string) string {
	extensions := map[string]string{
		"image/jpeg":      ".jpg",
		"image/jpg":       ".jpg",
		"image/png":       ".png",
		"image/gif":       ".gif",
		"image/webp":      ".webp",
		"audio/mpeg":      ".mp3",
		"audio/mp3":       ".mp3",
		"audio/wav":       ".wav",
		"audio/ogg":       ".ogg",
		"audio/webm":      ".webm",
		"video/mp4":       ".mp4",
		"application/pdf": ".pdf",
	}

	if ext, ok := extensions[contentType]; ok {
		return ext
	}
	return ""
}
