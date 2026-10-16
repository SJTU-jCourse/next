package middleware

import (
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"

	"jcourse/internal/domain/auth"
)

type limiterEntry struct {
	limiter          *rate.Limiter
	lastSeenUnixNano atomic.Int64
}

type GlobalRateLimiter struct {
	limiter *rate.Limiter
}

type UserRateLimiter struct {
	rate            rate.Limit
	burst           int
	cleanupInterval time.Duration
	idleTTL         time.Duration

	userLimiters      sync.Map
	apiKeyLimiters    sync.Map
	anonymousLimiters sync.Map
}

func NewUserRateLimiter(rps rate.Limit, burst int) *UserRateLimiter {
	return &UserRateLimiter{
		rate:            rps,
		burst:           burst,
		cleanupInterval: time.Minute,
		idleTTL:         10 * time.Minute,
	}
}

func UserIDRateLimit() gin.HandlerFunc {
	return NewUserRateLimiter(rate.Limit(10), 10).Middleware()
}

func NewGlobalRateLimiter(rps rate.Limit, burst int) *GlobalRateLimiter {
	return &GlobalRateLimiter{limiter: rate.NewLimiter(rps, burst)}
}

func GlobalRateLimit() gin.HandlerFunc {
	return NewGlobalRateLimiter(rate.Limit(300), 300).Middleware()
}

func (r *GlobalRateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !r.limiter.Allow() {
			abortRateLimited(c)
			return
		}
		c.Next()
	}
}

func (r *UserRateLimiter) Middleware() gin.HandlerFunc {
	if r.cleanupInterval > 0 && r.idleTTL > 0 {
		go r.cleanupLoop()
	}

	return func(c *gin.Context) {
		if skipsUserRateLimit(c) {
			c.Next()
			return
		}

		limiter := r.limiterForRequest(c)
		if !limiter.Allow() {
			abortRateLimited(c)
			return
		}
		c.Next()
	}
}

func skipsUserRateLimit(c *gin.Context) bool {
	u := auth.GetUserFromCtx(c.Request.Context())
	return u != nil && (u.IsAdmin() || u.IsSystemAPIKey())
}

func abortRateLimited(c *gin.Context) {
	c.Header("Retry-After", "1")
	c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "操作太频繁，请稍后再试"})
}

func (r *UserRateLimiter) limiterForRequest(c *gin.Context) *rate.Limiter {
	u := auth.GetUserFromCtx(c.Request.Context())
	if u != nil && u.ID > 0 {
		return r.limiterForKey(&r.userLimiters, u.ID)
	}

	apiKey := auth.GetApiKeyFromCtx(c.Request.Context())
	if apiKey != nil && apiKey.UserID > 0 {
		return r.limiterForKey(&r.userLimiters, apiKey.UserID)
	}
	if apiKey != nil && apiKey.ID > 0 {
		return r.limiterForKey(&r.apiKeyLimiters, apiKey.ID)
	}

	return r.limiterForKey(&r.anonymousLimiters, c.ClientIP())
}

func (r *UserRateLimiter) limiterForKey(limiters *sync.Map, key any) *rate.Limiter {
	now := time.Now()
	if existing, ok := limiters.Load(key); ok {
		entry := existing.(*limiterEntry)
		entry.touch(now)
		return entry.limiter
	}

	entry := newLimiterEntry(r.rate, r.burst, now)
	actual, loaded := limiters.LoadOrStore(key, entry)
	if loaded {
		entry = actual.(*limiterEntry)
		entry.touch(now)
	}
	return entry.limiter
}

func newLimiterEntry(rps rate.Limit, burst int, now time.Time) *limiterEntry {
	entry := &limiterEntry{limiter: rate.NewLimiter(rps, burst)}
	entry.touch(now)
	return entry
}

func (l *limiterEntry) touch(now time.Time) {
	l.lastSeenUnixNano.Store(now.UnixNano())
}

func (r *UserRateLimiter) cleanupLoop() {
	ticker := time.NewTicker(r.cleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		r.cleanup()
	}
}

func (r *UserRateLimiter) cleanup() {
	cutoff := time.Now().Add(-r.idleTTL).UnixNano()
	r.cleanupLimiters(&r.userLimiters, cutoff)
	r.cleanupLimiters(&r.apiKeyLimiters, cutoff)
	r.cleanupLimiters(&r.anonymousLimiters, cutoff)
}

func (r *UserRateLimiter) cleanupLimiters(limiters *sync.Map, cutoffUnixNano int64) {
	limiters.Range(func(key, value any) bool {
		entry, ok := value.(*limiterEntry)
		if ok && entry.lastSeenUnixNano.Load() < cutoffUnixNano {
			limiters.Delete(key)
		}
		return true
	})
}
