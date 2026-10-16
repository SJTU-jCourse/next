package controller

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"

	"jcourse/config"
	"jcourse/internal/application"
	"jcourse/internal/domain/auth"
)

const (
	enrollmentSyncSessionKey = "course_enrollment_sync_state"
	enrollmentSyncStateTTL   = 10 * time.Minute
)

type CourseEnrollmentSyncController struct {
	command             *application.CourseCommandService
	frontendCallbackURL string
}

func NewCourseEnrollmentSyncController(command *application.CourseCommandService, conf config.JAccountConfig) *CourseEnrollmentSyncController {
	return &CourseEnrollmentSyncController{
		command:             command,
		frontendCallbackURL: strings.TrimSpace(conf.FrontendCallbackURL),
	}
}

func (ctrl *CourseEnrollmentSyncController) Start(c *gin.Context) {
	u := auth.GetUserFromCtx(c.Request.Context())
	if u == nil {
		respondUnauthorized(c)
		return
	}
	semester := strings.TrimSpace(c.Query("semester"))
	if semester == "" {
		respondBadRequest(c, "学期不能为空")
		return
	}
	state, err := randomState()
	if err != nil {
		respondError(c, err)
		return
	}
	semester, authURL, err := ctrl.command.StartEnrollmentSync(c.Request.Context(), semester, state)
	if err != nil {
		respondError(c, err)
		return
	}
	stored := enrollmentSyncState{State: state, UserID: u.ID, Semester: semester, CreatedAt: time.Now().Unix()}
	encoded, err := json.Marshal(stored)
	if err != nil {
		respondError(c, err)
		return
	}
	s := sessions.Default(c)
	s.Set(enrollmentSyncSessionKey, string(encoded))
	if err := s.Save(); err != nil {
		respondError(c, err)
		return
	}
	c.Redirect(http.StatusFound, authURL)
}

func (ctrl *CourseEnrollmentSyncController) Callback(c *gin.Context) {
	stored, err := loadEnrollmentSyncState(c)
	if err != nil {
		ctrl.redirectResult(c, "", "error", "会话已失效，请重新同步", 0, 0)
		return
	}
	if c.Query("state") == "" || c.Query("state") != stored.State {
		ctrl.redirectResult(c, stored.Semester, "error", "登录状态校验失败，请重新同步", 0, 0)
		return
	}
	if oauthError := strings.TrimSpace(c.Query("error")); oauthError != "" {
		ctrl.redirectResult(c, stored.Semester, "error", oauthErrorMessage(oauthError), 0, 0)
		return
	}
	code := strings.TrimSpace(c.Query("code"))
	if code == "" {
		ctrl.redirectResult(c, stored.Semester, "error", "jAccount 授权失败，请重新同步", 0, 0)
		return
	}

	result, err := ctrl.command.SyncEnrollmentFromCode(c.Request.Context(), stored.UserID, stored.Semester, code)
	if err != nil {
		ctrl.redirectResult(c, stored.Semester, "error", "同步课表失败，请稍后再试", 0, 0)
		return
	}
	clearEnrollmentSyncState(c)
	ctrl.redirectResult(c, stored.Semester, "ok", "", result.Matched, result.Total)
}

func oauthErrorMessage(oauthError string) string {
	if oauthError == "access_denied" {
		return "你取消了 jAccount 授权，如需同步请重新授权"
	}
	return "jAccount 授权失败，请重新同步"
}

func (ctrl *CourseEnrollmentSyncController) redirectResult(c *gin.Context, semester, status, message string, matched int64, total int) {
	callback := ctrl.frontendCallbackURL
	if callback == "" {
		callback = "/course/mine/sync-callback"
	}
	u, err := url.Parse(callback)
	if err != nil {
		c.String(http.StatusInternalServerError, "前端回调地址无效")
		return
	}
	q := u.Query()
	q.Set("status", status)
	if semester != "" {
		q.Set("semester", semester)
	}
	if message != "" {
		q.Set("message", message)
	}
	if matched > 0 {
		q.Set("matched", strconv.FormatInt(matched, 10))
	}
	if total > 0 {
		q.Set("total", strconv.Itoa(total))
	}
	u.RawQuery = q.Encode()
	c.Redirect(http.StatusFound, u.String())
}

type enrollmentSyncState struct {
	State     string `json:"state"`
	UserID    int    `json:"user_id"`
	Semester  string `json:"semester"`
	CreatedAt int64  `json:"created_at"`
}

func loadEnrollmentSyncState(c *gin.Context) (*enrollmentSyncState, error) {
	v, ok := sessions.Default(c).Get(enrollmentSyncSessionKey).(string)
	if !ok || v == "" {
		return nil, fmt.Errorf("缺少选课同步状态")
	}
	var state enrollmentSyncState
	if err := json.Unmarshal([]byte(v), &state); err != nil {
		return nil, err
	}
	if state.State == "" || state.UserID == 0 || state.Semester == "" || state.CreatedAt == 0 {
		return nil, fmt.Errorf("选课同步状态无效")
	}
	if time.Since(time.Unix(state.CreatedAt, 0)) > enrollmentSyncStateTTL {
		return nil, fmt.Errorf("选课同步状态已过期")
	}
	return &state, nil
}

func clearEnrollmentSyncState(c *gin.Context) {
	s := sessions.Default(c)
	s.Delete(enrollmentSyncSessionKey)
	_ = s.Save()
}

func randomState() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
