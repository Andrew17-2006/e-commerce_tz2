# Mini Marketplace

A small e-commerce/marketplace built for the "Mini E-commerce / Marketplace" test assignment: product catalog, cart, checkout with atomic stock decrement, order management, and an admin dashboard.

**Stack:** NestJS (TypeScript) · React (TypeScript, Vite) · PostgreSQL + Prisma · Redis (cache) · BullMQ (queue) · Docker Compose · JWT auth · Storybook.

The frontend UI is built on a Figma-exported design (shadcn/ui component kit + a custom Tailwind v4 theme), wired up to the real API described below.

---

## 1. Architecture

```
/backend    NestJS API (auth, users, categories, products, cart, orders, analytics)
/frontend   React + Vite SPA (customer storefront + admin panel), Storybook
docker-compose.yml   postgres + redis + backend + frontend (nginx)
```

Both apps live in one npm-workspaces monorepo so they share a single `package.json`/lockfile and can each ship a small, independent Dockerfile.

### Backend module layout

`src/{auth,users,categories,products,cart,orders,analytics}` — each follows **controller → service → repository/DTO** separation. Cross-cutting infrastructure lives in `prisma/` (global `PrismaService`), `redis/` (cache client + `CacheService`), `queue/` (BullMQ registration), and `common/` (global exception filter, JWT/roles guards, decorators).

- **Auth**: JWT access (15m) + refresh (7d, rotated and stored bcrypt-hashed per user) tokens, `CUSTOMER`/`ADMIN` roles, a global `JwtAuthGuard` (escape-hatched with `@Public()`) plus a `RolesGuard` (`@Roles(Role.ADMIN)`) on admin-only routes.
- **Products**: search/filter/sort/pagination, Redis cache-aside on list + detail reads, image upload (file **or** URL).
- **Cart**: one row per `(user, product)`, quantity clamped against live stock on every mutation.
- **Orders**: the checkout endpoint is the core of the assignment — see §2.
- **Analytics**: revenue/order summary, top-5 products, sales-by-day, CSV export — all admin-only.

### Frontend layout

`src/{pages,components,hooks,api,stores,routes}` — TanStack Query owns all server state (including the cart, which is server-side per logged-in user) with **optimistic updates** on cart add/update/remove (`onMutate` → optimistic cache write → rollback on error → refetch on settle). Zustand holds only the auth token/user (persisted to `localStorage`). `components/ui/*` is the shadcn/ui kit; `components/catalog`, `components/common`, `components/layout` are bespoke pieces kept close to the original Figma design tokens in `styles/theme.css`.

---

## 2. The key requirement: race-condition-safe stock decrement

Checkout (`POST /orders/checkout`, [orders.service.ts](backend/src/orders/orders.service.ts)) runs inside **one Prisma interactive transaction**:

1. For every cart line, [`InventoryService.decrementStock`](backend/src/orders/inventory.service.ts) runs a **conditional raw `UPDATE`**:
   ```sql
   UPDATE "Product" SET stock = stock - $qty WHERE id = $productId AND stock >= $qty
   ```
   If the affected-row count is `0`, it throws `ConflictException` immediately.
2. The `Order` + `OrderItem`s (with product name/price **snapshotted** at purchase time) are created.
3. The purchased `CartItem` rows are deleted.

If any step fails, the whole transaction rolls back — no partial order, no oversold stock, cart left untouched. The safety comes from Postgres's row-level write lock on the conditional `UPDATE`, not from transaction isolation level: two concurrent checkouts racing the last unit can only have one `UPDATE` touch the row first — the other's `WHERE stock >= qty` then evaluates false against the already-decremented value and returns 0 rows.

This is proven directly by an e2e test that fires two concurrent checkout requests at a stock-1 product and asserts exactly one succeeds ([`test/e2e/checkout.e2e-spec.ts`](backend/test/e2e/checkout.e2e-spec.ts)) — see §5.

Stock decrement is **synchronous** (inside the HTTP request); only the downstream `NEW → PROCESSING` transition and processing-delay simulation are offloaded to a BullMQ queue ([`orders.processor.ts`](backend/src/orders/orders.processor.ts)), guarded so a queued job can never clobber a status an admin already changed in the meantime. Cancelling an order (by an admin) restocks the affected products in its own transaction. Orders that are already `COMPLETED`/`CANCELLED` reject further status changes (`ConflictException`) — the "editing an already-processed order" edge case.

---

## 3. Why these choices

- **PostgreSQL + Prisma over MongoDB**: the assignment's hardest requirement is atomic, race-safe stock decrement across relational entities (Product ↔ Order ↔ OrderItem). Postgres gives ACID transactions and row-level locking for free; Prisma gives typed queries/migrations and, when needed (as above), an escape hatch to raw SQL via `$executeRaw` inside `$transaction`.
- **BullMQ + Redis for order processing** rather than doing everything synchronously: only the stock-affecting work stays in the request; the "process order" simulation is exactly the kind of unit of work that shouldn't block the checkout response.
- **Redis cache-aside for the product catalog**, invalidated via a single `products:cache-version` counter incremented on any product/category write (embedded in every list cache key) — O(1) invalidation, no `SCAN`/pattern-delete edge cases.
- **Zustand for auth only; TanStack Query for everything else** (including cart) — the cart is a real server resource tied to checkout/order history, not transient client state, so it belongs in the query cache where optimistic updates are a first-class feature.
- **npm workspaces** over pnpm/Nx/Turborepo — nothing beyond npm was needed for two apps and it wires cleanly into two independent Dockerfiles.

---

## 4. Running it

### Docker (the intended way)

```bash
cp .env.example .env    # edit JWT secrets if you like
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API + Swagger docs: http://localhost:3000/docs (also reachable at `/docs` and `/api/*` through the frontend's nginx proxy on :8080)
- Postgres migrations run automatically on backend container start.

Seed demo data (categories, 8 products, an admin + a customer account, ~40 historical orders for the dashboard) once the stack is up:

```bash
docker compose exec backend npm run seed
```

Seeded logins: `admin@minishop.dev` / `Admin123!` and `customer@minishop.dev` / `Customer123!`.

### Local development (without Docker)

Requires a local Postgres + Redis (or point `DATABASE_URL`/`REDIS_URL` at any reachable instance).

```bash
npm install                                   # installs both workspaces
cp backend/.env.example backend/.env          # fill in DATABASE_URL / REDIS_URL
cd backend && npx prisma migrate dev && npm run seed && cd ..
npm run dev:backend                           # http://localhost:3000
npm run dev:frontend                          # http://localhost:5173 (proxies /api -> :3000)
```

### Storybook

```bash
npm run storybook            # http://localhost:6006
```

Stories cover `Button`, `Input`, `Select`, `Dialog`, `StatusBadge`, and `ProductCard` (in-stock / low-stock / out-of-stock).

---

## 5. Tests

```bash
npm run test:backend         # unit — InventoryService + OrdersService.checkout
npm run test:e2e:backend     # e2e  — needs a real Postgres + Redis (see below)
```

- **Unit** ([`test/unit/inventory.service.spec.ts`](backend/test/unit/inventory.service.spec.ts)): asserts the conditional-update-then-check-affected-rows logic throws on insufficient stock, and includes a deterministic simulation of two racing decrements against a shared in-memory "stock" counter (exactly one succeeds). [`test/unit/orders.service.spec.ts`](backend/test/unit/orders.service.spec.ts) covers checkout orchestration (total calculation, order-item price/name snapshotting, cart clearing, exactly-once queue enqueue).
- **e2e** ([`test/e2e/checkout.e2e-spec.ts`](backend/test/e2e/checkout.e2e-spec.ts), run against a real Postgres): add-to-cart → checkout → stock verification, a rejected-checkout-on-insufficient-stock case, and **two concurrent checkout requests for the same last unit**, asserting exactly one `201` and one `409` with final stock at `0`. This is the strongest proof of §2's correctness.

The e2e suite needs `DATABASE_URL`/`REDIS_URL` pointing at a real Postgres/Redis (CI spins these up as service containers — see `.github/workflows/ci.yml`).

---

## 6. What was skipped / would be done differently with more time

- **Payment is fully mocked** per the assignment — card fields are validated client- and server-side (format only) and never persisted.
- **Refresh tokens** are returned in the JSON body and stored client-side (`localStorage` via Zustand's persist) rather than as an httpOnly cookie — simpler to reason about across the Vite dev server / Docker nginx split without extra CORS/cookie-domain plumbing, but an httpOnly cookie would be the better production default.
- **Docker image size**: both Dockerfiles copy the full (hoisted, workspace-wide) `node_modules` into the runtime stage for simplicity; a leaner build would prune to the backend-only dependency subset.
- **`multer@1.x`** is pinned for compatibility with this NestJS/`platform-express` version; multer 2.x fixes several known advisories and would be the first upgrade in a follow-up pass. The image-upload endpoint is admin-only, which limits exposure in the meantime.
- **Storybook** covers the 6 most representative components (buttons, product card, form inputs, status badge, modal) rather than the full shadcn/ui kit, per the assignment's explicit "key components only" scope.
- **Frontend component/unit tests** were left out in favor of the mandatory backend unit + e2e coverage and a full manual/automated browser smoke test of every page (customer + admin flows) during development.
- Analytics aggregation queries (`AnalyticsService.topProducts`) do a group-by followed by a per-product re-query rather than a single SQL aggregation — fine at this data scale, would move to a single `$queryRaw` aggregate if the order volume grew.

---

## 7. Environment variables

See [`.env.example`](.env.example) (Docker Compose / root), [`backend/.env.example`](backend/.env.example), and [`frontend/.env.example`](frontend/.env.example).
