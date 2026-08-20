# Mini Marketplace

Невеликий e-commerce/маркетплейс, зроблений для тестового завдання "Mini E-commerce / Marketplace": каталог товарів, кошик, оформлення замовлення з атомарним списанням зі складу, керування замовленнями та адмін-дашборд.

**Стек:** NestJS (TypeScript) · React (TypeScript, Vite) · PostgreSQL + Prisma · Redis (кеш) · BullMQ (черга) · Docker Compose · JWT-автентифікація · Storybook.

Інтерфейс фронтенду побудований на дизайні, експортованому з Figma (набір компонентів shadcn/ui + кастомна Tailwind v4 тема), і підключений до реального API, описаного нижче.

---

## 1. Архітектура

```
/backend    NestJS API (auth, users, categories, products, cart, orders, analytics)
/frontend   React + Vite SPA (вітрина для покупця + адмін-панель), Storybook
docker-compose.yml   postgres + redis + backend + frontend (nginx)
```

Обидва застосунки живуть в одному npm-workspaces монорепозиторії — спільний `package.json`/lock-файл, і при цьому кожен збирається в окремий легкий Dockerfile.

### Структура бекенд-модулів

`src/{auth,users,categories,products,cart,orders,analytics}` — кожен модуль дотримується розділення **controller → service → repository/DTO**. Наскрізна інфраструктура лежить у `prisma/` (глобальний `PrismaService`), `redis/` (клієнт кешу + `CacheService`), `queue/` (реєстрація BullMQ) та `common/` (глобальний exception filter, JWT/roles guards, декоратори, санітизація вхідних даних).

- **Auth**: JWT access (15хв, повертається в тілі відповіді) + refresh (7 днів, ротується, зберігається у вигляді bcrypt-хешу для кожного користувача та передається лише через httpOnly/secure/`SameSite=Lax`-куку, недоступну з JS — захист від крадіжки через XSS), ролі `CUSTOMER`/`ADMIN`, глобальний `JwtAuthGuard` (обходиться декоратором `@Public()`) плюс `RolesGuard` (`@Roles(Role.ADMIN)`) на маршрутах лише для адміна.
- **Products**: пошук/фільтрація/сортування/пагінація, Redis cache-aside для списку й деталей товару, завантаження зображення (файлом **або** URL).
- **Cart**: один рядок на пару `(user, product)`, кількість обмежується актуальним залишком при кожній зміні.
- **Orders**: ендпоінт оформлення замовлення — ядро завдання, див. §2.
- **Analytics**: зведення по виручці/замовленнях, топ-5 товарів, продажі по днях, експорт у CSV — усе лише для адміна.

### Структура фронтенду

`src/{pages,components,hooks,api,stores,routes}` — весь серверний стан (включно з кошиком, який зберігається на бекенді для кожного залогіненого користувача) керується через TanStack Query з **оптимістичними оновленнями** при додаванні/зміні/видаленні товару з кошика (`onMutate` → оптимістичний запис у кеш → відкат при помилці → повторний запит після завершення). Zustand зберігає лише access-токен і користувача (персиститься в `localStorage`); refresh-токен у localStorage не потрапляє — він живе в httpOnly-куці. `components/ui/*` — набір shadcn/ui; `components/catalog`, `components/common`, `components/layout` — власні компоненти, наближені до вихідних Figma-токенів у `styles/theme.css`.

---

## 2. Ключова вимога: безпечне до конкурентного доступу списання зі складу

Оформлення замовлення (`POST /orders/checkout`, [orders.service.ts](backend/src/orders/orders.service.ts)) виконується в **одній інтерактивній Prisma-транзакції**:

1. Для кожного рядка кошика [`InventoryService.decrementStock`](backend/src/orders/inventory.service.ts) виконує **умовний сирий `UPDATE`**:
   ```sql
   UPDATE "Product" SET stock = stock - $qty WHERE id = $productId AND stock >= $qty
   ```
   Якщо кількість змінених рядків дорівнює `0`, одразу кидається `ConflictException`.
2. Створюються `Order` та `OrderItem` (з назвою/ціною товару, **зафіксованими** на момент покупки).
3. Видаляються рядки `CartItem`, які щойно купили.

Якщо будь-який крок падає, уся транзакція відкочується — жодного часткового замовлення, жодного перепродажу складу, кошик лишається незмінним. Безпека забезпечується блокуванням рядка на рівні запису Postgres під час умовного `UPDATE`, а не рівнем ізоляції транзакції: якщо два одночасні checkout'и змагаються за останню одиницю товару, лише один `UPDATE` встигне змінити рядок першим — у другого умова `WHERE stock >= qty` після цього стане хибною для вже зменшеного значення, і він поверне 0 рядків.

Це прямо доведено e2e-тестом, який одночасно надсилає два запити на checkout товару з залишком 1 і перевіряє, що успішним стає рівно один ([`test/e2e/checkout.e2e-spec.ts`](backend/test/e2e/checkout.e2e-spec.ts)) — див. §5.

Списання зі складу відбувається **синхронно** (у межах HTTP-запиту); лише подальший перехід `NEW → PROCESSING` та симуляція затримки обробки винесені в чергу BullMQ ([`orders.processor.ts`](backend/src/orders/orders.processor.ts)), з захистом від ситуації, коли задача з черги могла б перезаписати статус, який адмін вже встиг змінити вручну. Скасування замовлення (адміном) повертає товар на склад в окремій транзакції. Замовлення, які вже мають статус `COMPLETED`/`CANCELLED`, відхиляють подальшу зміну статусу (`ConflictException`) — це закриває edge-кейс "редагування вже обробленого замовлення".

---

## 3. Чому саме такі рішення

- **PostgreSQL + Prisma замість MongoDB**: найскладніша вимога завдання — атомарне, безпечне до конкурентного доступу списання складу між пов'язаними сутностями (Product ↔ Order ↔ OrderItem). Postgres з коробки дає ACID-транзакції та блокування на рівні рядка; Prisma дає типізовані запити/міграції і, за потреби (як вище), шлях до сирого SQL через `$executeRaw` всередині `$transaction`.
- **BullMQ + Redis для обробки замовлень** замість повністю синхронної обробки: у запиті лишається тільки те, що впливає на склад; симуляція "обробки замовлення" — це якраз той вид роботи, який не повинен блокувати відповідь на checkout.
- **Redis cache-aside для каталогу товарів**, інвалідація через єдиний лічильник `products:cache-version`, який інкрементується при будь-якому записі товару/категорії (і вбудований у кожен ключ кешу списку) — інвалідація за O(1), без edge-кейсів `SCAN`/pattern-delete.
- **Zustand лише для авторизації; TanStack Query — для всього іншого** (включно з кошиком) — кошик є реальним серверним ресурсом, пов'язаним із checkout/історією замовлень, а не тимчасовим клієнтським станом, тож його місце в кеші запитів, де оптимістичні оновлення — вбудована можливість.
- **npm workspaces** замість pnpm/Nx/Turborepo — для двох застосунків нічого понад npm не знадобилось, і це чисто інтегрується у два незалежні Dockerfile.

---

## 4. Запуск

### Docker (основний спосіб)

```bash
cp .env.example .env    # за бажанням відредагуйте JWT-секрети
docker compose up --build
```

- Фронтенд: http://localhost:8080
- Backend API + Swagger-документація: http://localhost:3000/docs (також доступно через `/docs` та `/api/*` через nginx-проксі фронтенду на :8080)
- Міграції Postgres виконуються автоматично при старті backend-контейнера.

Засіяти демо-дані (категорії, 8 товарів, акаунти адміна та покупця) після підняття стеку:

```bash
docker compose exec backend npm run seed
```

Тестові логіни: `admin@minishop.dev` / `Admin123!` та `customer@minishop.dev` / `Customer123!`.

### Локальна розробка (без Docker)

Потрібен локальний Postgres + Redis (або вкажіть `DATABASE_URL`/`REDIS_URL` на будь-який доступний інстанс).

```bash
npm install                                   # встановлює обидва workspace
cp backend/.env.example backend/.env          # заповніть DATABASE_URL / REDIS_URL
cd backend && npx prisma migrate dev && npm run seed && cd ..
npm run dev:backend                           # http://localhost:3000
npm run dev:frontend                          # http://localhost:5173 (проксіює /api -> :3000)
```

### Storybook

```bash
npm run storybook            # http://localhost:6006
```

Історії покривають `Button`, `Input`, `Select`, `Dialog`, `StatusBadge`, `ProductCard` (в наявності / залишок закінчується / немає в наявності) та `FieldError` — включно з прикладом складеної форми (`Label` + `Input` + інлайн-помилка), що повторює реальний патерн валідації з Checkout/Auth/адмін-форм.

---

## 5. Тести

```bash
npm run test:backend         # unit — InventoryService + OrdersService.checkout
npm run test:e2e:backend     # e2e  — потребує реальних Postgres + Redis (див. нижче)
npm run test:frontend        # unit/component — Vitest + Testing Library
```

- **Backend unit** ([`test/unit/inventory.service.spec.ts`](backend/test/unit/inventory.service.spec.ts)): перевіряє, що логіка "умовний UPDATE → перевірка кількості змінених рядків" кидає помилку при нестачі товару, і включає детерміновану симуляцію двох конкурентних списань над спільним "лічильником залишку" в пам'яті (успішним стає рівно одне). [`test/unit/orders.service.spec.ts`](backend/test/unit/orders.service.spec.ts) покриває оркестрацію checkout (розрахунок суми, фіксація ціни/назви в позиціях замовлення, очищення кошика, рівно один виклик постановки в чергу, інвалідація кешу товарів).
- **Backend e2e** ([`test/e2e/checkout.e2e-spec.ts`](backend/test/e2e/checkout.e2e-spec.ts), запускається проти реального Postgres): додавання в кошик → checkout → перевірка залишку, відхилення checkout при нестачі товару, а також **два одночасні запити на checkout за останню одиницю товару**, з перевіркою, що рівно один запит повертає `201`, а другий — `409`, і фінальний залишок дорівнює `0`. Це найпереконливіший доказ коректності §2.
- **Frontend** (Vitest + React Testing Library, jsdom): [`ProductCard.test.tsx`](frontend/src/components/catalog/ProductCard.test.tsx) — рендер назви/ціни/категорії, клік по "Add" викликає колбек, стан "Out of stock" (задизейблена кнопка + бейдж), бейдж малого залишку; [`StatusBadge.test.tsx`](frontend/src/components/common/StatusBadge.test.tsx) — коректний лейбл для кожного з 5 статусів замовлення; [`utils.test.ts`](frontend/src/components/ui/utils.test.ts) — утиліта мерджу Tailwind-класів `cn()`. Покриває кілька репрезентативних компонентів, а не весь UI-кіт — див. §6.

Для backend e2e-набору потрібні `DATABASE_URL`/`REDIS_URL`, що вказують на реальні Postgres/Redis (у CI вони піднімаються як сервіс-контейнери — див. `.github/workflows/ci.yml`).

---

## 6. Що свідомо пропущено / що зробив би інакше з більшим запасом часу

- **Оплата повністю замокана** відповідно до умов завдання — поля картки валідуються на клієнті й на сервері (лише формат) і ніколи не зберігаються.
- **Storybook** покриває 7 найбільш показових компонентів (кнопки, поля вводу, картка товару, форма з валідацією, бейдж статусу, модалка, селект), а не весь набір shadcn/ui — відповідно до явного уточнення завдання "лише ключові компоненти".
- **Frontend-тести** покривають лише кілька репрезентативних компонентів (`ProductCard`, `StatusBadge`, утиліту `cn()`), а не сторінки/хуки/форми повністю — пріоритет був на обов'язковому unit + e2e покритті бекенду та повному ручному/автоматизованому смоук-тестуванні кожної сторінки (флоу покупця й адміна) під час розробки.
---

## 7. Змінні середовища

Див. [`.env.example`](.env.example) (Docker Compose / корінь), [`backend/.env.example`](backend/.env.example) та [`frontend/.env.example`](frontend/.env.example).
