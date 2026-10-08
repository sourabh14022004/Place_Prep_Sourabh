# PlacePrep — Dashboard Workspace

This directory houses the unified web frontend for the PlacePrep NST Interview Intelligence Portal.

---

## Architecture Evolution: 3 Portals → 1 Unified App

Originally conceived and scaffolded as three separate Next.js deployments (`student-portal`, `faculty-portal`, `admin-portal`) backed by a shared library, the frontend architecture was refactored into a single, cohesive Next.js web application located in [`dashboard/web/`](file:///Users/sourabhsarkarmacois/Desktop/Place_Prep_Sourabh/dashboard/web).

### Why the Merge?
- **Shared Domain & State**: All three portals already shared the same MongoDB database, JWT authentication scheme, and entity models. The separation created artificial boundaries without real isolation.
- **Cross-Origin Auth Friction Eliminated**: Running separate apps previously required passing session tokens across origins via URL query parameters (leaking credentials into browser history and server logs). With one unified origin, authentication relies securely on same-origin HttpOnly cookies.
- **Dependency & Build Efficiency**: Merging eliminated three redundant dependency trees (dropping `node_modules` overhead by more than 50%), unified React 19 and Next.js versions, and reduced developer overhead from running three development servers down to one.
- **Reverse-Proxy Architecture**: The Next.js frontend at `localhost:3000` transparently rewrites all `/api/*` traffic to the standalone Express backend at `localhost:4000`, eliminating the need for complex CORS configurations.

---

## Directory Structure

```
dashboard/
└── web/                           # Unified Next.js 16 App Router application
    ├── app/
    │   ├── (app)/                 # Student Portal routes (/, /dashboard, /practice, /roadmap, etc.)
    │   ├── faculty/               # Faculty Portal routes (/faculty/*)
    │   ├── admin/                 # Admin Portal routes (/admin/*)
    │   ├── login/                 # Unified login with Google GIS & Credentials
    │   ├── register/              # Student onboarding & registration
    │   └── invite/[token]/        # Faculty invitation onboarding
    ├── components/
    │   ├── admin/                 # Admin-specific layout, charts, and tables
    │   ├── faculty/               # Faculty-specific layout, drawers, and metrics
    │   ├── staff/                 # Shared faculty/admin features (Custom Roadmap Builder)
    │   └── layout/                # Common shell components (Navbar, Sidebar, etc.)
    ├── lib/
    │   ├── admin/                 # Admin API clients and types
    │   ├── faculty/               # Faculty API clients, context, and types
    │   ├── api.ts                 # Unified fetch utilities
    │   ├── constants.ts           # Shared application constants
    │   └── hooks.ts               # SWR data fetching hooks
    └── proxy.ts                   # Role-aware edge authentication & route gating
```

---

## Portal Roles & URL Routing

The single web application uses route paths to distinguish user domains while enforcing strict role-based access control in [`proxy.ts`](file:///Users/sourabhsarkarmacois/Desktop/Place_Prep_Sourabh/dashboard/web/proxy.ts):

| Domain | Base Path | Target Audience | Primary Features |
|---|---|---|---|
| **Student Portal** | `/` | NST Students | Company roadmaps, weekly curricula, interactive practice (MCQ & coding), LeetCode & Codeforces verification, doubts, session booking, streak/XP tracking. |
| **Faculty Portal** | `/faculty` | Faculty & Mentors | Curriculum gap analysis, student progress matrix, doubt resolution inbox, 1-on-1 mentorship session management, custom roadmap authoring. |
| **Admin Portal** | `/admin` | Administrators | System analytics (engagement, practice, placements), question moderation, company management, feature flags, faculty invitations. |

---

## Quick Start

To develop the web frontend directly:

```bash
cd dashboard/web

# Install dependencies (managed at root workspace)
npm install

# Configure environment
cp .env.example .env.local

# Start web development server (:3000)
npm run dev
```

For full-stack local development (running both the Express API and Next.js web application simultaneously), use `npm run dev` from the repository root.

For detailed frontend documentation, see [dashboard/web/README.md](file:///Users/sourabhsarkarmacois/Desktop/Place_Prep_Sourabh/dashboard/web/README.md).
