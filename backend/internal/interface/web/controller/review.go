package controller

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"jcourse/internal/application"
	"jcourse/internal/domain/auth"
	"jcourse/internal/domain/review"
)

type ReviewController struct {
	query   *application.ReviewQueryService
	command *application.ReviewCommandService
}

func NewReviewController(
	query *application.ReviewQueryService,
	command *application.ReviewCommandService,
) *ReviewController {
	return &ReviewController{query: query, command: command}
}

func bindReviewListFilter(c *gin.Context) (application.ReviewListFilter, error) {
	var f application.ReviewListFilter
	if err := c.ShouldBindQuery(&f); err != nil {
		return f, err
	}
	normalizePagination(&f.Page, &f.PageSize)
	if f.OrderBy == "" && f.Order != "" {
		f.OrderBy = f.Order
	}
	if f.OrderBy == "" && strings.TrimSpace(f.Q) == "" {
		f.OrderBy = "updated_at"
	}
	return f, nil
}

func (r *ReviewController) ListCourseReviews(c *gin.Context) {
	courseID, err := strconv.Atoi(c.Param("courseID"))
	if err != nil {
		respondBadRequest(c, "课程 ID 无效")
		return
	}

	f, err := bindReviewListFilter(c)
	if err != nil {
		respondBindError(c, err)
		return
	}

	result, err := r.query.GetReviewsByCourse(c.Request.Context(), courseID, auth.GetUserFromCtx(c.Request.Context()), f)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (r *ReviewController) GetCourseReviewFilters(c *gin.Context) {
	courseID, err := strconv.Atoi(c.Param("courseID"))
	if err != nil {
		respondBadRequest(c, "课程 ID 无效")
		return
	}

	result, err := r.query.GetCourseReviewFilters(c.Request.Context(), courseID)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (r *ReviewController) GetCourseReviewTrend(c *gin.Context) {
	courseID, err := strconv.Atoi(c.Param("courseID"))
	if err != nil {
		respondBadRequest(c, "课程 ID 无效")
		return
	}

	result, err := r.query.GetCourseReviewTrend(c.Request.Context(), courseID)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (r *ReviewController) CreateReview(c *gin.Context) {
	u := auth.GetUserFromCtx(c.Request.Context())
	if u == nil {
		respondUnauthorized(c)
		return
	}

	var cmd application.CreateReviewCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		respondBindError(c, err)
		return
	}

	if err := r.command.CreateReview(c.Request.Context(), u, &cmd); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "ok"})
}

func (r *ReviewController) UpdateReview(c *gin.Context) {
	reviewID, err := strconv.Atoi(c.Param("reviewID"))
	if err != nil {
		respondBadRequest(c, "点评 ID 无效")
		return
	}

	u := auth.GetUserFromCtx(c.Request.Context())
	if u == nil {
		respondUnauthorized(c)
		return
	}

	var cmd application.UpdateReviewCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		respondBindError(c, err)
		return
	}
	cmd.ReviewID = reviewID

	if err := r.command.UpdateReview(c.Request.Context(), u, &cmd); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func (r *ReviewController) UpdateModeratorRemark(c *gin.Context) {
	reviewID, err := strconv.Atoi(c.Param("reviewID"))
	if err != nil {
		respondBadRequest(c, "点评 ID 无效")
		return
	}

	u := auth.GetUserFromCtx(c.Request.Context())
	if u == nil {
		respondUnauthorized(c)
		return
	}

	var cmd application.UpdateReviewModeratorRemarkCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		respondBindError(c, err)
		return
	}

	if err := r.command.UpdateModeratorRemark(c.Request.Context(), u, reviewID, &cmd); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func (r *ReviewController) DeleteReview(c *gin.Context) {
	reviewID, err := strconv.Atoi(c.Param("reviewID"))
	if err != nil {
		respondBadRequest(c, "点评 ID 无效")
		return
	}

	u := auth.GetUserFromCtx(c.Request.Context())
	if u == nil {
		respondUnauthorized(c)
		return
	}

	if err := r.command.DeleteReview(c.Request.Context(), u, reviewID); err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func (r *ReviewController) ListUserReviews(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("userID"))
	if err != nil {
		respondBadRequest(c, "用户 ID 无效")
		return
	}

	f, err := bindReviewListFilter(c)
	if err != nil {
		respondBindError(c, err)
		return
	}

	result, err := r.query.GetReviewsByUser(c.Request.Context(), userID, auth.GetUserFromCtx(c.Request.Context()), f)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (r *ReviewController) ListReviews(c *gin.Context) {
	f, err := bindReviewListFilter(c)
	if err != nil {
		respondBindError(c, err)
		return
	}

	u := auth.GetUserFromCtx(c.Request.Context())
	result, err := r.query.GetReviews(c.Request.Context(), u, f)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (r *ReviewController) ListFollowedReviews(c *gin.Context) {
	u := auth.GetUserFromCtx(c.Request.Context())
	if u == nil {
		respondUnauthorized(c)
		return
	}

	f, err := bindReviewListFilter(c)
	if err != nil {
		respondBindError(c, err)
		return
	}

	result, err := r.query.GetFollowedReviews(c.Request.Context(), u.ID, u, f)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (r *ReviewController) GetReview(c *gin.Context) {
	reviewID, err := strconv.Atoi(c.Param("reviewID"))
	if err != nil {
		respondBadRequest(c, "点评 ID 无效")
		return
	}

	u := auth.GetUserFromCtx(c.Request.Context())
	detail, err := r.query.GetReviewByID(c.Request.Context(), u, reviewID)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, detail)
}

func (r *ReviewController) ListReviewRevisions(c *gin.Context) {
	reviewID, err := strconv.Atoi(c.Param("reviewID"))
	if err != nil {
		respondBadRequest(c, "点评 ID 无效")
		return
	}

	items, err := r.query.GetReviewRevisions(c.Request.Context(), reviewID)
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, items)
}

func (r *ReviewController) VoteReview(c *gin.Context) {
	reviewID, err := strconv.Atoi(c.Param("reviewID"))
	if err != nil {
		respondBadRequest(c, "点评 ID 无效")
		return
	}

	var cmd application.VoteReviewCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		respondBadRequest(c, "请求参数无效")
		return
	}

	if cmd.VoteType != review.VoteLike && cmd.VoteType != review.VoteDislike && cmd.VoteType != 0 {
		respondBadRequest(c, "投票类型无效")
		return
	}

	u := auth.GetUserFromCtx(c.Request.Context())
	if u == nil {
		respondUnauthorized(c)
		return
	}

	if err := r.command.VoteReview(c.Request.Context(), u.ID, reviewID, cmd.VoteType); err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}
