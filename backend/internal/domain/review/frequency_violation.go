package review

import (
	_ "embed"
	"strconv"
	"time"

	"jcourse/internal/domain/course"
	"jcourse/internal/domain/email"
)

const (
	SpamSuspensionEmailType    = "account_banned"
	spamSuspensionEmailSubject = "[管理员] 刷评自动封禁通知"
)

//go:embed templates/review_frequency_suspension.html
var spamSuspensionEmailTemplate string

type FrequencyViolation struct {
	Reason          error
	Review          *Review
	Course          *course.CourseView
	SuspendDuration time.Duration
	BannedUntil     time.Time
}

func (e *FrequencyViolation) Error() string {
	return e.Reason.Error()
}

func (e *FrequencyViolation) Unwrap() error {
	return e.Reason
}

func (e *FrequencyViolation) NewSpamSuspensionEmails(recipients []string) ([]email.Email, error) {
	body, err := e.renderSpamSuspensionEmailBody()
	if err != nil {
		return nil, err
	}
	mails := make([]email.Email, 0, len(recipients))
	for _, to := range recipients {
		mails = append(mails, email.Email{To: to, Subject: spamSuspensionEmailSubject, Body: body})
	}
	return mails, nil
}

func (e *FrequencyViolation) renderSpamSuspensionEmailBody() (string, error) {
	body, err := email.RenderTemplate(spamSuspensionEmailTemplate, map[string]string{
		"UserID":          strconv.Itoa(e.Review.UserID),
		"CourseID":        strconv.Itoa(e.courseID()),
		"CourseCode":      e.courseCode(),
		"CourseName":      e.courseName(),
		"MainTeacherName": e.mainTeacherName(),
		"ReviewContent":   e.Review.Content,
		"BannedUntil":     e.bannedUntilText(),
		"Reason":          e.Reason.Error(),
	})
	if err != nil {
		return "", err
	}
	return body, nil
}

func (e *FrequencyViolation) bannedUntilText() string {
	if e.BannedUntil.IsZero() {
		return ""
	}
	return e.BannedUntil.Format(time.DateTime)
}

func (e *FrequencyViolation) courseID() int {
	if e.Course != nil {
		return e.Course.ID
	}
	return e.Review.CourseID
}

func (e *FrequencyViolation) courseCode() string {
	if e.Course == nil {
		return ""
	}
	return e.Course.Code
}

func (e *FrequencyViolation) courseName() string {
	if e.Course == nil {
		return ""
	}
	return e.Course.Name
}

func (e *FrequencyViolation) mainTeacherName() string {
	if e.Course == nil || e.Course.MainTeacher == nil {
		return ""
	}
	return e.Course.MainTeacher.Name
}
