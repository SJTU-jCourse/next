package repository

import (
	"context"
	"errors"
	"strconv"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"jcourse/internal/domain/course"
	"jcourse/internal/domain/point"
	"jcourse/internal/domain/review"
)

func newReviewEntity(r *review.Review) ReviewEntity {
	return ReviewEntity{
		ID:              r.ID,
		CourseID:        r.CourseID,
		Semester:        r.Semester,
		UserID:          r.UserID,
		Rating:          r.Rating,
		Content:         r.Content,
		Score:           r.Score,
		ModeratorRemark: r.ModeratorRemark,
		CreatedAt:       r.CreatedAt,
		UpdatedAt:       r.UpdatedAt,
	}
}

func newReviewDomain(e *ReviewEntity) review.Review {
	return review.Review{
		ID:              e.ID,
		CourseID:        e.CourseID,
		Semester:        e.Semester,
		UserID:          e.UserID,
		Rating:          e.Rating,
		Content:         e.Content,
		Score:           e.Score,
		ModeratorRemark: e.ModeratorRemark,
		CreatedAt:       e.CreatedAt,
		UpdatedAt:       e.UpdatedAt,
	}
}

func newReviewRevisionEntity(r review.Revision) ReviewRevisionEntity {
	return ReviewRevisionEntity{
		ID:        r.ID,
		ReviewID:  r.ReviewID,
		CourseID:  r.CourseID,
		Semester:  r.Semester,
		CreatedBy: r.CreatedBy,
		Rating:    r.Rating,
		Content:   r.Content,
		Score:     r.Score,
		CreatedAt: r.CreatedAt,
	}
}

func newReviewRevisionQuery(e *ReviewRevisionEntity) review.RevisionView {
	return review.RevisionView{
		ID:        e.ID,
		ReviewID:  e.ReviewID,
		CourseID:  e.CourseID,
		Semester:  e.Semester,
		CreatedBy: e.CreatedBy,
		Rating:    e.Rating,
		Content:   e.Content,
		Score:     e.Score,
		CreatedAt: e.CreatedAt,
	}
}

func newReviewView(e *ReviewEntity) review.ReviewView {
	v := review.ReviewView{
		ID:              e.ID,
		CourseID:        e.CourseID,
		Semester:        e.Semester,
		UserID:          e.UserID,
		Rating:          e.Rating,
		Content:         e.Content,
		Score:           e.Score,
		ModeratorRemark: e.ModeratorRemark,
		Vote: review.ReviewVoteStats{
			LikeCount:    e.LikeCount,
			DislikeCount: e.DislikeCount,
		},
		CreatedAt: e.CreatedAt,
		UpdatedAt: e.UpdatedAt,
	}
	if e.Course != nil {
		v.Course = newCourseViewFromEntity(e.Course)
	}
	return v
}

type ReviewRepository struct {
	db           *gorm.DB
	cache        *redis.Client
	searchConfig string
	ratingScore  course.RatingScoreConfig
}

func (r2 *ReviewRepository) deleteReviewCache(ctx context.Context, reviewID, courseID int) {
	keys := []string{
		cacheKey("review", reviewID),
		cacheKey("review", reviewID, "view"),
	}
	if courseID > 0 {
		keys = append(keys,
			cacheKey("course", courseID),
			cacheKey("course", courseID, "detail"),
			cacheKey("review", "course", courseID, "filters"),
			cacheKey("review", "course", courseID, "trend"),
		)
	}
	cacheDelete(ctx, r2.cache, keys...)
}

func (r2 *ReviewRepository) updateCourseStats(tx *gorm.DB, courseID int) error {
	priorCount := r2.ratingScore.Normalized().PriorCount
	return tx.Exec(`
		WITH global_rating AS (
			SELECT COALESCE(AVG(rating), 0)::double precision AS avg_rating
			FROM reviews
		), course_rating AS (
			SELECT
				course_id,
				COUNT(*)::double precision AS rating_count,
				AVG(rating)::double precision AS rating_avg
			FROM reviews
			WHERE course_id = ?
			GROUP BY course_id
		)
		UPDATE courses AS c SET
			rating_count = COALESCE(cr.rating_count, 0)::integer,
			rating_avg = COALESCE(cr.rating_avg, 0),
			rating_score = CASE
				WHEN COALESCE(cr.rating_count, 0) = 0 THEN 0
				ELSE ((cr.rating_avg * cr.rating_count) + (? * gr.avg_rating)) / (cr.rating_count + ?)
			END
		FROM global_rating AS gr
		LEFT JOIN course_rating AS cr ON true
		WHERE c.id = ?
	`, courseID, priorCount, priorCount, courseID).Error
}

func (r2 *ReviewRepository) FindBy(ctx context.Context, filter review.ReviewFilter) ([]review.ReviewView, int64, error) {
	db := r2.db.WithContext(ctx).Model(&ReviewEntity{})

	if filter.WithCourse {
		db = db.Joins("Course").Joins("Course.MainTeacher")
	}

	db = r2.applyFilter(db, filter)

	var total int64
	countKey := reviewFindByCountCacheKey(filter)
	if cached, ok := cacheGetJSON[int64](ctx, r2.cache, countKey); ok {
		total = *cached
	} else {
		if err := db.Count(&total).Error; err != nil {
			return nil, 0, err
		}
		cacheSetJSONWithTTL(ctx, r2.cache, countKey, total, findByCountCacheTTL)
	}

	db = r2.applySort(db, filter)
	db = r2.applyPagination(db, filter)

	var entities []ReviewEntity
	if err := db.Find(&entities).Error; err != nil {
		return nil, 0, err
	}

	rs := make([]review.ReviewView, len(entities))
	for i, e := range entities {
		rs[i] = newReviewView(&e)
	}
	return rs, total, nil
}

func (r2 *ReviewRepository) GetByID(ctx context.Context, reviewID int) (*review.ReviewView, error) {
	key := cacheKey("review", reviewID, "view")
	if cached, ok := cacheGetJSON[review.ReviewView](ctx, r2.cache, key); ok {
		return cached, nil
	}

	var entity ReviewEntity
	if err := r2.db.WithContext(ctx).
		Joins("Course").
		Joins("Course.MainTeacher").
		Where("reviews.id = ?", reviewID).
		Take(&entity).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	view := newReviewView(&entity)
	cacheSetJSON(ctx, r2.cache, key, &view)
	return &view, nil
}

func (r2 *ReviewRepository) GetCourseFilters(ctx context.Context, courseID int) (*review.ReviewFilters, error) {
	key := cacheKey("review", "course", courseID, "filters")
	if cached, ok := cacheGetJSON[review.ReviewFilters](ctx, r2.cache, key); ok {
		return cached, nil
	}

	var semesters []review.FilterItem
	if err := r2.db.WithContext(ctx).
		Model(&ReviewEntity{}).
		Select("semester AS name, COUNT(*) AS count").
		Where("course_id = ? AND semester <> ''", courseID).
		Group("semester").
		Order("semester DESC").
		Scan(&semesters).Error; err != nil {
		return nil, err
	}

	type ratingCount struct {
		Rating int
		Count  int
	}
	var rows []ratingCount
	if err := r2.db.WithContext(ctx).
		Model(&ReviewEntity{}).
		Select("rating, COUNT(*) AS count").
		Where("course_id = ?", courseID).
		Group("rating").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	counts := make(map[int]int, len(rows))
	for _, row := range rows {
		counts[row.Rating] = row.Count
	}
	ratings := make([]review.FilterItem, 0, 5)
	for rating := 5; rating >= 1; rating-- {
		ratings = append(ratings, review.FilterItem{
			Name:  strconv.Itoa(rating),
			Count: counts[rating],
		})
	}

	filters := &review.ReviewFilters{Semesters: semesters, Ratings: ratings}
	cacheSetJSON(ctx, r2.cache, key, filters)
	return filters, nil
}

func (r2 *ReviewRepository) GetCourseTrend(ctx context.Context, courseID int) ([]review.ReviewTrendItem, error) {
	key := cacheKey("review", "course", courseID, "trend")
	if cached, ok := cacheGetJSON[[]review.ReviewTrendItem](ctx, r2.cache, key); ok {
		return *cached, nil
	}

	var items []review.ReviewTrendItem
	if err := r2.db.WithContext(ctx).
		Model(&ReviewEntity{}).
		Select("semester, AVG(rating) AS avg, COUNT(*) AS count").
		Where("course_id = ? AND semester <> ''", courseID).
		Group("semester").
		Order("semester ASC").
		Scan(&items).Error; err != nil {
		return nil, err
	}
	cacheSetJSON(ctx, r2.cache, key, items)
	return items, nil
}

func (r2 *ReviewRepository) applyFilter(db *gorm.DB, filter review.ReviewFilter) *gorm.DB {
	if filter.ReviewID != 0 {
		db = db.Where("reviews.id = ?", filter.ReviewID)
	}
	if filter.CourseID != 0 {
		db = db.Where("reviews.course_id = ?", filter.CourseID)
	}
	if len(filter.CourseIDs) > 0 {
		db = db.Where("reviews.course_id IN ?", filter.CourseIDs)
	}
	if len(filter.ExcludeCourseIDs) > 0 {
		db = db.Where("reviews.course_id NOT IN ?", filter.ExcludeCourseIDs)
	}
	if filter.UserID != 0 {
		db = db.Where("reviews.user_id = ?", filter.UserID)
	}
	if filter.Q != "" {
		db = applySearchVectorFilter(db, r2.searchConfig, "reviews.search_vector", filter.Q)
	}
	if filter.Semester != "" {
		db = db.Where("reviews.semester = ?", filter.Semester)
	}
	if filter.Rating != 0 {
		db = db.Where("reviews.rating = ?", filter.Rating)
	}
	if !filter.CreatedAfter.IsZero() {
		db = db.Where("reviews.created_at > ?", filter.CreatedAfter)
	}
	return db
}

func (r2 *ReviewRepository) applySort(db *gorm.DB, filter review.ReviewFilter) *gorm.DB {
	desc := !filter.Ascend
	if searchQuery(filter.Q) != "" && filter.OrderBy == "" {
		db = db.Order(clause.Expr{
			SQL:  searchRankOrder("reviews.search_vector", filter.Q),
			Vars: []any{r2.searchConfig, searchQuery(filter.Q)},
		})
	}
	order := clause.OrderByColumn{Column: clause.Column{Table: "reviews", Name: "updated_at"}, Desc: desc}
	switch filter.OrderBy {
	case "rating":
		order = clause.OrderByColumn{Column: clause.Column{Table: "reviews", Name: "rating"}, Desc: desc}
	case "like_count":
		order = clause.OrderByColumn{Column: clause.Column{Table: "reviews", Name: "like_count"}, Desc: desc}
	case "created_at":
		order = clause.OrderByColumn{Column: clause.Column{Table: "reviews", Name: "created_at"}, Desc: desc}
	case "updated_at":
		order = clause.OrderByColumn{Column: clause.Column{Table: "reviews", Name: "updated_at"}, Desc: desc}
	}
	return db.Order(order).Order(clause.OrderByColumn{Column: clause.Column{Table: "reviews", Name: "id"}, Desc: desc})
}

func (r2 *ReviewRepository) applyPagination(db *gorm.DB, filter review.ReviewFilter) *gorm.DB {
	if filter.Page > 0 && filter.PageSize > 0 {
		offset := (filter.Page - 1) * filter.PageSize
		db = db.Offset(offset).Limit(filter.PageSize)
	}
	return db
}

func (r2 *ReviewRepository) FindRevisions(ctx context.Context, reviewID int) ([]review.RevisionView, error) {
	es, err := gorm.G[ReviewRevisionEntity](r2.db).Where("review_id = ?", reviewID).Order("created_at DESC, id DESC").Find(ctx)
	if err != nil {
		return nil, err
	}
	rs := make([]review.RevisionView, len(es))
	for i, e := range es {
		rs[i] = newReviewRevisionQuery(&e)
	}
	return rs, nil
}

func (r2 *ReviewRepository) Create(ctx context.Context, r *review.Review) error {
	_, err := r2.create(ctx, r, nil)
	return err
}

func (r2 *ReviewRepository) CreateWithReward(ctx context.Context, r *review.Review, rewards []point.Reward) (review.CreateResult, error) {
	return r2.create(ctx, r, rewards)
}

func (r2 *ReviewRepository) create(ctx context.Context, r *review.Review, rewards []point.Reward) (review.CreateResult, error) {
	e := newReviewEntity(r)
	createResult := review.CreateResult{}
	if err := r2.db.Transaction(func(tx *gorm.DB) error {
		eligibleRewards, err := eligibleCreateReviewRewards(ctx, tx, r, rewards)
		if err != nil {
			return err
		}

		if err := gorm.G[ReviewEntity](tx).Create(ctx, &e); err != nil {
			return err
		}
		if err := refreshReviewSearchVector(tx, r2.searchConfig, e.ID); err != nil {
			return err
		}
		if err := r2.updateCourseStats(tx, r.CourseID); err != nil {
			return err
		}
		eligibleRewards = materializeCreateReviewRewards(e.ID, eligibleRewards)
		for i := range eligibleRewards {
			rewardEntity := newPointRewardEntity(&eligibleRewards[i])
			insertResult := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "reason"}, {Name: "source_type"}, {Name: "source_key"}},
				DoNothing: true,
			}).Create(&rewardEntity)
			if insertResult.Error != nil {
				return insertResult.Error
			}
			if insertResult.RowsAffected > 0 {
				eligibleRewards[i].ID = rewardEntity.ID
				createResult.RewardIDs = append(createResult.RewardIDs, rewardEntity.ID)
			}
		}
		return nil
	}); err != nil {
		return review.CreateResult{}, err
	}

	r.ID = e.ID
	r2.deleteReviewCache(ctx, r.ID, r.CourseID)
	cacheDelete(ctx, r2.cache, cacheKey("course", "filters"))
	return createResult, nil
}

type createReviewRewardEligibilityFunc func(ctx context.Context, tx *gorm.DB, r *review.Review, reward point.Reward) (bool, error)

var createReviewRewardEligibility = map[point.RewardReason]createReviewRewardEligibilityFunc{
	point.RewardReasonCourseFirstReview: courseFirstReviewRewardEligible,
}

func eligibleCreateReviewRewards(ctx context.Context, tx *gorm.DB, r *review.Review, rewards []point.Reward) ([]point.Reward, error) {
	eligible := make([]point.Reward, 0, len(rewards))
	for _, reward := range rewards {
		check, ok := createReviewRewardEligibility[reward.Reason]
		if !ok {
			eligible = append(eligible, reward)
			continue
		}
		ok, err := check(ctx, tx, r, reward)
		if err != nil {
			return nil, err
		}
		if ok {
			eligible = append(eligible, reward)
		}
	}
	return eligible, nil
}

func courseFirstReviewRewardEligible(ctx context.Context, tx *gorm.DB, r *review.Review, _ point.Reward) (bool, error) {
	if err := tx.WithContext(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).
		Select("id").
		Where("id = ?", r.CourseID).
		Take(&CourseEntity{}).Error; err != nil {
		return false, err
	}

	var count int64
	if err := tx.WithContext(ctx).Model(&ReviewEntity{}).Where("course_id = ?", r.CourseID).Count(&count).Error; err != nil {
		return false, err
	}
	return count == 0, nil
}

type createReviewRewardMaterializerFunc func(reviewID int, reward point.Reward) point.Reward

var createReviewRewardMaterializers = map[point.RewardReason]createReviewRewardMaterializerFunc{
	point.RewardReasonReviewCreate: materializeReviewCreateReward,
}

func materializeCreateReviewRewards(reviewID int, rewards []point.Reward) []point.Reward {
	materialized := make([]point.Reward, 0, len(rewards))
	for _, reward := range rewards {
		materialize, ok := createReviewRewardMaterializers[reward.Reason]
		if ok {
			reward = materialize(reviewID, reward)
		}
		materialized = append(materialized, reward)
	}
	return materialized
}

func materializeReviewCreateReward(reviewID int, reward point.Reward) point.Reward {
	reward.SourceType = point.RewardSourceTypeReview
	reward.SourceKey = strconv.Itoa(reviewID)
	return reward
}

func (r2 *ReviewRepository) Update(ctx context.Context, r *review.Review, rv review.Revision) error {
	e := newReviewEntity(r)
	if err := r2.db.Transaction(func(tx *gorm.DB) error {
		rr := newReviewRevisionEntity(rv)
		if _, err := gorm.G[ReviewEntity](tx).Where("id = ?", e.ID).Updates(ctx, e); err != nil {
			return err
		}
		if err := refreshReviewSearchVector(tx, r2.searchConfig, e.ID); err != nil {
			return err
		}
		if err := gorm.G[ReviewRevisionEntity](tx).Create(ctx, &rr); err != nil {
			return err
		}
		return r2.updateCourseStats(tx, r.CourseID)
	}); err != nil {
		return err
	}

	r.ID = e.ID
	r2.deleteReviewCache(ctx, r.ID, r.CourseID)
	return nil
}

func (r2 *ReviewRepository) UpdateModeratorRemark(ctx context.Context, reviewID int, moderatorRemark string) error {
	if err := r2.db.WithContext(ctx).Model(&ReviewEntity{}).
		Where("id = ?", reviewID).
		Update("moderator_remark", moderatorRemark).Error; err != nil {
		return err
	}
	r2.deleteReviewCache(ctx, reviewID, 0)
	return nil
}

func (r2 *ReviewRepository) Delete(ctx context.Context, r *review.Review) error {
	if err := r2.db.Transaction(func(tx *gorm.DB) error {
		if _, err := gorm.G[ReviewEntity](tx).Where("id = ?", r.ID).Delete(ctx); err != nil {
			return err
		}
		return r2.updateCourseStats(tx, r.CourseID)
	}); err != nil {
		return err
	}
	r2.deleteReviewCache(ctx, r.ID, r.CourseID)
	cacheDelete(ctx, r2.cache, cacheKey("course", "filters"))
	return nil
}

func (r2 *ReviewRepository) Get(ctx context.Context, reviewID int) (*review.Review, error) {
	key := cacheKey("review", reviewID)
	if cached, ok := cacheGetJSON[review.Review](ctx, r2.cache, key); ok {
		return cached, nil
	}

	e, err := gorm.G[ReviewEntity](r2.db).Where("id = ?", reviewID).First(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	r := newReviewDomain(&e)
	cacheSetJSON(ctx, r2.cache, key, &r)
	return &r, nil
}

func NewReviewRepository(db *gorm.DB, cache ...*redis.Client) *ReviewRepository {
	var client *redis.Client
	if len(cache) > 0 {
		client = cache[0]
	}
	return NewReviewRepositoryWithRatingScore(db, client, course.DefaultRatingScoreConfig)
}

func NewReviewRepositoryWithRatingScore(db *gorm.DB, cache *redis.Client, ratingScore course.RatingScoreConfig) *ReviewRepository {
	ratingScore = ratingScore.Normalized()
	return &ReviewRepository{db: db, cache: cache, searchConfig: SearchConfig(db), ratingScore: ratingScore}
}

var _ review.ReviewRepository = (*ReviewRepository)(nil)
var _ review.ReviewQuery = (*ReviewRepository)(nil)
