# Finora API Documentation

Base URL: `http://localhost:4000` (default `PORT=4000`)

There was no formal OpenAPI/Swagger spec in the repo. This document is generated from `apps/backend/src/routes` and Zod validators in `apps/backend/src/validators`.

## Conventions

### Authentication

- Protected routes require header: `Authorization: Bearer <accessToken>`
- Refresh token is an httpOnly cookie named `finora_refresh` with path `/api/auth`
- Access token TTL default: `15m`; refresh TTL default: `7d`

### Response shape

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 0 }
}
```

`meta` is present on paginated list endpoints.

### Currencies

`INR` | `USD` | `EUR` | `GBP` | `AED` | `SGD`

### Rate limits

- `/api/auth/*` — stricter (default 20 / window)
- Other `/api/*` — general (default 100 / window)

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | Public | Liveness `{ status: "ok" }` |

---

## Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/logout` | Public | Clear refresh cookie |
| POST | `/api/auth/refresh` | Cookie | New access token |
| GET | `/api/auth/me` | Bearer | Current user |
| POST | `/api/auth/change-password` | Bearer | Change password |
| DELETE | `/api/auth/account` | Bearer | Delete account |

### Bodies

**POST `/api/auth/register`**
```json
{
  "name": "string (1–120)",
  "email": "email",
  "password": "string (8–128)",
  "currency": "INR|USD|EUR|GBP|AED|SGD (optional)",
  "timezone": "string (optional)"
}
```

**POST `/api/auth/login`**
```json
{ "email": "email", "password": "string" }
```

**POST `/api/auth/change-password`**
```json
{
  "currentPassword": "string",
  "newPassword": "string (8–128)"
}
```

---

## Accounts (`/api/accounts`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/accounts` | List |
| GET | `/api/accounts/:id` | Get one |
| POST | `/api/accounts` | Create |
| PATCH | `/api/accounts/:id` | Update |
| DELETE | `/api/accounts/:id` | Delete |

**Create body**
```json
{
  "name": "string",
  "type": "bank|cash|credit_card|debit|wallet|investment",
  "institution": "string?",
  "accountNumberMasked": "string?",
  "currentBalance": 0,
  "availableBalance": 0,
  "currency": "INR"
}
```

---

## Transactions (`/api/transactions`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | List (paginated + filters) |
| GET | `/api/transactions/:id` | Get one |
| POST | `/api/transactions` | Create |
| PATCH | `/api/transactions/:id` | Update |
| DELETE | `/api/transactions/:id` | Delete |

**List query:** `page`, `limit` (≤100), `accountId`, `categoryId`, `type`, `dateFrom`, `dateTo`, `minAmount`, `maxAmount`, `q`, `sortBy` (`transactionDate|amount|merchant|createdAt`), `sortOrder` (`asc|desc`)

**Create body**
```json
{
  "accountId": "id",
  "type": "income|expense|transfer",
  "amount": 1,
  "currency": "INR",
  "categoryId": "id?",
  "categoryName": "string?",
  "subCategory": "string?",
  "merchant": "string?",
  "description": "string?",
  "transactionDate": "ISO date",
  "paymentMethod": "upi|card|netbanking|cash|cheque|other?",
  "tags": [],
  "notes": "string?"
}
```

---

## Categories (`/api/categories`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List |
| POST | `/api/categories/seed` | Seed defaults |
| POST | `/api/categories` | Create `{ name, icon?, color?, parentId? }` |
| PATCH | `/api/categories/:id` | Update |
| DELETE | `/api/categories/:id` | Delete |

---

## Budgets (`/api/budgets`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/budgets` | List |
| GET | `/api/budgets/:id` | Get one |
| POST | `/api/budgets` | Create |
| PATCH | `/api/budgets/:id` | Update |
| DELETE | `/api/budgets/:id` | Delete |

**Create body**
```json
{
  "name": "string",
  "period": "monthly|annual|category",
  "categoryId": "id?",
  "amount": 1,
  "currency": "INR",
  "startDate": "ISO date",
  "endDate": "ISO date",
  "alertThresholds": [50, 80, 100]
}
```

---

## Goals (`/api/goals`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/goals` | List |
| GET | `/api/goals/:id` | Get one |
| POST | `/api/goals` | Create |
| PATCH | `/api/goals/:id` | Update |
| DELETE | `/api/goals/:id` | Delete |

**Create body**
```json
{
  "name": "string",
  "targetAmount": 1,
  "currentAmount": 0,
  "targetDate": "ISO date",
  "monthlyContribution": 0,
  "priority": "low|medium|high",
  "category": "string"
}
```

---

## Investments (`/api/investments`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/investments` | List |
| GET | `/api/investments/:id` | Get one |
| POST | `/api/investments` | Create |
| PATCH | `/api/investments/:id` | Update |
| DELETE | `/api/investments/:id` | Delete |

**Create body**
```json
{
  "name": "string",
  "type": "mutual_fund|stock|etf|fd|gold|ppf|other",
  "investedAmount": 1,
  "currentValue": 0,
  "units": 1,
  "purchaseDate": "ISO date",
  "notes": "string?"
}
```

---

## Dashboard (`/api/dashboard`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard` | Summary (alias) |
| GET | `/api/dashboard/summary` | Summary |

---

## Reports (`/api/reports`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reports/summary` | Report summary |
| GET | `/api/reports/export.csv` | CSV export |

**Query:** `period` (`monthly|quarterly|annual`), `year?`, `month?`, `quarter?`, `format?` (`json|csv`)

---

## Recurring (`/api/recurring`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/recurring` | List recurring expenses |
| POST | `/api/recurring/detect` | Detect patterns |

**Detect query:** `minOccurrences` (default 3), `lookbackDays` (default 180)

---

## Anomalies (`/api/anomalies`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/anomalies` | Detect anomalies |

**Query:** `lookbackDays` (default 90), `zThreshold` (default 2)

---

## Forecast (`/api/forecast`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/forecast` | Cash-flow forecast |

**Query:** `months` (1–24, default 6)

---

## Insights (`/api/insights`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/insights` | List (`unreadOnly=true|false`) |
| POST | `/api/insights/daily-summary` | Generate daily summary |
| PATCH | `/api/insights/:id/read` | Mark read |

---

## Import (`/api/import`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/import/csv` | Upload CSV (`multipart` field `file`) |
| POST | `/api/import/pdf` | Upload PDF (`multipart` field `file`) |
| POST | `/api/import/:id/map` | Map columns |
| GET | `/api/import/:id/preview` | Preview rows |
| POST | `/api/import/:id/validate` | Validate batch |
| PATCH | `/api/import/:id/rows/:rowId` | Edit row |
| POST | `/api/import/:id/approve` | Approve |
| POST | `/api/import/:id/reject` | Reject |

**Map body**
```json
{
  "columnMapping": { "Date": "date", "Amount": "amount" },
  "accountId": "id"
}
```

**Row edit body**
```json
{
  "date": "string?",
  "amount": 0,
  "merchant": "string?",
  "description": "string?",
  "type": "income|expense|transfer?",
  "categoryName": "string?",
  "status": "pending|approved|rejected?"
}
```

---

## Categorization (`/api/categorization`) — Bearer

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/categorization` | Suggest category |
| GET | `/api/categorization/corrections` | List corrections |
| POST | `/api/categorization/corrections` | Save correction |

**Categorize body**
```json
{ "merchant": "string", "description": "string?", "useAi": false }
```

**Correction body**
```json
{
  "merchant": "string",
  "categoryId": "id?",
  "categoryName": "string",
  "transactionId": "id?"
}
```

---

## AI (`/api/ai`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/chat` | Bearer | Chat `{ message, conversationId? }` |
| GET | `/api/ai/conversations` | Bearer | List conversations |
| GET | `/api/ai/conversations/:id` | Bearer | Get conversation |

---

## Source files

- App mount: `apps/backend/src/app.ts`
- Route index: `apps/backend/src/routes/index.ts`
- Validators: `apps/backend/src/validators/*.ts`
