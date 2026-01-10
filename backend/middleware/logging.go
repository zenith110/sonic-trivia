package middleware

import (
	"log"
	"net/http"
	"time"
)

// responseWriter wraps http.ResponseWriter to capture the status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
	written    int64
}

func newResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{
		ResponseWriter: w,
		statusCode:     http.StatusOK,
	}
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.written += int64(n)
	return n, err
}

// Logging returns a middleware that logs HTTP requests
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap the response writer to capture status code
		wrapped := newResponseWriter(w)

		// Log the request
		log.Printf("[%s] %s %s - Started", r.Method, r.URL.Path, r.RemoteAddr)

		// Call the next handler
		next.ServeHTTP(wrapped, r)

		// Log the response
		duration := time.Since(start)
		log.Printf("[%s] %s %s - Completed %d in %v (%d bytes)",
			r.Method,
			r.URL.Path,
			r.RemoteAddr,
			wrapped.statusCode,
			duration,
			wrapped.written,
		)
	})
}

// RequestIDMiddleware adds a unique request ID to each request
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}
		w.Header().Set("X-Request-ID", requestID)
		next.ServeHTTP(w, r)
	})
}

// generateRequestID generates a simple request ID
// In production, consider using a more robust UUID generator
func generateRequestID() string {
	return time.Now().Format("20060102150405.000000")
}
