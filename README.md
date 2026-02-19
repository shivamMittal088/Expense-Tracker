<div align="center">

<img src="./docs/images/readme-banner-small.svg" alt="Expense Tracker Banner" width="760"/>

### Mobile-first expense tracking with social features and analytics

[![Live Demo](https://img.shields.io/badge/Live-Demo-22C55E?style=for-the-badge&logo=vercel&logoColor=white)](https://www.track-expense.com/)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-State-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org/)

</div>

---

## 🌐 Live Deployment

- **Project URL:** [https://www.track-expense.com/](https://www.track-expense.com/)
- **Backend Repository:** [https://github.com/shivamMittal088/ExpenseTracker-backend](https://github.com/shivamMittal088/ExpenseTracker-backend)

---

## 💡 What is Expense Tracker Frontend?

Expense Tracker Frontend is the user-facing app used to **log expenses quickly** and get a **clear, visual view of your financial activity**. It delivers smooth mobile-first flows for adding, reviewing, analyzing, and exporting expenses.

---

## 🧠 Engineering Insights

- Implemented **route/component lazy loading** to reduce initial bundle size and improve loading performance.
- Added **modal prefetching** and deferred optional UI chunks to improve real-world responsiveness.
- Built **cursor-based transaction flows** and optimized list rendering for smoother infinite browsing.
- Reduced redundant API pressure with **debounced state-driven requests**.
- Integrated robust **notification and follow-request UX**, including safe async action states.
- Delivered **Excel export UX** with previous week/month presets and custom date-range support.

---

## 📸 Screenshots

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

## ✨ Features

| Feature | Description |
|---------|-------------|
| ⚡ **Quick Add** | Fast expense entry from home cards and footer tools |
| 📅 **Date Navigation** | Day-wise tracking with calendar picker and heatmap selection |
| 📜 **Transactions** | Dedicated paginated transactions route |
| 📊 **Analytics** | Spending trends, category split, recurring insights, payment methods |
| 👥 **Social** | User search, follow requests, followers/following lists, public profiles |
| 👤 **Profile** | Edit name/status, upload avatar, and manage visibility |
| 🔔 **Notifications** | Follow-request modal with accept/decline actions |
| 📤 **Export Excel** | Previous week/month + custom date range export page |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Routing | React Router |
| State | Redux Toolkit |
| Styling | Tailwind CSS |
| API Client | Axios |

---

## 🚀 Getting Started

### 1) Install

```bash
cd frontend
npm install
```

### 2) Environment

Create `.env` in `frontend/` for local backend usage:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 3) Run

```bash
npm run dev
```

Local URLs:

- Frontend app: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 📋 Routes Snapshot

- `/` Home dashboard
- `/analytics` Analytics view
- `/transactions` Transactions page
- `/profile` Current user profile
- `/profile/:id` Public profile
- `/exports` Excel export page
- `/settings` User settings

---

## 📋 TODOs

- [ ] Add stronger unit/integration coverage for key UI flows
- [ ] Improve offline/PWA readiness
- [ ] Add richer empty/error UI states
- [ ] Continue Lighthouse and bundle optimization
