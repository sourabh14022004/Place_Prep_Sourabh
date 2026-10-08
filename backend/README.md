# PlacePrep Backend — API Server

The core backend service for the **PlacePrep NST Interview Intelligence Platform**, built with Express 5, TypeScript, and MongoDB Atlas via Mongoose.

It serves as the centralized API layer for student preparation workflows, faculty mentorship and curriculum intelligence, staff custom roadmaps, and administrative control.

---

## Architectural Highlights

- **Standalone Express 5 Server**: Decoupled from the Next.js frontend, listening on port `:4000`. The frontend at `:3000` proxies `/api/*` requests to this backend, ensuring unified origin for browser cookies with zero CORS complexity.
- **Filesystem-Based Router (`src/http/fsRouter.ts`)**: Dynamically mounts 107 API endpoints directly by inspecting the `src/routes` directory hierarchy. Static URL segments take precedence over dynamic parameters (preventing greedy route collisions).
- **Web-Standard Fetch Adapter (`src/http/adapter.ts`)**: Routes are written with standard `(request: Request, context: RouteContext) => Promise<Response>` signatures, decoupling route logic from framework-specific HTTP bindings.
- **Resilient Database Lifecycle**: Implements non-blocking MongoDB Atlas connection handling. The server boots and continues serving even during database downtime; `/health` reports `{"status":"degraded"}` and automatically recovers with exponential backoff once the database becomes reachable.
- **Strict Role-Based Access Control**: Built-in middleware protecting routes for `student`, `faculty`, `admin`, and shared `staff` (faculty + admin) roles.

---

## Directory Structure

```
backend/
├── src/
│   ├── server.ts               # Server bootstrap & graceful shutdown hooks
│   ├── app.ts                  # Express 5 initialization & middleware chain
│   ├── config/
│   │   └── db.ts               # Resilient Mongoose connection manager
│   ├── http/
│   │   ├── adapter.ts          # Express ↔ Web standard Fetch adapter
│   │   └── fsRouter.ts         # Directory-based route loader
│   ├── routes/                 # 107 endpoint handlers mapped to directory paths
│   │   ├── auth/               # /api/auth (login, register, google, logout, me)
│   │   ├── student/            # /api/student (profile, handles, rankings)
│   │   ├── practice/           # /api/practice (practice catalog, filters)
│   │   ├── questions/          # /api/questions (details, completions, MCQs)
│   │   ├── custom-roadmaps/    # /api/custom-roadmaps (student discovery & follow)
│   │   ├── staff/              # /api/staff (shared faculty/admin roadmap builder)
│   │   ├── faculty/            # /api/faculty (doubts, sessions, curriculum gaps)
│   │   ├── admin/              # /api/admin (analytics, moderation, feature flags)
│   │   └── health/             # /api/health (database & service status)
│   ├── services/               # 11 business logic domains
│   ├── repositories/           # 12 Mongoose data access layers
│   ├── models/                 # 18 Mongoose data schemas (Question, User, etc.)
│   ├── validators/             # Zod input validation schemas
│   └── utils/                  # JWT helpers, ApiError, authMiddleware, rate limiter
├── scripts/
│   └── seedRealData.js         # Production dataset seeder (22k+ questions, 676 companies)
├── package.json
└── tsconfig.json
```

---

## Authentication & Verification Systems

### 1. Google OAuth & Institutional Domain Restriction
- **Endpoint**: `POST /api/auth/google`
- **Verification**: Validates Google Identity Services ID tokens directly against Google's token info APIs.
- **Domain Gate**: Strictly enforces `@nst.rishihood.edu.in`. Non-institutional emails are rejected with a 403 status.
- **Auto-Provisioning**: Creates a student user and default student profile if the authenticated Google email does not exist in the database.
- **Avatar Extraction**: Stores the Google account `picture` URL on the user document for display across the web app.

### 2. LeetCode & Codeforces Live Submission Verification
To preserve academic honesty in placement preparation, problem completions can be automatically verified against external competitive programming platforms:
- **Handle Linking**: Students link their LeetCode and Codeforces handles in `/profile`.
- **LeetCode GraphQL Verification**:
  - Pulls user stats (ranking, total solved, easy/medium/hard breakdown) via `https://leetcode.com/graphql`.
  - When marking a problem complete via `POST /api/questions/:id/complete`, backend queries `recentAcSubmissionList` to ensure the student has an `Accepted` submission for that problem's slug within their last 100 solves.
- **Codeforces REST Verification**:
  - Queries `https://codeforces.com/api/user.status` to verify an accepted (`verdict: OK`) submission matching the contest ID and problem index within recent submissions.
- **Unlinked Warning Handling**: If a student solves a problem without having linked the relevant platform handle, the completion is recorded with `verifiedViaPlatform: false`, triggering a non-blocking toast reminder in the UI to link their profile.

### 3. Staff-Authored Custom Roadmaps
- **Endpoints**: `/api/staff/custom-roadmaps`, `/api/staff/company-questions`, `/api/staff/questions`
- Allows faculty and admins to curate roadmaps spanning multiple companies, group questions by week, and insert custom LeetCode links.
- **Live Following**: Students follow via `/api/custom-roadmaps/:slug/follow`. Follower progress is computed dynamically by intersecting their question completion records with the roadmap's current questions.
- **Safe Unpublish**: Supports `retire` (keeps roadmap active for existing followers but hides from discovery) and `remove` modes.

---

## Environment Setup

Create a `.env.local` file in `backend/` based on `.env.example`:

```env
# MongoDB Atlas connection string (percent-encode special chars in password)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/placeprep?retryWrites=true&w=majority

# JWT Signing Secret (must be at least 32 characters, identical to web JWT_SECRET)
JWT_SECRET=your-32-char-minimum-jwt-secret-here
JWT_EXPIRES_IN=7d

# Port the Express server listens on
API_PORT=4000

# Public URL of the web frontend
SITE_URL=http://localhost:3000

# Google OAuth Client ID (matching web app)
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

# SMTP configuration for faculty invite emails (optional in dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=PlacePrep NST <noreply@placeprep.nst>

NODE_ENV=development
```

---

## Development & Utility Commands

Run from the `backend/` directory (or use workspace commands from the root):

```bash
# Start backend in watch mode via tsx (:4000)
npm run dev

# Run TypeScript type check
npm run typecheck

# Build TypeScript to dist/
npm run build

# Start production build
npm run start

# Seed initial test data
npm run seed

# Seed full production dataset (22k+ questions, 676 companies)
npm run seed:real

# Backfill MCQs into questions
npm run backfill:mcq

# Backfill question IDs on roadmaps
npm run backfill:domains
```

---

## Production Deployment

Because the Express API is a persistent Node.js process, it is decoupled from Vercel and designed for hosting on platforms such as **Railway**, **Render**, or **Fly.io**:
- **Start Command**: `npm run start` (or `node dist/server.js` after running `npm run build`).
- **Health Check**: `GET /api/health` returns status `200` with `{"status":"ok","db":"connected"}`.
