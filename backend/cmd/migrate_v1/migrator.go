package main

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"jcourse/internal/domain/auth"
	"jcourse/internal/domain/course"
	"jcourse/internal/domain/stat"
	teacherdomain "jcourse/internal/domain/teacher"
	"jcourse/internal/infrastructure/repository"
	"jcourse/pkg/logx"
)

const batchSize = 1000

type Migrator struct {
	source     *gorm.DB
	target     *gorm.DB
	checkpoint *migrationCheckpoint
}

func NewMigrator(source, target *gorm.DB, checkpointPath string) *Migrator {
	checkpoint, err := loadCheckpoint(checkpointPath)
	if err != nil {
		panic(err)
	}
	return &Migrator{source: source, target: target, checkpoint: checkpoint}
}

func (m *Migrator) Run(ctx context.Context) error {
	logx.Info(ctx, "starting v1 data migration")
	migrationCtx := &migrationContext{Context: ctx, target: m.target}

	if err := m.migrateTeachers(migrationCtx); err != nil {
		return fmt.Errorf("migrate teachers: %w", err)
	}
	if err := m.migrateCourses(migrationCtx); err != nil {
		return fmt.Errorf("migrate courses: %w", err)
	}
	if err := m.migrateUsers(migrationCtx); err != nil {
		return fmt.Errorf("migrate users: %w", err)
	}
	if err := m.migrateUserPoints(migrationCtx); err != nil {
		return fmt.Errorf("migrate user points: %w", err)
	}
	if err := m.migrateCourseEnrollments(migrationCtx); err != nil {
		return fmt.Errorf("migrate course enrollments: %w", err)
	}
	if err := m.migrateReviews(migrationCtx); err != nil {
		return fmt.Errorf("migrate reviews: %w", err)
	}
	if err := m.migrateReviewRevisions(migrationCtx); err != nil {
		return fmt.Errorf("migrate review revisions: %w", err)
	}
	if err := m.migrateVotes(migrationCtx); err != nil {
		return fmt.Errorf("migrate votes: %w", err)
	}
	if err := m.migrateCourseNotifications(migrationCtx); err != nil {
		return fmt.Errorf("migrate course notifications: %w", err)
	}
	if err := m.refreshDerivedData(ctx); err != nil {
		return fmt.Errorf("refresh derived data: %w", err)
	}
	if err := m.resetSequences(ctx); err != nil {
		return fmt.Errorf("reset sequences: %w", err)
	}
	if err := m.backfillCourseHotScores(ctx, course.DefaultHotScoreConfig); err != nil {
		return fmt.Errorf("backfill course hot scores: %w", err)
	}
	if err := m.backfillSiteDailyStats(ctx); err != nil {
		return fmt.Errorf("backfill site daily stats: %w", err)
	}

	logx.Info(ctx, "v1 data migration complete")
	return nil
}

type migrationContext struct {
	Context context.Context
	target  *gorm.DB
}

func (m *Migrator) migrateTeachers(ctx *migrationContext) error {
	const stage = "teachers"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx.Context, "migration stage already done", "stage", "teachers")
		return nil
	}
	logx.Info(ctx.Context, "migrating teachers")

	now := time.Now()
	config := repository.SearchConfig(ctx.target)
	total := 0
	lastID := m.checkpoint.StageLastID(stage)
	if lastID > 0 {
		logx.Info(ctx.Context, "resuming teachers", "last_id", lastID)
	}
	for {
		rows, err := queryLegacyTeachers(m.source, lastID)
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			break
		}

		batch := make([]teacherUpsertRow, 0, len(rows))
		for _, row := range rows {
			code := strings.TrimSpace(nullStringValue(row.TID))
			if code == "" {
				return fmt.Errorf("legacy teacher %d has empty tid", row.ID)
			}
			searchName := teacherdomain.NewSearchName(row.Name)
			batch = append(batch, teacherUpsertRow{
				ID:           row.ID,
				Code:         code,
				Name:         row.Name,
				Department:   legacyDepartmentName(row.Department),
				Title:        nullStringValue(row.Title),
				SearchName:   searchName,
				LastSemester: legacySemesterName(row.LastSemester),
				CreatedAt:    now,
				UpdatedAt:    now,
			})
		}
		if err := upsertTeachers(ctx.target, config, batch); err != nil {
			return err
		}
		total += len(rows)
		lastID = rows[len(rows)-1].ID
		if err := m.checkpoint.MarkProgress(stage, lastID); err != nil {
			return err
		}
		logx.Info(ctx.Context, "teachers migrated", "total", total)
	}
	if err := m.checkpoint.MarkDone(stage); err != nil {
		return err
	}
	logx.Info(ctx.Context, "teachers migrated", "total", total)
	return nil
}

func (m *Migrator) migrateCourses(ctx *migrationContext) error {
	const stage = "courses"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx.Context, "migration stage already done", "stage", "courses")
		return nil
	}
	logx.Info(ctx.Context, "migrating courses")

	now := time.Now()
	total := 0
	skipped := 0
	lastID := m.checkpoint.StageLastID(stage)
	if lastID > 0 {
		logx.Info(ctx.Context, "resuming courses", "last_id", lastID)
	}
	for {
		rows, err := queryLegacyCourses(m.source, lastID)
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			break
		}

		batch := make([]repository.CourseEntity, 0, len(rows))
		for _, row := range rows {
			if row.MainTeacherID == 0 {
				skipped++
				continue
			}
			courseTeachers := legacyTeacherIDs(row.TeacherGroup)
			if len(courseTeachers) == 0 {
				courseTeachers = []int64{int64(row.MainTeacherID)}
			}
			batch = append(batch, repository.CourseEntity{
				ID:              row.ID,
				Code:            row.Code,
				Name:            row.Name,
				Credit:          row.Credit,
				Department:      legacyDepartmentName(row.Department),
				MainTeacherID:   row.MainTeacherID,
				Categories:      pq.StringArray(legacyCategoryNames(row.Categories)),
				Language:        "",
				TargetYears:     pq.StringArray{},
				TeacherIDs:      pq.Int64Array(courseTeachers),
				LastSemester:    legacySemesterName(row.LastSemester),
				ModeratorRemark: nullStringValue(row.ModeratorRemark),
				RatingCount:     intOrZero(row.ReviewCount),
				RatingAvg:       floatOrZero(row.ReviewAvg),
				CreatedAt:       now,
			})
		}
		if len(batch) > 0 {
			if err := upsertCourses(ctx.target, batch); err != nil {
				return err
			}
		}
		total += len(batch)
		lastID = rows[len(rows)-1].ID
		if err := m.checkpoint.MarkProgress(stage, lastID); err != nil {
			return err
		}
		logx.Info(ctx.Context, "courses migrated", "total", total, "skipped", skipped)
	}
	if err := m.checkpoint.MarkDone(stage); err != nil {
		return err
	}
	logx.Info(ctx.Context, "courses migrated", "total", total, "skipped", skipped)
	return nil
}

func (m *Migrator) migrateUsers(ctx *migrationContext) error {
	const stage = "users"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx.Context, "migration stage already done", "stage", "users")
		return nil
	}
	logx.Info(ctx.Context, "migrating users")

	now := time.Now()
	total := 0
	lastID := m.checkpoint.StageLastID(stage)
	if lastID > 0 {
		logx.Info(ctx.Context, "resuming users", "last_id", lastID)
	}
	for {
		rows, err := queryLegacyUsers(m.source, lastID)
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			break
		}

		batch := make([]repository.UserEntity, 0, len(rows))
		for _, row := range rows {
			createdAt := row.DateJoined
			if createdAt.IsZero() {
				createdAt = now
			}
			batch = append(batch, repository.UserEntity{
				ID:           row.ID,
				Username:     row.Username,
				Email:        sql.NullString{},
				Role:         userRole(row),
				PasswordHash: migratePasswordHash(row.PasswordHash),
				CreatedAt:    createdAt,
				LastSeenAt:   userLastSeen(row, createdAt),
				SuspendedAt:  nil,
				SuspendTill:  nil,
			})
		}
		if err := upsertUsers(ctx.target, batch); err != nil {
			return err
		}
		total += len(rows)
		lastID = rows[len(rows)-1].ID
		if err := m.checkpoint.MarkProgress(stage, lastID); err != nil {
			return err
		}
		logx.Info(ctx.Context, "users migrated", "total", total)
	}
	if err := m.checkpoint.MarkDone(stage); err != nil {
		return err
	}
	logx.Info(ctx.Context, "users migrated", "total", total)
	return nil
}

func (m *Migrator) migrateReviews(ctx *migrationContext) error {
	const stage = "reviews"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx.Context, "migration stage already done", "stage", "reviews")
		return nil
	}
	logx.Info(ctx.Context, "migrating reviews")
	total := 0
	lastID := m.checkpoint.StageLastID(stage)
	if lastID > 0 {
		logx.Info(ctx.Context, "resuming reviews", "last_id", lastID)
	}
	for {
		rows, err := queryLegacyReviews(m.source, lastID)
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			break
		}

		batch := make([]repository.ReviewEntity, 0, len(rows))
		for _, row := range rows {
			updatedAt := row.CreatedAt
			if row.ModifiedAt.Valid {
				updatedAt = row.ModifiedAt.Time
			}
			batch = append(batch, repository.ReviewEntity{
				ID:              row.ID,
				CourseID:        row.CourseID,
				Semester:        nullStringValue(row.SemesterName),
				UserID:          row.UserID,
				Rating:          row.Rating,
				Content:         row.Comment,
				Score:           nullStringValue(row.Score),
				ModeratorRemark: nullStringValue(row.ModeratorRemark),
				LikeCount:       intOrZero(row.ApproveCount),
				DislikeCount:    intOrZero(row.DisapproveCount),
				CreatedAt:       row.CreatedAt,
				UpdatedAt:       updatedAt,
			})
		}
		if err := upsertReviews(ctx.target, batch); err != nil {
			return err
		}
		total += len(rows)
		lastID = rows[len(rows)-1].ID
		if err := m.checkpoint.MarkProgress(stage, lastID); err != nil {
			return err
		}
		logx.Info(ctx.Context, "reviews migrated", "total", total)
	}
	if err := m.checkpoint.MarkDone(stage); err != nil {
		return err
	}
	logx.Info(ctx.Context, "reviews migrated", "total", total)
	return nil
}

func (m *Migrator) migrateCourseEnrollments(ctx *migrationContext) error {
	const stage = "course_enrollments"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx.Context, "migration stage already done", "stage", "course enrollments")
		return nil
	}
	logx.Info(ctx.Context, "migrating course enrollments")

	total := 0
	skipped := 0
	lastID := m.checkpoint.StageLastID(stage)
	if lastID > 0 {
		logx.Info(ctx.Context, "resuming course enrollments", "last_id", lastID)
	}
	for {
		rows, err := queryLegacyCourseEnrollments(m.source, lastID)
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			break
		}

		batch := make([]repository.CourseEnrollmentEntity, 0, len(rows))
		for _, row := range rows {
			semester := strings.TrimSpace(nullStringValue(row.SemesterName))
			if !row.UserID.Valid || !row.CourseID.Valid || semester == "" {
				skipped++
				continue
			}
			batch = append(batch, repository.CourseEnrollmentEntity{
				ID:        row.ID,
				UserID:    int(row.UserID.Int64),
				CourseID:  int(row.CourseID.Int64),
				Semester:  semester,
				CreatedAt: row.CreatedAt,
			})
		}
		if len(batch) > 0 {
			if err := upsertCourseEnrollments(ctx.target, batch); err != nil {
				return err
			}
		}
		total += len(batch)
		lastID = rows[len(rows)-1].ID
		if err := m.checkpoint.MarkProgress(stage, lastID); err != nil {
			return err
		}
		logx.Info(ctx.Context, "course enrollments migrated", "total", total, "skipped", skipped)
	}
	if err := m.checkpoint.MarkDone(stage); err != nil {
		return err
	}
	logx.Info(ctx.Context, "course enrollments migrated", "total", total, "skipped", skipped)
	return nil
}

func (m *Migrator) migrateUserPoints(ctx *migrationContext) error {
	const stage = "user_points"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx.Context, "migration stage already done", "stage", "user points")
		return nil
	}
	logx.Info(ctx.Context, "migrating user points")

	now := time.Now()
	total := 0
	lastID := m.checkpoint.StageLastID(stage)
	if lastID > 0 {
		logx.Info(ctx.Context, "resuming user points", "last_id", lastID)
	}
	for {
		rows, err := queryLegacyUserPoints(m.source, lastID)
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			break
		}

		batch := make([]repository.UserPointRecordEntity, 0, len(rows))
		for _, row := range rows {
			description := strings.TrimSpace(nullStringValue(row.Description))
			if description == "" {
				description = "历史积分"
			}
			createdAt := row.Time
			if createdAt.IsZero() {
				createdAt = now
			}
			batch = append(batch, repository.UserPointRecordEntity{
				ID:          row.ID,
				UserID:      row.UserID,
				Reason:      "legacy_migration",
				Amount:      row.Value,
				Description: description,
				CreatedAt:   createdAt,
			})
		}
		if err := upsertUserPoints(ctx.target, batch); err != nil {
			return err
		}
		total += len(rows)
		lastID = rows[len(rows)-1].ID
		if err := m.checkpoint.MarkProgress(stage, lastID); err != nil {
			return err
		}
		logx.Info(ctx.Context, "user points migrated", "total", total)
	}
	if err := m.checkpoint.MarkDone(stage); err != nil {
		return err
	}
	logx.Info(ctx.Context, "user points migrated", "total", total)
	return nil
}

func (m *Migrator) migrateVotes(ctx *migrationContext) error {
	const stage = "review_votes"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx.Context, "migration stage already done", "stage", "review votes")
		return nil
	}
	logx.Info(ctx.Context, "migrating review votes")

	now := time.Now()
	total := 0
	lastID := m.checkpoint.StageLastID(stage)
	if lastID > 0 {
		logx.Info(ctx.Context, "resuming review votes", "last_id", lastID)
	}
	for {
		rows, err := queryLegacyReactions(m.source, lastID)
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			break
		}

		batch := make([]repository.ReviewVoteEntity, 0, len(rows))
		for _, row := range rows {
			updatedAt := now
			if row.ModifiedAt.Valid {
				updatedAt = row.ModifiedAt.Time
			}
			batch = append(batch, repository.ReviewVoteEntity{
				ReviewID:  row.ReviewID,
				UserID:    row.UserID,
				VoteType:  row.Reaction,
				CreatedAt: updatedAt,
				UpdatedAt: updatedAt,
			})
		}
		if err := upsertVotes(ctx.target, batch); err != nil {
			return err
		}
		total += len(rows)
		lastID = rows[len(rows)-1].ID
		if err := m.checkpoint.MarkProgress(stage, lastID); err != nil {
			return err
		}
		logx.Info(ctx.Context, "review votes migrated", "total", total)
	}
	if err := m.checkpoint.MarkDone(stage); err != nil {
		return err
	}
	logx.Info(ctx.Context, "review votes migrated", "total", total)
	return nil
}

func (m *Migrator) migrateReviewRevisions(ctx *migrationContext) error {
	const stage = "review_revisions"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx.Context, "migration stage already done", "stage", "review revisions")
		return nil
	}
	logx.Info(ctx.Context, "migrating review revisions")

	total := 0
	lastID := m.checkpoint.StageLastID(stage)
	if lastID > 0 {
		logx.Info(ctx.Context, "resuming review revisions", "last_id", lastID)
	}
	for {
		rows, err := queryLegacyReviewRevisions(m.source, lastID)
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			break
		}

		batch := make([]repository.ReviewRevisionEntity, 0, len(rows))
		for _, row := range rows {
			if !row.ReviewID.Valid || !row.CourseID.Valid || !row.UserID.Valid {
				continue
			}
			batch = append(batch, repository.ReviewRevisionEntity{
				ID:        row.ID,
				ReviewID:  int(row.ReviewID.Int64),
				CourseID:  int(row.CourseID.Int64),
				Semester:  nullStringValue(row.SemesterName),
				CreatedBy: int(row.UserID.Int64),
				Rating:    row.Rating,
				Content:   row.Comment,
				Score:     nullStringValue(row.Score),
				CreatedAt: row.CreatedAt,
			})
		}
		if len(batch) > 0 {
			if err := upsertReviewRevisions(ctx.target, batch); err != nil {
				return err
			}
		}
		total += len(rows)
		lastID = rows[len(rows)-1].ID
		if err := m.checkpoint.MarkProgress(stage, lastID); err != nil {
			return err
		}
		logx.Info(ctx.Context, "review revisions migrated", "total", total)
	}
	if err := m.checkpoint.MarkDone(stage); err != nil {
		return err
	}
	logx.Info(ctx.Context, "review revisions migrated", "total", total)
	return nil
}

func (m *Migrator) migrateCourseNotifications(ctx *migrationContext) error {
	const stage = "course_notifications"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx.Context, "migration stage already done", "stage", "course notifications")
		return nil
	}
	logx.Info(ctx.Context, "migrating course notifications")

	total := 0
	lastID := m.checkpoint.StageLastID(stage)
	if lastID > 0 {
		logx.Info(ctx.Context, "resuming course notifications", "last_id", lastID)
	}
	for {
		rows, err := queryLegacyCourseNotifications(m.source, lastID)
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			break
		}

		batch := make([]repository.CourseNotificationEntity, 0, len(rows))
		for _, row := range rows {
			if !row.UserID.Valid || !row.CourseID.Valid {
				continue
			}
			batch = append(batch, repository.CourseNotificationEntity{
				UserID:    int(row.UserID.Int64),
				CourseID:  int(row.CourseID.Int64),
				Level:     row.NotificationLevel,
				CreatedAt: row.ModifiedAt,
				UpdatedAt: row.ModifiedAt,
			})
		}
		if len(batch) > 0 {
			if err := upsertCourseNotifications(ctx.target, batch); err != nil {
				return err
			}
		}
		total += len(rows)
		lastID = rows[len(rows)-1].ID
		if err := m.checkpoint.MarkProgress(stage, lastID); err != nil {
			return err
		}
		logx.Info(ctx.Context, "course notifications migrated", "total", total)
	}
	if err := m.checkpoint.MarkDone(stage); err != nil {
		return err
	}
	logx.Info(ctx.Context, "course notifications migrated", "total", total)
	return nil
}

func queryLegacyTeachers(db *gorm.DB, lastID int) ([]legacyTeacher, error) {
	var rows []legacyTeacher
	err := db.
		Preload("Department").
		Preload("LastSemester").
		Where("id > ?", lastID).
		Order("id").
		Limit(batchSize).
		Find(&rows).Error
	return rows, err
}

func queryLegacyCourses(db *gorm.DB, lastID int) ([]legacyCourse, error) {
	var rows []legacyCourse
	err := db.
		Preload("Department").
		Preload("LastSemester").
		Preload("Categories").
		Preload("TeacherGroup").
		Where("id > ?", lastID).
		Order("id").
		Limit(batchSize).
		Find(&rows).Error
	return rows, err
}

func queryLegacyUsers(db *gorm.DB, lastID int) ([]legacyUser, error) {
	var rows []legacyUser
	err := db.Raw(`
		SELECT u.id,
		       u.password AS password_hash,
		       u.username,
		       u.is_staff,
		       u.is_superuser,
		       u.date_joined,
		       u.last_login,
		       p.last_seen_at
		FROM auth_user AS u
		LEFT JOIN oauth_userprofile AS p ON p.user_id = u.id
		WHERE u.id > ?
		ORDER BY u.id
		LIMIT ?
	`, lastID, batchSize).Scan(&rows).Error
	return rows, err
}

func queryLegacyReviews(db *gorm.DB, lastID int) ([]legacyReview, error) {
	var rows []legacyReview
	err := db.Raw(`
		SELECT r.id,
		       r.user_id,
		       r.course_id,
		       s.name AS semester_name,
		       r.rating,
		       r.comment,
		       r.created_at,
		       r.modified_at,
		       r.score,
		       r.moderator_remark,
		       r.approve_count,
		       r.disapprove_count
		FROM jcourse_api_review AS r
		LEFT JOIN jcourse_api_semester AS s ON s.id = r.semester_id
		WHERE r.id > ?
		ORDER BY r.id
		LIMIT ?
	`, lastID, batchSize).Scan(&rows).Error
	return rows, err
}

func queryLegacyReviewRevisions(db *gorm.DB, lastID int) ([]legacyReviewRevision, error) {
	var rows []legacyReviewRevision
	err := db.Raw(`
		SELECT rr.id,
		       rr.review_id,
		       rr.course_id,
		       s.name AS semester_name,
		       rr.user_id,
		       rr.rating,
		       rr.comment,
		       rr.created_at,
		       rr.score
		FROM jcourse_api_reviewrevision AS rr
		LEFT JOIN jcourse_api_semester AS s ON s.id = rr.semester_id
		WHERE rr.id > ?
		ORDER BY rr.id
		LIMIT ?
	`, lastID, batchSize).Scan(&rows).Error
	return rows, err
}

func queryLegacyReactions(db *gorm.DB, lastID int) ([]legacyReaction, error) {
	var rows []legacyReaction
	err := db.Raw(`
		SELECT id, user_id, review_id, reaction, modified_at
		FROM jcourse_api_reviewreaction
		WHERE id > ? AND reaction IN (1, -1)
		ORDER BY id
		LIMIT ?
	`, lastID, batchSize).Scan(&rows).Error
	return rows, err
}

func queryLegacyUserPoints(db *gorm.DB, lastID int) ([]legacyUserPoint, error) {
	var rows []legacyUserPoint
	err := db.Raw(`
		SELECT id, user_id, value, description, time
		FROM jcourse_api_userpoint
		WHERE id > ?
		ORDER BY id
		LIMIT ?
	`, lastID, batchSize).Scan(&rows).Error
	return rows, err
}

func queryLegacyCourseEnrollments(db *gorm.DB, lastID int) ([]legacyEnrollCourse, error) {
	var rows []legacyEnrollCourse
	err := db.Raw(`
		SELECT e.id,
		       e.user_id,
		       e.course_id,
		       s.name AS semester_name,
		       e.created_at
		FROM jcourse_api_enrollcourse AS e
		LEFT JOIN jcourse_api_semester AS s ON s.id = e.semester_id
		WHERE e.id > ?
		ORDER BY e.id
		LIMIT ?
	`, lastID, batchSize).Scan(&rows).Error
	return rows, err
}

func queryLegacyCourseNotifications(db *gorm.DB, lastID int) ([]legacyCourseNotificationLevel, error) {
	var rows []legacyCourseNotificationLevel
	err := db.Raw(`
		SELECT id, user_id, course_id, notification_level, modified_at
		FROM jcourse_api_coursenotificationlevel
		WHERE id > ? AND notification_level IN (1, 2)
		ORDER BY id
		LIMIT ?
	`, lastID, batchSize).Scan(&rows).Error
	return rows, err
}

type teacherUpsertRow struct {
	ID           int
	Code         string
	Name         string
	Department   string
	Title        string
	SearchName   string
	LastSemester string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func upsertTeachers(db *gorm.DB, config string, batch []teacherUpsertRow) error {
	rows := make([]map[string]any, 0, len(batch))
	for _, teacher := range batch {
		rows = append(rows, map[string]any{
			"id":            teacher.ID,
			"code":          teacher.Code,
			"name":          teacher.Name,
			"department":    teacher.Department,
			"title":         teacher.Title,
			"search_vector": repository.TeacherSearchVectorExpr(config, teacher.Code, teacher.SearchName),
			"last_semester": teacher.LastSemester,
			"created_at":    teacher.CreatedAt,
			"updated_at":    teacher.UpdatedAt,
		})
	}
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoNothing: true,
	}).Model(&repository.TeacherEntity{}).Create(&rows).Error
}

func upsertCourses(db *gorm.DB, batch []repository.CourseEntity) error {
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoNothing: true,
	}).Create(&batch).Error
}

func upsertUsers(db *gorm.DB, batch []repository.UserEntity) error {
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoNothing: true,
	}).Create(&batch).Error
}

func upsertReviews(db *gorm.DB, batch []repository.ReviewEntity) error {
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoNothing: true,
	}).Create(&batch).Error
}

func upsertReviewRevisions(db *gorm.DB, batch []repository.ReviewRevisionEntity) error {
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoNothing: true,
	}).Create(&batch).Error
}

func upsertVotes(db *gorm.DB, batch []repository.ReviewVoteEntity) error {
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "review_id"}, {Name: "user_id"}},
		DoNothing: true,
	}).Create(&batch).Error
}

func upsertUserPoints(db *gorm.DB, batch []repository.UserPointRecordEntity) error {
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoNothing: true,
	}).Create(&batch).Error
}

func upsertCourseEnrollments(db *gorm.DB, batch []repository.CourseEnrollmentEntity) error {
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "course_id"}, {Name: "semester"}},
		DoNothing: true,
	}).Create(&batch).Error
}

func upsertCourseNotifications(db *gorm.DB, batch []repository.CourseNotificationEntity) error {
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "course_id"}},
		DoNothing: true,
	}).Create(&batch).Error
}

func (m *Migrator) refreshDerivedData(ctx context.Context) error {
	const stage = "refresh_derived_data"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx, "migration stage already done", "stage", stage)
		return nil
	}
	db := m.target
	logx.Info(ctx, "refreshing search vectors and denormalized counters")
	if err := db.Exec(`
		UPDATE reviews AS r SET
			like_count = (SELECT COUNT(*) FROM review_votes AS v WHERE v.review_id = r.id AND v.vote_type = 1),
			dislike_count = (SELECT COUNT(*) FROM review_votes AS v WHERE v.review_id = r.id AND v.vote_type = -1)
	`).Error; err != nil {
		return err
	}
	priorCount := course.DefaultRatingScoreConfig.PriorCount
	if err := db.Exec(`
		WITH global_rating AS (
			SELECT COALESCE(AVG(rating), 0)::double precision AS avg_rating
			FROM reviews
		), course_rating AS (
			SELECT
				course_id,
				COUNT(*)::double precision AS rating_count,
				AVG(rating)::double precision AS rating_avg
			FROM reviews
			GROUP BY course_id
		), computed AS (
			SELECT
				c.id,
				COALESCE(cr.rating_count, 0) AS rating_count,
				COALESCE(cr.rating_avg, 0) AS rating_avg,
				CASE
					WHEN COALESCE(cr.rating_count, 0) = 0 THEN 0
					ELSE ((cr.rating_avg * cr.rating_count) + (? * gr.avg_rating)) / (cr.rating_count + ?)
				END AS rating_score
			FROM courses AS c
			CROSS JOIN global_rating AS gr
			LEFT JOIN course_rating AS cr ON cr.course_id = c.id
		)
		UPDATE courses AS c SET
			rating_count = computed.rating_count::integer,
			rating_avg = computed.rating_avg,
			rating_score = computed.rating_score
		FROM computed
		WHERE computed.id = c.id
	`, priorCount, priorCount).Error; err != nil {
		return err
	}
	if err := repository.RefreshCourseSearchVectors(db); err != nil {
		return err
	}
	if err := repository.RefreshReviewSearchVectors(db); err != nil {
		return err
	}
	return m.checkpoint.MarkDone(stage)
}

func (m *Migrator) resetSequences(ctx context.Context) error {
	const stage = "reset_sequences"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx, "migration stage already done", "stage", stage)
		return nil
	}
	db := m.target
	logx.Info(ctx, "resetting sequences")
	for _, table := range []string{"teachers", "courses", "users", "course_enrollments", "user_point_records", "reviews", "review_revisions"} {
		if err := resetSequence(db, table, "id"); err != nil {
			return err
		}
	}
	return m.checkpoint.MarkDone(stage)
}

func (m *Migrator) backfillCourseHotScores(ctx context.Context, scores course.HotScoreConfig) error {
	const stage = "course_hot_scores_current_period"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx, "migration stage already done", "stage", stage)
		return nil
	}
	logx.Info(ctx, "backfilling course hot scores")

	loc, err := course.DefaultHotCourseLocation()
	if err != nil {
		return fmt.Errorf("load hot course location: %w", err)
	}
	now := time.Now()
	monthKey := course.HotCoursePeriodKey(course.HotCoursePeriodMonth, now, loc)
	weekKey := course.HotCoursePeriodKey(course.HotCoursePeriodWeek, now, loc)
	monthStart, monthEnd := course.HotCoursePeriodRange(course.HotCoursePeriodMonth, now, loc)
	weekStart, weekEnd := course.HotCoursePeriodRange(course.HotCoursePeriodWeek, now, loc)

	var rowsAffected int64
	err = m.target.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(`
			DELETE FROM course_hot_scores
			WHERE (period, period_key) IN ((?, ?), (?, ?))
		`,
			string(course.HotCoursePeriodMonth), monthKey,
			string(course.HotCoursePeriodWeek), weekKey,
		).Error; err != nil {
			return err
		}

		result := tx.Exec(`
		WITH periods AS (
			SELECT *
			FROM (VALUES
				(?::text, ?::text, ?::timestamptz, ?::timestamptz),
				(?::text, ?::text, ?::timestamptz, ?::timestamptz)
			) AS p(period, period_key, start_at, end_at)
		), events AS (
			SELECT r.course_id, r.created_at AS occurred_at, ?::bigint AS score
			FROM reviews AS r
			WHERE ?::bigint <> 0

			UNION ALL

			SELECT rr.course_id, rr.created_at AS occurred_at, ?::bigint AS score
			FROM review_revisions AS rr
			WHERE ?::bigint <> 0

			UNION ALL

			SELECT r.course_id, v.updated_at AS occurred_at, ?::bigint AS score
			FROM review_votes AS v
			JOIN reviews AS r ON r.id = v.review_id
			WHERE ?::bigint <> 0
		), period_scores AS (
			SELECT p.period, p.period_key, e.course_id, SUM(e.score)::bigint AS score
			FROM periods AS p
			JOIN events AS e ON e.occurred_at >= p.start_at AND e.occurred_at < p.end_at
			GROUP BY p.period, p.period_key, e.course_id
			HAVING SUM(e.score) <> 0
		)
		INSERT INTO course_hot_scores (period, period_key, course_id, score, created_at, updated_at)
		SELECT period, period_key, course_id, score, ? AS created_at, ? AS updated_at
		FROM period_scores
	`,
			string(course.HotCoursePeriodMonth), monthKey, monthStart, monthEnd,
			string(course.HotCoursePeriodWeek), weekKey, weekStart, weekEnd,
			scores.ReviewCreateScore, scores.ReviewCreateScore,
			scores.ReviewUpdateScore, scores.ReviewUpdateScore,
			scores.ReviewVoteScore, scores.ReviewVoteScore,
			now, now,
		)
		if result.Error != nil {
			return result.Error
		}
		rowsAffected = result.RowsAffected
		return nil
	})
	if err != nil {
		return err
	}

	if err := m.checkpoint.MarkDone(stage); err != nil {
		return err
	}
	logx.Info(ctx, "course hot scores backfilled", "rows", rowsAffected, "month", monthKey, "week", weekKey)
	return nil
}

func (m *Migrator) backfillSiteDailyStats(ctx context.Context) error {
	const stage = "site_daily_stats"
	if m.checkpoint.StageDone(stage) {
		logx.Info(ctx, "migration stage already done", "stage", stage)
		return nil
	}
	logx.Info(ctx, "backfilling site daily stats")

	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		return fmt.Errorf("load stats location: %w", err)
	}
	calendar := stat.NewCalendar(loc)

	startDate, endDate, err := m.siteDailyStatsDateRange(calendar, loc)
	if err != nil {
		return err
	}
	if startDate.IsZero() {
		logx.Info(ctx, "site daily stats has no source data")
		return m.checkpoint.MarkDone(stage)
	}

	if lastDate := m.checkpoint.StageLastDate(stage); lastDate != "" {
		resumeDate, err := calendar.ParseDate(lastDate)
		if err != nil {
			return fmt.Errorf("parse site daily stats checkpoint date: %w", err)
		}
		startDate = resumeDate.AddDate(0, 0, 1)
		logx.Info(ctx, "resuming site daily stats", "last_date", lastDate)
	}
	if startDate.After(endDate) {
		return m.checkpoint.MarkDone(stage)
	}

	endExclusive := endDate.AddDate(0, 0, 1)
	locName := loc.String()

	userNewCounts, err := m.dailyCountByDate(
		`SELECT TO_CHAR((created_at AT TIME ZONE ?)::date, 'YYYY-MM-DD') AS stat_date, COUNT(*) AS count
		 FROM users
		 WHERE created_at >= ? AND created_at < ?
		 GROUP BY 1
		 ORDER BY 1`, locName, startDate, endExclusive,
	)
	if err != nil {
		return fmt.Errorf("load site daily user counts: %w", err)
	}
	userActiveCounts, err := m.dailyCountByDate(
		`SELECT TO_CHAR((last_seen_at AT TIME ZONE ?)::date, 'YYYY-MM-DD') AS stat_date, COUNT(*) AS count
		 FROM users
		 WHERE last_seen_at >= ? AND last_seen_at < ?
		 GROUP BY 1
		 ORDER BY 1`, locName, startDate, endExclusive,
	)
	if err != nil {
		return fmt.Errorf("load site daily active user counts: %w", err)
	}
	reviewNewCounts, err := m.dailyCountByDate(
		`SELECT TO_CHAR((created_at AT TIME ZONE ?)::date, 'YYYY-MM-DD') AS stat_date, COUNT(*) AS count
		 FROM reviews
		 WHERE created_at >= ? AND created_at < ?
		 GROUP BY 1
		 ORDER BY 1`, locName, startDate, endExclusive,
	)
	if err != nil {
		return fmt.Errorf("load site daily review counts: %w", err)
	}
	reviewAuthorCounts, err := m.dailyCountByDate(
		`SELECT TO_CHAR((created_at AT TIME ZONE ?)::date, 'YYYY-MM-DD') AS stat_date, COUNT(DISTINCT user_id) AS count
		 FROM reviews
		 WHERE created_at >= ? AND created_at < ?
		 GROUP BY 1
		 ORDER BY 1`, locName, startDate, endExclusive,
	)
	if err != nil {
		return fmt.Errorf("load site daily review author counts: %w", err)
	}
	firstReviewCourseCounts, err := m.dailyCountByDate(
		`SELECT stat_date, COUNT(*) AS count
		 FROM (
			SELECT TO_CHAR((MIN(created_at) AT TIME ZONE ?)::date, 'YYYY-MM-DD') AS stat_date
			FROM reviews
			GROUP BY course_id
		 ) AS course_first_reviews
		 WHERE stat_date >= ? AND stat_date <= ?
		 GROUP BY stat_date
		 ORDER BY stat_date`, locName, startDate.Format(stat.DateLayout), endDate.Format(stat.DateLayout),
	)
	if err != nil {
		return fmt.Errorf("load site daily reviewed course counts: %w", err)
	}
	newLikeCounts, err := m.dailyCountByDate(
		`SELECT TO_CHAR((updated_at AT TIME ZONE ?)::date, 'YYYY-MM-DD') AS stat_date, COUNT(*) AS count
		 FROM review_votes
		 WHERE updated_at >= ? AND updated_at < ? AND vote_type = 1
		 GROUP BY 1
		 ORDER BY 1`, locName, startDate, endExclusive,
	)
	if err != nil {
		return fmt.Errorf("load site daily like counts: %w", err)
	}
	newDislikeCounts, err := m.dailyCountByDate(
		`SELECT TO_CHAR((updated_at AT TIME ZONE ?)::date, 'YYYY-MM-DD') AS stat_date, COUNT(*) AS count
		 FROM review_votes
		 WHERE updated_at >= ? AND updated_at < ? AND vote_type = -1
		 GROUP BY 1
		 ORDER BY 1`, locName, startDate, endExclusive,
	)
	if err != nil {
		return fmt.Errorf("load site daily dislike counts: %w", err)
	}

	totalUsers, totalReviews, reviewedCourses, err := m.siteDailyStatsTotalsBefore(startDate)
	if err != nil {
		return err
	}

	now := time.Now().In(loc)
	for date := startDate; !date.After(endDate); date = date.AddDate(0, 0, 1) {
		dateKey := date.Format(stat.DateLayout)
		totalUsers += userNewCounts[dateKey]
		totalReviews += reviewNewCounts[dateKey]
		reviewedCourses += firstReviewCourseCounts[dateKey]

		entity := repository.SiteDailyStatEntity{
			StatDate: date,
			Metrics: datatypes.JSONMap{
				stat.MetricTotalUserCount:      totalUsers,
				stat.MetricTotalReviewCount:    totalReviews,
				stat.MetricActiveUserCount:     userActiveCounts[dateKey],
				stat.MetricNewUserCount:        userNewCounts[dateKey],
				stat.MetricNewReviewCount:      reviewNewCounts[dateKey],
				stat.MetricReviewAuthorCount:   reviewAuthorCounts[dateKey],
				stat.MetricReviewedCourseTotal: reviewedCourses,
				stat.MetricNewLikeCount:        newLikeCounts[dateKey],
				stat.MetricNewDislikeCount:     newDislikeCounts[dateKey],
			},
			GeneratedAt: now,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		if err := m.target.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "stat_date"}},
			DoNothing: true,
		}).Create(&entity).Error; err != nil {
			return fmt.Errorf("insert site daily stat %s: %w", dateKey, err)
		}
		if err := m.checkpoint.MarkDateProgress(stage, dateKey); err != nil {
			return fmt.Errorf("save site daily stats checkpoint: %w", err)
		}
		logx.Info(ctx, "site daily stats backfilled", "date", dateKey)
	}

	if err := m.checkpoint.MarkDone(stage); err != nil {
		return err
	}
	logx.Info(ctx, "site daily stats backfilled", "days", int(endDate.Sub(startDate).Hours()/24)+1)
	return nil
}

func (m *Migrator) siteDailyStatsDateRange(calendar stat.Calendar, loc *time.Location) (time.Time, time.Time, error) {
	startDate, err := m.firstDateForTable(`SELECT TO_CHAR(MIN(created_at AT TIME ZONE ?), 'YYYY-MM-DD') AS stat_date FROM users`, loc)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("load first user date: %w", err)
	}
	reviewDate, err := m.firstDateForTable(`SELECT TO_CHAR(MIN(created_at AT TIME ZONE ?), 'YYYY-MM-DD') AS stat_date FROM reviews`, loc)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("load first review date: %w", err)
	}

	if startDate.IsZero() {
		startDate = reviewDate
	} else if !reviewDate.IsZero() && reviewDate.Before(startDate) {
		startDate = reviewDate
	}
	if startDate.IsZero() {
		return time.Time{}, time.Time{}, nil
	}

	endDate := calendar.DateOnly(time.Now().In(loc))
	return startDate, endDate, nil
}

func (m *Migrator) siteDailyStatsTotalsBefore(date time.Time) (int64, int64, int64, error) {
	var totalUsers int64
	if err := m.target.Raw(`SELECT COUNT(*) FROM users WHERE created_at < ?`, date).Scan(&totalUsers).Error; err != nil {
		return 0, 0, 0, fmt.Errorf("load previous total user count: %w", err)
	}

	var totalReviews int64
	if err := m.target.Raw(`SELECT COUNT(*) FROM reviews WHERE created_at < ?`, date).Scan(&totalReviews).Error; err != nil {
		return 0, 0, 0, fmt.Errorf("load previous total review count: %w", err)
	}

	var reviewedCourses int64
	if err := m.target.Raw(`
		SELECT COUNT(*)
		FROM (
			SELECT course_id
			FROM reviews
			GROUP BY course_id
			HAVING MIN(created_at) < ?
		) AS reviewed_courses
	`, date).Scan(&reviewedCourses).Error; err != nil {
		return 0, 0, 0, fmt.Errorf("load previous reviewed course count: %w", err)
	}

	return totalUsers, totalReviews, reviewedCourses, nil
}

type dateCountRow struct {
	StatDate string `gorm:"column:stat_date"`
	Count    int64  `gorm:"column:count"`
}

type dateValueRow struct {
	StatDate sql.NullString `gorm:"column:stat_date"`
}

func (m *Migrator) firstDateForTable(query string, loc *time.Location) (time.Time, error) {
	var row dateValueRow
	if err := m.target.Raw(query, loc.String()).Scan(&row).Error; err != nil {
		return time.Time{}, err
	}
	if !row.StatDate.Valid || row.StatDate.String == "" {
		return time.Time{}, nil
	}
	date, err := time.ParseInLocation(stat.DateLayout, row.StatDate.String, loc)
	if err != nil {
		return time.Time{}, err
	}
	return date, nil
}

func (m *Migrator) dailyCountByDate(query string, args ...any) (map[string]int64, error) {
	var rows []dateCountRow
	if err := m.target.Raw(query, args...).Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := make(map[string]int64, len(rows))
	for _, row := range rows {
		if row.StatDate == "" {
			continue
		}
		result[row.StatDate] = row.Count
	}
	return result, nil
}

func resetSequence(db *gorm.DB, table, column string) error {
	return db.Exec(`
		SELECT setval(
			pg_get_serial_sequence(?, ?),
			COALESCE((SELECT MAX(id) FROM `+table+`), 1),
			COALESCE((SELECT MAX(id) FROM `+table+`), 0) > 0
		)
	`, table, column).Error
}

func userRole(row legacyUser) string {
	if row.IsSuperuser {
		return auth.RoleSuperAdmin
	}
	if row.IsStaff {
		return auth.RoleAdmin
	}
	return auth.RoleUser
}

func migratePasswordHash(hash string) string {
	hash = strings.TrimSpace(hash)
	if hash == "" || strings.HasPrefix(hash, "!") {
		return ""
	}
	return hash
}

func legacyDepartmentName(department *legacyDepartment) string {
	if department == nil {
		return ""
	}
	return department.Name
}

func legacySemesterName(semester *legacySemester) string {
	if semester == nil {
		return ""
	}
	return semester.Name
}

func legacyCategoryNames(categories []legacyCategory) []string {
	if len(categories) == 0 {
		return nil
	}
	seen := make(map[string]bool, len(categories))
	names := make([]string, 0, len(categories))
	for _, category := range categories {
		name := strings.TrimSpace(category.Name)
		if name == "" || seen[name] {
			continue
		}
		seen[name] = true
		names = append(names, name)
	}
	return names
}

func legacyTeacherIDs(teachers []legacyTeacher) []int64 {
	if len(teachers) == 0 {
		return nil
	}
	seen := make(map[int]bool, len(teachers))
	ids := make([]int64, 0, len(teachers))
	for _, teacher := range teachers {
		if teacher.ID == 0 || seen[teacher.ID] {
			continue
		}
		seen[teacher.ID] = true
		ids = append(ids, int64(teacher.ID))
	}
	return ids
}

func userLastSeen(row legacyUser, fallback time.Time) time.Time {
	if row.LastSeenAt.Valid {
		return row.LastSeenAt.Time
	}
	if row.LastLogin.Valid {
		return row.LastLogin.Time
	}
	return fallback
}

func nullStringValue(value sql.NullString) string {
	if !value.Valid {
		return ""
	}
	return value.String
}

func intOrZero(value sql.NullInt64) int {
	if !value.Valid {
		return 0
	}
	return int(value.Int64)
}

func floatOrZero(value sql.NullFloat64) float64 {
	if !value.Valid {
		return 0
	}
	return value.Float64
}
