package middleware

import (
	"net/http"
)

// CORSConfig holds configuration for CORS middleware
type CORSConfig struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	ExposedHeaders   []string
	AllowCredentials bool
	MaxAge           int
}

// DefaultCORSConfig returns a default CORS configuration suitable for development
func DefaultCORSConfig() CORSConfig {
	return CORSConfig{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodPatch,
			http.MethodDelete,
			http.MethodOptions,
			http.MethodHead,
		},
		AllowedHeaders: []string{
			"Accept",
			"Accept-Encoding",
			"Authorization",
			"Content-Type",
			"Connect-Protocol-Version",
			"Connect-Timeout-Ms",
			"Grpc-Timeout",
			"X-Grpc-Web",
			"X-User-Agent",
		},
		ExposedHeaders: []string{
			"Grpc-Status",
			"Grpc-Message",
			"Grpc-Status-Details-Bin",
		},
		AllowCredentials: true,
		MaxAge:           86400, // 24 hours
	}
}

// CORS returns a middleware that adds CORS headers to responses
func CORS(config CORSConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if origin is allowed
			allowedOrigin := ""
			for _, allowed := range config.AllowedOrigins {
				if allowed == "*" || allowed == origin {
					allowedOrigin = allowed
					break
				}
			}

			// If no specific origin matched and wildcard is allowed, use the request origin
			if allowedOrigin == "" && len(config.AllowedOrigins) > 0 {
				if config.AllowedOrigins[0] == "*" {
					allowedOrigin = "*"
				}
			}

			// Set CORS headers if origin is allowed
			if allowedOrigin != "" {
				if allowedOrigin == "*" {
					w.Header().Set("Access-Control-Allow-Origin", "*")
				} else {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Vary", "Origin")
				}

				if len(config.AllowedMethods) > 0 {
					methods := ""
					for i, method := range config.AllowedMethods {
						if i > 0 {
							methods += ", "
						}
						methods += method
					}
					w.Header().Set("Access-Control-Allow-Methods", methods)
				}

				if len(config.AllowedHeaders) > 0 {
					headers := ""
					for i, header := range config.AllowedHeaders {
						if i > 0 {
							headers += ", "
						}
						headers += header
					}
					w.Header().Set("Access-Control-Allow-Headers", headers)
				}

				if len(config.ExposedHeaders) > 0 {
					exposed := ""
					for i, header := range config.ExposedHeaders {
						if i > 0 {
							exposed += ", "
						}
						exposed += header
					}
					w.Header().Set("Access-Control-Expose-Headers", exposed)
				}

				if config.AllowCredentials {
					w.Header().Set("Access-Control-Allow-Credentials", "true")
				}

				if config.MaxAge > 0 {
					w.Header().Set("Access-Control-Max-Age", string(rune(config.MaxAge)))
				}
			}

			// Handle preflight requests
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
