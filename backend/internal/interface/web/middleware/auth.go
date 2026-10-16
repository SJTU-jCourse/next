package middleware

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"

	"jcourse/internal/application"
	"jcourse/internal/domain/auth"
	"jcourse/pkg/apperr"
)

func ResolveCurrentUser(authResolution *application.AuthResolutionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		if auth.GetUserFromCtx(c.Request.Context()) != nil || auth.GetApiKeyFromCtx(c.Request.Context()) != nil {
			c.Next()
			return
		}

		resolved, err := authResolution.Resolve(c.Request.Context(), bearerToken(c), sessionUserID(c), sessionAuthHash(c))
		if err != nil {
			if errors.Is(err, auth.ErrInvalidSession) {
				_ = ClearSession(c)
				c.Next()
				return
			}
			if errors.Is(err, auth.ErrUserSuspended) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": err.Error()})
				return
			}
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
			return
		}
		ctx := c.Request.Context()
		if resolved.ApiKey != nil {
			ctx = auth.WithApiKey(ctx, resolved.ApiKey)
		}
		if resolved.User != nil {
			ctx = auth.WithUser(ctx, resolved.User)
		}
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

func sessionAuthHash(c *gin.Context) string {
	s := sessions.Default(c)
	hash, ok := sessionString(s, sessionKeyAuthHash)
	if !ok {
		return ""
	}
	return hash
}

func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		if auth.GetUserFromCtx(c.Request.Context()) == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
			return
		}
		c.Next()
	}
}

func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		u := auth.GetUserFromCtx(c.Request.Context())
		if u == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
			return
		}
		if !u.IsAdmin() {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "没有权限进行此操作"})
			return
		}
		c.Next()
	}
}

func RequireSuperAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		u := auth.GetUserFromCtx(c.Request.Context())
		if u == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
			return
		}
		if !u.IsSuperAdmin() {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": apperr.ErrRequireSuperAdmin.Error()})
			return
		}
		c.Next()
	}
}

func RequireSelfOrAdmin(userIDParam string) gin.HandlerFunc {
	return func(c *gin.Context) {
		u := auth.GetUserFromCtx(c.Request.Context())
		if u == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
			return
		}

		userID, err := strconv.Atoi(c.Param(userIDParam))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "用户 ID 无效"})
			return
		}

		if u.ID != userID && !u.IsAdmin() {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "没有权限进行此操作"})
			return
		}
		c.Next()
	}
}

func sessionUserID(c *gin.Context) int {
	s := sessions.Default(c)
	userID, ok := sessionInt(s, sessionKeyUserID)
	if !ok || userID == 0 {
		return 0
	}
	return userID
}
