# Implementation Plan - Workshop "Binh Gom Thanh Ha"

## Goal

Build a mobile-first workshop web app where visitors enter personal info, play the "dap binh gom" game, receive one of three outcomes, and let admins export/reset the campaign safely.

## Proposed stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- PostgreSQL hosted on Neon
- Prisma
- Zod for validation
- Vercel for frontend deployment
- Render for backend/API deployment
- API calls from frontend to backend for mutations
- SheetJS or ExcelJS for XLSX export

## Key assumptions

- Single workshop campaign with one active prize pool at a time.
- Admin access is protected by a simple server-side secret/password.
- LocalStorage is a convenience layer; database remains source of truth.
- Reset is global and replaces the current campaign version.
- The production frontend is deployed on Vercel.
- The production backend/API is deployed on Render and connects to Neon PostgreSQL through environment variables.
- The frontend calls the Render backend through a configured public API base URL.

## Phases and tasks

### Phase 1 - Project scaffold and domain model

- [ ] T001 Create the base Next.js app structure with `src/app`, `src/components`, `src/lib`, `prisma`, and environment config. Verify the app starts cleanly on mobile viewport. [REQ-001, REQ-010]
- [ ] T002 Define the Prisma schema in `prisma/schema.prisma` for `Player`, `DrawResult`, `PrizeInventory`, `ResetEvent`, `AdminUser`, and `AppState`, including unique constraints for one confirmed result per player/reset version and idempotency keys. Verify schema can be migrated/pushed without errors. [REQ-006, REQ-008, REQ-012, REQ-015]
- [ ] T003 Add Zod schemas and shared TypeScript types in `src/lib/validation` and `src/types`. Verify invalid input is rejected before persistence. [REQ-001, REQ-002]
- [ ] T003A Configure production environments for Vercel, Render, and Neon: frontend API base URL on Vercel; `DATABASE_URL`, admin secret, CORS origin, build command, start command, Prisma generate/migrate step, and health check endpoint on Render. Verify Render can connect to Neon and Vercel can call Render successfully. [REQ-016]

### Phase 2 - Prize engine and reset state

- [ ] T004 Implement the prize draw service in `src/lib/prize-draw.ts` with weighted random selection over remaining inventory. Verify exhausted prizes are removed from the pool automatically. [REQ-006, REQ-007]
- [ ] T004A Implement safe prize claim transaction in `src/lib/prize-claim.ts`: create/resolve idempotency key, check existing confirmed result, lock or atomically decrement `PrizeInventory` with `remaining_qty > 0`, then create `DrawResult`. Verify concurrent claims cannot overdraw inventory. [REQ-006, REQ-007, REQ-008, REQ-015]
- [ ] T005 Implement campaign state/version helpers in `src/lib/reset-version.ts` and `src/lib/local-storage.ts` for invalidating client state after reset. Verify a version bump clears stale browser state on reload. [REQ-003, REQ-013]
- [ ] T006 Implement the Excel export service in `src/lib/excel-export.ts` to generate the admin workbook from current results. Verify the exported file contains all required columns. [REQ-011, REQ-012]

### Phase 3 - Player experience

- [ ] T007 Build the landing form in `src/app/page.tsx` and `src/components/player-form/*` for Ten, MSSV, and SDT capture. Verify form submission is blocked until required fields are valid. [REQ-001, REQ-002]
- [ ] T008 Build the game board and pot interaction UI in `src/components/game/*` with zoom, repeated tap/click breaking, and audio hooks. Verify mobile touch interactions feel responsive. [REQ-004, REQ-005]
- [ ] T009 Wire the draw flow so the Vercel frontend calls the Render backend API and the backend confirms the claim through the safe claim service. Verify the confirmed draw is written to the database once, even after double tap/retry. [REQ-006, REQ-008, REQ-015, REQ-016]
- [ ] T010 Persist and hydrate local history in browser storage so returning users see the history button instead of the game after a claimed prize. Verify the historical state survives refresh until reset. [REQ-003, REQ-009]

### Phase 4 - Admin workflow

- [ ] T011 Build the admin auth gate and dashboard in `src/app/admin/*` to list players, prizes, and claimed results. Verify unauthorized users cannot access the dashboard. [REQ-010]
- [ ] T012 Add search, filter, and detail views for admin review in `src/components/admin/*`. Verify admins can quickly find a player by name, MSSV, or phone. [REQ-010]
- [ ] T013 Implement manual XLSX export from the admin dashboard and confirm the file downloads with current data. Verify the workbook opens with correct rows and headers. [REQ-011]
- [ ] T014 Implement the reset action so the system exports the current Excel file first, then clears campaign tables, increments the reset version, and reinitializes inventory. Verify the old campaign is no longer visible after reset. [REQ-012, REQ-013, REQ-014]

### Phase 5 - Quality, safety, and launch readiness

- [ ] T015 Add unit tests for the prize engine, safe claim transaction, idempotency handling, and reset-version helpers. Verify prize exhaustion, no double claim, and reset invalidation behave deterministically. [REQ-006, REQ-007, REQ-013, REQ-015]
- [ ] T016 Add integration/E2E coverage for player play, concurrent prize claims, admin export, and admin reset flows. Verify the main workshop journey passes end-to-end on a mobile viewport and 20-50 simultaneous claim requests do not overdraw inventory. [REQ-001, REQ-008, REQ-011, REQ-012, REQ-014, REQ-015]
- [ ] T017 Add final UX polish for mobile responsiveness, fallback audio behavior, and empty-state copy. Verify the app remains usable when audio is blocked by the browser. [REQ-004, REQ-005, REQ-009]
- [ ] T018 Deploy the frontend on Vercel, backend/API on Render, and database on Neon. Verify public frontend URL, Render API URL, CORS, environment variables, database migration, admin login, export, reset, and concurrent claim tests on production-like data. [REQ-016, REQ-015]

## Requirement mapping

| REQ ID | Description | Plan items | Implementation evidence |
|---|---|---|---|
| REQ-001 | Form nhap thong tin nguoi choi | T001, T003, T007 | `src/app/page.tsx`, `src/components/player-form/*` |
| REQ-002 | Validate du lieu bat buoc | T003, T007 | `src/lib/validation/*` |
| REQ-003 | LocalStorage luu trang thai va lich su | T005, T010 | `src/lib/local-storage.ts` |
| REQ-004 | Hien danh sach binh va zoom khi chon | T008, T017 | `src/components/game/*` |
| REQ-005 | Dap binh co am thanh va hieu ung | T008, T017 | `src/components/game/*` |
| REQ-006 | Random co dieu kien theo phan bo con lai | T002, T004, T015 | `src/lib/prize-draw.ts` |
| REQ-007 | Tu dong loai prize da het | T004, T015 | `src/lib/prize-draw.ts` |
| REQ-008 | Luu ket qua vao database khi xac nhan | T002, T009 | `prisma/schema.prisma`, `src/app/api/*` |
| REQ-009 | Da co ket qua thi hien nut lich su | T010, T017 | `src/lib/local-storage.ts`, `src/components/game/*` |
| REQ-010 | Admin xem danh sach nguoi choi va ket qua | T011, T012 | `src/app/admin/*` |
| REQ-011 | Xuat file Excel tu admin | T006, T013 | `src/lib/excel-export.ts` |
| REQ-012 | Reset phai xuat Excel truoc va reset DB | T006, T014 | `src/lib/excel-export.ts`, `src/app/admin/*` |
| REQ-013 | Reset version invalidates localStorage | T005, T014 | `src/lib/reset-version.ts` |
| REQ-014 | Nguoi choi choi lai sau reset | T014, T016, T017 | `src/app/page.tsx`, `src/app/admin/*` |
| REQ-015 | Xu ly dong thoi bang hang doi/transaction de bao dam ton kho | T002, T004A, T009, T015, T016 | `prisma/schema.prisma`, `src/lib/prize-claim.ts`, `src/app/api/*` |
| REQ-016 | Deploy production voi frontend tren Vercel, backend tren Render, database Neon PostgreSQL | T003A, T009, T018 | `vercel.json`, `render.yaml`, `.env.example`, Vercel settings, Render service settings, Neon database |

## Done when

- Nguoi choi mobile co the vao web, nhap thong tin, dap binh va nhan ket qua.
- Qua duoc random dung theo so luong con lai va khong qua gioi han inventory.
- Nhieu nguoi nhan qua cung luc van khong lam ton kho am, khong cap qua vuot gioi han, va retry/double tap khong tao trung ket qua.
- Admin xuat duoc Excel va reset duoc toan bo campaign an toan.
- Frontend production chay tren Vercel, backend/API chay tren Render, ket noi Neon on dinh, va co health check de kiem tra trang thai backend.
- Reset xong, localStorage cu cua nguoi choi khong con hieu luc va luot choi moi bat dau tu dau.

