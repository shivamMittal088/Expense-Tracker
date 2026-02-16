# Expense Tracker Frontend

The React + Vite frontend for the Expense Tracker application.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state)
- React Router

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file in `frontend/` if you are running the backend locally:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### Running Locally

```bash
npm run dev
```

## Key Features

- Expense tracking UI with day navigation
- Profile management (name, status, avatar)
- Transactions feed with cursor pagination and infinite scroll
- Followers/following lists and public profiles
- Search people modal (navbar)
- Public profile view for searched users (`/profile/:id`) with follow actions and counts
- Analytics dashboard with trends, categories, payment breakdown, and recurring insights

## Notes

- The search modal opens from the navbar search icon.
- Clicking a search result routes to `/profile/:id` and fetches minimal user info.
- The `/transactions` route shows a dedicated transactions-only view.
