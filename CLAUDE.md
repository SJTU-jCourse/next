# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**jcourse** — a course review platform. Go 1.26 backend (Gin + GORM + PostgreSQL) and React 19 / TypeScript frontend (Vite + shadcn + TanStack Query). Repo layout:

```
backend/   Go API, async worker, importer, SQL schema
frontend/  React/Vite SPA
docker/    Local PostgreSQL + Redis compose
jcourse_v1 Legacy reference; ignore for active work
```

## Development Commands

### Local dependencies (run from repo root)
```bash
docker compose -f docker/docker-compose.yaml up -d postgres redis
psql "host=localhost port=5432 user=postgres password=postgres dbname=jcourse sslmode=disable" -f backend/script/0001_schema_pgsql.up.sql
```

PostgreSQL is `dujiajun/postgres-pg-jieba:17` (custom image with `pg_jieba` for Chinese full-text search). Redis is `redis:7`.

### Backend (`cd backend`)
```bash
cp config/config.example.yaml config/config.yaml         # one-time
go run cmd/api/main.go --config config/config.yaml       # API server (:8080)
go run cmd/taskworker/main.go --config config/config.yaml  # async worker (Asynq)
go run cmd/importer/main.go --config config/config.yaml --semester 2025-2026-1
go build ./...
go vet -tags test ./...
go test -tags test ./...                                  # ALWAYS pass -tags test
go test -tags test ./internal/application -run TestCourseQuery   # single test
```

The `test` build tag is required because shared repository mocks (`testutil.go` files in `internal/domain/*`) are guarded by `//go:build test`. Without the tag, code that imports these mocks fails to compile. Repository tests in `internal/infrastructure/repository/` spin up a `jcourse_test` database against the local Postgres.

### Frontend (`cd frontend`, pnpm 11.2.2)
```bash
pnpm dev                # Vite dev server (:5173, proxies /api → :8080)
pnpm build              # tsc + vite build
pnpm typecheck          # tsc only
pnpm lint               # ESLint
pnpm test               # Vitest
pnpm preview            # serve dist/ for PWA verification
pnpm format             # Prettier
```

MSW mocks are **opt-in**, not auto-started: run `VITE_ENABLE_MOCKS=true pnpm dev` to use handlers in `src/mocks/` without a real backend.

### CI
`.github/workflows/ci.yml` runs `go vet -tags test`, `go test -tags test`, and `go build` against PostgreSQL 17 and Redis 7. Test config is injected via `JCOURSE_POSTGRES_*` env vars.

## Backend Architecture

Hexagonal / Clean DDD layering under `backend/internal/`:

```
domain/         entities, repository + query interfaces, domain services, policies, mocks (build tag: test)
application/    use-case services, CQRS-style command/query split, DTOs
infrastructure/ persistence (gorm + redis), repository (gorm impls), smtp, jaccount, moderation, task (asynq)
interface/web   Gin controllers, middleware, router
interface/async Asynq task handler registration
app/container.go  manual DI wiring
cmd/{api,taskworker,importer,migrate_v1}  entrypoints
```

**Key patterns:**
- **Dual interfaces per aggregate**: a write-oriented `*Repository` (CRUD on domain models) and a read-oriented `*Query` (returns `*ForQuery` DTOs with eager-loaded joins). Both are satisfied by a single gorm struct in `infrastructure/repository/`.
- **Application CQRS**: paired `*CommandService` / `*QueryService` per aggregate. Review creation runs through a `CreatePolicy` chain (safety + frequency).
- **Authorization via Guardian objects** (e.g. `review.Guardian`) for owner / admin checks; admin checks live alongside or above the application layer, never in handlers alone.
- **GORM entities are separate** from domain models. Each `*Entity` has explicit `new*Domain()` / `new*Query()` converters — no auto-mapping.
- **Soft deletes** use a `deleted_at` unix-timestamp column; queries filter `deleted_at = 0`.
- **Review revisions**: each update writes a `Revision` snapshot in the same transaction.
- **PostgreSQL features**: tsvector + GIN indexes for full-text search (incl. pinyin via `pg_jieba`), `int[]` array columns for categories / teacher IDs.
- **Redis**: session store (`jcourse:session:` prefix), hot-course sorted sets, verification codes, login-attempt lockout, repository JSON caches (default 30 min TTL — see `backend/CACHE_KEYS.md`).
- **Async tasks**: `domain/task` defines pure `Task` / `Enqueuer` ports; `infrastructure/task` provides the Asynq backend; `interface/async` registers handlers. The API process injects an enqueuer at startup; `cmd/taskworker` runs the Asynq server with SIGINT/SIGTERM graceful shutdown.
- **Auth**: email/password with verification codes (Django-compatible PBKDF2-SHA256 hashes), `Auth.EmailWhitelist` domain restriction, password reset flow, login lockout. JAccount OAuth is also wired in for SJTU course enrollment sync. External clients use `APIKeyAuth` for `/api/ext/*`.
- **Config** via Viper. Any field is overridable with a `JCOURSE_` env var (e.g. `JCOURSE_POSTGRES_DSN`, `JCOURSE_SERVER_ADDR`). Never commit `config/config.yaml`.

**Routing:** all routes are mounted under `/api` in `internal/interface/web/router.go`. Most need session auth; site-stats and parts of review moderation require admin; `/api/ext/*` uses API-key auth. When adding endpoints, verify the auth middleware in this file.

**Domain model overview:** `Course → OfferedCourse ↔ TeacherGroup`, `Review → ReviewRevision / ReviewVote`, `User → PointRecord / PointTransfer`, plus `Announcement`, `SiteDailyStat`, `Account` (JAccount link), `AuditLog`.

**Database migrations:** `backend/script/` holds four-digit numbered up/down SQL migration pairs (`0001_schema_pgsql.up.sql`, `0001_schema_pgsql.down.sql`, ...). When changing schema, **add a new numbered up/down pair — never edit an existing migration.**

## Frontend Architecture

React 19 + TypeScript strict + Vite. Path alias: `@/` → `src/`.

```
src/api/        HTTP client + per-domain modules (auth, course, review, teacher, point, …)
src/hooks/      TanStack Query hooks (useQuery + useMutation with cache invalidation)
src/pages/      route components (kebab-case filenames, e.g. course-detail-page.tsx)
src/components/ feature folders (auth/, course/, review/, teacher/, point/) + ui/ (shadcn primitives)
src/mocks/      MSW handlers + fixtures (opt-in via VITE_ENABLE_MOCKS)
src/contexts/   React contexts; src/lib/ shared utilities; src/config/ branding + auth config
```

**Key patterns:**
- `apiClient<T>()` in `src/api/client.ts` wraps `fetch`: cookies always sent (`credentials: "include"`); for non-GET/HEAD/OPTIONS it pre-fetches `/api/auth/csrf` and attaches `X-CSRF-Token`. Non-2xx responses throw `HttpError`.
- **TanStack Query for all server state**, with optimistic updates for review voting.
- **shadcn / Radix UI** in `components/ui/`; Tailwind v4 with CSS-variable theming (light/dark).
- **PWA** via `vite-plugin-pwa` (production builds only): static assets precached; read-only course/teacher/review GETs cached `NetworkFirst` for offline fallback; cached user snapshot allows offline route auth for 7 days; review draft autosave per user/course/review ID. Verify with `pnpm build && pnpm preview` (do not test PWA in `pnpm dev`).
- **Dev proxy**: Vite forwards `/api` to `http://localhost:8080`. Backend CORS allows `localhost:5173` and `127.0.0.1:5173` by default.

## Coding Conventions

- **Go**: `gofmt`; short lowercase package names (`course`, `review`, `repository`); domain layer must not import Gin, GORM, Redis, Asynq, or any adapter detail; when adding an interface, also add a mock implementation guarded by `//go:build test`.
- **Frontend**: TypeScript strict, function components, PascalCase components, `useThing` hooks, kebab-case page filenames, prefer existing UI primitives in `components/ui/` and feature folders before creating new structure. Add shadcn components via `pnpm dlx shadcn@latest add <name>` (never hand-write them); check generated imports use `@/lib/utils`.
- **Frontend UI conventions**:
  - Page title: `PageHeader` (`components/common/page-header`) — h1 `text-2xl font-bold`, one-line description without trailing period, ~10–16 chars, “动词 + 对象” (e.g. 浏览和搜索所有课程). Every h1 (including detail, 404 and error pages) uses `text-2xl font-bold`.
  - Section title: `SectionHeader` — h2 `text-lg font-semibold`; counts go in `meta` (noun omitted: “共 N 条”), actions / “查看更多” in `actions`. Standalone list counts keep the noun (“共 N 门课程”).
  - Spacing: page root `space-y-6`; list rows `p-2` with skeletons matching; pagination wrapper `flex justify-center pt-4`; back buttons `variant="ghost" size="sm" className="mb-4 -ml-2"`; form pages (写点评 / 编辑点评) use the full `PageShell` width like other pages; settings page centered `mx-auto max-w-3xl`.
  - Text: body/hints `text-sm`, meta `text-xs`/`text-sm text-muted-foreground`; long prose `leading-7`, form hints `leading-6`. No arbitrary `text-[..]` sizes; use theme tokens (`text-rating`, `text-success`, `bg-warning/10`) instead of raw palette colors.
  - States: `ErrorState` / `NotFoundState` / `EmptyState`; user-facing errors via `toUserMessage`; mutation results via `toast` (sonner). Empty-state title “暂无X”, description = what to do next, no trailing period.
  - Copy: 点评, 教师, 课程, 成绩 (not 分数), 管理员备注, 编辑 / 保存修改, 关注状态, API Key; “你” in UI, “您” only in legal text; Chinese-full-width punctuation, “…” ellipsis, space between CJK and Latin/digits (brand “SJTU选课社区” excepted).
- **Commits**: short imperative subjects, often with a type prefix (`feat:`, `fix:`, `refine`, `style`, `docs:`).
