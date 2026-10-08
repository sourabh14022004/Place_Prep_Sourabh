# PlacePrep Web — Unified Portal

The unified web frontend for the **PlacePrep NST Interview Intelligence Platform**, built with Next.js 16, React 19, and Tailwind CSS v4.

It provides a single, high-performance web experience serving three distinct user roles — **Students**, **Faculty**, and **Administrators** — backed by a standalone Express 5 API.

---

## Architecture & Merged Portals

PlacePrep previously operated as three separate Next.js portal deployments (`student-portal`, `faculty-portal`, `admin-portal`). These have been consolidated into this single application under `dashboard/web/`:

```
dashboard/web/
├── app/
│   ├── (app)/                       # Student Portal (/, /dashboard, /practice, /roadmap, etc.)
│   ├── faculty/                     # Faculty Portal (/faculty/*)
│   ├── admin/                       # Admin Portal (/admin/*)
│   ├── login/                       # Unified login (Google GIS + Credentials)
│   ├── register/                    # Student onboarding & registration
│   ├── onboarding/                  # Multi-step placement onboarding wizard
│   ├── invite/[token]/              # Faculty invitation claiming
│   ├── globals.css                  # Global styles & Tailwind v4 theme
│   └── layout.tsx                   # Root HTML shell & providers
├── components/
│   ├── admin/                       # Admin dashboards, analytics charts, tables
│   ├── faculty/                     # Faculty mentorship drawers, review tools
│   ├── staff/                       # Shared Faculty & Admin custom roadmap tools
│   │   └── custom-roadmaps/         # RoadmapBuilder, RoadmapList, UnpublishDialog
│   ├── layout/                      # Navbar, Sidebar, User Avatar, Quick Navigation
│   ├── modals/                      # Modals (AddToRoadmap, ExternalQuestion, etc.)
│   └── ui.tsx                       # Shared design system components & logo stacks
├── lib/
│   ├── admin/                       # Admin API clients, hooks & types
│   ├── faculty/                     # Faculty API clients, context & types
│   ├── api.ts                       # Typed fetch client with error handling
│   ├── constants.ts                 # Domain constants, platform info, difficulty colors
│   ├── hooks.ts                     # SWR data-fetching hooks (User, Roadmaps, Doubts)
│   └── proxy.ts                     # Role-aware edge authentication & route protection
└── next.config.ts                   # Next.js config & API rewrites to Express backend
```

---

## Authentication & Role Gating

### 1. Domain-Restricted Google Login
- **Google Identity Services (GIS)**: Integrated via `@react-oauth/google` / GIS script on `/login`.
- **Domain Whitelist**: Strictly restricted to `@nst.rishihood.edu.in` institutional email accounts. Any non-NST account is rejected at both the frontend and backend.
- **Auto-Provisioning**: First-time Google logins automatically provision a student user and matching student profile.
- **Profile Picture**: Google profile avatar is synchronized and displayed in the global `Navbar`, `Profile` page, and `Progress` tracker.

### 2. Credentials Fallback
- Email and password authentication is retained for faculty, system administrators, and staging environments.

### 3. Edge Route Protection (`proxy.ts`)
- Evaluates the session JWT from HttpOnly cookies on every request.
- **Prefix Isolation**:
  - `/admin/*` requires `admin` role.
  - `/faculty/*` requires `faculty` or `admin` role.
  - `/*` (root student routes) requires `student` role.
- **Cross-Role Redirection**: If a logged-in user visits a portal outside their permission, `proxy.ts` automatically redirects them to their designated home (e.g., faculty visiting `/dashboard` are redirected to `/faculty`).

---

## Key Features

### Student Experience
- **Personalized Roadmaps**: Dynamically generated based on student self-ratings and company frequency data (`frequency × weakness`), organized into manageable weekly modules with a preview of upcoming weeks.
- **Interactive Practice**:
  - **Coding Questions**: Direct practice links to LeetCode, Codeforces, HackerRank, and GeeksforGeeks.
  - **Interactive MCQs**: In-browser multiple choice testing with immediate feedback, answer explanations, and automated XP crediting.
- **Platform Verification & Coding Profiles**:
  - Connect external handles for **LeetCode** and **Codeforces** in `/profile`.
  - **Live Solve Verification**: When a student marks a problem as solved, the system queries the LeetCode GraphQL API or Codeforces API to confirm an `Accepted` submission for their handle before awarding XP.
  - Unlinked warnings remind students to connect their handles to verify their achievements.
- **Gamification & Analytics**: XP system (Easy: 10, Medium: 25, Hard: 50), streak counters, GitHub-style activity heatmaps, and batch-wide leaderboards.
- **Mentorship & Doubts**: Submit question-specific doubts to faculty and schedule 1-on-1 mock interviews or doubt-clearing sessions.

### Faculty Experience
- **Curriculum Gap Analysis**: Interactive matrix comparing industry interview topic frequencies against NST course syllabus coverage to pinpoint curriculum gaps.
- **Doubts Inbox & Mentorship**: Real-time view of student questions, filtered by domain and urgency, with threaded replies.
- **Session Management**: Review and accept 1-on-1 student mentorship bookings.
- **Student Progress Matrix**: Batch-wide visibility into question completion, active roadmaps, and streak health.

### Staff-Authored Custom Roadmaps (Faculty & Admin)
- Multi-company curriculum builder allowing faculty to curate questions spanning multiple companies.
- Drag-and-drop week structuring and external question additions (LeetCode problems, custom questions).
- **Company Logo Stacks**: Dynamic overlapping visual badges on roadmap cards displaying the logos of all covered companies.
- **Live Subscriber Synchronization**: Updates to a published custom roadmap propagate to all student followers in real time without erasing existing completion credits.
- **Safe Unpublish Workflow**: Two-step retirement dialog showing live follower counts, supporting non-destructive retirement (hidden from discovery while existing followers keep progress) or full removal.

### Admin Experience
- Platform analytics dashboards (engagement, practice volume, doubt resolution rate, placement outcomes).
- Company and question management (moderation, topic tagging, frequency score adjustments).
- Faculty invitation generation and role management.
- System-wide feature flag controls.

---

## Environment Configuration

Create a `.env.local` file in `dashboard/web/` based on `.env.example`:

```env
# URL where the standalone Express API server is reachable
API_URL=http://localhost:4000

# Public site URL used for metadata, robots.txt, and sitemap
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Must be byte-identical to backend JWT_SECRET (min 32 chars)
JWT_SECRET=your-32-char-minimum-jwt-secret-here

# Google OAuth Client ID (restricted to @nst.rishihood.edu.in)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

NODE_ENV=development
```

> **Important**: `JWT_SECRET` must match the `JWT_SECRET` configured in `backend/.env.local` exactly, or edge cookie validation in `proxy.ts` will fail.

---

## Development & Build Commands

All commands can be run directly from `dashboard/web/` or via npm workspaces from the project root:

```bash
# Run web dev server (:3000)
npm run dev

# Run TypeScript typecheck
npm run typecheck

# Build production Next.js bundle
npm run build

# Start production server
npm run start
```

---

## Deployment Decoupling

The web application is fully decoupled and optimized for deployment to **Vercel**:
- All `/api/*` requests are proxied via `next.config.ts` rewrites to `API_URL`.
- In production, set `API_URL` in the Vercel dashboard to the public URL of your deployed Express backend (e.g. hosted on Railway, Render, or Fly.io).
- Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Vercel environment variables to enable Google Sign-In in production.
