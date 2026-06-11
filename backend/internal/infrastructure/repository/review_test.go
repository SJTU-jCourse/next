package repository_test

import (
	"context"
	"strconv"
	"testing"
	"time"

	"jcourse/internal/domain/point"
	"jcourse/internal/domain/review"
	"jcourse/internal/infrastructure/repository"
)

func TestReviewRepository_Create(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	user := seedUser(t, db)

	r := &review.Review{
		CourseID:  course.ID,
		Semester:  "2024-2025-1",
		UserID:    user.ID,
		Rating:    5,
		Content:   "非常好的课程！",
		Score:     "A",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := repo.Create(ctx, r); err != nil {
		t.Fatalf("Create: %v", err)
	}
	if r.ID == 0 {
		t.Fatal("expected non-zero ID after Create")
	}

	got, err := repo.Get(ctx, r.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if got.CourseID != course.ID {
		t.Errorf("CourseID: got %d, want %d", got.CourseID, course.ID)
	}
	if got.Rating != 5 {
		t.Errorf("Rating: got %d, want 5", got.Rating)
	}
	if got.Content != "非常好的课程！" {
		t.Errorf("Content: got %q, want %q", got.Content, "非常好的课程！")
	}
	if got.Score != "A" {
		t.Errorf("Score: got %q, want A", got.Score)
	}

	var count int64
	db.Model(&repository.CourseEntity{}).Where("id = ?", course.ID).Select("rating_count").Scan(&count)
	if count != 1 {
		t.Errorf("course rating_count: got %d, want 1", count)
	}
}

func TestReviewRepository_CreateWithRewardCreatesSingleRewardPerCourse(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "point_rewards", "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	user := seedUser(t, db)
	otherUser := seedUserRaw(t, db, "reviewreward2", "reviewreward2@example.com")
	now := time.Now()

	firstReview := &review.Review{
		CourseID:  course.ID,
		Semester:  "2024-2025-1",
		UserID:    user.ID,
		Rating:    5,
		Content:   "首评",
		CreatedAt: now,
		UpdatedAt: now,
	}
	firstReward := point.NewCourseFirstReviewReward(user.ID, course.ID, 10, now)
	result, err := repo.CreateWithReward(ctx, firstReview, []point.Reward{*firstReward})
	if err != nil {
		t.Fatalf("CreateWithReward first: %v", err)
	}
	if len(result.RewardIDs) != 1 || result.RewardIDs[0] == 0 {
		t.Fatalf("first reward result=%+v, want reward ID", result)
	}

	secondReview := &review.Review{
		CourseID:  course.ID,
		Semester:  "2024-2025-1",
		UserID:    otherUser.ID,
		Rating:    4,
		Content:   "第二条",
		CreatedAt: now,
		UpdatedAt: now,
	}
	secondReward := point.NewCourseFirstReviewReward(otherUser.ID, course.ID, 10, now)
	result, err = repo.CreateWithReward(ctx, secondReview, []point.Reward{*secondReward})
	if err != nil {
		t.Fatalf("CreateWithReward second: %v", err)
	}
	if len(result.RewardIDs) != 0 {
		t.Fatalf("second reward result=%+v, want no reward IDs", result)
	}

	var count int64
	if err := db.Model(&repository.PointRewardEntity{}).Count(&count).Error; err != nil {
		t.Fatalf("count rewards: %v", err)
	}
	if count != 1 {
		t.Fatalf("reward count = %d, want 1", count)
	}
}

func TestReviewRepository_CreateWithRewardSkipsCourseFirstRewardWhenCourseAlreadyHasReview(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "point_rewards", "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	legacyAuthor := seedUser(t, db)
	newAuthor := seedUserRaw(t, db, "reviewreward3", "reviewreward3@example.com")
	seedReview(t, db, course.ID, legacyAuthor.ID)
	now := time.Now()

	reviewToCreate := &review.Review{
		CourseID:  course.ID,
		Semester:  "2024-2025-1",
		UserID:    newAuthor.ID,
		Rating:    5,
		Content:   "不是课程第一条点评",
		CreatedAt: now,
		UpdatedAt: now,
	}
	reward := point.NewCourseFirstReviewReward(newAuthor.ID, course.ID, 10, now)
	result, err := repo.CreateWithReward(ctx, reviewToCreate, []point.Reward{*reward})
	if err != nil {
		t.Fatalf("CreateWithReward: %v", err)
	}
	if reviewToCreate.ID == 0 {
		t.Fatal("review ID was not set")
	}
	if len(result.RewardIDs) != 0 {
		t.Fatalf("reward IDs = %+v, want none", result.RewardIDs)
	}

	var rewardCount int64
	if err := db.Model(&repository.PointRewardEntity{}).Count(&rewardCount).Error; err != nil {
		t.Fatalf("count rewards: %v", err)
	}
	if rewardCount != 0 {
		t.Fatalf("reward count = %d, want 0", rewardCount)
	}
}

func TestReviewRepository_CreateWithRewardCreatesMultipleRewards(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "point_rewards", "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	user := seedUser(t, db)
	now := time.Now()
	reviewToCreate := &review.Review{
		CourseID:  course.ID,
		Semester:  "2024-2025-1",
		UserID:    user.ID,
		Rating:    5,
		Content:   "触发多个奖励",
		CreatedAt: now,
		UpdatedAt: now,
	}

	result, err := repo.CreateWithReward(ctx, reviewToCreate, []point.Reward{
		*point.NewCourseFirstReviewReward(user.ID, course.ID, 10, now),
		*point.NewReviewCreateReward(user.ID, 2, now),
	})
	if err != nil {
		t.Fatalf("CreateWithReward: %v", err)
	}
	if len(result.RewardIDs) != 2 {
		t.Fatalf("reward IDs = %+v, want 2 IDs", result.RewardIDs)
	}

	var count int64
	if err := db.Model(&repository.PointRewardEntity{}).Count(&count).Error; err != nil {
		t.Fatalf("count rewards: %v", err)
	}
	if count != 2 {
		t.Fatalf("reward count = %d, want 2", count)
	}

	var reviewCreateReward repository.PointRewardEntity
	if err := db.Where("reason = ?", string(point.RewardReasonReviewCreate)).Take(&reviewCreateReward).Error; err != nil {
		t.Fatalf("find review create reward: %v", err)
	}
	if reviewCreateReward.SourceType != point.RewardSourceTypeReview || reviewCreateReward.SourceKey != strconv.Itoa(reviewToCreate.ID) {
		t.Fatalf("review create reward source = %s/%s, want review/%d", reviewCreateReward.SourceType, reviewCreateReward.SourceKey, reviewToCreate.ID)
	}
}

func TestReviewRepository_Update(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	user := seedUser(t, db)
	entity := seedReview(t, db, course.ID, user.ID)

	r, err := repo.Get(ctx, entity.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	originalContent := r.Content
	rv := r.MakeRevision(user.ID)
	r.Content = "更新后的评价"
	r.Rating = 4
	r.Score = "B"
	r.UpdatedAt = time.Now()

	if err := repo.Update(ctx, r, rv); err != nil {
		t.Fatalf("Update: %v", err)
	}

	got, err := repo.Get(ctx, entity.ID)
	if err != nil {
		t.Fatalf("Get after update: %v", err)
	}
	if got.Content != "更新后的评价" {
		t.Errorf("Content: got %q, want %q", got.Content, "更新后的评价")
	}
	if got.Rating != 4 {
		t.Errorf("Rating: got %d, want 4", got.Rating)
	}
	if got.Score != "B" {
		t.Errorf("Score: got %q, want B", got.Score)
	}

	revisions, err := repo.FindRevisions(ctx, entity.ID)
	if err != nil {
		t.Fatalf("FindRevisions: %v", err)
	}
	if len(revisions) != 1 {
		t.Fatalf("revisions count: got %d, want 1", len(revisions))
	}
	if revisions[0].Content != originalContent {
		t.Errorf("revision Content: got %q, want %q", revisions[0].Content, originalContent)
	}
}

func TestReviewRepository_UpdateModeratorRemark(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	user := seedUser(t, db)
	entity := seedReview(t, db, course.ID, user.ID)

	if err := repo.UpdateModeratorRemark(ctx, entity.ID, "管理员已核实"); err != nil {
		t.Fatalf("UpdateModeratorRemark: %v", err)
	}

	got, err := repo.Get(ctx, entity.ID)
	if err != nil {
		t.Fatalf("Get after update moderator remark: %v", err)
	}
	if got.ModeratorRemark != "管理员已核实" {
		t.Errorf("ModeratorRemark: got %q, want 管理员已核实", got.ModeratorRemark)
	}

	revisions, err := repo.FindRevisions(ctx, entity.ID)
	if err != nil {
		t.Fatalf("FindRevisions: %v", err)
	}
	if len(revisions) != 0 {
		t.Fatalf("revisions count after moderator remark update: got %d, want 0", len(revisions))
	}
}

func TestReviewRepository_Delete(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	user := seedUser(t, db)
	entity := seedReview(t, db, course.ID, user.ID)

	if err := repo.Delete(ctx, &review.Review{ID: entity.ID, CourseID: course.ID}); err != nil {
		t.Fatalf("Delete: %v", err)
	}

	got, err := repo.Get(ctx, entity.ID)
	if err != nil {
		t.Fatalf("Get after Delete: %v", err)
	}
	if got != nil {
		t.Fatalf("Get after Delete got %+v, want nil", got)
	}

	var count int64
	db.Model(&repository.CourseEntity{}).Where("id = ?", course.ID).Select("rating_count").Scan(&count)
	if count != 0 {
		t.Errorf("course rating_count after delete: got %d, want 0", count)
	}
}

func TestReviewRepository_Get_NotFound(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	got, err := repo.Get(ctx, 999999)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if got != nil {
		t.Fatalf("Get got %+v, want nil", got)
	}
}

func TestReviewRepository_FindBy(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	user := seedUser(t, db)
	otherUser := seedUserRaw(t, db, "findbyuser2", "findbyuser2@example.com")
	otherCourse := seedCourseRaw(t, db, "CS102", "算法设计", 3.0, "计算机学院", teacher.ID, "zh", nil, nil)

	r1 := repository.ReviewEntity{
		CourseID: course.ID, Semester: "2024-2025-1", UserID: user.ID,
		Rating: 5, Content: "很好", Score: "A",
		CreatedAt: time.Now(), UpdatedAt: time.Now().Add(3 * time.Hour),
	}
	r2 := repository.ReviewEntity{
		CourseID: course.ID, Semester: "2024-2025-2", UserID: otherUser.ID,
		Rating: 3, Content: "一般", Score: "C",
		CreatedAt: time.Now().Add(time.Hour), UpdatedAt: time.Now().Add(time.Hour),
	}
	r3 := repository.ReviewEntity{
		CourseID: otherCourse.ID, Semester: "2024-2025-2", UserID: user.ID,
		Rating: 4, Content: "一般", Score: "B",
		CreatedAt: time.Now().Add(2 * time.Hour), UpdatedAt: time.Now().Add(2 * time.Hour),
	}
	for _, r := range []repository.ReviewEntity{r1, r2, r3} {
		if err := db.Create(&r).Error; err != nil {
			t.Fatalf("seed review: %v", err)
		}
	}

	t.Run("find by course", func(t *testing.T) {
		results, _, err := repo.FindBy(ctx, review.ReviewFilter{CourseID: course.ID})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if len(results) != 2 {
			t.Errorf("count: got %d, want 2", len(results))
		}
		if results[0].Content != "很好" {
			t.Errorf("first review content: got %q, want 很好", results[0].Content)
		}
	})

	t.Run("find by semester", func(t *testing.T) {
		results, _, err := repo.FindBy(ctx, review.ReviewFilter{Semester: "2024-2025-1"})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if len(results) != 1 {
			t.Errorf("count: got %d, want 1", len(results))
		}
		if results[0].Rating != 5 {
			t.Errorf("Rating: got %d, want 5", results[0].Rating)
		}
	})

	t.Run("find by rating", func(t *testing.T) {
		results, _, err := repo.FindBy(ctx, review.ReviewFilter{Rating: 5})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if len(results) != 1 {
			t.Errorf("count: got %d, want 1", len(results))
		}
	})

	t.Run("find by user", func(t *testing.T) {
		results, _, err := repo.FindBy(ctx, review.ReviewFilter{UserID: user.ID})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if len(results) != 2 {
			t.Errorf("count: got %d, want 2", len(results))
		}
	})

	t.Run("find by course and semester", func(t *testing.T) {
		results, _, err := repo.FindBy(ctx, review.ReviewFilter{CourseID: course.ID, Semester: "2024-2025-1"})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if len(results) != 1 {
			t.Errorf("count: got %d, want 1", len(results))
		}
	})

	t.Run("find by course_ids", func(t *testing.T) {
		results, _, err := repo.FindBy(ctx, review.ReviewFilter{CourseIDs: []int{course.ID}})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if len(results) != 2 {
			t.Errorf("count: got %d, want 2", len(results))
		}
	})

	t.Run("exclude course_ids", func(t *testing.T) {
		results, _, err := repo.FindBy(ctx, review.ReviewFilter{ExcludeCourseIDs: []int{course.ID}})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if len(results) != 1 {
			t.Errorf("count: got %d, want 1", len(results))
		}
	})

	t.Run("with course filters and sorts on review columns", func(t *testing.T) {
		results, total, err := repo.FindBy(ctx, review.ReviewFilter{
			UserID:       user.ID,
			CreatedAfter: time.Now().Add(-time.Hour),
			OrderBy:      "created_at",
			WithCourse:   true,
		})
		if err != nil {
			t.Fatalf("FindBy WithCourse: %v", err)
		}
		if total != 2 || len(results) != 2 {
			t.Fatalf("count: got total=%d len=%d, want 2", total, len(results))
		}
		if results[0].Content != "一般" {
			t.Errorf("first review content: got %q, want 一般", results[0].Content)
		}
		if results[0].Course == nil {
			t.Fatal("expected course to be loaded")
		}
		if results[0].Course.MainTeacher == nil {
			t.Fatal("expected course main teacher to be loaded")
		}
	})

	t.Run("sorts ascending when requested", func(t *testing.T) {
		results, total, err := repo.FindBy(ctx, review.ReviewFilter{
			UserID:  user.ID,
			OrderBy: "created_at",
			Ascend:  true,
		})
		if err != nil {
			t.Fatalf("FindBy ascending: %v", err)
		}
		if total != 2 || len(results) != 2 {
			t.Fatalf("count: got total=%d len=%d, want 2", total, len(results))
		}
		if results[0].Content != "很好" {
			t.Errorf("first review content: got %q, want 很好", results[0].Content)
		}
	})
}

func TestReviewRepository_GetCourseTrend(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	otherCourse := seedCourseRaw(t, db, "CS102", "算法设计", 3, "计算机学院", teacher.ID, "zh", []string{"核心课"}, []string{"2022"})
	users := []repository.UserEntity{
		seedUser(t, db),
		seedUserRaw(t, db, "trenduser2", "trenduser2@example.com"),
		seedUserRaw(t, db, "trenduser3", "trenduser3@example.com"),
		seedUserRaw(t, db, "trenduser4", "trenduser4@example.com"),
		seedUserRaw(t, db, "trenduser5", "trenduser5@example.com"),
	}
	now := time.Now()

	rows := []repository.ReviewEntity{
		{CourseID: course.ID, Semester: "2024-2025-1", UserID: users[0].ID, Rating: 4, Content: "好", CreatedAt: now, UpdatedAt: now},
		{CourseID: course.ID, Semester: "2024-2025-1", UserID: users[1].ID, Rating: 2, Content: "一般", CreatedAt: now, UpdatedAt: now},
		{CourseID: course.ID, Semester: "2024-2025-2", UserID: users[2].ID, Rating: 5, Content: "很好", CreatedAt: now, UpdatedAt: now},
		{CourseID: course.ID, Semester: "", UserID: users[3].ID, Rating: 1, Content: "无学期", CreatedAt: now, UpdatedAt: now},
		{CourseID: otherCourse.ID, Semester: "2024-2025-1", UserID: users[4].ID, Rating: 1, Content: "其他课程", CreatedAt: now, UpdatedAt: now},
	}
	for _, row := range rows {
		if err := db.Create(&row).Error; err != nil {
			t.Fatalf("seed review: %v", err)
		}
	}

	trend, err := repo.GetCourseTrend(ctx, course.ID)
	if err != nil {
		t.Fatalf("GetCourseTrend: %v", err)
	}
	if len(trend) != 2 {
		t.Fatalf("trend count: got %d, want 2", len(trend))
	}
	if trend[0].Semester != "2024-2025-1" || trend[0].Count != 2 || trend[0].Avg != 3 {
		t.Errorf("first trend item = %+v, want semester 2024-2025-1 count 2 avg 3", trend[0])
	}
	if trend[1].Semester != "2024-2025-2" || trend[1].Count != 1 || trend[1].Avg != 5 {
		t.Errorf("second trend item = %+v, want semester 2024-2025-2 count 1 avg 5", trend[1])
	}
}

func TestReviewRepository_SearchVector(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	users := []repository.UserEntity{
		seedUser(t, db),
		seedUserRaw(t, db, "searchuser2", "searchuser2@example.com"),
		seedUserRaw(t, db, "searchuser3", "searchuser3@example.com"),
		seedUserRaw(t, db, "searchuser4", "searchuser4@example.com"),
		seedUserRaw(t, db, "searchuser5", "searchuser5@example.com"),
	}

	rows := []repository.ReviewEntity{
		{CourseID: course.ID, Semester: "2024-2025-1", UserID: users[0].ID, Rating: 5, Content: "这门数据结构课非常好，讲解清晰", Score: "A", CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{CourseID: course.ID, Semester: "2024-2025-1", UserID: users[1].ID, Rating: 4, Content: "算法设计的内容很有深度", Score: "B+", CreatedAt: time.Now().Add(time.Hour), UpdatedAt: time.Now().Add(time.Hour)},
		{CourseID: course.ID, Semester: "2024-2025-2", UserID: users[2].ID, Rating: 3, Content: "课程作业太多了", Score: "C", CreatedAt: time.Now().Add(2 * time.Hour), UpdatedAt: time.Now().Add(2 * time.Hour)},
	}
	for _, r := range rows {
		if err := db.Create(&r).Error; err != nil {
			t.Fatalf("seed review: %v", err)
		}
	}
	if err := repository.RefreshReviewSearchVectors(db); err != nil {
		t.Fatalf("RefreshReviewSearchVectors: %v", err)
	}

	t.Run("search by q content", func(t *testing.T) {
		results, total, err := repo.FindBy(ctx, review.ReviewFilter{Q: "数据结构"})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if total != 1 {
			t.Errorf("total: got %d, want 1", total)
		}
		if len(results) == 0 || results[0].Content != "这门数据结构课非常好，讲解清晰" {
			t.Errorf("Content: got %v", results)
		}
	})

	t.Run("search by q combined with filter", func(t *testing.T) {
		results, total, err := repo.FindBy(ctx, review.ReviewFilter{Q: "课程", Semester: "2024-2025-2"})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if total != 1 {
			t.Errorf("total: got %d, want 1", total)
		}
		if len(results) == 0 || results[0].Semester != "2024-2025-2" {
			t.Errorf("Semester: got %v", results)
		}
	})

	t.Run("search by q ignores score", func(t *testing.T) {
		_, total, err := repo.FindBy(ctx, review.ReviewFilter{Q: "B+"})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if total != 0 {
			t.Errorf("total: got %d, want 0", total)
		}
	})

	t.Run("search by q no match", func(t *testing.T) {
		_, total, err := repo.FindBy(ctx, review.ReviewFilter{Q: "不存在的关键词"})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if total != 0 {
			t.Errorf("total: got %d, want 0", total)
		}
	})

	t.Run("search vector refreshed on create", func(t *testing.T) {
		r := &review.Review{
			CourseID:  course.ID,
			Semester:  "2024-2025-1",
			UserID:    users[3].ID,
			Rating:    5,
			Content:   "高等数学的进阶内容",
			Score:     "A+",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := repo.Create(ctx, r); err != nil {
			t.Fatalf("Create: %v", err)
		}

		results, total, err := repo.FindBy(ctx, review.ReviewFilter{Q: "高等数学"})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if total != 1 {
			t.Errorf("total after create: got %d, want 1", total)
		}
		if len(results) == 0 || results[0].ID != r.ID {
			t.Errorf("ID: got %v, want %d", results, r.ID)
		}
	})

	t.Run("search vector refreshed on update", func(t *testing.T) {
		entity := seedReview(t, db, course.ID, users[4].ID)
		if err := repository.RefreshReviewSearchVectors(db); err != nil {
			t.Fatalf("RefreshReviewSearchVectors: %v", err)
		}

		r, err := repo.Get(ctx, entity.ID)
		if err != nil {
			t.Fatalf("Get: %v", err)
		}
		rv := r.MakeRevision(users[4].ID)
		r.Content = "线性代数的内容很有趣"
		r.UpdatedAt = time.Now()

		if err := repo.Update(ctx, r, rv); err != nil {
			t.Fatalf("Update: %v", err)
		}

		results, total, err := repo.FindBy(ctx, review.ReviewFilter{Q: "线性代数"})
		if err != nil {
			t.Fatalf("FindBy: %v", err)
		}
		if total < 1 {
			t.Errorf("total after update: got %d, want >= 1", total)
		}
		found := false
		for _, v := range results {
			if v.ID == r.ID {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("updated review not found by search, results: %v", results)
		}
	})
}

func TestReviewRepository_CourseStatsAggregation(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	users := []repository.UserEntity{
		seedUser(t, db),
		seedUserRaw(t, db, "statsuser2", "statsuser2@example.com"),
		seedUserRaw(t, db, "statsuser3", "statsuser3@example.com"),
	}

	ratings := []int{5, 4, 3}
	for i, rating := range ratings {
		r := &review.Review{
			CourseID:  course.ID,
			Semester:  "2024-2025-1",
			UserID:    users[i].ID,
			Rating:    rating,
			Content:   "评价内容",
			Score:     "B",
			CreatedAt: time.Now().Add(time.Duration(i) * time.Minute),
			UpdatedAt: time.Now().Add(time.Duration(i) * time.Minute),
		}
		if err := repo.Create(ctx, r); err != nil {
			t.Fatalf("Create review: %v", err)
		}
	}

	var c repository.CourseEntity
	if err := db.Where("id = ?", course.ID).Take(&c).Error; err != nil {
		t.Fatalf("fetch course: %v", err)
	}
	if c.RatingCount != 3 {
		t.Errorf("ReviewCount: got %d, want 3", c.RatingCount)
	}
	avg := float64(5+4+3) / 3
	if c.RatingAvg != avg {
		t.Errorf("AvgRating: got %v, want %v", c.RatingAvg, avg)
	}
	if c.RatingScore != avg {
		t.Errorf("RatingScore: got %v, want %v", c.RatingScore, avg)
	}
}

func TestReviewRepository_GetCourseFilters(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	otherCourse := seedCourseRaw(t, db, "CS102", "算法设计", 3.0, "计算机学院", teacher.ID, "zh", nil, nil)
	user := seedUser(t, db)
	user2 := seedUserRaw(t, db, "filteruser2", "filteruser2@example.com")
	user3 := seedUserRaw(t, db, "filteruser3", "filteruser3@example.com")

	rows := []repository.ReviewEntity{
		{CourseID: course.ID, Semester: "2024-2025-2", UserID: user.ID, Rating: 5, Content: "很好", CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{CourseID: course.ID, Semester: "2024-2025-2", UserID: user2.ID, Rating: 4, Content: "不错", CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{CourseID: course.ID, Semester: "2024-2025-1", UserID: user3.ID, Rating: 5, Content: "推荐", CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{CourseID: otherCourse.ID, Semester: "2024-2025-2", UserID: user.ID, Rating: 1, Content: "其他课程", CreatedAt: time.Now(), UpdatedAt: time.Now()},
	}
	for _, row := range rows {
		if err := db.Create(&row).Error; err != nil {
			t.Fatalf("seed review: %v", err)
		}
	}

	filters, err := repo.GetCourseFilters(ctx, course.ID)
	if err != nil {
		t.Fatalf("GetCourseFilters: %v", err)
	}

	if len(filters.Semesters) != 2 {
		t.Fatalf("semester filter count: got %d, want 2", len(filters.Semesters))
	}
	if filters.Semesters[0].Name != "2024-2025-2" || filters.Semesters[0].Count != 2 {
		t.Errorf("first semester: got %+v, want 2024-2025-2 count 2", filters.Semesters[0])
	}
	if len(filters.Ratings) != 5 {
		t.Fatalf("rating filter count: got %d, want 5", len(filters.Ratings))
	}
	if filters.Ratings[0].Name != "5" || filters.Ratings[0].Count != 2 {
		t.Errorf("5-star rating: got %+v, want count 2", filters.Ratings[0])
	}
	if filters.Ratings[4].Name != "1" || filters.Ratings[4].Count != 0 {
		t.Errorf("1-star rating: got %+v, want count 0", filters.Ratings[4])
	}
}

func TestReviewRepository_FindRevisions(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)
	ctx := context.Background()

	cleanTables(t, db, "reviews", "review_revisions", "courses", "teachers", "users")

	teacher := seedTeacher(t, db)
	course := seedCourse(t, db, teacher.ID)
	user := seedUser(t, db)
	entity := seedReview(t, db, course.ID, user.ID)

	r, _ := repo.Get(ctx, entity.ID)
	rv1 := r.MakeRevision(user.ID)
	r.Content = "第一次更新"
	r.Rating = 4
	r.UpdatedAt = time.Now()
	repo.Update(ctx, r, rv1)

	rv2 := r.MakeRevision(user.ID)
	r.Content = "第二次更新"
	r.Rating = 3
	r.UpdatedAt = time.Now()
	repo.Update(ctx, r, rv2)

	revs, err := repo.FindRevisions(ctx, entity.ID)
	if err != nil {
		t.Fatalf("FindRevisions: %v", err)
	}
	if len(revs) != 2 {
		t.Fatalf("revisions count: got %d, want 2", len(revs))
	}
}
