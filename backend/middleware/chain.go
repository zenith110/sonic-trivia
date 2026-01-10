package middleware

import "net/http"

// Chain represents a chain of middleware functions
type Chain struct {
	middlewares []func(http.Handler) http.Handler
}

// NewChain creates a new middleware chain
func NewChain(middlewares ...func(http.Handler) http.Handler) *Chain {
	return &Chain{
		middlewares: middlewares,
	}
}

// Then chains the middleware and returns the final handler
func (c *Chain) Then(h http.Handler) http.Handler {
	// Apply middleware in reverse order so that the first middleware
	// in the chain is the outermost one
	for i := len(c.middlewares) - 1; i >= 0; i-- {
		h = c.middlewares[i](h)
	}
	return h
}

// ThenFunc chains the middleware and returns the final handler from a HandlerFunc
func (c *Chain) ThenFunc(fn http.HandlerFunc) http.Handler {
	return c.Then(fn)
}

// Append adds middleware to the end of the chain and returns a new chain
func (c *Chain) Append(middlewares ...func(http.Handler) http.Handler) *Chain {
	newMiddlewares := make([]func(http.Handler) http.Handler, len(c.middlewares)+len(middlewares))
	copy(newMiddlewares, c.middlewares)
	copy(newMiddlewares[len(c.middlewares):], middlewares)
	return &Chain{
		middlewares: newMiddlewares,
	}
}

// Prepend adds middleware to the beginning of the chain and returns a new chain
func (c *Chain) Prepend(middlewares ...func(http.Handler) http.Handler) *Chain {
	newMiddlewares := make([]func(http.Handler) http.Handler, len(middlewares)+len(c.middlewares))
	copy(newMiddlewares, middlewares)
	copy(newMiddlewares[len(middlewares):], c.middlewares)
	return &Chain{
		middlewares: newMiddlewares,
	}
}
