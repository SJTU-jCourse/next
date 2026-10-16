package apperr

import "net/http"

type AppError struct {
	Msg        string
	StatusCode int
}

func New(msg string, statusCode int) *AppError {
	return &AppError{Msg: msg, StatusCode: statusCode}
}

func (e *AppError) Error() string {
	if e == nil {
		return ""
	}
	return e.Msg
}

func BadRequest(msg string) *AppError {
	return New(msg, http.StatusBadRequest)
}

func Unauthorized(msg string) *AppError {
	return New(msg, http.StatusUnauthorized)
}

func Forbidden(msg string) *AppError {
	return New(msg, http.StatusForbidden)
}

func NotFound(msg string) *AppError {
	return New(msg, http.StatusNotFound)
}

func Conflict(msg string) *AppError {
	return New(msg, http.StatusConflict)
}

func TooManyRequests(msg string) *AppError {
	return New(msg, http.StatusTooManyRequests)
}

func ServiceUnavailable(msg string) *AppError {
	return New(msg, http.StatusServiceUnavailable)
}

var (
	ErrUnauthorized = Unauthorized("请先登录")

	ErrUserAlreadyExists  = Conflict("用户已存在")
	ErrUserNotFound       = NotFound("用户不存在")
	ErrEmailNotAllowed    = Forbidden("该邮箱暂不支持注册，请使用学校邮箱")
	ErrPasswordRequired   = BadRequest("密码不能为空")
	ErrPasswordNotSet     = BadRequest("该账号尚未设置密码，请通过「忘记密码」设置")
	ErrInvalidCredentials = Unauthorized("邮箱或密码错误")
	ErrLoginLocked        = TooManyRequests("登录失败次数过多，请稍后再试，或通过「忘记密码」重置密码")

	ErrVerificationSendTooSoon = TooManyRequests("验证码发送过于频繁，请稍后再试")
	ErrVerificationCodeInvalid = BadRequest("验证码错误或已过期，请重新获取")

	ErrUserSuspended          = Forbidden("账号已被封禁，如有疑问请联系 course@sjtu.plus")
	ErrApiKeyNameRequired     = BadRequest("API Key 名称不能为空")
	ErrApiKeyLimitExceeded    = BadRequest("API Key 数量已达上限")
	ErrApiKeyNotFound         = NotFound("API Key 不存在")
	ErrInvalidApiKey          = Unauthorized("API Key 无效")
	ErrInvalidApiKeyRole      = BadRequest("API Key 角色无效")
	ErrCannotSuspendAdmin     = Forbidden("不能封禁管理员")
	ErrCannotOperateSelf      = Forbidden("不能操作自己")
	ErrRequireSuperAdmin      = Forbidden("需要超级管理员权限")
	ErrCannotModifySuperAdmin = Forbidden("不能修改超级管理员权限")

	ErrCourseNotFound           = NotFound("课程不存在")
	ErrTeacherNotFound          = NotFound("教师不存在")
	ErrSemesterRequired         = BadRequest("学期不能为空")
	ErrOfferedCourseNotFound    = BadRequest("该学期未开设此课程")
	ErrInvalidSyncSemester      = BadRequest("学期无效")
	ErrEnrollmentSyncDisabled   = ServiceUnavailable("选课同步功能已关闭")
	ErrInvalidHotCoursePeriod   = BadRequest("热门课程周期无效")
	ErrInvalidHotCourseActivity = BadRequest("热门课程活动类型无效")

	ErrReviewNotFound           = NotFound("点评不存在")
	ErrOfferedCourseMissing     = BadRequest("该学期未开设此课程")
	ErrUserCannotCreateReview   = Forbidden("无权创建点评")
	ErrUserCannotUpdateReview   = Forbidden("无权编辑这条点评")
	ErrUserCannotModerateReview = Forbidden("无权修改管理员备注")
	ErrUserCannotDeleteReview   = Forbidden("点评发布后不可自行删除，如需删除请联系管理员")
	ErrContentSensitive         = BadRequest("内容可能包含不当信息，请修改后重新提交")
	ErrSimilarContentDetected   = BadRequest("短时间内发布了过多相似点评，请稍后再试")
	ErrSameCourseSpam           = BadRequest("短时间内对同一课程发布了过多点评，请稍后再试")
	ErrDailyVoteLimitReached    = TooManyRequests("今日投票次数已达上限，请明天再试")
	ErrInvalidVoteType          = BadRequest("投票类型无效")
	ErrInvalidRating            = BadRequest("评分无效")
	ErrReviewContentEmpty       = BadRequest("点评内容不能为空")
	ErrReviewContentTooLong     = BadRequest("点评内容过长，请精简后再提交")
	ErrReviewScoreTooLong       = BadRequest("成绩内容过长，请精简（如 A、92、W）")

	ErrInsufficientPointBalance          = Conflict("积分余额不足")
	ErrPointTransferInvalidAmount        = BadRequest("转账积分必须大于 0")
	ErrPointTransferInvalidFeePayer      = BadRequest("手续费承担方无效")
	ErrPointTransferSelf                 = BadRequest("不能给自己转账")
	ErrPointTransferRecipientAmountSmall = BadRequest("扣除手续费后到账积分过少")
	ErrPointTransferRecipientNotFound    = NotFound("收款用户不存在")
	ErrPointUserNotFound                 = NotFound("用户不存在")

	ErrInvalidCurrentSemester = BadRequest("当前学期无效")
	ErrInvalidDateRange       = BadRequest("日期范围无效")
	ErrInvalidAuditTimeRange  = BadRequest("审计日志时间范围无效")

	ErrJAccountDisabled         = ServiceUnavailable("jAccount 选课同步功能已关闭")
	ErrJAccountSemesterRequired = BadRequest("学期不能为空")
)
