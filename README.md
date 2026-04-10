# 1. Project Title

## Expense Tracker Frontend

Expense Tracker Frontend is a mobile-first React application for daily expense capture, analytics, social discovery, and export workflows.

## Quick Links

- Live Deployment: https://www.track-expense.com/
- Backend README: https://github.com/shivamMittal088/ExpenseTracker-backend

---

# 2. Project Overview

This frontend is the user-facing layer of the Expense Tracker platform. It is built as a Vite + React SPA and integrates with a cookie-authenticated backend API.

The app focuses on fast daily usage patterns:

- Quick expense entry from home actions
- Date-aware browsing and transaction history
- Analytics for trends, recurring expenses, and payment behavior
- Social features like follow requests, public profiles, and notifications
- Export-ready data views for reporting

In production, the app can send relative `/api/*` requests and rely on hosting rewrites/proxy rules to reach backend services.

---

# 3. Screenshots

### 🏠 Home → Quick Actions

<p align="center">
  <img src="./docs/images/mobile-home.png" width="230" alt="Mobile Home"/>
  &nbsp;&nbsp;&nbsp;
  <img src="./docs/images/mobile-home-4.png" width="230" alt="Mobile Home 4"/>
</p>
<p align="center">
  <img src="./docs/images/mobile-add-expense-1.png" width="230" alt="Mobile Add Expense 1"/>
  &nbsp;&nbsp;&nbsp;
  <img src="./docs/images/mobile-add-expense-2.png" width="230" alt="Mobile Add Expense 2"/>
</p>

---

### 📈 Analytics → 💸 Transactions

<p align="center">
  <img src="./docs/images/mobile-analytics-1.png" width="220" alt="Mobile Analytics 1"/>
  &nbsp;&nbsp;&nbsp;
  <img src="./docs/images/mobile-analytics-2.png" width="220" alt="Mobile Analytics 2"/>
  &nbsp;&nbsp;&nbsp;
  <img src="./docs/images/mobile-transactions.png" width="220" alt="Mobile Transactions"/>
</p>

---

### 🪵 Axiom Logging

<p align="center">
  <img src="./docs/images/mobile-axiom-logging.png" width="920" alt="Axiom Logging Dashboard"/>
</p>

---

### 📱 Lighthouse (Mobile)

<p align="center">
  <img src="./expense-tracker-screenshot/mobile-lighthouse.png" width="360" alt="Mobile Lighthouse Report"/>
</p>

---

### 👤 Profile → 📤 Export

<p align="center">
  <img src="./docs/images/mobile-profile.png" width="220" alt="Mobile Profile"/>
  &nbsp;&nbsp;&nbsp;
  <img src="./docs/images/mobile-public-profile.png" width="220" alt="Mobile Public Profile"/>
</p>
<p align="center">
  <img src="./docs/images/mobile-public-profile-2.png" width="220" alt="Mobile Public Profile 2"/>
  &nbsp;&nbsp;&nbsp;
  <img src="./docs/images/mobile-export.png" width="220" alt="Mobile Export"/>
</p>

---

# 4. Features

- Email/password authentication flow (signup, login, logout)
- Protected routing with auth-aware redirects
- Day-level expense tracking with pagination
- Transaction feed for historical browsing
- Analytics dashboards (range, recurring, payment breakdown, trends, heatmap)
- Expense mutation flows (hide, restore, update)
- Category/tile management and seed initialization
- Offline tile access via IndexedDB caching (tiles cached on fetch, served from IndexedDB when offline)
- Social graph UX: search users, follow/unfollow, requests, followers/following
- Profile management: name, status, privacy, avatar upload, hide-amount preference
- Excel export by date range
- Lazy-loaded routes and heavy UI chunks for better initial load performance

---

# 5. Tech Stack

| Technology | Where Used | Why It Is Used |
| --- | --- | --- |
| React 19 | Frontend app | Component-driven UI and stateful rendering |
| TypeScript | Frontend app | Type safety for components, state, and API calls |
| Vite 7 | Frontend tooling | Fast local dev server and modern build pipeline |
| React Router DOM 7 | Routing | SPA route composition and protected route boundaries |
| Redux Toolkit | Global state | Predictable app state for auth/user and transaction slices |
| React Redux | State bindings | Hooks-based Redux integration in components |
| Axios | API layer | Centralized HTTP client with auth/error interceptors |
| Tailwind CSS 4 | Styling | Utility-first, responsive UI development |
| Day.js | Date handling | Lightweight date operations for analytics and UI |
| Nginx | Container runtime | Serves static SPA and proxies `/api/*` to backend in Docker |
| Vercel rewrites | Production routing | Routes frontend calls to backend API without exposing CORS complexity |

---

# 6. Project Architecture

## Overall System Architecture

```mermaid
flowchart LR
  USER[Browser Client] --> SW[Service Worker]
  SW --> WEB[expense-tracker-frontend React/Vite]
  WEB --> IDB[(IndexedDB)]
  WEB --> API[expense-tracker-backend Express API]
  API --> DB[(MongoDB)]
  API --> REDIS[(Redis)]
  API --> CLOUD[(Cloudinary)]
  WEB -. production rewrites .-> API
  WEB -. docker nginx /api proxy .-> API
```

## Online Flow

When the user is connected to the internet, data flows through the API and is cached locally for offline use.

```mermaid
flowchart TD
  subgraph Browser
    APP[React App]
    SW[Service Worker]
    IDB[(IndexedDB)]
  end

  subgraph Backend
    API[Express API :5000]
    DB[(MongoDB)]
    REDIS[(Redis)]
    CLOUD[(Cloudinary)]
  end

  APP -- "1 · page navigation" --> SW
  SW -- "2 · serve cached shell + assets" --> APP
  SW -- "3 · fetch & dynamic-cache JS/CSS" --> CDN[Network / CDN]
  APP -- "4 · API requests (axios)" --> API
  API --> DB
  API --> REDIS
  API --> CLOUD
  API -- "5 · JSON response" --> APP
  APP -- "6 · cache response" --> IDB
  APP -- "7 · sync pending offline expenses" --> API
  APP -- "8 · delete synced items" --> IDB
```

**Online step-by-step:**

1. User navigates — Service Worker intercepts and serves the cached SPA shell (`/`) and static assets from Static Cache
2. Any uncached JS/CSS assets are fetched from the network and stored in Dynamic Cache by the Service Worker
3. React app makes API calls via Axios (`withCredentials: true` for cookie auth)
4. Backend processes requests (auth → MongoDB/Redis/Cloudinary) and returns JSON
5. App caches API responses into IndexedDB (tiles, transactions, heatmap data)
6. On reconnect, `Layout.tsx` syncs any pending offline expenses to the API, then removes them from IndexedDB

## Offline Flow

When the network is unavailable, the Service Worker and IndexedDB work together to keep the app functional.

```mermaid
flowchart TD
  subgraph Browser
    APP[React App]
    SW[Service Worker]
    SC[(Static Cache)]
    DC[(Dynamic Cache)]
    IDB[(IndexedDB)]
  end

  APP -- "1 · navigation request" --> SW
  SW -- "2 · serve cached '/' shell" --> APP
  SW -- "3 · serve cached JS/CSS/assets" --> APP
  SC -. pre-cached assets .-> SW
  DC -. dynamically cached assets .-> SW
  APP -- "4 · API call fails" --> APP
  APP -- "5 · read cached data" --> IDB
  IDB -- "6 · tiles, transactions, heatmap" --> APP
  APP -- "7 · user adds expense" --> IDB
  IDB -. "stored as pending expense" .-> IDB
```

**Offline step-by-step:**

1. User navigates — Service Worker serves the cached SPA shell from Static Cache
2. JS, CSS, and other assets are served from Static Cache (pre-cached) or Dynamic Cache (previously fetched)
3. If `'/'` is also not cached, Service Worker falls back to `/offline.html`
4. React app attempts API calls — they fail (network error, no `response` object)
5. App falls back to IndexedDB for cached data:
   - **Tiles** → served from `tiles` store (for Add Expense modal)
   - **Transactions** → served from `transactions` store (last 100 cached)
   - **Heatmap** → served from `heatmap` store (keyed by year)
6. User can still add expenses — saved to `pendingExpenses` store in IndexedDB
7. Tile add/delete is blocked with a toast ("All features are not available when offline")
8. When connection returns → `online` event triggers sync of pending expenses to API

## Service Worker Caching Strategy

```mermaid
flowchart TD
  REQ[Incoming Request] --> NAV{Navigation?}
  NAV -- Yes --> CACHE_ROOT[Serve cached '/']
  CACHE_ROOT -- miss --> FETCH_NAV[Fetch from network]
  FETCH_NAV -- fail --> OFFLINE[/offline.html/]
  NAV -- No --> MATCH{Cache match?}
  MATCH -- hit --> SERVE[Return cached response]
  MATCH -- miss --> NETWORK[Fetch from network]
  NETWORK -- success --> IS_ASSET{JS / CSS / asset?}
  IS_ASSET -- Yes --> DYN_CACHE[Store in Dynamic Cache & return]
  IS_ASSET -- No --> RETURN[Return response]
  NETWORK -- fail --> GONE[Request fails]

  style OFFLINE fill:#ef4444,color:#fff
  style DYN_CACHE fill:#22c55e,color:#fff
```

| Cache | Contents | Strategy |
|-------|----------|----------|
| **Static Cache** (`Static-V2`) | `/`, `/offline.html`, `/manifest.json`, favicons | Pre-cached on install |
| **Dynamic Cache** (`Dynamic-V2`) | `/assets/*`, runtime JS/CSS | Cache on first fetch |
| **IndexedDB** (`expense-tracker` v5) | tiles, transactions, heatmap, pendingExpenses | Cache on API success, read on API failure |

## Docker Runtime View

```mermaid
flowchart LR
  BROWSER[Browser] --> NGINX[frontend container Nginx :80]
  NGINX -->|serve SPA| DIST[dist assets]
  NGINX -->|/api/* proxy| BACKEND[backend container :5000]
  BACKEND --> MONGO[(mongo container)]
  BACKEND --> REDIS[(redis container)]
```

## Text Fallback Diagram

```text
Browser
  ├── Service Worker
  │     ├── Static Cache (pre-cached: /, offline.html, manifest, favicons)
  │     └── Dynamic Cache (runtime: JS, CSS, assets)
  ├── React App (Vite)
  │     ├── Online  → API requests → Backend (Express)
  │     │                              ├── MongoDB
  │     │                              ├── Redis
  │     │                              └── Cloudinary
  │     │            → Cache responses → IndexedDB
  │     └── Offline → Read from IndexedDB (tiles, transactions, heatmap)
  │                 → Save expenses to IndexedDB (pendingExpenses)
  │                 → Sync to API when back online
  └── IndexedDB (expense-tracker v5)
        ├── tiles            — cached tile list
        ├── transactions     — last 100 transactions
        ├── heatmap          — per-year heatmap data
        └── pendingExpenses  — expenses saved while offline
```

**High-level request flow:**

- User signs in and receives auth cookie from backend
- Frontend sends credentialed API requests (`withCredentials: true`)
- Service Worker intercepts navigation and asset requests, serving from cache when possible
- API responses are cached in IndexedDB for offline fallback
- Protected routes load profile/session data before rendering app flows
- Backend performs auth/validation and returns domain data for UI modules
- When offline, IndexedDB serves cached data; new expenses queue in `pendingExpenses` and sync on reconnect

---

# 7. Project Folder Structure

```text
frontend/
├── src/
│   ├── Components/          # Page and UI components (home, analytics, profile, exports, modals)
│   ├── hooks/               # Custom hooks (for example idle prefetch behavior)
│   ├── routeWrapper/        # Axios API client and route guards
│   ├── store/               # Redux store, hooks, and slices
│   ├── utils/               # Shared utility modules and UI helpers
│   │   └── indexedDB/       # IndexedDB helpers for offline data caching
│   ├── App.tsx              # Route tree and protected/public routing
│   └── main.tsx             # App bootstrap entrypoint
├── public/                  # Static assets
├── docs/                    # Frontend learning notes and screenshots
├── Dockerfile               # Multi-stage frontend image build
├── nginx.conf               # SPA serving + API proxy in container
├── vite.config.ts           # Vite and chunk-splitting config
├── vercel.json              # Rewrite and header rules for deployment
└── package.json             # Scripts and dependencies
```

---

# 8. Installation Steps

## Prerequisites

- Git
- Node.js 18+ (Node.js 20 recommended)
- npm
- Running backend API (local or hosted)

## Clone repository

```bash
git clone <your-repo-url>
cd expense-tracker/frontend
```

## Create environment file

PowerShell (Windows):

```powershell
Copy-Item .env.example .env
```

Bash (macOS/Linux):

```bash
cp .env.example .env
```

## Install dependencies

```bash
npm install
```

---

# 9. Environment Variables

## Frontend (`frontend/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes (for local dev) | Backend base URL in development (for example `http://localhost:5000`) |

Notes:

- In production builds, `src/routeWrapper/Api.ts` uses relative API base (`""`) and depends on host-level rewrites/proxy for `/api/*`.
- `frontend/vercel.json` currently rewrites `/api/:path*` to the deployed backend URL.

---

# 10. How to Run the Project

Use separate terminals for frontend and backend.

## 1) Start backend

From repository root:

```bash
cd Backend
npm install
npm run dev
```

Default backend URL: `http://localhost:5000`

## 2) Start frontend

From `frontend/`:

```bash
npm run dev
```

Default frontend URL: `http://localhost:5173`

## 3) Build and preview frontend (optional)

```bash
npm run build
npm run preview
```

---

# 11. Running with Docker

## Option A: Root docker compose (published images)

From repository root:

```powershell
docker compose pull
docker compose up -d
```

Open:

- Frontend: `http://localhost:5173`
- Backend test route: `http://localhost:5000/test`

Stop:

```powershell
docker compose down
```

## Option B: Build frontend image locally

From `frontend/`:

```bash
docker build -t expense-tracker-frontend-local .
docker run --rm -p 5173:80 expense-tracker-frontend-local
```

The container serves the SPA through Nginx and proxies `/api/*` to `http://backend:5000` (as defined in `frontend/nginx.conf`).

---

# 12. Routes and Backend API Usage

## Frontend Routes

| Route | Description |
| --- | --- |
| `/login` | Public authentication page |
| `/` | Home dashboard |
| `/analytics` | Analytics and trend visualizations |
| `/transactions` | Paginated transaction feed |
| `/profile` | Current user profile |
| `/profile/followers` | Followers list |
| `/profile/following` | Following list |
| `/profile/:id` | Public user profile view |
| `/settings` | User/account settings |
| `/exports` | Excel export workflow |

## Backend Route Groups Used by Frontend

| Prefix | Examples |
| --- | --- |
| `/api/auth/*` | `signup`, `login`, `logout`, `update/password` |
| `/api/profile/*` | `view`, `update`, `privacy`, `upload-avatar`, `user/:id` |
| `/api/expense/*` | `add`, `:date`, `paged` |
| `/api/expenseMutations/*` | `:id/hide`, `:id/restore`, `:id`, `:date/hidden` |
| `/api/expenseAnalytics/*` | `range`, `recurring`, `payment-breakdown`, `spending-trends`, `heatmap` |
| `/api/expenseExport/*` | `excel` |
| `/api/follow/*` | follow actions, follow requests, followers/following lists |
| `/api/search/*` | user search and recent searches |
| `/api/tile/*` | tile list/create |
| `/api/seed/*` | initial tile seeding |

---

# 13. Future Improvements

- Add focused unit and integration tests for route-level UI behavior
- Improve error boundaries and empty-state UX coverage
- Expand offline-first/PWA capabilities (currently tiles are cached via IndexedDB)
- Harden accessibility checks across modals and dynamic lists
- Add stronger telemetry for frontend performance and failure diagnostics
- Continue bundle splitting and lazy-load tuning for slower mobile networks

---

# 14. Contributing Guidelines

1. Fork the repository.
2. Create a branch: `git checkout -b feat/your-feature-name`.
3. Keep changes scoped and include tests when feasible.
4. Update docs when routes, setup, or behavior changes.
5. Run `npm run lint` and `npm run build` before opening a PR.
6. Open a pull request describing what changed, why it changed, and how it was validated.

Recommended commit style:

- `feat: add xyz`
- `fix: correct abc`
- `docs: update frontend readme`
