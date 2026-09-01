# PlacePrep — Vibe Coding Pre-Build Documents
### 6 Documents to Continue Building the NST Interview Intelligence Portal

> **How to use this document:**
> 1. All 6 pre-build documents below are fully filled in with real PlacePrep content, derived from an exhaustive audit of the existing frontend codebase.
> 2. Feed this entire file to your AI coding tool.
> 3. Use the Master Prompt at the end to kick off the next phase of the build (wiring the real backend behind the three existing mocked frontends).
>
> **Current state (important context for the AI):** PlacePrep already has three independently deployed Next.js 16 frontends (Student, Faculty, Admin), all running entirely on local mock data with no live backend, no database, and no enforced authentication. Documents 1–5 describe both what is already built and the target architecture; Document 6 is the phased plan to take it from "three mocked frontends" to a working production app.

---

# DOCUMENT 1 — Product Requirements Document (PRD)

> **Purpose:** Tells the AI *what* you're building — the idea, users, problems, and features.

---

## App Overview

| Field | Your Answer |
|---|---|
| **App Name** | PlacePrep — NST Interview Intelligence Portal |
| **One-Line Description** | India's first structured, data-driven interview preparation portal built exclusively for NST (Newton School of Technology) students, enabling students to prepare for company-specific interviews with personalized roadmaps, while giving faculty and administrators real-time visibility into student preparedness and placement readiness. |
| **App Category** | EdTech / Internal University Tool (SaaS-style, institution-locked) |
| **Platform** | Web (Responsive — Desktop, Tablet, Mobile). Three independent Next.js applications deployed as separate Vercel projects from a monorepo. |

**Why "PlacePrep" and Not Something Else?** The name is a portmanteau of *Placement + Preparation*, directly communicating its core purpose. The "NST" prefix anchors it to Newton School of Technology, making it clear this is a university-owned, curriculum-aligned placement intelligence system — not a generic LeetCode clone.

**Why a Monorepo with Three Separate Portals (Not a Single App)?**

| Decision | Rationale | Why Not the Alternative |
|---|---|---|
| 3 independent Next.js apps in one repo | Each portal has fundamentally different users, permissions, navigation, and data needs. A student should never see faculty controls and vice versa. | Single app with role-based routing — adds complexity to middleware, increases bundle size for all users, makes each deploy risky for all roles. |
| Monorepo (one GitHub repo) | Shared deployment pipeline, single source of truth, synchronized releases, easy for the university to manage. | Separate repos — harder to coordinate changes, version drift between portals, duplicated CI/CD setup. |
| Vercel per-project deployment | Each portal gets its own URL, independent build, and zero-downtime deploys. Vercel's "Root Directory" feature was made for this pattern. | Single Vercel project — can only serve one app per project. |

---

## Target Users

**Primary User: NST Students (Placement-Year & Pre-Placement-Year)**
Students at Newton School of Technology preparing for campus placements. They are tech-savvy (CS/Engineering students), familiar with LeetCode, Codeforces, and coding platforms, but lack a structured, company-specific preparation system tied to their university curriculum. Most are in years 2–4 of their B.Tech program. They use phones and laptops equally.

**Secondary User: NST Faculty (Placement Cell & Department Professors)**
Faculty members involved in placement preparation. They conduct doubt-clearing sessions, mock interviews, and monitor which students are actively preparing. They range from very tech-savvy (CS professors) to moderately technical (placement coordinators). They primarily use desktops.

**Tertiary User: NST Administrators (Placement Cell Head / Dean)**
Senior university staff who need aggregate dashboards — how many students are preparing, which companies are most targeted, and system engagement metrics. They need decision-making data, not individual student interactions.

**User Personas:**

| Persona | Age Range | Goal | Pain Point |
|---|---|---|---|
| Aarav (3rd Year CSE Student) | 20–22 | Crack Google SDE-1 interview in 12 weeks | No structured roadmap — hops between LeetCode, YouTube, and random PDFs. Doesn't know what Google actually asks. |
| Kavya (2nd Year Student) | 19–21 | Start early prep for top Indian product companies | Overwhelmed by options — doesn't know if she should focus on DSA, System Design, or aptitude first. |
| Prof. Sharma (CS Faculty) | 35–50 | Help students prepare efficiently, track who needs guidance | Gets flooded with unstructured WhatsApp messages; can't see who is actually practicing and who is not. |
| Dr. Verma (Placement Head/Admin) | 40–55 | Maximize placement rate, report metrics to management | No single dashboard shows which batches are underperforming, what the curriculum gaps are, or how engaged students are. |

---

## Problem Statement

**Current Situation:**
Without PlacePrep, NST students use a chaotic mix of LeetCode, InterviewBit, YouTube playlists, random Telegram groups, and seniors' notes. They have no company-specific interview intel (they don't know which companies ask System Design vs pure DSA vs aptitude), get no personalized roadmap (a student targeting Google and one targeting TCS follow the same generic "do 300 LeetCode problems" advice), have no way to track progress across weeks and topics, and message faculty on WhatsApp for doubts, creating an unmanageable flood of messages.

Faculty members cannot see which students are actually preparing vs which are just registered, have no structured system for scheduling mentoring sessions, and cannot identify at-risk students early enough to intervene. Administrators rely on manual Excel sheets for placement tracking, have no real-time visibility into preparation activity across batches, and cannot assess curriculum vs industry demand alignment.

**Core Problem:**
There is no single platform that connects company-specific interview intelligence, personalized preparation roadmaps, faculty mentoring workflows, and institutional placement analytics for a university setting.

**Why Existing Solutions Fall Short:**

| Solution | Why It Falls Short |
|---|---|
| LeetCode / InterviewBit | Generic question banks with no company-specific roadmaps, no faculty involvement, no university integration, no onboarding that tailors to a student's target companies. |
| Pramp / Interviewing.io | Mock interview platforms only — no content, no roadmaps, no progress tracking, no faculty angle. |
| PrepInsta / GeeksforGeeks Campus | Focus on company-specific questions but no personalized roadmaps, no XP/gamification, no faculty portal, no admin analytics. |
| WhatsApp / Telegram Groups | Unstructured, noisy, un-searchable, no accountability, no data. |
| University LMS (Moodle, etc.) | Designed for coursework, not interview prep. No company intelligence, no roadmap engine, no placement-specific analytics. |

PlacePrep is different because it is the only tool that unifies all three stakeholders (Student, Faculty, Admin) in a single platform purpose-built for campus placement preparation.

---

## User Roles

| Role | Description | Permissions |
|---|---|---|
| Student | Active NST student preparing for placements. Accesses the Student Portal. | Can browse company intel, add companies to personal roadmap (max 5), practice questions, track progress, submit interview experiences, ask doubts to faculty, book mentoring sessions, view leaderboard, manage profile & notifications. |
| Faculty | NST professor or placement mentor. Accesses the Faculty Portal. | Can view/respond to student doubts, manage session requests (accept/propose/decline), view student matrix and leaderboard, browse company rankings and curriculum alignment data, export reports. |
| Admin | Placement cell head or university administrator. Accesses the Admin Portal. | Can view platform-wide overview stats (students, faculty, online counts, DAU/MAU), manage students and faculty accounts, view deep analytics (engagement heatmaps, doubts intelligence, practice zone, placement tracking), manage leaderboard, view slot bookings, send push notifications, export reports, manage calendar. |

**Why These Three Roles and Not More?** A two-role system (Student + Admin) was rejected because faculty need a separate, focused interface (they shouldn't see admin controls, and admin shouldn't see individual doubt threads) and faculty are subject-matter experts, not system operators. A more granular system (separate "Mentor" vs "Professor" roles) was rejected under YAGNI — the current role set covers all identified use cases; sub-roles can be introduced within the Faculty portal later if needed.

---

## Core Features (MVP)

These are the features already built out in the frontend (currently on mock data). They constitute the V1 product surface the backend must support.

### Student Portal Features

| # | Feature | Description | Priority |
|---|---|---|---|
| 1 | Onboarding Flow (4 Steps) | Step 1: Select target domains (SDE, Frontend, Data Science, etc.). Step 2: Choose target company categories (FAANG/MAANG, Indian Product, Service, Startup, BFSI, Other). Step 3: Rate self-confidence on relevant topics (1–10 slider per topic). Step 4: Select preparation timeline (4, 8, 12, 16, or 24 weeks). | Must Have |
| 2 | Company Intelligence Pages | Browse 12+ companies (Google, Amazon, Microsoft, Flipkart, TCS, Razorpay, etc.). Each page shows success rate, avg salary, difficulty rating, hiring status, avg process duration, round structure, topic frequency distribution (bar chart), difficulty breakdown (pie chart), year-over-year trend data (line chart), and a full round-wise question bank. Filter by company type. | Must Have |
| 3 | Multi-Company Roadmap Engine | Students add up to 5 companies to a personal roadmap. Each company generates a week-by-week prep plan (4–16 weeks) with specific topics, questions (linked to LeetCode URLs), XP rewards, and difficulty tags. Weeks are progressively unlocked (done → active → locked). Companies can be removed. | Must Have |
| 4 | Dashboard (Student Home) | Target companies with circular readiness gauges, today's tasks per company (3 or 5 questions), checkable question list with XP, recent interview reports, prep score (composite of practice %, streak, XP), day streak counter, XP earned, GitHub-style activity heatmap, problems-solved progress bar. | Must Have |
| 5 | Practice Zone | 8 practice categories: DSA, System Design, Aptitude, HR & Behavioral, LLD/OOP, Core CS, Mock OA, MCQs. Each maps to specific round types. Questions filterable by topic, difficulty, round type, and company. Links to external sources (LeetCode, etc.). | Must Have |
| 6 | Progress Tracker | Visual progress across all added roadmap companies — current week, problems solved vs assigned, XP progress. | Must Have |
| 7 | Leaderboard | XP-based ranking of students. Shows rank, name, batch, XP, badge icons. Gamification element. | Should Have |
| 8 | Interview Experience Submission | Students submit real interview experiences: company, role, rounds faced, round-by-round details (questions, difficulty, notes), outcome (selected/rejected/pending), tags. Others can browse and upvote. | Must Have |
| 9 | Doubt System (Ask a Doubt) | Students post doubts tagged with a topic (DSA, System Design, LLD, HR, General, Web Dev, Aptitude). Each doubt has subject, body, tag, status (pending/answered/resolved), and a thread of replies. Faculty respond via the Faculty Portal. | Must Have |
| 10 | Book a Session | Students book mentoring sessions with faculty. Calendar-based date picker, 7 time slots, 30-min or 60-min duration, topic selection, notes field. Statuses: pending → confirmed/proposed/cancelled → completed. Confirmed sessions show a Jitsi Meet link. | Must Have |
| 11 | Profile Page | Displays name, email, batch/year, academic details, skills, prep stats (problems solved, day streak, XP, target companies), and edit capabilities for personal and academic info. | Should Have |
| 12 | Notifications | Badge earned, new company added, roadmap week completed, interview experience approved, new questions added, XP milestones. Read/unread status. | Should Have |
| 13 | Global Search | Unified search across companies, questions, and topics. Returns max 8 results. Index includes company names (with question counts and types) and topic categories (with interview frequency context). | Should Have |
| 14 | Messages Page | Chat-style messaging interface between students and faculty. Currently a UI shell — future feature for real-time communication. | Nice to Have |
| 15 | Authentication (Clerk) | Login via Clerk (email/password, Google OAuth restricted to @newtonschool.co). Protected routes via middleware. Onboarding redirect for new users. Currently in demo mode with middleware protection commented out. | Must Have |

### Faculty Portal Features

| # | Feature | Description | Priority |
|---|---|---|---|
| 1 | Faculty Dashboard | KPI cards: curriculum coverage stats (per subject, per company category), pending doubts, upcoming sessions, industry trend alerts. Quick-access cards. Semester selector (Fall 2024, Spring 2024, Fall 2023) that dynamically adjusts stats. Sync button for data refresh. | Must Have |
| 2 | Session Request Management | View all student session requests with status-based tabs (Pending, Confirmed, Proposed, Completed, Cancelled). Accept, decline, or propose alternative times. Auto-generated Jitsi Meet links for confirmed sessions. Session details: student name, branch, year, topic, notes, date/time, duration. | Must Have |
| 3 | Doubt Response System | View all student doubts with status filters (All, Pending, Answered, Resolved). Tag-based filtering. Threaded reply system — faculty answer, student follows up. Mark doubts as resolved. | Must Have |
| 4 | Student Matrix | View all students with preparation metrics. Filterable and searchable. Shows name, branch, year, progress percentage, XP earned, practice stats. | Must Have |
| 5 | Leaderboard (Faculty View) | Same XP-based leaderboard as student view, with faculty-specific context — lets faculty see top performers and struggling students. | Should Have |
| 6 | Company Rankings | View companies ranked by curriculum alignment score (how well NST's curriculum covers what each company tests). Filter by company type. Shows top tested subject per company. | Should Have |
| 7 | Curriculum Coverage Matrix | Interactive matrix showing which interview topics (Arrays, Trees, SQL, DP, System Design, etc.) are covered in which course categories (DSA, System Design, SQL, OS, Networking). Identifies curriculum gaps — topics industry demands but the university doesn't adequately cover. | Should Have |
| 8 | Export Reports | Generate reports on curriculum coverage, student preparedness, and industry alignment. Report history with downloadable records. | Should Have |
| 9 | Industry Trend Alerts | Real-time feed of hiring trend changes: companies increasing/decreasing focus areas, new interview patterns, aptitude cutoff changes. Severity-tagged (High, Medium, Info). | Nice to Have |
| 10 | Profile Management | Faculty profile with name, department, subjects taught, stats (doubts solved, sessions conducted). | Should Have |
| 11 | Notifications | Session request updates, new doubts assigned, system announcements. | Should Have |

### Admin Portal Features

| # | Feature | Description | Priority |
|---|---|---|---|
| 1 | Platform Overview Dashboard | Hero row: Total Students (active/inactive), Total Faculty (active/inactive), Students Online Now (with DAU/MAU), Faculty Online Now (with DAU/MAU). KPI row: Students on Roadmap (+% change), Doubts Raised, Sessions Booked, Sessions Completed, Avg Satisfaction (out of 5). Weekly sessions bar chart. Recent sessions table. System diagnostics (server load, CPU, memory). | Must Have |
| 2 | Student Management | Paginated student table with search. Fields: name, batch, progress %, doubts raised, sessions completed, status (PLACED, IN PROGRESS, INACTIVE). Individual student detail pages. | Must Have |
| 3 | Faculty Management | Faculty table with search. Fields: name, initials, subject, sessions accepted/declined, satisfaction rating, response rate, status (ACTIVE, INACTIVE, PENDING, INVITE PENDING). Separate "Manage Faculty" page for CRUD operations. | Must Have |
| 4 | Engagement Analytics | Daily Active Users (DAU) line chart (students vs faculty), Monthly Active Users trend, hourly activity heatmap (peak usage hours/days), current online counts. | Must Have |
| 5 | Doubts Intelligence | Summary: total raised, total resolved, resolution rate %, avg resolution time (hours). Timeline chart (raised vs resolved). By-batch, by-faculty, by-subject breakdowns. Hourly pattern heatmap. | Must Have |
| 6 | Practice Zone Analytics | Summary: total problems solved, active solvers today, top domain. By-domain breakdown. Batch × domain matrix. Daily unique solvers trend. | Must Have |
| 7 | Placement Tracker | Company interest distribution (most-targeted companies). Batch-wise placement rate. Assignment solve rate over time. | Must Have |
| 8 | Admin Leaderboard | XP leaderboard with batch filtering and period selection (monthly/weekly). Shows rank, student name, batch, XP, tasks completed, doubts raised. | Should Have |
| 9 | Slot Bookings Overview | Booking summary: today, this week, this month. By-batch booking stats (upcoming/completed/cancelled). Daily booking trend. Top faculty by bookings. | Should Have |
| 10 | Calendar | Calendar view of all scheduled sessions across the platform. | Should Have |
| 11 | Push Notifications | Send notifications to students, faculty, or all users. Notification log with status (sent/scheduled/failed) and target audience. | Should Have |
| 12 | Reports | Downloadable reports across all analytics dimensions. | Should Have |
| 13 | Help / Guide | Static help content for platform navigation and FAQ. | Nice to Have |

---

## User Stories

Format: *As a [user role], I want to [action] so that [outcome].*

```
Student Stories
1. As a student, I want to select my target companies and preparation timeline during
   onboarding so that I get a personalized roadmap tailored to what those companies test.
2. As a student, I want to see deep intelligence on each company (round structure, topic
   frequencies, difficulty breakdown, year-over-year trends, and real questions) so that I
   know exactly what to prepare for.
3. As a student, I want to add up to 5 companies to my roadmap and see week-by-week plans
   with specific LeetCode problems, XP rewards, and progressive unlocking so that I stay on
   track without getting overwhelmed.
4. As a student, I want to see today's assigned tasks per company on my dashboard (with
   checkboxes, difficulty tags, and XP) so that I start each day knowing what to solve.
5. As a student, I want to track my prep score (a composite of practice consistency, day
   streak, and XP progress) so that I have a single number representing my readiness.
6. As a student, I want to browse a Practice Zone with 8 categories so that I can practice
   beyond my roadmap.
7. As a student, I want to ask tagged doubts and receive threaded replies from faculty so
   that my questions are answered without WhatsApp chaos.
8. As a student, I want to book mentoring sessions with faculty (30/60-min, with topic and
   notes) and join via Jitsi Meet link so that I get structured one-on-one guidance.
9. As a student, I want to submit my real interview experiences so that I help peers and
   build a community knowledge base.
10. As a student, I want to see a GitHub-style activity heatmap and an XP-based leaderboard
    so that I stay motivated through gamification and social comparison.

Faculty Stories
1. As a faculty member, I want to see all student doubts in one place — filterable by tag
   and status — so that I can prioritize and respond efficiently.
2. As a faculty member, I want to manage session requests (accept, propose, decline) with
   auto-generated Jitsi links so that I can schedule mentoring without back-and-forth.
3. As a faculty member, I want to see a curriculum coverage matrix showing which interview
   topics are covered in my courses and which are gaps so that I can align my teaching.
4. As a faculty member, I want to see company rankings by curriculum alignment score so that
   I know which companies my students are best prepared for.
5. As a faculty member, I want to see industry trend alerts so that I can proactively update
   my teaching material.
6. As a faculty member, I want to view a student matrix with individual progress metrics so
   that I can identify struggling students early and intervene.

Admin Stories
1. As an admin, I want a real-time platform overview (students, faculty, online users,
   DAU/MAU, key KPIs) so that I can assess platform health in 30 seconds.
2. As an admin, I want engagement analytics (DAU/MAU trends, hourly heatmaps) so that I can
   optimize usage and identify drop-off points.
3. As an admin, I want doubts intelligence (resolution rate, avg time, by-faculty
   performance) so that I can ensure faculty are meeting student needs.
4. As an admin, I want practice zone analytics so that I can measure actual preparation
   activity — not just logins.
5. As an admin, I want placement tracking so that I can report outcomes to university
   management.
6. As an admin, I want to manage student and faculty accounts (view, search, filter by
   status) so that I can onboard new users and deactivate inactive ones.
7. As an admin, I want to send push notifications to students, faculty, or all users so that
   I can communicate announcements platform-wide.
```

---

## Success Metrics

| Metric | Target |
|---|---|
| Student signups (Month 1) | 100% of placement-year batch (institutional mandate) |
| Onboarding completion rate | > 80% |
| Students with active roadmap | > 70% of registered students |
| Daily Active Users (Students) | > 30% of registered students |
| Problems solved per active student per week | > 10 |
| Average day streak | > 5 days |
| Doubt resolution rate | > 85% within 24 hours |
| Session booking utilization | > 60% of available slots |
| Interview experience submissions | > 50 per semester |
| Placement rate improvement | +10% vs previous year |

---

## Out of Scope (V1)

Features intentionally NOT built in Version 1:

- [ ] Mobile native app (iOS/Android) — web-only; responsive design covers mobile browsers
- [ ] Real backend / database — V1 uses mock data with BACKEND TODO annotations; all data is client-side sessionStorage or hardcoded (backend is planned but not yet implemented)
- [ ] Real-time notifications (WebSocket/SSE) — currently static mock notifications
- [ ] AI-powered roadmap generation — roadmaps are currently template-based per company (AI personalization is V2)
- [ ] Integrated code editor / online judge — questions link to external platforms (in-platform coding is V2)
- [ ] Video recording / playback for mock interviews — sessions are live via Jitsi only, no recording
- [ ] Multi-university support — hardcoded for NST only (multi-tenant is V3)
- [ ] API access for third parties — no public API in V1
- [ ] Advanced RBAC / sub-roles — no fine-grained role permissions (e.g., "HOD" vs "Assistant Professor")
- [ ] Payments / subscriptions — no monetization (university internal tool)
- [ ] Resume builder / ATS integration — focus is on interview prep, not applications
- [ ] Proctoring for Mock OAs — Mock OAs are self-paced, not proctored

---
---

# DOCUMENT 2 — Technical Requirements Document (TRD)

> **Purpose:** Tells the AI *how* to build it — stack, architecture, APIs, auth, deployment.
>
> Document Version: 1.0 · Last Updated: 2026-07-09 · Repository: github.com/edusatyaki/NST-Interview-Prep-Portal

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) + React 19 + TypeScript 5 | App Router enables server components, streaming, and nested layouts. React 19 brings performance improvements and server-component support. Three separate Next.js apps (Student, Faculty, Admin) enable independent deployment and role-isolated codebases. |
| **Backend** | FastAPI (Python) — shared API layer, plus Next.js API Routes for portal-specific actions | Lightweight, async-native Python framework. Ideal for the data-centric workload: scraping-pipeline integration, Claude API classification, and serving structured interview data from PostgreSQL. Next.js API Routes handle session-context operations (bookings, doubts, roadmaps). |
| **Database** | PostgreSQL 15+ via Supabase | Relational schema suits the highly normalized data model (companies, roles, topics, questions, courses, syllabus_topics). Supabase provides managed PostgreSQL with built-in Row-Level Security, realtime subscriptions, and auto-generated REST/GraphQL APIs. |
| **Auth** | Clerk (Student Portal) + cookie-based auth (Faculty Portal) + pending/JWT (Admin Portal) | Student Portal uses Clerk with Google OAuth SSO (restricted to @newtonschool.co). Faculty Portal uses a lightweight cookie-based session (`faculty_authed`) via Next.js middleware. Admin Portal auth is pending implementation — middleware currently passes all requests through. |
| **File Storage** | Supabase Storage | Avatar uploads and data-export files stored in Supabase Storage; integrates with Supabase Auth for access control. Large raw scraper dumps go to cloud storage (Supabase Storage / Google Drive) and are excluded from git. |
| **Hosting/Deploy** | Vercel (Frontend) + Supabase Edge / standalone (Backend) | All three Next.js portals deploy as independent Vercel projects. FastAPI backend is intended for Supabase Edge Functions or a standalone deployment. Vercel provides automatic preview deployments, edge caching, and zero-config Next.js support. |
| **CSS/Styling** | Tailwind CSS v4 + shadcn/ui (Faculty Portal) | Tailwind v4 provides utility-first styling with zero-config PostCSS integration. Faculty Portal additionally uses shadcn/ui with class-variance-authority, clsx, tailwind-merge, and tw-animate-css. Student Portal uses raw Tailwind. |
| **Charts & Visualization** | Recharts (all portals) + Chart.js (Faculty heatmaps) | Recharts is React-native, used across all portals for bar/area/line/pie charts. Chart.js is used specifically in the Faculty Portal for heatmap-style visualizations (Industry vs. Syllabus gap matrix). |
| **Data Fetching** | SWR (Admin Portal) + native fetch (other portals) | Admin Portal uses SWR with built-in caching, revalidation, and polling (`refreshInterval: 30_000`). Student and Faculty portals currently use mock data directly. |
| **AI/ML Pipeline** | Anthropic Claude API | Used in the ETL classification pipeline (`pipeline/classify.py`) to tag scraped questions with topic, difficulty, round type, and syllabus mapping. |
| **Scraping Tools** | BeautifulSoup + Selenium/Playwright + GraphQL/REST APIs | Static HTML scraped with requests + BeautifulSoup. JS-rendered pages (AmbitionBox, Glassdoor) use Selenium/Playwright. LeetCode and GitHub use GraphQL/REST. `fake_useragent` for user-agent rotation. |
| **Typography** | Inter (Google Fonts) | Clean, professional sans-serif loaded via Google Fonts CDN. Weights 300–900 used across all portals. |
| **Icons** | Lucide React | Consistent, lightweight, tree-shakeable SVG icon library across all three portals. |

---

## Architecture Overview

**Architecture Pattern:** Multi-App Monorepo with Shared Backend (Modular Monolith)

Three independent Next.js frontend apps share a common FastAPI backend and Supabase database. Each portal deploys independently on Vercel under its own URL. The data pipeline (scrapers → ETL → classification) runs as a separate offline batch process.

**High-Level Flow:**
```
DATA PIPELINE (Offline)
  35+ Public Sources → Scrapers (Python) → Raw JSON Dumps
    → Ingestion Pipeline → Deduplication → Transformation → Cleaning
    → Claude API Classification (topic, difficulty, round_type)
    → Supabase PostgreSQL (companies, roles, topics, questions, courses)
                              │
                    ┌─────────┴─────────┐
                    │  FastAPI Backend  │
                    │  /companies        /topics
                    │  /questions        /syllabus/gap-analysis
                    └─────────┬─────────┘
          ┌──────────────────┼──────────────────┐
     Student Portal     Faculty Portal      Admin Portal
     Next.js 16 :3000   Next.js 16 :3001    Next.js 16 :3001
     Clerk Auth         Cookie Auth         (No Auth yet)
     Vercel ①           Vercel ②            Vercel ③

Data Flow Summary:
1. Scrapers extract raw interview data from 35+ public sources → JSON dumps to data/raw/
2. Pipeline ingests, deduplicates, transforms, classifies → loads into Supabase PostgreSQL
3. FastAPI serves structured data through REST API endpoints
4. Student Portal → company search, topic browsing, roadmap generation, practice zone
5. Faculty Portal → curriculum gap analysis, industry trend monitoring, session management
6. Admin Portal → student/faculty management, analytics dashboards, system monitoring
```

---

## Authentication & Authorization

**Auth Method (by portal):**
- **Student Portal:** Clerk — Google OAuth SSO, restricted to @newtonschool.co emails only.
- **Faculty Portal:** Custom cookie-based — password login sets a `faculty_authed` cookie.
- **Admin Portal:** Pending implementation — currently bypassed (middleware passes all requests through). Target is JWT/session.

**Session Handling:**
- **Student:** Clerk-managed JWT sessions, automatic token refresh. `ClerkProvider` wraps the app; `clerkMiddleware` with `createRouteMatcher` for route protection; SSO callback redirects to `/dashboard`.
- **Faculty:** HTTP-only cookie (`faculty_authed`). Next.js middleware checks for cookie presence; unauthenticated users redirected to `/login`, authenticated users on `/login` redirected to `/`.
- **Admin:** None currently (auth removed). Middleware comment states: "Authentication check removed to prepare for robust backend auth. Session verification should be handled by actual auth provider."

**Authorization Rules:**
- **Student** can access dashboard, companies, practice, roadmap, progress, doubts, sessions, leaderboard, messages, notifications, profile, submit; can interact with their own onboarding flow.
- **Guest User** can access the landing page (`/`), login page (`/login`), and demo mode via "Guest Access" → `/onboarding/step1`.
- **Guest/Unauthenticated User** CANNOT access any protected route under `/(app)/` (currently bypassed for demo).
- **Faculty** can access dashboard, curriculum gap matrix, industry trends, company rankings, session requests, doubts, reports, students, leaderboard, notifications, profile; can answer doubts, manage session requests (confirm/propose/decline), and generate/export PDF reports.
- **Unauthenticated Faculty** CANNOT access any route except `/login`.
- **Admin** can manage all students and faculty, view all analytics (engagement, doubts, practice, placement, bookings), view leaderboard data, send push notifications, and view system overview.

> ⚠ **Current State:** Student Portal auth is in "EMERGENCY DEMO MODE" — Clerk protection is commented out so teachers can view the Vercel link without authentication. This must be re-enabled before any production release with real student data. (See Document 6, Phase 2.)

---

## Unified Role-Based Login (Cross-Portal SSO Design)

> **The requirement:** one login experience where a Student, a Faculty member, and an Admin all sign in the same way, and each is automatically routed into *their own* portal (Student / Faculty / Admin) based on their role — instead of today's three disconnected, differently-broken login screens.

**Why this isn't just "add auth to each portal separately":** the three portals are three *separately deployed* Next.js apps on three different Vercel domains (see App URLs below). A login on one does not carry over to another today, and never will unless the three apps are made to share one identity/session layer on purpose. The design below does that.

### Recommended Approach: Clerk with Satellite Domains

Clerk (already integrated in the Student Portal) supports exactly this topology: one **primary** application plus any number of **satellite** applications that all share a single sign-in session, as long as they sit on subdomains of the same root domain.

1. **Put all three portals on one root domain, as subdomains** — e.g. `app.placeprep.nst.edu` (Student, primary), `faculty.placeprep.nst.edu` (satellite), `admin.placeprep.nst.edu` (satellite). This formalizes the "custom domain" item already on the Phase 10 deployment checklist — it's a functional requirement for SSO here, not just cosmetic branding.
2. **Add a `role` field to every user's identity** — stored in Clerk `publicMetadata.role` (`'student' | 'faculty' | 'admin'`) and mirrored into the Supabase `users`/`profiles` table so RLS policies and API authorization checks can key off the same value. Students get `role: 'student'` automatically on first Google OAuth sign-in (domain-restricted to `@newtonschool.co`); Faculty and Admin accounts get their role set at invite time by an existing Admin (reuses the faculty-invite flow already planned in Document 6, Phase 7).
3. **One shared sign-in screen.** The simplest option is to keep using the Student Portal's existing, already-styled `/login` as the Clerk *primary* sign-in surface for everyone — Faculty and Admin visiting `faculty.placeprep.nst.edu` or `admin.placeprep.nst.edu` while signed out get redirected there automatically by Clerk's satellite-domain handshake, then bounced back after authenticating. (Alternative: stand up a small neutral 4th "gateway" app at the root domain if a portal-branded login page feels wrong for faculty/admin — more infra to maintain, but a cleaner first impression.)
4. **Role-based redirect after sign-in.** Immediately after Clerk authenticates the user, a redirect callback reads `publicMetadata.role` and sends them to the matching subdomain's home: `student` → `app.placeprep.nst.edu/dashboard`, `faculty` → `faculty.placeprep.nst.edu/`, `admin` → `admin.placeprep.nst.edu/overview`.
5. **Each portal still independently enforces its own role**, not just the login gate — every portal's `middleware.ts` calls Clerk's `auth()`, reads `role`, and redirects anyone whose role doesn't match that portal back to their own subdomain (e.g., a student who manually types the admin subdomain's URL gets bounced, not let in). This is the piece that's currently entirely missing on the Admin Portal and only cookie-deep on Faculty — Clerk satellite auth replaces both of today's fragile, portal-specific mechanisms with one real one.
6. **Retire the portal-specific auth hacks once this lands:** the Faculty Portal's custom `faculty_authed` cookie and the Admin Portal's currently-nonexistent auth both go away, replaced by the same Clerk session everywhere. The "Guest Access (Demo Mode)" buttons found live on all three login pages (see Document 3's live-verification notes) should be removed or hidden behind a non-production flag as part of this same change — they currently bypass whatever gating exists on any portal.

### Alternative Approach (if avoiding Clerk's paid multi-domain tier)

Standardize on **Supabase Auth** instead: set the session cookie's `Domain` attribute to the shared apex (`.placeprep.nst.edu`) so all three subdomains can read the same cookie, store `role` on the `profiles` table, and have each portal's middleware call `supabase.auth.getUser()` + a `role` check. This avoids new vendor cost but is more custom-built than Clerk's turnkey satellite-domain support and means re-doing the Student Portal's existing Clerk integration rather than extending it.

**Recommendation:** go with Clerk satellite domains — it reuses work already done (Student Portal), and Document 6 Phase 2 already calls for "one auth strategy for all three portals," which this design directly answers.

---

## External APIs & Integrations

| Service | Purpose | API/SDK |
|---|---|---|
| Clerk | Student authentication & user management | @clerk/nextjs v6.39.5 (Student Portal) |
| Supabase | Database (PostgreSQL), Auth (Faculty), File Storage, Realtime | Supabase JS Client (all portals + pipeline) |
| Anthropic Claude | AI classification of interview questions (topic tagging, difficulty, round type, syllabus mapping) | Anthropic API (`ANTHROPIC_API_KEY`) — data pipeline |
| Google Fonts | Typography (Inter font family) | CDN link (all portals) |
| Google OAuth | SSO sign-in for students (via Clerk) | Clerk OAuth redirect (Student Portal) |
| Jitsi Meet | Video conferencing for mentoring sessions | Auto-generated room URLs (`https://meet.jit.si/NST-PlacePrep-{id}`) — free, no account, no time limits |
| GeeksForGeeks | Data source — company-tagged DSA problems, interview experiences | Web scraping (BeautifulSoup) |
| LeetCode | Data source — company-tagged problems, community interview reports | GraphQL API |
| GitHub | Data source — curated interview prep repos | REST API |
| AmbitionBox | Data source — Indian company-specific interview experiences | Web scraping (Selenium/Playwright) |
| Reddit | Data source — interview experiences from r/cscareerquestions, r/developersIndia | Reddit API (PRAW) |

---

## Environment Variables Needed

```env
# ─── Supabase (Database & Backend) ───
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ─── Clerk (Student Portal Auth) ───
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding/step1

# ─── AI Classification Pipeline ───
ANTHROPIC_API_KEY=your-claude-api-key

# ─── Database Pipeline Config ───
DB_STAGING_TABLE=raw_questions
DB_CLEAN_TABLE=questions

# ─── App URLs ───
NEXT_PUBLIC_STUDENT_PORTAL_URL=https://nst-prepportal-frontend.vercel.app
NEXT_PUBLIC_FACULTY_PORTAL_URL=https://nst-prepportal-frontend-khaki.vercel.app
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://nst-prepportal-frontend-fs6o.vercel.app
NEXT_PUBLIC_API_URL=http://localhost:8000

# ─── Faculty Portal Auth ───
FACULTY_AUTH_SECRET=your-faculty-secret-key
```

---

## Performance Requirements

| Requirement | Target |
|---|---|
| Page load time (LCP) | < 2.0 seconds (Next.js App Router + server components + streaming; Vercel Edge Network) |
| API response time | < 500ms (p95) — FastAPI async handlers; queries optimized with indexes on company_id, user_id, topic_id |
| Time to Interactive (TTI) | < 3.0 seconds (Tailwind tree-shaking, code splitting via dynamic imports) |
| Lighthouse Performance Score | > 80 (production deployment validation) |
| Uptime SLA | 99.9% (Vercel 99.99%; Supabase 99.9% Pro tier) |
| Concurrent users (MVP) | Up to 500 (NST student body + faculty + admin) |
| Database query time | < 100ms (p95) — indexed lookups on all foreign keys, Supabase connection pooling |
| Scraper throughput | Polite crawling — rate-limited (`rate_limiter.py`), respects robots.txt (`tos_check.py`) |
| Bundle size (JS) | < 250KB gzipped initial (Next.js code splitting, tree-shakeable Lucide icons) |

---

## Security Requirements

**Implemented:**
- [x] Auth middleware on protected routes — Clerk middleware (Student), Next.js middleware (Faculty/Admin) gate routes under `/(app)/` *(note: Student/Admin currently bypassed — see Doc 6)*
- [x] Domain-restricted Google OAuth — Student login restricted to @newtonschool.co via Clerk
- [x] Environment variables isolated — secrets in `.env.local` (gitignored); `NEXT_PUBLIC_` prefix only for client-safe values
- [x] HTTPS enforced — Vercel enforces HTTPS by default; HSTS headers included
- [x] Input sanitization — React JSX auto-escapes user content; forms use controlled components
- [x] Robots.txt compliance — `tos_check.py` verifies scraping compliance before each source
- [x] Rate limiting on scrapers — `rate_limiter.py` enforces polite crawling delays
- [x] Sensitive data excluded from git — `data/raw/` in `.gitignore`; large datasets in cloud storage

**Planned (not yet implemented):**
- [ ] Row-Level Security (RLS) — RLS policies defined in `schema/` but not yet applied (DB setup not started)
- [ ] API route authentication — FastAPI endpoints currently unprotected; auth middleware needed for faculty-only and admin-only endpoints
- [ ] Rate limiting on auth endpoints — Clerk provides built-in for Student; Faculty/Admin need custom implementation
- [ ] CSRF protection — Next.js built-in for server actions; additional CSRF tokens needed for custom Faculty auth
- [ ] Admin Portal auth — currently disabled; needs a robust auth provider before production
- [ ] Content Security Policy (CSP) — restrict script sources, font origins (Google Fonts), API endpoints
- [ ] Audit logging — no audit trail for admin actions yet; needed for production compliance
- [ ] Re-enable Student Portal Clerk middleware — currently commented out under "EMERGENCY DEMO MODE"

---
---

# DOCUMENT 3 — App Flow Document

> **Purpose:** Documents every screen, action, and state that actually exists across the three independent Next.js apps — Student Portal, Faculty Portal, and Admin Portal. All three currently run on mocked data (`lib/mock-data.ts` in each app) with no live backend wired in.

---

## Full Screen/Page List

### Student Portal
*App root: `dashboard/student-portal`. Auth is wired for Clerk, but `middleware.ts` currently has route-protection logic commented out under "EMERGENCY DEMO MODE" — architecturally protected pages are not actually gated at runtime.*

| Screen | Route | Description | Auth Required? |
|---|---|---|---|
| Landing Page | `/` | Public marketing page with hero, stats bar, feature grid, and "Start Prep Now" / "Login" CTAs | No |
| Sign In | `/login` | Google (NST email) sign-in via Clerk, plus a "Guest Access (Demo Mode)" button that skips into onboarding | No |
| Onboarding Step 1 | `/onboarding/step1` | Select prep domains (SDE, Frontend, Data Science, etc.) | No |
| Onboarding Step 2 | `/onboarding/step2` | Select target company categories (MAANG, Product, Service, Startup, BFSI, Other) | No |
| Onboarding Step 3 | `/onboarding/step3` | Self-rate confidence per topic (1–10 sliders, topics derived from Step 2) and choose roadmap duration (4–24 weeks) | No |
| Onboarding Step 4 | `/onboarding/step4` | Confirmation/"You're all set" screen; launches into the dashboard | No |
| Dashboard | `/dashboard` | Main authenticated home: target companies, roadmap snapshot, global search bar in navbar | Yes (gate currently bypassed) |
| Companies | `/companies` | Browse/search all covered companies | Yes |
| Company Detail | `/companies/[name]` | Company-specific intel page (hiring patterns, focus areas, etc.) | Yes |
| Company Practice | `/companies/[name]/practice` | Practice questions scoped to one company | Yes |
| Practice Zone | `/practice` | General question bank with filters | Yes |
| My Roadmap | `/roadmap` | Personalized week-by-week roadmap(s) built from onboarding | Yes |
| My Progress | `/progress` | Progress/analytics on the student's prep | Yes |
| Leaderboard | `/leaderboard` | PlacePrep XP leaderboard | Yes |
| Ask a Doubt | `/doubts` | List of the student's doubts + form to submit a new one | Yes |
| Book a Session | `/sessions` | Upcoming/past 1:1 session bookings with faculty, plus a booking drawer | Yes |
| Submit Experience | `/submit` | Submit and browse interview-experience write-ups | Yes |
| Messages | `/messages` | Faculty message/contact list (not linked from any nav — reachable only via direct URL) | Yes |
| Notifications | `/notifications` | Notification feed | Yes |
| Profile | `/profile` | Student profile/account settings | Yes |
| 404 / Not Found | `*` (any unmatched route) | Custom "Page not found" screen with links back to Dashboard or Home | No |

*Notes: All pages except Landing, Login, Onboarding, and 404 live inside the `(app)` route group with a shared layout (Navbar + Sidebar). `/companies/[name]` and `/companies/[name]/practice` are dynamic routes keyed by company slug. There is no dedicated `loading.tsx`/`error.tsx` at the route-segment level; loading/empty states are handled inline in page components.*

> **✅ Live-verified (2026-07-10) against `https://nst-prepportal-frontend.vercel.app`:** Confirmed the auth bypass is real and applies to the *entire* portal, not just `/dashboard` — `/dashboard`, `/companies`, `/companies/google`, `/roadmap`, `/leaderboard`, `/notifications`, `/profile`, and `/messages` all render fully with real mock data when requested with **zero prior login**, no redirect to `/login` occurs anywhere. Confirmed live data matches spec closely: exactly 12 companies (Google, Amazon, Microsoft, Flipkart, Razorpay, TCS, Uber, Swiggy, Infosys, Zepto, Wipro, Paytm) with real question counts; Google's detail page shows a fully populated hiring-pulse panel (18.4% success rate, ₹45 LPA avg salary, 9.2/10 difficulty, round structure, topic-frequency breakdown, sample questions linking to real LeetCode URLs); Leaderboard shows a "June 2026 Contest" with ranked users and monthly deltas; Notifications shows 7 realistic mock entries with a "3 unread" badge; Profile shows a fully fleshed-out mock student (roll no., batch, branch, XP, global rank, streak, shareable profile link) across Overview/Career Settings/Performance/Settings tabs (tabs not previously captured in this document). `/roadmap` rendered only the nav shell with no page content in a no-JS fetch — likely fully dependent on client-side `sessionStorage` state, so this could not be confirmed either way without a real browser session. Visiting an unmatched route returned a blank body with no visible text in a no-JS fetch — the custom 404 page likely also renders client-side; not confirmed with certainty. (Verification method: direct HTTP fetch of each URL, not a full interactive browser session — see verification caveat at the end of Document 3.)

### Faculty Portal
*App root: `dashboard/faculty-portal`. Auth is enforced via `middleware.ts`, which checks for a `faculty_authed` cookie: any route other than `/login` redirects to `/login` if the cookie is missing. The login page sets this cookie itself after a simulated delay — there is no real credential check against a backend.*

| Screen | Route | Description | Auth Required? |
|---|---|---|---|
| Sign In | `/login` | Email/password form; simulates auth (800ms), sets `faculty_authed` cookie, redirects to `/`. **Also has a "Guest Access (Demo Mode)" button** (live-verified — not previously documented) that likely grants entry the same way the Student portal's guest button does. | No |
| Dashboard | `/` | "Curriculum Intelligence Dashboard" — faculty's main landing screen | Yes |
| Session Requests | `/requests` | List/manage student session requests (confirm, decline, propose new date, list/calendar toggle) | Yes |
| Doubts & Questions | `/doubts` | List of student-submitted doubts with status filtering and a reply/resolve workflow | Yes |
| Student Matrix | `/students` | Table of students with search/filter (completions, curriculum alignment) | Yes |
| Leaderboard | `/leaderboard` | Student leaderboard view for faculty | Yes |
| Company Rankings | `/rankings` | Companies ranked by curriculum-relevance impact, with search | Yes |
| Export Reports | `/reports` | Generate/download curriculum intelligence reports | Yes |
| Profile | `/profile` | Faculty profile page | Yes |
| Notifications | `/notifications` | Faculty notification feed | Yes |

*Notes: All authenticated pages live inside the `(app)` route group with a shared layout. The `(app)` folder also contains `_curriculum` and `_trends` subfolders (each with a `page.tsx`), but the underscore prefix makes Next.js treat them as private folders excluded from routing — they are not reachable at any URL and nothing links to them. There is no `loading.tsx`, `error.tsx`, or custom `not-found.tsx` at the route-segment level.*

> **✅ Live-verified (2026-07-10) against `https://nst-prepportal-frontend-khaki.vercel.app`:** Unlike the Student and Admin portals, the Faculty Portal's auth gate **actually works as a real barrier today.** Direct, cookie-less requests to `/`, `/requests`, `/doubts`, `/students`, and `/rankings` all issued a genuine server-side redirect to `/login` — none of the protected content rendered. This is a more positive finding than the "broken auth" framing might suggest: even though the credential check itself is fake (any email/password combination is accepted, per the source audit), the `faculty_authed`-cookie gate in `middleware.ts` **does** currently block unauthenticated direct access in production. The one gap: the "Guest Access (Demo Mode)" button on `/login` (see table above) most likely bypasses this gate entirely and was not exercised in this check — treat the portal as effectively open to anyone who clicks that button.

### Admin Portal
*App root: `dashboard/admin-portal`. `middleware.ts` currently performs no auth check (removed with comment "Authentication check removed to prepare for robust backend auth"). The login page simulates a delay and pushes straight to `/overview` without setting any token. The Sidebar logout clears an `admin_authed` cookie, but nothing in middleware reads it.*

| Screen | Route | Description | Auth Required? |
|---|---|---|---|
| Root Redirect | `/` | No UI; immediately `redirect()`s to `/overview` | No |
| Sign In | `/login` | Email/password form; simulates auth (800ms) and pushes to `/overview`. **Also has a "Guest Access (Demo Mode)" button** (live-verified — not previously documented). | No |
| Overview | `/overview` | Main admin dashboard ("Good morning, Admin.") | Not enforced (architecturally protected; middleware performs no check) |
| Students | `/students` | Paginated, searchable table of all students | Not enforced |
| Student Detail | `/students/[id]` | Individual student profile (status, curriculum alignment, activity); "Student not found." if ID doesn't match | Not enforced |
| Faculty | `/faculty` | Paginated, searchable table of all faculty | Not enforced |
| Manage Faculty | `/manage-faculty` | Add / edit / remove faculty via modals | Not enforced |
| Engagement Analytics | `/analytics/engagement` | Engagement metrics/charts | Not enforced |
| Doubts Intelligence | `/analytics/doubts` | Analytics on student doubts | Not enforced |
| Practice Zone Analytics | `/analytics/practice` | Analytics on practice-question activity | Not enforced |
| Placement Tracker | `/analytics/placement` | Placement-outcome analytics | Not enforced |
| Student Leaderboard | `/leaderboard` | Leaderboard filterable by batch and period | Not enforced |
| Slot Bookings | `/bookings` | Analytics/list of session slot bookings | Not enforced |
| Session Calendar | `/calendar` | Calendar view of scheduled sessions | Not enforced |
| Notifications | `/notifications` | Admin notification feed | Not enforced |
| Reports & Analytics | `/reports` | Generate/download reports; shows recent exports | Not enforced |
| Admin Portal Help Guide | `/help` | Static help/documentation screen | Not enforced |

*Notes: All pages other than `/` and `/login` live inside the `(app)` route group with a shared layout. `/students/[id]` is the only dynamic route. Unlike the other two portals, the admin `(app)` group has segment-level `loading.tsx` and `error.tsx` files applying to every page — the only portal with a route-level error boundary. There is no custom `not-found.tsx`; unmatched routes fall back to the Next.js default 404.*

> **✅ Live-verified (2026-07-10) against `https://nst-prepportal-frontend-fs6o.vercel.app`:** Confirmed zero auth enforcement across the board — `/`, `/overview`, `/students/1`, `/faculty`, `/manage-faculty`, `/analytics/engagement`, `/help`, `/calendar`, `/reports`, and `/bookings` all rendered fully with real mock data on a completely cold, cookie-less request. This is the most exposed of the three portals: `/students/1` returned a named student's full profile (Arjun Sharma, Batch 2024, PLACED, 85% roadmap completion, 2 doubts, 12 sessions) and `/manage-faculty` returned all 12 faculty members' names and emails, with zero login required. The Help page (`/help`) turned out to be a substantial, well-written in-app documentation screen (sections on navigation, dashboard KPIs, student management, faculty management, notifications) — more built-out than "static help screen" suggests. The Calendar page renders a live-looking July 2026 month grid with per-day session counts and monthly totals (24 sessions, 18 unique students, 3.4/day avg).
>
> **🐛 Bug found (not in the source audit):** `/faculty` shows populated summary KPI cards (Total Faculty: 12, Active Now: 9, Avg Satisfaction: 4.29, Avg Response Rate: 84%) directly above a table that reports **"0 members found"** with an empty body — the KPI cards and the table are clearly reading from two different data sources/states that have drifted out of sync. Worth a quick manual confirmation in a real browser (this check used a no-JS HTTP fetch), but it's a concrete, fixable inconsistency to carry into Document 6.

---

## User Journeys

### Journey 1: New Student Onboarding (Guest / Demo Access)

```
1. User lands on Landing Page (/)
   → Sees hero, stats (658+ companies, 18,000+ questions), and CTA buttons
2. Clicks "Login" → Redirected to /login
3. Clicks "Guest Access (Demo Mode)"
   → Routed directly to /onboarding/step1 (no credentials required)
4. Step 1: selects one or more prep domains (e.g. SDE, Frontend/Full Stack)
   → Clicks continue → /onboarding/step2
5. Step 2: selects one or more target company categories (e.g. MAANG, Startup)
   → Selections stored in sessionStorage ("onboarding_categories", "onboarding_companies")
   → Clicks continue → /onboarding/step3
6. Step 3: rates confidence on topics generated from chosen categories; picks a roadmap
   duration (4/8/12/16/24 weeks) → Clicks continue → /onboarding/step4
7. Step 4: confirmation screen lists what will be generated
   → Clicks "Launch" → writes "roadmap_companies" and "has_onboarded" to sessionStorage
   → Redirected to /dashboard
8. Dashboard loads → Shows target companies from onboarding selections + roadmap snapshot
```

### Journey 2: Signed-In Access via Google (NST Email)

```
1. User is on /login
2. Clicks "Sign in with Google (NST Email)"
   → Clerk's authenticateWithRedirect (oauth_google) fires
   → On success: redirected to /dashboard
   → On failure: an inline error message is shown on the login form
```

### Journey 3: Exploring a Company and Practicing

```
1. User is on Dashboard, navigates to Companies (/companies) via sidebar
2. Companies page loads → user searches/filters the list
   → If no match: "No companies found for '[search]'" empty state
3. User clicks a company → /companies/[name] → company intel loads (hiring focus areas, etc.)
4. User clicks into practice for that company → /companies/[name]/practice
   → Company-scoped question set loads
```

### Journey 4: Asking a Doubt

```
1. User navigates to Ask a Doubt (/doubts) under the "Faculty Connect" sidebar section
2. Doubts page loads existing doubts (or empty state if list is empty)
3. User opens the new-doubt form/drawer
   → Fills subject (>5 chars) and body (>10 chars) — Submit stays disabled until valid
   → Selects an optional tag
4. Clicks "Submit" → New doubt appended client-side (mock state); the drawer closes
```

### Journey 5: Booking a Faculty Session

```
1. User navigates to Book a Session (/sessions) under "Faculty Connect"
2. Sessions page loads, showing "Upcoming" / "Past" tabs
   → If a tab has no sessions: empty state for that tab
3. User opens the Booking Drawer and submits date/time/topic details
4. New session added to the "Upcoming" list (mock client-side state)
```

### Journey 6: Submitting an Interview Experience

```
1. User navigates to Experience (/submit) via sidebar
2. Submit page loads existing experiences with search/filter
   → If none match: "No experiences found"-style empty state
3. User fills out and submits their own interview experience
   → New entry appended; other students' entries can be upvoted
```

### Journey 7: Global Search from the Dashboard

```
1. User is on /dashboard (search bar only renders on this route)
2. Types into the search input
   → Dropdown shows matching companies / topics / questions, keyboard-navigable
3. Presses Enter or clicks a result → Routed to that result's href (e.g. a company page)
```

### Journey 8: Hitting an Unknown URL

```
1. User navigates to any route the app doesn't recognize
2. Custom 404 page renders → "Go to Dashboard" or "Go Home" buttons offered
```

### Journey 9: Faculty Sign-In

```
1. Faculty lands on /login (or redirected here automatically by middleware when visiting any
   other route without the faculty_authed cookie)
2. Enters email + password, clicks submit
   → Simulated 800ms "auth" delay, no real validation of credentials
   → faculty_authed cookie is set → Redirected to / (Dashboard)
```

### Journey 10: Faculty — Managing Session Requests

```
1. Faculty navigates to Session Requests (/requests) from the sidebar
2. Page loads with a skeleton (~450ms), then shows requests
3. Faculty filters by status tab (All / pending / confirmed / proposed / cancelled), can search
   → If nothing matches: empty state
4. For a pending request, faculty can:
   a) Confirm → status becomes "confirmed" and a mock Jitsi meet link is generated
   b) Decline → status becomes "cancelled"
   c) Propose a new date/time → status becomes "proposed" with the new date/time stored
5. Faculty can toggle between list view and calendar view
```

### Journey 11: Faculty — Resolving a Student Doubt

```
1. Faculty navigates to Doubts & Questions (/doubts)
2. Page loads with skeleton placeholders, then the doubt list filtered by status
3. Faculty opens an unresolved doubt and submits a reply → reply added to that doubt's thread
4. Faculty can mark the doubt as resolved → status changes to "resolved"; the reply box hides
   for already-resolved doubts
```

### Journey 12: Faculty — Reviewing the Student Matrix / Exporting a Report / Logging Out

```
Student Matrix (/students): loads skeleton → searchable/filterable table; "No students found
  matching your query filters." if empty.
Export Reports (/reports): loads skeleton → report config UI; faculty selects options and
  generates/downloads a report.
Logout: click "Logout" in Sidebar → faculty_authed cookie cleared → hard redirect to /login.
```

### Journey 13: Admin — Sign-In & Reviewing the Overview Dashboard

```
1. Admin lands on / → redirected immediately to /overview (loads regardless of login state,
   since no auth check exists)
2. If admin navigates to /login and submits: simulated 800ms delay, no validation → /overview
3. On /overview: AppLoading boundary ("Loading portal...") may show briefly; useOverviewData()
   resolves → dashboard cards/widgets populate
```

### Journey 14: Admin — Managing Faculty

```
1. Admin navigates to Manage Faculty (/manage-faculty)
2. Table of faculty loads; "No faculty members found." if empty after filtering
3. Admin clicks "Add Faculty" → modal opens (name, email, stream, status) → on submit, new
   faculty appended to mock list, modal closes
4. Admin clicks "Edit" on a row → edit modal opens pre-filled → on save, row updates in place
5. Admin clicks "Remove" → confirmation modal → on confirm, faculty removed from mock list
```

### Journey 15: Admin — Drilling Into a Student / Reviewing Analytics / Errors / Logout

```
Students (/students): table loads (skeleton first), searchable/paginated; "No students found."
  if none match. Click a row → /students/[id]: full profile if ID exists, else "Student not
  found." with a "Back to Students" link.
Analytics (Engagement/Doubts/Practice/Placement): each page fetches its own mock dataset (e.g.
  useEngagementData("30d")); <Skeleton /> while loading → charts/metrics render.
Reports (/reports): report config panel loads; "No recent exports found." if no history.
Runtime error: shared error.tsx boundary catches it → "Something went wrong" + "Try again"
  (calls reset() to re-render the segment).
Logout: clears admin_authed cookie → hard redirect to /login (does not block re-entry by URL,
  since middleware performs no auth check).
```

---

## States for Each Key Screen

### Student — Dashboard (`/dashboard`)

| State | What User Sees |
|---|---|
| **Loading** | Not implemented as a distinct skeleton; content renders once client-side data (sessionStorage-derived target companies) resolves |
| **Empty** | If `targetCompanies.length === 0`, an empty-state message/prompt in place of the target-companies list |
| **Populated** | Target companies list, roadmap snapshot, and other dashboard widgets |
| **Error** | Not implemented (no error UI on this page) |

### Student — Companies (`/companies`)

| State | What User Sees |
|---|---|
| **Loading** | Not implemented |
| **Empty** | "No companies found for '[search]'" when the filtered list is empty |
| **Populated** | Grid/list of company cards |
| **Error** | Not implemented |

### Student — Practice Zone (`/practice`) / My Roadmap (`/roadmap`) / Submit Experience (`/submit`)

| State | What User Sees |
|---|---|
| **Loading** | Animated skeleton bars/cards (`animate-pulse`) while the page initializes |
| **Empty** | Practice: "No questions found"; Roadmap: empty/guided state if no active company or `companies.length === 0`; Submit: "No experiences found" when `filteredExperiences.length === 0` |
| **Populated** | Practice: filtered question list; Roadmap: company-specific week-by-week timeline; Submit: submitted experiences with upvoting |
| **Error** | Not implemented |

### Student — Ask a Doubt (`/doubts`) / Book a Session (`/sessions`) / Notifications / Messages

| State | What User Sees |
|---|---|
| **Loading** | Not implemented (doubts, sessions, notifications, messages) |
| **Empty** | Doubts: empty state when `filtered.length === 0`; Sessions: empty state when active tab has zero sessions; Notifications: empty when `notifications.length === 0`; Messages: "No faculty found" |
| **Populated** | Doubts with statuses/replies; booked sessions with faculty name/time/meeting link; notification list (opening the page marks them read via sessionStorage); faculty message list |
| **Error** | Not implemented |

### Faculty — Dashboard (`/`) / Session Requests / Doubts / Student Matrix / Company Rankings / Reports / Leaderboard / Notifications

| State | What User Sees |
|---|---|
| **Loading** | Skeleton cards/rows/panels (`animate-pulse`) while `isLoading` is true (Dashboard: 4 skeleton cards; Requests: skeleton cards + search bar; Doubts: stat cards + search + list; Students: skeleton rows; Rankings: search bar + 6 rows; Reports: two large panels; Leaderboard: hero/stat/filter/rows). Notifications: not implemented |
| **Empty** | Requests/Doubts: empty state when `filtered.length === 0`; Students: "No students found matching your query filters."; Rankings: "No companies found matching '[searchQuery]'"; Notifications: empty when `notifications.length === 0`. Dashboard/Reports/Leaderboard: not implemented as distinct empty states |
| **Populated** | The respective list/table/chart/report view |
| **Error** | Not implemented (no route-level error boundary in this portal) |

### Admin — Overview / Students / Student Detail / Faculty / Manage Faculty / Analytics / Leaderboard / Bookings / Notifications / Reports

| State | What User Sees |
|---|---|
| **Loading** | Route-level `loading.tsx` ("Loading portal...") on navigation, plus page-level `isLoading` skeletons (Overview: `useOverviewData()`; Students: `useStudents()`; Faculty: `useFaculty()`; Analytics: `<Skeleton />`; Leaderboard: `useLeaderboard()`; Bookings: `useBookingsData()`). Student Detail, Manage Faculty, Notifications, Reports: not implemented as distinct loading states |
| **Empty** | Students: "No students found."; Student Detail: "Student not found." + "Back to Students" link; Faculty/Manage Faculty: "No faculty members found."; Notifications: empty when `notifications.length === 0`; Reports: "No recent exports found." Overview/Analytics/Leaderboard/Bookings: not implemented as distinct empty states |
| **Populated** | The respective dashboard, table, profile, chart, or report view |
| **Error** | Route-level `error.tsx` ("Something went wrong" + "Try again") — this is the only portal with a shared route-level error boundary |

---

## Navigation Structure

```
STUDENT PORTAL
Top Navigation (fixed header, all (app) routes):
  Logo "NST | PlacePrep" (static, not a link)
  Global search (only rendered when pathname === /dashboard) → routes to selected result href
  XP badge (from Clerk user metadata, mock default 2450)
  Notifications bell → /notifications
  Profile avatar → /profile
  Mobile hamburger menu (toggles Sidebar on small screens)
  (Hidden) Clerk UserButton — sign-out/account management, visually hidden

Sidebar (persistent left nav):
  Main: Home → /dashboard · Companies → /companies · My Roadmap → /roadmap ·
        Practice → /practice · My Progress → /progress · Leaderboard → /leaderboard ·
        Experience → /submit
  Faculty Connect: Ask a Doubt → /doubts · Book a Session → /sessions

Public Navigation (Landing, unauthenticated): Logo (static) · Login → /login
Footer (Landing only): © 2024 PlacePrep by NST · Privacy Policy · Terms of Service
Notes: /messages exists but has no nav entry point. Sidebar highlights active item by exact
  match on /dashboard, prefix match for all others.

FACULTY PORTAL
Top Navigation: Mobile hamburger · Logo "NST | PlacePrep — Faculty Portal" (desktop) ·
  Dynamic page title (mapped from pathname) · Notifications bell → /notifications ·
  Profile icon → /profile
Sidebar: Dashboard → / · Session Requests → /requests · Doubts & Questions → /doubts ·
  Student Matrix → /students · Leaderboard → /leaderboard · Company Rankings → /rankings ·
  Export Reports → /reports · --- · Logout (clears faculty_authed cookie, hard-redirect /login)
Public Navigation (Login): No nav bar; standalone split-panel form screen.

ADMIN PORTAL
Top Navigation: Logo "NST | PlacePrep — Admin Portal" (desktop); notification/profile
  affordances in the header per components/layout/Navbar.tsx
Sidebar (grouped):
  Overview: Overview → /overview
  People: Students → /students · Faculty → /faculty · Manage Faculty → /manage-faculty
  Analytics: Engagement → /analytics/engagement · Doubts Intel → /analytics/doubts ·
    Practice Zone → /analytics/practice · Placement → /analytics/placement
  Activity: Leaderboard → /leaderboard · Slot Bookings → /bookings · Calendar → /calendar
  Communication: Notifications → /notifications · Reports → /reports
  Bottom: Help → /help · Logout (clears admin_authed cookie, hard-redirect /login)
Role label: single "Super Admin" (hardcoded in Sidebar) — no role-conditional nav branching.
Active-state: /overview highlights on exact match only; all others on exact match OR path
  starting with "item.href + /".
```

---

## Live Verification Note (2026-07-10)

All three deployments below were checked against the live URLs, and the ✅ callouts inlined above reflect what was actually observed, not just what the frontend audit claimed:

- Student Portal: `https://nst-prepportal-frontend.vercel.app`
- Faculty Portal: `https://nst-prepportal-frontend-khaki.vercel.app`
- Admin Portal: `https://nst-prepportal-frontend-fs6o.vercel.app`

**Method:** Requested each route directly (fresh, cookie-less HTTP fetch) and read the returned HTML — this reflects what an unauthenticated visitor typing a URL directly would receive, and reliably confirms server-side behavior like redirects, auth gates, and content that Next.js renders on the server. It does **not** execute client-side JavaScript, so any page/state that depends purely on client interaction, `sessionStorage`, or client-only data fetching (e.g. Student `/roadmap`, Admin `/overview`'s widgets, Admin `/bookings`) could only be confirmed as "reachable" — their fully-populated interactive state should be double-checked in a real browser session before relying on this document for anything JS-state-specific. A full interactive Playwright/browser pass (clicking through forms, testing the Guest Access buttons, watching client-side redirects) was attempted first via the Claude-in-Chrome browser tool but the extension was not connected in this session — re-run that pass if deeper interactive verification is needed.

**Net result:** the three-tier auth picture in this document is confirmed accurate and, if anything, slightly worse than described — Student and Admin portals are fully open with zero enforcement on every route tested (including one that leaks a full student profile and another that leaks the entire faculty roster with no login), Faculty portal's cookie-gate does function as a real barrier against direct URL access, but all three now have a previously-undocumented "Guest Access (Demo Mode)" button on their login screens that most likely bypasses whatever gating exists.

---
---

# DOCUMENT 4 — UI/UX Design Brief

> **Purpose:** Tells the AI exactly how the app should look and feel — no guessing on style.

---

## Design Identity

| Field | Your Choice |
|---|---|
| **Design Style** | Clean & minimal, data-dense admin/SaaS style. Flat white surfaces on a soft light-gray canvas, thin hairline borders instead of heavy shadows, generous use of blue-tinted accent chips and rounded corners. Consistent across all three portals (Student, Faculty, Admin). |
| **Personality** | Trustworthy, structured, and efficient — a "control-panel" feel appropriate for an academic placement/interview-intelligence system. Confident use of bold numerals and uppercase micro-labels gives it a technical, analytics-driven personality rather than a playful consumer one. |
| **Inspiration Apps** | Modern SaaS analytics dashboards in the vein of Linear / Vercel / Notion-style admin panels — flat surfaces, soft blue accents, pill-shaped status badges, card-based KPI strips. (Note: these are not explicitly referenced in the codebase; this is an inference from the implemented styling patterns.) |
| **Target Feel** | "A clean interview-prep control room" — calm, information-forward, and fast to scan, where students, faculty, and admins each get a purpose-built dashboard using the same visual DNA (same colors, spacing, and components) so the three portals feel like one connected product. |

---

## Color Palette

| Role | Hex Code | Usage |
|---|---|---|
| **Primary** | `#2563EB` (blue-600) | Primary buttons, active nav states, links, focus rings, active batch/status pills, range-input accent |
| **Secondary** | `#4F46E5` (indigo-600) | Secondary accents — gradient pairing with primary on avatars/hero panels, "In Progress" status badges, secondary data series |
| **Background** | `#F9FAFB` (gray-50) | App shell/page background, set globally in `body` in `globals.css` across all three portals |
| **Surface** | `#FFFFFF` (white) | Card, sidebar, navbar, table, and modal backgrounds |
| **Border** | `#F3F4F6` / `#E5E7EB` (gray-100 / gray-200) | Card borders, table dividers, input borders, sidebar/navbar hairlines |
| **Text Primary** | `#111827` (gray-900) | Headings, primary body copy — the global body text color |
| **Text Secondary** | `#6B7280` / `#9CA3AF` (gray-500 / gray-400) | Sub-labels, metadata, uppercase table headers, timestamps |
| **Success** | `#10B981` / `#059669` (emerald-500 / emerald-600) | Success states, "Placed" indicators, positive KPI accents |
| **Warning** | `#F59E0B` (amber-500) | Warning badges, pending/attention KPI accents |
| **Error** | `#EF4444` (red-500) | Error banners, destructive actions (e.g., "Remove Faculty" confirmation), notification dots |

**Dark Mode:** No — no `dark:` Tailwind variants or dark theme tokens exist anywhere in the codebase; all three portals are light-mode only.

---

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| **Display / Hero** | Inter | 700 (Bold) | ~36px (`text-4xl`, portal login/marketing panels) |
| **H1** | Inter | 700 (Bold) | 24px (`text-2xl`, page titles like "Students", "Overview") |
| **H2** | Inter | 700 (Bold) | 18–20px (`text-lg`/`text-xl`, section headers, modal titles) |
| **H3** | Inter | 600 (Semibold) | 16px (`text-base`, card titles, navbar page title) |
| **Body** | Inter | 400–500 | 14px (`text-sm`, default body copy, table cell text, form labels) |
| **Small / Label** | Inter | 500–700 | 10–12px (`text-[10px]`/`text-xs`, uppercase tracked labels, table headers, badges, timestamps) |
| **Code** | Not used | — | No monospace/code font is loaded anywhere (no code editor or code-display surfaces exist in the product) |

*Font is loaded via Google Fonts in every portal's `globals.css`: Inter at weights 300–900, with fallback stack `-apple-system, BlinkMacSystemFont, sans-serif`.*

---

## Component Style

| Component | Style Direction |
|---|---|
| **Buttons (Primary)** | Solid blue-600 fill, white text, `rounded-xl` (or `rounded-lg` for smaller controls), `font-semibold`, `px-4–6 py-2–2.5`, `hover:bg-blue-700`, subtle `shadow-sm`, disabled at `opacity-40` with `cursor-not-allowed` |
| **Buttons (Secondary)** | Outlined — `border border-gray-200`, white background, `text-gray-700`, `hover:bg-gray-50`, same `rounded-xl` radius as primary for consistency |
| **Cards** | White surface, `border border-gray-100`, `rounded-xl` (KPI/stat cards) or `rounded-2xl` (modals), `shadow-sm`; hover escalates to `shadow-md` on interactive cards |
| **Inputs** | Outlined, white background, `border border-gray-200`, `rounded-xl`/`rounded-lg`, `px-3–4 py-2–2.5`, focus state `focus:ring-2 focus:ring-blue-500/20` plus `focus:border-blue-500` |
| **Badges/Tags** | Pill shape (`rounded-full`), soft background tints paired with matching text color (e.g., `bg-blue-50 text-blue-700 border border-blue-100`), small dot indicator + uppercase tracked label for status badges (e.g., PLACED, IN PROGRESS) |
| **Modals/Dialogs** | Centered overlay, `bg-black/40 backdrop-blur-sm` scrim, white panel with `rounded-2xl`, `shadow-xl`, `max-w-sm`/`max-w-md` width, `p-6` internal padding |
| **Tables** | Minimal-border — light `bg-gray-50/60` header row with uppercase `text-xs font-bold text-gray-400` column labels, `border-b border-gray-50` row dividers (no zebra striping), `hover:bg-blue-50/20` row highlight, horizontal scroll via `overflow-x-auto` |
| **Toast/Alerts** | Fixed position bottom-right (`fixed bottom-5 right-5`), dark `bg-gray-900` pill/card with white text, `rounded-xl`, `shadow-lg`, icon + short message, fades via `transition-opacity` |
| **Navigation** | Fixed left sidebar (216px wide, collapsible into an off-canvas drawer on mobile) + a sticky top navbar (56px height) showing the current page title and right-aligned notification/help icons; sidebar items grouped under uppercase section labels with active-state `bg-blue-50 text-blue-600` highlighting |

---

## Layout Rules

**Grid System:** No explicit 12-column grid utility; layouts are composed with Tailwind Flexbox and CSS Grid per section (commonly `grid-cols-2`/`grid-cols-3`/`grid-cols-4` for KPI strips, collapsing to `grid-cols-1`/`grid-cols-2` on smaller screens). Content areas typically cap around `max-w-7xl` on wide report/overview screens.

**Spacing Scale:** Tailwind's default 4px base scale throughout (`gap-1` through `gap-8`, with `gap-2`–`gap-4` the most common rhythm for card and form spacing).

**Page Padding:** `px-4` on mobile, stepping up to `px-6` on `lg:` breakpoints for the main content area; cards commonly use `p-4`–`p-6` internal padding; modals use `p-6`.

**Dashboard Layout:**
```
- Fixed/sticky top navbar (56px height, --navbar-height CSS variable)
    - Current page title (mapped from route via a pageTitles lookup)
    - Right side: notification bell (unread-dot) + help icon
    - Left side (mobile only): hamburger menu trigger
- Fixed left sidebar (216px expanded width, --sidebar-width CSS variable)
    - Logo + portal name block at top
    - Logged-in user identity card (avatar initials + name + role)
    - Grouped nav sections with uppercase labels (e.g. Overview, People, Analytics,
      Activity, Communication in Admin Portal)
    - Help + Logout pinned to the bottom
    - On mobile/tablet: sidebar collapses into a slide-in drawer with backdrop-blur overlay,
      triggered by the navbar hamburger icon
- Main content area offset by sidebar width on large screens (lg:ml-[var(--sidebar-width)]),
  padded top by navbar height (pt-14), with its own internal page padding
- KPI/stat card strips sit directly below the page header, followed by the primary data surface
  (table, chart, or list) inside a bordered white card
```

---

## Responsive Behavior

| Breakpoint | Layout Change |
|---|---|
| Mobile (< 1024px, Tailwind default `< lg`) | Sidebar hidden, replaced by a hamburger-triggered slide-in drawer (`fixed inset-y-0 left-0`, 216px wide, `bg-black/40 backdrop-blur-sm` overlay behind it); KPI grids collapse from 3–4 columns to `grid-cols-2`; header rows stack vertically (`flex-col → sm:flex-row`) |
| Tablet (sm–md, ~640–1024px) | Same drawer-based navigation as mobile (the fixed-sidebar breakpoint is `lg`, not `md`); KPI grids typically move to `sm:grid-cols-4`; secondary controls (e.g. batch filter pills) reappear via `hidden sm:flex` |
| Desktop (`lg` and above, ≥ 1024px) | Full layout with the fixed 216px left sidebar always visible (`lg:fixed lg:flex`), navbar/main content offset to accommodate it (`lg:ml-[var(--sidebar-width)]`); all KPI grids and multi-column layouts render at full column count |

---

## UX Principles

1. **Speed first** — Search inputs are debounced (400ms) before triggering data fetches; tables show an inline centered spinner (`animate-spin`) during loading rather than blocking the whole page; no full-page reloads for filtering or pagination.
2. **Minimal clicks** — Primary actions (adding faculty, viewing a student profile, opening a session) are surfaced directly on list/table rows via inline buttons/links rather than buried in secondary menus.
3. **Clear feedback** — Every async action has a distinct visual state: loading spinners in tables/cards, disabled + dimmed buttons while a form is incomplete or submitting, dedicated `error.tsx` boundaries with a retry button ("Something went wrong" + "Try again"), and bottom-right toast confirmations.
4. **Progressive disclosure** — Row-level actions (e.g., "View Profile") are revealed on hover (`opacity-0 group-hover:opacity-100`) rather than shown at all times; destructive actions (e.g., removing faculty) are gated behind a dedicated confirmation modal.
5. **Consistent cross-portal language** — The same color tokens, border radii, card styling, badge shapes, and sidebar/navbar structure are deliberately reused across all three portals so a user who learns one portal instantly understands the others, even though each portal's navigation and data are role-specific.

---
---

# DOCUMENT 5 — Backend Schema Document

> **Purpose:** Defines every database table, column, relationship, and permission — the backbone of the app. The schema is derived directly from the implemented frontend codebase, its TypeScript interfaces, mock-data contracts, explicit BACKEND TODO annotations, the data pipeline README, and the `schema/` directory migrations. **None of these tables exist in a live database yet** (schema is written, never executed).

---

## Database Platform

**Database:** PostgreSQL 15+ (via Supabase). Explicitly referenced in the repository README data pipeline diagram and `schema/README.md` migrations. Supabase provides managed PostgreSQL with built-in Auth, Row-Level Security, REST auto-API, realtime subscriptions, and Storage in one platform.

**File / Asset Storage:** Supabase Storage (profile avatars, report exports; avoids adding a separate S3 bucket for V1).

**Search Layer:** PostgreSQL full-text search (tsvector) + pg_trgm (sufficient for V1 company/question search; upgrade to Meilisearch/Typesense post-V1 if needed).

**ORM/Query Layer:**
- **Primary ORM:** Prisma (TypeScript) — type-safe schema, auto-generated client, first-class Next.js integration; schema types auto-flow to frontend interfaces.
- **Analytics Queries:** Raw SQL via Supabase RPC / Prisma `$queryRaw` — Admin analytics (DAU, engagement heatmaps, doubt resolution rates) require complex aggregations better expressed in SQL.
- **Supabase Client:** `@supabase/supabase-js` v2 — for Realtime subscriptions (live doubt status updates), Storage API, and Auth helpers where Clerk is not the provider.
- **Backend Framework:** FastAPI (Python) for the intelligence engine (`/companies`, `/topics`, `/questions`); Next.js API Routes for session-context operations (bookings, doubt CRUD).

**Portal-to-Auth Mapping:**

| Portal | Auth Method | Session Strategy | Role in System |
|---|---|---|---|
| Student Portal | Clerk (Next.js SDK) | Clerk JWT per user session | Read: company intel, questions, roadmap. Write: experience submissions, doubt threads, session bookings |
| Faculty Portal | Cookie-based (`faculty_authed`) | HTTP-only cookie set on `/login`, checked by Next.js middleware | Read: assigned student progress, doubt queue. Write: session status, doubt replies, reports |
| Admin Portal | JWT / Session (planned) | Middleware stub present; robust auth planned for Phase 2 | Full CRUD: faculty management, student oversight, analytics, push notifications |

---

## Tables

The schema is organized into four logical groups: **(A) Auth & Identity**, **(B) Intelligence Core** (data pipeline output that powers company intel), **(C) Portal Application** (student/faculty/admin features), and **(D) Analytics & Audit**.

### Group A — Auth & Identity

#### `users`
*Root identity record, one row per authenticated user across all portals. Managed by auth provider; extended by role-specific profile tables.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Internal UUID; Clerk user ID stored separately in `student_profiles.clerk_id` |
| `email` | `text` | UNIQUE, NOT NULL | Canonical email used across portals |
| `role` | `text` | NOT NULL, CHECK (role IN ('student','faculty','admin')) | Drives RLS policies and middleware routing |
| `is_active` | `boolean` | DEFAULT true | Soft-deactivate without deleting history |
| `last_login_at` | `timestamptz` | NULLABLE | Updated on successful authentication |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | Updated via trigger on any mutation |

#### `student_profiles`
*Extended student data collected during onboarding (Steps 1–4) and profile editing.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, FK → users.id ON DELETE CASCADE | 1:1 with users |
| `clerk_id` | `text` | UNIQUE, NULLABLE | Clerk user ID for JWT verification on Student Portal |
| `full_name` | `text` | NOT NULL | |
| `batch` | `text` | NOT NULL | Graduation batch year (e.g. '2024', '2025', '2026') |
| `branch` | `text` | NOT NULL | 'Computer Science', 'AI', 'Software Engineering', etc. |
| `year` | `text` | NOT NULL | '1st', '2nd', '3rd', '4th' — current academic year |
| `avatar_url` | `text` | NULLABLE | Supabase Storage URL |
| `onboarding_complete` | `boolean` | DEFAULT false | Set true on POST /api/user/me/onboarding/complete (Step 4) |
| `placement_status` | `text` | DEFAULT 'IN PROGRESS', CHECK IN ('PLACED','IN PROGRESS','INACTIVE') | Mirrors admin `Student.status` |
| `placed_company` | `text` | NULLABLE | Set when placement_status = 'PLACED' |
| `placed_role` | `text` | NULLABLE | Role offered at placed company |
| `phone` | `text` | NULLABLE | |
| `linkedin_url` | `text` | NULLABLE | |
| `github_url` | `text` | NULLABLE | |
| `xp_total` | `integer` | DEFAULT 0 | Cumulative XP from questions, streaks, milestones |
| `current_streak_days` | `integer` | DEFAULT 0 | Consecutive days with ≥1 question solved |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

#### `faculty_profiles`
*Faculty data managed by Admin Portal (invite + manage-faculty page) and visible in Faculty Portal.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, FK → users.id ON DELETE CASCADE | |
| `full_name` | `text` | NOT NULL | |
| `initials` | `text` | NOT NULL | 2-letter display initials (e.g. 'AM') |
| `subject` | `text` | NOT NULL | Primary teaching subject |
| `stream` | `text` | NULLABLE | 'Computer Science', 'Mathematics', 'Data Science', etc. |
| `avatar_url` | `text` | NULLABLE | |
| `status` | `text` | DEFAULT 'PENDING', CHECK IN ('ACTIVE','INACTIVE','PENDING','INVITE PENDING') | Tracks onboarding state from admin invite flow |
| `accept_count` | `integer` | DEFAULT 0 | Total session requests accepted (denormalized for Admin analytics) |
| `decline_count` | `integer` | DEFAULT 0 | Total session requests declined |
| `satisfaction_avg` | `numeric(3,2)` | DEFAULT 0.00 | Rolling average from session feedback (0.00–5.00) |
| `response_rate` | `numeric(5,2)` | DEFAULT 0.00 | % of requests responded to within 48h |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

### Group B — Intelligence Core (Data Pipeline Output)

*Output of the scraper → ETL → classification pipeline. Powers the company intelligence queries that are the core product.*

#### `companies`
*One row per company in the intelligence dataset. Seed data from `schema/seed/companies.sql`.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `slug` | `text` | UNIQUE, NOT NULL | URL-safe identifier ('google', 'flipkart', 'razorpay') — used in /companies/:slug |
| `name` | `text` | UNIQUE, NOT NULL | Display name |
| `category` | `text` | NOT NULL, CHECK IN ('maang','product','service','startup','bfsi','other') | Mirrors CompanyCategory type across all portals |
| `tier` | `text` | NULLABLE | 'FAANG', 'Indian Product', 'Service', 'Indian Startup', 'BFSI' — display label |
| `country` | `text` | DEFAULT 'India' | |
| `logo_url` | `text` | NULLABLE | URL to company logo asset |
| `hiring_status` | `text` | DEFAULT 'Active Hiring', CHECK IN ('Active Hiring','Slow Hiring','Paused') | Sourced from job posting freshness signal |
| `avg_salary_lpa` | `text` | NULLABLE | e.g. '18–35 LPA' — display string |
| `avg_process_weeks` | `text` | NULLABLE | e.g. '3–4 weeks' |
| `hiring_note` | `text` | NULLABLE | Short contextual hiring note |
| `success_rate` | `text` | NULLABLE | e.g. '12%' — acceptance rate estimate |
| `last_synced_at` | `timestamptz` | NULLABLE | Timestamp of last scraper run that updated this company |
| `created_at` | `timestamptz` | DEFAULT now() | |

#### `roles`
*Normalized role/level dimension. Company–role pairs are the primary query key for the intelligence engine.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `name` | `text` | NOT NULL | 'SDE-1', 'SDE-2', 'SDE-3', 'Data Analyst', 'ML Engineer', 'Frontend', 'Backend', 'Full Stack', 'DevOps', 'PM', 'QA', 'Business Analyst' |
| `level` | `text` | NULLABLE | 'Junior', 'Mid', 'Senior' |
| `domain` | `text` | NULLABLE | 'Engineering', 'Data', 'Product', 'Operations' |

#### `topics`
*Canonical topic taxonomy. Seed data from `schema/seed/topics.sql`. Every question is tagged against this table.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `slug` | `text` | UNIQUE, NOT NULL | 'arrays', 'dynamic-programming', 'system-design', 'os', 'dbms', 'lld' |
| `name` | `text` | UNIQUE, NOT NULL | 'Arrays & Strings', 'Dynamic Programming', 'System Design (HLD)', 'Operating Systems', 'DBMS & SQL', 'Low Level Design' |
| `category` | `text` | NOT NULL, CHECK IN ('DSA','Core CS','Domain','Behavioral') | Top-level grouping for onboarding self-rating and curriculum mapping |
| `parent_topic_id` | `uuid` | NULLABLE, FK → topics.id | For topic hierarchies: parent='DSA', child='Dynamic Programming' |

#### `questions`
*Central intelligence table. Every scraped question, experience, or problem tagged with company, role, round, topic, difficulty, and source.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `company_id` | `uuid` | NOT NULL, FK → companies.id ON DELETE RESTRICT | |
| `role_id` | `uuid` | NULLABLE, FK → roles.id | Nullable when role not specified in source |
| `round_type` | `text` | NOT NULL, CHECK IN ('Coding','System Design','HR','Aptitude','LLD','Domain','Managerial') | Mirrors RoundType union type |
| `round_number` | `smallint` | NULLABLE | Position of this round in company's process (1, 2, 3…) |
| `problem_summary` | `text` | NOT NULL | Question text or summary extracted from source |
| `difficulty` | `text` | NOT NULL, CHECK IN ('Easy','Medium','Hard') | Mirrors Difficulty type |
| `source` | `text` | NOT NULL | 'geeksforgeeks', 'ambitionbox', 'reddit', 'github', 'leetcode_discuss', 'nst_internal', 'codeforces', 'interviewbit', 'prepinsta' |
| `source_url` | `text` | NULLABLE | Direct URL to original content (BACKEND TODO noted in Question interface) |
| `scraped_at` | `timestamptz` | NOT NULL | When this record entered the pipeline |
| `frequency_score` | `numeric(5,4)` | DEFAULT 0.0000 | Normalized 0–1 frequency within (company_id, role_id) pair. Core intelligence engine output |
| `xp_value` | `integer` | DEFAULT 10 | XP awarded on solving: Easy=10, Medium=25, Hard=50 |
| `is_hot` | `boolean` | DEFAULT false | Flagged as trending/high-frequency question |
| `leetcode_url` | `text` | NULLABLE | LeetCode problem URL (BACKEND TODO: store in questions.source_url per mock-data comment) |
| `companies_json` | `jsonb` | NULLABLE | Array of additional company slugs this question appears at beyond primary company_id |
| `verified` | `boolean` | DEFAULT false | Manually verified by admin/faculty |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

#### `question_topics`
*Many-to-many join: a question can cover multiple topics. Derived from `schema/migrations/005`.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `question_id` | `uuid` | NOT NULL, FK → questions.id ON DELETE CASCADE | |
| `topic_id` | `uuid` | NOT NULL, FK → topics.id ON DELETE RESTRICT | |
| `is_primary` | `boolean` | DEFAULT false | Dominant topic for this question; used in single-topic UI display |
| — | — | PRIMARY KEY (question_id, topic_id) | Composite PK prevents duplicates |

#### `company_round_structure`
*Typical round sequence for a company+role combination. Powers the round breakdown section of Company Profile pages.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `company_id` | `uuid` | NOT NULL, FK → companies.id ON DELETE CASCADE | |
| `role_id` | `uuid` | NULLABLE, FK → roles.id | Null = applies to all roles at this company |
| `round_number` | `smallint` | NOT NULL | 1, 2, 3… |
| `round_name` | `text` | NOT NULL | 'Online Assessment', 'Technical Round 1', 'System Design', 'HR' |
| `round_type` | `text` | NOT NULL, CHECK IN ('Coding','System Design','HR','Aptitude','LLD','Domain','Managerial') | |
| `typical_duration_min` | `smallint` | NULLABLE | Duration in minutes |
| `description` | `text` | NULLABLE | What is typically assessed in this round |
| — | — | UNIQUE (company_id, role_id, round_number) | |

#### `company_topic_frequency`
*Pre-aggregated frequency intelligence: for a given company+role, the % occurrence of each topic. This IS the topic frequency engine output.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `company_id` | `uuid` | NOT NULL, FK → companies.id ON DELETE CASCADE | |
| `role_id` | `uuid` | NULLABLE, FK → roles.id | Null = aggregated across all roles |
| `topic_id` | `uuid` | NOT NULL, FK → topics.id ON DELETE CASCADE | |
| `frequency_pct` | `numeric(5,2)` | NOT NULL | 0.00–100.00. e.g. 78.50 = 78.5% of experiences mention this topic |
| `question_count` | `integer` | DEFAULT 0 | Raw count of questions in this (company, role, topic) bucket |
| `experience_count` | `integer` | DEFAULT 0 | Number of interview experiences contributing to this frequency |
| `last_computed_at` | `timestamptz` | DEFAULT now() | Refreshed by frequency engine job |
| — | — | UNIQUE (company_id, role_id, topic_id) | |

#### `company_difficulty_distribution`
*Pre-aggregated difficulty split per company+role. Powers the difficulty donut chart on Company Profile pages.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `company_id` | `uuid` | NOT NULL, FK → companies.id ON DELETE CASCADE | |
| `role_id` | `uuid` | NULLABLE, FK → roles.id | |
| `difficulty` | `text` | NOT NULL, CHECK IN ('Easy','Medium','Hard') | |
| `pct` | `numeric(5,2)` | NOT NULL | Percentage of questions at this difficulty level |
| — | — | PRIMARY KEY (company_id, role_id, difficulty) | |

### Group C.1 — Curriculum Intelligence (Faculty Portal)

#### `courses`
*B.Tech CS & AI curriculum courses. Populated from official NST syllabus. Derived from `schema/migrations/006`.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `code` | `text` | UNIQUE, NOT NULL | 'CS201', 'CS301', 'CS302', 'CS401', 'CS402' |
| `name` | `text` | NOT NULL | 'Data Structures & Algorithms', 'OS & Networks', 'DBMS & SQL', 'Modern Web Dev', 'System Design', 'Cloud Computing' |
| `semester` | `smallint` | NOT NULL | 1–8 semester number |
| `credits` | `smallint` | NULLABLE | Course credit hours |
| `department` | `text` | DEFAULT 'Computer Science' | |
| `is_active` | `boolean` | DEFAULT true | Soft delete for discontinued courses |

#### `syllabus_topics`
*Maps curriculum topics to canonical topics taxonomy. Derived from `schema/migrations/007`. Enables the curriculum gap matrix computation.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `course_id` | `uuid` | NOT NULL, FK → courses.id ON DELETE CASCADE | |
| `topic_id` | `uuid` | NOT NULL, FK → topics.id ON DELETE RESTRICT | |
| `coverage_depth` | `text` | NOT NULL, CHECK IN ('Introductory','Intermediate','Advanced') | How deeply this topic is covered in the course |
| — | — | UNIQUE (course_id, topic_id) | |

#### `curriculum_gap_cache`
*Pre-computed gap matrix row per course-category pair. Refreshed on pipeline completion. Powers Faculty Portal curriculum gap matrix.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `course_id` | `uuid` | NOT NULL, FK → courses.id ON DELETE CASCADE | |
| `company_category` | `text` | NOT NULL, CHECK IN ('maang','product','service','startup','bfsi') | One row per course per company category |
| `coverage_pct` | `numeric(5,2)` | NOT NULL | How well this course's topics match what companies in this category test |
| `industry_demand` | `text` | NOT NULL, CHECK IN ('High','Medium','Low') | Demand label derived from aggregate frequency across category |
| `industry_relevance_score` | `numeric(5,2)` | DEFAULT 0.00 | 0–100 relevance score per course (Phase 2 enhancement) |
| `gap_status` | `text` | NOT NULL, CHECK IN ('covered','gap','over-indexed') | Red/Green/Yellow matrix cell value |
| `last_computed_at` | `timestamptz` | DEFAULT now() | |
| — | — | UNIQUE (course_id, company_category) | |

### Group C.2 — Student Portal Application Tables

#### `student_onboarding`
*Multi-step onboarding selections (Steps 1–4). Persisted to DB on onboarding completion (Step 4 BACKEND TODO).*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `student_id` | `uuid` | PRIMARY KEY, FK → student_profiles.id ON DELETE CASCADE | 1:1; completed once |
| `target_domains` | `text[]` | NOT NULL | Step 1 role domains: ['SDE / Software Engineering', 'Data Science / ML'] |
| `target_categories` | `text[]` | NOT NULL | Step 2 company categories: ['maang', 'product'] |
| `topic_self_ratings` | `jsonb` | NOT NULL | Map of topic_slug → self_rating (1–10) from Step 3 sliders, e.g. {"arrays": 7, "dp": 3} |
| `target_company_slugs` | `text[]` | NOT NULL | Company slugs added during onboarding: ['google', 'amazon', 'flipkart'] |
| `prep_weeks_committed` | `smallint` | DEFAULT 12 | Total weeks committed at Step 4 |
| `completed_at` | `timestamptz` | NULLABLE | Timestamp of Step 4 'Launch' click |

#### `user_roadmaps`
*One row per company a student adds to their roadmap. Source: AddToRoadmapModal + onboarding Step 4.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `student_id` | `uuid` | NOT NULL, FK → student_profiles.id ON DELETE CASCADE | |
| `company_id` | `uuid` | NOT NULL, FK → companies.id ON DELETE RESTRICT | |
| `role_name` | `text` | NOT NULL | 'SDE-1', 'SDE-2' etc. — user's selected target role |
| `weeks_committed` | `integer` | NOT NULL | Preparation weeks allocated for this company |
| `current_week` | `integer` | DEFAULT 1 | Progress pointer |
| `pct_complete` | `numeric(5,2)` | DEFAULT 0.00 | Overall completion percentage |
| `is_active` | `boolean` | DEFAULT true | User can pause/remove companies from roadmap |
| `added_at` | `timestamptz` | DEFAULT now() | |
| — | — | UNIQUE (student_id, company_id, role_name) | One roadmap entry per company+role |

#### `roadmap_weeks`
*Week-by-week breakdown for each user roadmap entry.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `roadmap_id` | `uuid` | NOT NULL, FK → user_roadmaps.id ON DELETE CASCADE | |
| `week_number` | `smallint` | NOT NULL | |
| `topic_label` | `text` | NOT NULL | e.g. 'Arrays & Sliding Window' |
| `total_questions` | `integer` | DEFAULT 0 | Questions assigned this week |
| `done_questions` | `integer` | DEFAULT 0 | Questions completed |
| `status` | `text` | DEFAULT 'locked', CHECK IN ('done','active','locked') | Mirrors RoadmapWeek.status |
| — | — | UNIQUE (roadmap_id, week_number) | |

#### `question_completions`
*Student's completed questions — source of XP, streak, and progress tracking.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `student_id` | `uuid` | NOT NULL, FK → student_profiles.id ON DELETE CASCADE | |
| `question_id` | `uuid` | NOT NULL, FK → questions.id ON DELETE CASCADE | |
| `roadmap_id` | `uuid` | NULLABLE, FK → user_roadmaps.id | If completed as part of a roadmap week |
| `xp_earned` | `integer` | NOT NULL | XP value at time of completion |
| `completed_at` | `timestamptz` | DEFAULT now() | |
| — | — | UNIQUE (student_id, question_id) | Prevents double-counting |

#### `interview_experiences`
*Student-submitted interview experiences (Submit page). Source of primary NST-internal data — the product moat.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `student_id` | `uuid` | NOT NULL, FK → student_profiles.id ON DELETE CASCADE | Submitting student |
| `company_id` | `uuid` | NOT NULL, FK → companies.id ON DELETE RESTRICT | |
| `role` | `text` | NOT NULL | Role applied for |
| `interview_date` | `date` | NOT NULL | Actual interview date |
| `outcome` | `text` | NOT NULL, CHECK IN ('offer','rejected','waiting') | |
| `overall_difficulty` | `text` | NOT NULL, CHECK IN ('Easy','Medium','Hard') | |
| `rounds_count` | `smallint` | NOT NULL | Total number of rounds conducted |
| `problems_count` | `smallint` | DEFAULT 0 | Problems asked across all rounds |
| `work_type` | `text` | NULLABLE | 'Remote', 'On-site', 'Hybrid' |
| `experience_text` | `text` | NOT NULL | Full narrative from experience textarea |
| `tips` | `text` | NULLABLE | Surprises or tips field from submit form |
| `upvote_count` | `integer` | DEFAULT 0 | Denormalized for fast display |
| `is_verified` | `boolean` | DEFAULT false | Admin-verified before contributing to frequency engine |
| `source` | `text` | DEFAULT 'nst_internal' | Distinguishes NST submissions from scraped content |
| `created_at` | `timestamptz` | DEFAULT now() | |

#### `experience_rounds`
*Per-round detail within an interview experience submission. Mirrors InterviewRound interface.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `experience_id` | `uuid` | NOT NULL, FK → interview_experiences.id ON DELETE CASCADE | |
| `round_number` | `smallint` | NOT NULL | |
| `type` | `text` | NOT NULL | 'DSA Coding', 'System Design', 'HR / Googlyness', 'LLD', 'Managerial' |
| `topics` | `text[]` | NOT NULL | e.g. ['Arrays', 'Sliding Window'] |
| `description` | `text` | NOT NULL | Round narrative |
| `cleared` | `boolean` | NOT NULL | Whether student cleared this round |

#### `experience_upvotes`
*Tracks which student upvoted which experience. Prevents double-upvoting.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `student_id` | `uuid` | NOT NULL, FK → student_profiles.id ON DELETE CASCADE | |
| `experience_id` | `uuid` | NOT NULL, FK → interview_experiences.id ON DELETE CASCADE | |
| `upvoted_at` | `timestamptz` | DEFAULT now() | |
| — | — | PRIMARY KEY (student_id, experience_id) | |

#### `doubt_threads`
*Student doubt Q&A. Cross-portal: students post, faculty reply. Mirrors FacultyDoubt interface.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `student_id` | `uuid` | NOT NULL, FK → student_profiles.id ON DELETE CASCADE | The student who raised the doubt |
| `assigned_faculty_id` | `uuid` | NULLABLE, FK → faculty_profiles.id | Faculty assigned to answer |
| `subject` | `text` | NOT NULL | Short subject line |
| `body` | `text` | NOT NULL | Full doubt description |
| `tag` | `text` | NOT NULL, CHECK IN ('DSA','System Design','LLD','HR','General','Web Development','Aptitude') | Mirrors DoubtTag type |
| `status` | `text` | DEFAULT 'pending', CHECK IN ('pending','answered','resolved') | Mirrors DoubtStatus type |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `resolved_at` | `timestamptz` | NULLABLE | Timestamp when student marks resolved |

#### `doubt_replies`
*Messages within a doubt thread. Mirrors DoubtReply interface — author can be faculty or student.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `thread_id` | `uuid` | NOT NULL, FK → doubt_threads.id ON DELETE CASCADE | |
| `author_id` | `uuid` | NOT NULL, FK → users.id | Either a student or faculty user |
| `author_role` | `text` | NOT NULL, CHECK IN ('faculty','student') | Mirrors DoubtReply.author |
| `body` | `text` | NOT NULL | |
| `sent_at` | `timestamptz` | DEFAULT now() | |

#### `session_bookings`
*Student requests for 1:1 mentorship sessions with faculty. Mirrors FacultySessionRequest and student Session interfaces.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `student_id` | `uuid` | NOT NULL, FK → student_profiles.id ON DELETE CASCADE | |
| `faculty_id` | `uuid` | NOT NULL, FK → faculty_profiles.id ON DELETE RESTRICT | |
| `topic` | `text` | NOT NULL | Session topic requested by student |
| `notes` | `text` | NULLABLE | Additional student notes |
| `requested_date` | `date` | NOT NULL | Student's preferred date |
| `requested_time` | `time` | NOT NULL | Student's preferred time |
| `duration_min` | `smallint` | NOT NULL, CHECK IN (30, 60) | Mirrors FacultySessionRequest.duration constraint |
| `status` | `text` | DEFAULT 'pending', CHECK IN ('pending','confirmed','proposed','completed','cancelled') | Mirrors SessionStatus |
| `meet_link` | `text` | NULLABLE | Jitsi Meet link added by faculty on confirmation |
| `proposed_date` | `date` | NULLABLE | Faculty counter-proposal date |
| `proposed_time` | `time` | NULLABLE | Faculty counter-proposal time |
| `student_feedback_rating` | `smallint` | NULLABLE, CHECK (BETWEEN 1 AND 5) | Post-session rating; feeds faculty satisfaction_avg |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

#### `notifications`
*In-app notification feed for students and faculty. Mirrors AppNotification interface.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `user_id` | `uuid` | NOT NULL, FK → users.id ON DELETE CASCADE | |
| `type` | `text` | NOT NULL, CHECK IN ('badge','new_company','roadmap','experience','question','xp','session','doubt','system') | Mirrors NotificationType + portal-specific additions |
| `title` | `text` | NOT NULL | |
| `subtitle` | `text` | NULLABLE | |
| `icon_name` | `text` | NULLABLE | Lucide icon name for frontend rendering |
| `is_read` | `boolean` | DEFAULT false | |
| `created_at` | `timestamptz` | DEFAULT now() | |

### Group C.3 — Admin Portal Tables

#### `admin_sent_notifications`
*Log of push notifications sent from Admin Portal. Mirrors SentNotification interface.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `sent_by_admin_id` | `uuid` | NOT NULL, FK → users.id | |
| `title` | `text` | NOT NULL | |
| `message` | `text` | NOT NULL | |
| `target_audience` | `text` | NOT NULL, CHECK IN ('students','faculty','all') | Broadcast scope |
| `status` | `text` | DEFAULT 'sent', CHECK IN ('sent','scheduled','failed') | |
| `scheduled_for` | `timestamptz` | NULLABLE | For scheduled notifications |
| `sent_at` | `timestamptz` | DEFAULT now() | |

#### `faculty_invites`
*Tracks admin-initiated faculty invitations before account activation. Supports 'INVITE PENDING' status in manage-faculty page.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| `email` | `text` | UNIQUE, NOT NULL | Invited email address |
| `full_name` | `text` | NOT NULL | |
| `stream` | `text` | NULLABLE | |
| `invited_by_admin_id` | `uuid` | NOT NULL, FK → users.id | |
| `token` | `text` | UNIQUE, NOT NULL | Secure random token for invite link |
| `token_expires_at` | `timestamptz` | NOT NULL | DEFAULT now() + interval '7 days' |
| `accepted_at` | `timestamptz` | NULLABLE | Set when faculty completes registration |
| `created_at` | `timestamptz` | DEFAULT now() | |

### Group D — Analytics & Audit Tables

#### `daily_activity_log`
*DAU/MAU source of truth. One row per user per day they are active. Powers Admin engagement analytics.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `user_id` | `uuid` | NOT NULL, FK → users.id ON DELETE CASCADE | |
| `activity_date` | `date` | NOT NULL | |
| `session_count` | `smallint` | DEFAULT 1 | |
| `questions_solved` | `integer` | DEFAULT 0 | |
| `doubts_raised` | `integer` | DEFAULT 0 | |
| `sessions_booked` | `integer` | DEFAULT 0 | |
| — | — | PRIMARY KEY (user_id, activity_date) | One row per user per day |

#### `hourly_activity_heatmap`
*Aggregated hourly activity counts for the admin engagement heatmap. Refreshed nightly.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `role` | `text` | NOT NULL, CHECK IN ('student','faculty') | |
| `day_of_week` | `smallint` | NOT NULL | 0=Monday … 6=Sunday |
| `hour_of_day` | `smallint` | NOT NULL | 0–23 |
| `activity_count` | `integer` | DEFAULT 0 | |
| `week_computed` | `date` | NOT NULL | Monday of the week this row covers |
| — | — | PRIMARY KEY (role, day_of_week, hour_of_day, week_computed) | |

#### `leaderboard_cache`
*Pre-computed leaderboard rankings. Mirrors LeaderboardEntry interface from Admin Portal.*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `student_id` | `uuid` | PRIMARY KEY, FK → student_profiles.id ON DELETE CASCADE | |
| `rank` | `integer` | NOT NULL | |
| `xp` | `integer` | NOT NULL | |
| `tasks_completed` | `integer` | DEFAULT 0 | |
| `doubts_raised` | `integer` | DEFAULT 0 | |
| `last_computed_at` | `timestamptz` | DEFAULT now() | |

---

## Relationships Diagram

*Crow's foot notation: (1) one, (N) many, (N)>──<(N) many-to-many.*

```
IDENTITY LAYER
  users (1) ──── (1) student_profiles
  users (1) ──── (1) faculty_profiles
  users (1) ──< (N) notifications

INTELLIGENCE CORE
  companies (1) ──< (N) questions
  roles     (1) ──< (N) questions
  questions (N) >──< (N) topics                 [via question_topics]
  companies (1) ──< (N) company_round_structure
  companies (1) ──< (N) company_topic_frequency
  topics    (1) ──< (N) company_topic_frequency
  companies (1) ──< (N) company_difficulty_distribution

CURRICULUM INTELLIGENCE
  courses (1) ──< (N) syllabus_topics
  topics  (1) ──< (N) syllabus_topics
  courses (1) ──< (N) curriculum_gap_cache

STUDENT PORTAL
  student_profiles (1) ──── (1) student_onboarding
  student_profiles (1) ──< (N) user_roadmaps
  user_roadmaps    (1) ──< (N) roadmap_weeks
  companies        (1) ──< (N) user_roadmaps
  student_profiles (1) ──< (N) question_completions
  questions        (1) ──< (N) question_completions
  student_profiles (1) ──< (N) interview_experiences
  companies        (1) ──< (N) interview_experiences
  interview_experiences (1) ──< (N) experience_rounds
  interview_experiences (1) ──< (N) experience_upvotes
  student_profiles (1) ──< (N) experience_upvotes
  student_profiles (1) ──< (N) doubt_threads
  faculty_profiles (1) ──< (N) doubt_threads     [assigned_faculty_id]
  doubt_threads    (1) ──< (N) doubt_replies
  users            (1) ──< (N) doubt_replies
  student_profiles (1) ──< (N) session_bookings
  faculty_profiles (1) ──< (N) session_bookings

ADMIN PORTAL
  users            (1) ──< (N) admin_sent_notifications  [sent_by_admin_id]
  users            (1) ──< (N) faculty_invites           [invited_by_admin_id]
  student_profiles (1) ──── (1) leaderboard_cache

ANALYTICS
  users (1) ──< (N) daily_activity_log
```

---

## Indexes

Recommended based on frontend API contract query patterns, analytics aggregations, and join patterns. Critical-path indexes marked **P0**.

| Index | Purpose / Query Pattern | Priority |
|---|---|---|
| `idx_questions_company_role` | GET /api/companies/:slug?role=X — core intelligence engine query (filter by company_id, role_id) | P0 |
| `idx_questions_company_round` | Round-level question grouping on Company Profile page (roundQuestions data) | P0 |
| `idx_company_topic_freq_company_role` | GET /api/companies/:slug/topics — rank topics by frequency_pct for a company+role | P0 |
| `idx_companies_slug` | GET /api/companies/:slug — primary student-facing lookup | P0 |
| `idx_companies_category` | GET /api/companies?category=maang — filter by company category | P1 |
| `idx_user_roadmaps_student` | GET /api/user/roadmap — all roadmap companies for a student | P0 |
| `idx_question_completions_student` | GET /api/user/stats — XP, progress, solved count per student | P0 |
| `idx_interview_exp_company` | Aggregate NST-internal experiences by company for frequency engine | P0 |
| `idx_interview_exp_student` | GET /api/user/experiences — student's own submission history | P1 |
| `idx_doubt_threads_student` | GET /api/user/doubts — student's doubt queue | P1 |
| `idx_doubt_threads_faculty` | Faculty portal: GET assigned doubts for a faculty member | P1 |
| `idx_doubt_threads_status` | Filter open ('pending','answered') doubts for dashboard counts | P1 |
| `idx_session_bookings_student` | GET student's own session list | P1 |
| `idx_session_bookings_faculty` | Faculty: GET assigned sessions queue | P1 |
| `idx_session_bookings_status` | Admin analytics: session counts by status | P2 |
| `idx_notifications_user_unread` | Fast unread count badge for Navbar notification indicator | P1 |
| `idx_question_topics_topic` | Reverse lookup: all questions for a given topic | P1 |
| `idx_syllabus_topics_course` | Curriculum gap matrix: get topics for a course | P1 |
| `idx_daily_activity_log_date` | Admin DAU chart: aggregate by date range | P1 |
| `idx_questions_fts` | Full-text search on problem_summary (GIN tsvector index) | P2 |
| `idx_questions_hot` | Filter hot/trending questions for dashboard quick-access cards | P2 |

**Critical Index DDL:**
```sql
-- P0: Core intelligence engine queries
CREATE INDEX idx_questions_company_role ON questions(company_id, role_id);
CREATE INDEX idx_questions_company_round ON questions(company_id, round_type);
CREATE INDEX idx_company_topic_freq_lookup ON company_topic_frequency(company_id, role_id, frequency_pct DESC);
CREATE INDEX idx_companies_slug ON companies(slug);

-- P0: Student portal critical paths
CREATE INDEX idx_user_roadmaps_student ON user_roadmaps(student_id);
CREATE INDEX idx_question_completions_student ON question_completions(student_id);
CREATE INDEX idx_interview_exp_company ON interview_experiences(company_id, is_verified);

-- P1: Doubt & session management
CREATE INDEX idx_doubt_threads_student ON doubt_threads(student_id, status);
CREATE INDEX idx_doubt_threads_faculty ON doubt_threads(assigned_faculty_id, status);
CREATE INDEX idx_session_bookings_student ON session_bookings(student_id, status);
CREATE INDEX idx_session_bookings_faculty ON session_bookings(faculty_id, status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- P2: Full-text search
CREATE INDEX idx_questions_fts ON questions USING GIN (to_tsvector('english', problem_summary));
CREATE INDEX idx_companies_name_trgm ON companies USING GIN (name gin_trgm_ops);
```

---

## Row-Level Security (RLS) Policies

RLS is enforced via Supabase's PostgreSQL RLS. All tables with user-scoped data have RLS enabled. `auth.uid()` returns the authenticated user's UUID from the JWT. *(These are written but NOT yet applied — see Document 6, Phase 1.)*

```sql
-- ── Identity Tables ──
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_select_own" ON student_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "students_update_own" ON student_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "faculty_admin_view_students" ON student_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('faculty','admin'))
  );

ALTER TABLE faculty_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faculty_select_own" ON faculty_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "faculty_update_own" ON faculty_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admin_manage_faculty" ON faculty_profiles
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ── Intelligence Core Tables (Public Read) ──
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_companies" ON companies
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_questions" ON questions
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE company_topic_frequency ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_read_freq" ON company_topic_frequency
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── Student-Scoped Data ──
ALTER TABLE user_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_own_roadmap" ON user_roadmaps FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "admin_read_roadmaps" ON user_roadmaps
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE question_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_own_completions" ON question_completions FOR ALL USING (auth.uid() = student_id);

ALTER TABLE interview_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_own_experiences" ON interview_experiences FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "all_read_verified_experiences" ON interview_experiences
  FOR SELECT USING (is_verified = true AND auth.role() = 'authenticated');

-- ── Doubt Threads (Cross-Portal) ──
ALTER TABLE doubt_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_own_doubts" ON doubt_threads FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "faculty_assigned_doubts" ON doubt_threads FOR SELECT USING (auth.uid() = assigned_faculty_id);
CREATE POLICY "faculty_reply_to_doubts" ON doubt_threads FOR UPDATE USING (auth.uid() = assigned_faculty_id);
CREATE POLICY "admin_all_doubts" ON doubt_threads
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ── Session Bookings (Cross-Portal) ──
ALTER TABLE session_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_own_sessions" ON session_bookings FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "faculty_assigned_sessions" ON session_bookings FOR SELECT USING (auth.uid() = faculty_id);
CREATE POLICY "faculty_update_sessions" ON session_bookings FOR UPDATE USING (auth.uid() = faculty_id);
CREATE POLICY "admin_all_sessions" ON session_bookings
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
```

### Role-Based Permission Matrix

*Key: R = SELECT only · R+W = SELECT + INSERT + UPDATE + DELETE · (own) = restricted to own rows by RLS · (all) = across all rows · — = no access · Pipeline roles use Supabase service_role key (bypasses RLS).*

| Table | Student | Faculty | Admin | Pipeline / System |
|---|---|---|---|---|
| users | R (own) | R (own) | R+W (all) | — |
| student_profiles | R+W (own) | R (all) | R+W (all) | R+W (all) |
| faculty_profiles | R (public fields) | R+W (own) | R+W (all) | — |
| companies | R | R | R+W | W (pipeline) |
| roles | R | R | R+W | W (pipeline) |
| topics | R | R | R+W | W (pipeline) |
| questions | R | R | R+W | W (pipeline) |
| question_topics | R | R | R+W | W (pipeline) |
| company_round_structure | R | R | R+W | W (pipeline) |
| company_topic_frequency | R | R | R | W (pipeline) |
| company_difficulty_distribution | R | R | R | W (pipeline) |
| courses | R | R+W | R+W | — |
| syllabus_topics | R | R+W | R+W | — |
| curriculum_gap_cache | R | R | R | W (pipeline) |
| student_onboarding | R+W (own) | — | R (all) | — |
| user_roadmaps | R+W (own) | — | R (all) | — |
| roadmap_weeks | R+W (own) | — | R (all) | — |
| question_completions | R+W (own) | — | R (all) | — |
| interview_experiences | R+W (own); R (verified) | R (all verified) | R+W (all) | W (pipeline) |
| experience_rounds | R+W (via experience) | R | R+W | W (pipeline) |
| experience_upvotes | R+W (own) | — | R | — |
| doubt_threads | R+W (own) | R+W (assigned) | R+W (all) | — |
| doubt_replies | R+W (own) | R+W (assigned) | R+W (all) | — |
| session_bookings | R+W (own) | R+W (assigned) | R (all) | — |
| notifications | R+W (own) | R+W (own) | W (all) | — |
| admin_sent_notifications | — | — | R+W | — |
| faculty_invites | — | — | R+W | — |
| daily_activity_log | — | — | R | W (system) |
| leaderboard_cache | R | R | R | W (system) |

---

## Backend Workflow & Data Flow

**Data Pipeline (Intelligence Engine Build):**
```
STAGE 1 — Source Discovery & Extraction (Week 1)
  scrapers/geeksforgeeks.py ──► data/raw/geeksforgeeks/*.json
  scrapers/ambitionbox.py   ──► data/raw/ambitionbox/*.json
  api/codeforces.py         ──► data/raw/codeforces/*.json
  api/reddit_praw.py        ──► data/raw/reddit/*.json
  github_repos/clone.sh     ──► data/raw/github/*.json
  [NST Placement Cell CSV]  ──► data/raw/nst_internal/*.json
STAGE 2 — Ingestion & Schema (Week 2)
  pipeline/merge.py ──► data/staging/*.json (deduplicated)
  pipeline/load.py  ──► PostgreSQL (companies, questions, topics)
  [Schema migrations applied: 001_create_companies.sql … 007]
STAGE 3 — Cleaning & Classification (Week 2–3)
  pipeline/clean.py       ──► data/processed/*.json
  pipeline/classify.py    ──► Claude API classification [topic, difficulty, round_type, skill_area]
  pipeline/syllabus_map.py ──► syllabus_topics table populated
STAGE 4 — Intelligence Computation
  engine/frequency.py   ──► company_topic_frequency  [COUNT GROUP BY company,role,topic → frequency_pct]
  engine/difficulty.py  ──► company_difficulty_distribution
  engine/gap_matrix.py  ──► curriculum_gap_cache
  engine/leaderboard.py ──► leaderboard_cache
STAGE 5 — Product Layer
  FastAPI /api/companies/:slug ◄── company_topic_frequency + questions
  FastAPI /api/questions        ◄── questions + question_topics
  FastAPI /api/search           ◄── companies + questions (FTS index)
  Next.js API Routes            ◄── session_bookings, doubt_threads, roadmaps
```

**Key backend workflows** (student onboarding writes student_onboarding + user_roadmaps + roadmap_weeks and flips onboarding_complete; question solve inserts question_completions, bumps xp_total, updates roadmap_weeks, inserts notification, refreshes leaderboard_cache async; experience submission inserts interview_experiences + experience_rounds and, on admin verify, re-runs the frequency engine; faculty session status changes trigger student notifications; admin faculty-invite flow writes faculty_invites → users + faculty_profiles on acceptance; admin push notification writes admin_sent_notifications + bulk-inserts notifications).

## API / Data Interaction Overview

| Method | Endpoint | Primary Tables | Role |
|---|---|---|---|
| GET | /api/companies | companies | All |
| GET | /api/companies/:slug | companies, company_topic_frequency, company_round_structure, company_difficulty_distribution, questions | All |
| GET | /api/questions?company=&topic=&difficulty=&roundType= | questions, question_topics | All |
| GET | /api/onboarding/topics?categories= | topics (filtered by category) | Student |
| GET | /api/search?q= | companies, questions (FTS) | All |
| GET | /api/dashboard | user_roadmaps, question_completions, company_topic_frequency | Student |
| GET | /api/user/roadmap-companies | user_roadmaps, companies | Student |
| GET | /api/dashboard/today-tasks | roadmap_weeks, questions | Student |
| GET | /api/user/stats | question_completions, student_profiles | Student |
| GET | /api/user/me/roadmap | user_roadmaps, roadmap_weeks | Student |
| POST | /api/user/me/onboarding/complete | student_onboarding, user_roadmaps, student_profiles | Student |
| POST | /api/questions/:id/complete | question_completions, student_profiles (xp) | Student |
| GET | /api/practice/categories | topics (grouped) | Student |
| GET | /api/notifications | notifications | Student/Faculty |
| POST | /api/experiences | interview_experiences, experience_rounds | Student |
| POST | /api/doubts | doubt_threads | Student |
| POST | /api/doubts/:id/replies | doubt_replies, doubt_threads | Student/Faculty |
| POST | /api/sessions/book | session_bookings | Student |
| PATCH | /faculty/api/sessions/:id | session_bookings, notifications | Faculty |
| GET | /faculty/api/curriculum | curriculum_gap_cache, courses, syllabus_topics | Faculty |
| GET | /admin/api/overview | student_profiles, faculty_profiles, doubt_threads, session_bookings | Admin |
| GET | /admin/api/analytics/engagement | daily_activity_log, hourly_activity_heatmap | Admin |
| GET | /admin/api/analytics/doubts | doubt_threads, doubt_replies, faculty_profiles | Admin |
| GET | /admin/api/analytics/practice | question_completions, topics | Admin |
| GET | /admin/api/analytics/placement | student_profiles, user_roadmaps, interview_experiences | Admin |
| GET | /admin/api/leaderboard | leaderboard_cache, student_profiles | Admin |
| POST | /admin/api/faculty/invite | faculty_invites | Admin |
| PATCH | /admin/api/faculty/:id | faculty_profiles | Admin |
| POST | /admin/api/notifications/send | admin_sent_notifications, notifications | Admin |

## Backend Architecture Decisions

1. **Pre-aggregated intelligence tables vs. runtime computation** — `company_topic_frequency` and `curriculum_gap_cache` are pre-computed by a pipeline job (not on every request), because ranking topics by frequency requires COUNT aggregation across 50,000+ question rows. Data is at most 24h stale, acceptable given weekly/bi-weekly scraping cadence. `leaderboard_cache` follows the same pattern.
2. **Dual backend strategy: FastAPI + Next.js API Routes** — Intelligence-layer endpoints (`/api/companies`, `/api/questions`, `/api/search`) are served by FastAPI (Python-native pipeline). Portal-specific, session-context operations (bookings, doubts, roadmaps) are served by Next.js API Routes (Clerk JWT / faculty cookie without an extra round-trip). Both share the same PostgreSQL database.
3. **NST-internal experiences as first-class data** — Student submissions are `is_verified=false` until admin verification; only verified experiences feed the frequency engine, protecting data quality while allowing immediate community display. The `source` field distinguishes NST-internal from scraped data.
4. **Auth fragmentation across portals** — Three portals currently use three different mechanisms (Clerk, cookie, stub). The backend must unify identity through the `users` table; the `role` column drives RLS. Recommended long-term: consolidate to Supabase Auth or Clerk Organizations. Interim: Faculty/Admin issue their own JWTs mapping to `users.id`.
5. **XP and leaderboard as denormalized counters** — `xp_total` and `current_streak_days` are counters on `student_profiles`; `leaderboard_cache` is refreshed nightly. `xp_total` is incremented in the same transaction as `INSERT question_completions`.

## Scalability & Future-Ready Notes

**V1 data volume estimates:** companies 80–120; questions 30,000–60,000; question_topics 90,000–180,000 (~3 topics/question); company_topic_frequency ~5,000; interview_experiences 25,000–50,000 external + 500+ NST; student_profiles 428 (initial NST batch); user_roadmaps ~1,000; question_completions ~50,000/yr (write-heavy); doubt_threads ~2,000/yr; session_bookings ~1,500/yr; daily_activity_log ~150,000/yr.

**Scaling strategies:** range-partition `daily_activity_log` and `question_completions` by month/year past 1M rows; PgBouncer connection pooling for serverless functions; CDN/Redis caching of company profile responses (1h TTL, invalidate on pipeline re-run); Supabase read replica for analytics once students exceed 2,000; migrate FTS to Meilisearch/Typesense past 100,000 questions.

**Future-ready schema improvements (Phase 2/3):** `nst_company_visits` + `nst_visit_id` FK (NST Placement Mirror); `industry_relevance_score` computation for `courses`; `study_plan_items` (AI personalized study plans from Claude); `company_topic_frequency_history` (topic trend timeline); `quiz_sessions` + `quiz_question_attempts` (in-portal quiz engine); `alumni_profiles` (NST Alumni Feed); `institution_id` on profile/course tables for multi-tenancy. All schema changes must be applied via numbered migration files (`008_add_nst_visits.sql`, etc.) — never ad-hoc SQL against production.

---
---

# DOCUMENT 6 — Implementation Plan

> **Purpose:** The exact build sequence to take PlacePrep from **"three mocked frontends, no backend"** to a working production app. AI follows this phase by phase — no skipping, no guessing order.
>
> **This plan is not a greenfield build.** Per the codebase audit, Phase 0 (project setup) and Phase 3 (app shell & navigation) are already done across all three portals; the entire UI layer is built and deployed on Vercel. The critical, unstarted work is the *backend*: no Supabase project, no database, no API routes, no data pipeline, and no enforced authentication on any portal. The phases below are ordered by what PlacePrep actually still needs, reusing the standard phase structure but adapting each to the real gap.

---

## Build Rules (Read Before Starting)

1. **Do not build Phase N+1 until Phase N is tested and confirmed working.** (The audit explicitly calls out this rule.)
2. After each phase, test manually before proceeding.
3. Never break the existing, already-deployed frontends when wiring in the backend. Keep each portal shippable at all times.
4. Commit to version control at the end of each phase.
5. **Consolidate, don't fragment.** Pick ONE auth strategy for all three portals — do not keep three different half-built auth mechanisms.
6. **Reconcile the three mock-data modules into one shared data model** before/while wiring real data — each portal currently has subtly different shapes for the same entities (e.g. "student", "company").
7. Before writing any new page or changing Next.js APIs, check `node_modules/next/dist/docs/` — the faculty portal's `AGENTS.md` warns this Next.js 16 release has breaking API changes versus most training data.

---

## Phase 0 — Project Setup & Repo Hygiene  *(Status: mostly DONE ×3 — finish the gaps)*

**Already done:** Three Next.js 16 / React 19 apps scaffolded (student-portal, faculty-portal, admin-portal); `/app`, `/components`, `/lib` present in all three; Tailwind v4 configured everywhere (shadcn/ui + Base UI additionally in faculty-portal); Git repo initialized and pushed; all three deployed to Vercel.

**Remaining deliverables:**
- [ ] Create `.env.local` in every portal (currently missing in all three) with all required variable names from TRD Section 5 (Supabase, Clerk, Anthropic keys) — values can start empty
- [ ] Add a Prettier config to each portal (ESLint present, no Prettier found anywhere)
- [ ] Remove/reconcile duplicate config files in student-portal: `middleware 2.ts`, `next.config 2.ts` (build-conflict risk)
- [ ] Move or remove one-off utility scripts not part of app runtime: `faculty-portal/add_loading.py`, `add_loading_safe.py`, `admin-portal/scratch/upscale.js`
- [ ] Populate or delete the empty root `CONTEXT.MD`
- [ ] Reconcile `dashboard/README.md` (it still refers to a `faculty-dashboard/` folder and a shared `dashboard/api/` — neither matches the actual folder names on disk)
- [ ] Confirm whether faculty-portal's `_curriculum` / `_trends` (underscore-prefixed, currently excluded from routing) are intentionally private or just unlinked

**Test:** All three portals build clean (`next build`) with no duplicate-config warnings and Prettier passing.

---

## Phase 1 — Supabase Schema + RLS (Database Setup)  *(Status: NOT STARTED — primary blocker)*

*No Supabase project is connected anywhere; the `schema/migrations/*.sql` files exist but have never run against a live DB. This is the single biggest blocker — even if API routes were written today, there is no database to query.*

**Deliverables:**
- [ ] Create the Supabase project; capture URL + anon key + service role key into each portal's `.env.local`
- [ ] Run the existing `schema/migrations/*.sql` (001–007) against the live database, then extend with the full table set from Document 5 (all four groups: Auth & Identity, Intelligence Core, Portal Application, Analytics & Audit — ~27 tables)
- [ ] Apply all indexes from Document 5 (P0 first: `idx_questions_company_role`, `idx_company_topic_freq_lookup`, `idx_companies_slug`, `idx_user_roadmaps_student`, `idx_question_completions_student`, `idx_interview_exp_company`)
- [ ] Enable and apply all RLS policies from Document 5 (currently written in `schema/` but never applied) — identity, intelligence-core public-read, student-scoped, doubt threads, session bookings
- [ ] Enable `pg_trgm` and create the GIN full-text index on `questions.problem_summary`
- [ ] Create the `student_profiles` auto-creation trigger on user signup
- [ ] Seed static data: `companies` (from `schema/seed/companies.sql`), `topics` (from `schema/seed/topics.sql`), `roles`, and `courses` (NST syllabus)
- [ ] Load seed data for `curriculum_gap_cache` / `company_topic_frequency` placeholders so faculty/student pages have something to render before the pipeline runs

**Test:** Create a test user via the Supabase dashboard; confirm the `student_profiles` row auto-creates. Run a manual query as a non-owner and confirm RLS blocks cross-user reads.

---

## Phase 2 — Unify Auth + Enforce Middleware Across All 3 Portals  *(Status: PARTIAL / broken — most urgent fix)*

*Cross-portal auth is "the same underlying problem showing up three different ways," but **live verification against the production URLs on 2026-07-10 shows the three portals are not equally broken** — see the corrected, per-portal status below. `/login` pages exist and are styled in all three, but no real, backend-validated session-based login exists anywhere; and all three now have an undocumented "Guest Access (Demo Mode)" button that likely bypasses whatever gating exists.*

**Live-verified status per portal (supersedes the original audit's "all three fully open" framing):**
- **Student Portal** (`nst-prepportal-frontend.vercel.app`) — confirmed **fully open**. Every tested route (`/dashboard`, `/companies`, `/companies/google`, `/leaderboard`, `/notifications`, `/profile`, `/messages`) rendered completely with zero login, no redirect anywhere.
- **Admin Portal** (`nst-prepportal-frontend-fs6o.vercel.app`) — confirmed **fully open**, and the most exposed: `/students/1` and `/manage-faculty` leak real (mock) student PII and the full faculty roster to anyone with the URL, no login required.
- **Faculty Portal** (`nst-prepportal-frontend-khaki.vercel.app`) — **partially working today**: direct requests to `/`, `/requests`, `/doubts`, `/students`, and `/rankings` all correctly redirect to `/login` server-side. The `faculty_authed`-cookie gate is a real, functioning barrier against blind URL access, even though the credential check behind it is fake. The likely hole is the "Guest Access (Demo Mode)" button, not exercised in this check.

**Deliverables:**
- [ ] **Decide one auth strategy for all three portals** (either extend Clerk everywhere — already installed in student-portal — or move fully to Supabase Auth). Do not keep three half-built mechanisms.
- [ ] **Implement the unified role-based login design from Document 2** ("Unified Role-Based Login" section): move all three portals to subdomains of one root domain, configure Clerk primary + satellite domains (or the Supabase shared-cookie alternative), add a `role` field to every identity (`student` / `faculty` / `admin`), and wire the post-sign-in redirect so each role lands on their own portal automatically from one shared login
- [ ] Build a shared `/lib/supabase.ts` client + auth helper functions (`getUser`, `signIn`, `signOut`, `signUp`) — none exist in any portal today
- [ ] **Student Portal:** re-enable the Clerk route protection in `middleware.ts` that is currently commented out under "EMERGENCY DEMO MODE"; keep Google OAuth restricted to `@newtonschool.co`; keep the onboarding redirect for new users
- [ ] **Faculty Portal:** replace the placeholder cookie gate (nothing currently sets `faculty_authed` after a verified login) with a real login action that authenticates against the backend and issues a valid session
- [ ] **Admin Portal:** add real route protection (middleware currently has the auth check removed entirely) backed by the chosen provider / JWT
- [ ] Map every authenticated identity to a `users` row so RLS (`auth.uid()`) evaluates correctly across all portals
- [ ] Redirect logic: unauthenticated users → `/login`; authenticated users on `/login` → their portal home; unauthenticated on protected routes → `/login`
- [ ] Loading and error states on all login forms (mostly present — verify)
- [ ] **Decide the fate of the "Guest Access (Demo Mode)" button present on all three login pages (live-verified 2026-07-10).** Either gate it behind a non-production environment flag so it cannot ship to prod, or remove it entirely once real auth lands — as-is, it is a standing bypass of whatever gating each portal has.

**Test:** For each portal: attempt to reach a protected route while logged out (must redirect to `/login`); log in; confirm access; log out; confirm re-entry by direct URL is blocked. Confirm a student cannot load faculty/admin routes.

> Note: there is no standalone `/signup` or `/forgot-password` page in any portal (student self-serve signup happens via Clerk Google OAuth; faculty are invited by admins). Build a `/forgot-password` flow only for whichever provider is chosen; faculty onboarding uses the invite-token flow in Phase 7.

---

## Phase 3 — Build the API Layer (FastAPI + Next.js Routes)  *(Status: NOT STARTED — does not exist on disk)*

*There is no `/api` directory in any of the three Next.js apps, and the FastAPI `dashboard/api/` routers described in the README do not exist on disk. Nothing built so far can survive contact with real data without this layer.*

**Deliverables:**
- [ ] Stand up the **FastAPI intelligence service** for the shared, read-heavy endpoints (SQLAlchemy + asyncpg): `GET /api/companies`, `GET /api/companies/:slug` (joins company_topic_frequency + company_round_structure + company_difficulty_distribution + questions), `GET /api/questions` (filtered/paginated), `GET /api/topics`, `GET /api/search` (FTS), `GET /api/syllabus/gap-analysis`
- [ ] Build **Next.js API Routes** in each portal for session-context operations: student (`/api/dashboard`, `/api/user/stats`, `/api/user/roadmap-companies`, `/api/dashboard/today-tasks`, `/api/user/me/onboarding/complete`, `/api/questions/:id/complete`, `/api/experiences`, `/api/doubts`, `/api/doubts/:id/replies`, `/api/sessions/book`, `/api/notifications`); faculty (`/faculty/api/sessions/:id`, `/faculty/api/curriculum`, `/faculty/api/dashboard`); admin (`/admin/api/overview`, `/admin/api/analytics/{engagement,doubts,practice,placement}`, `/admin/api/leaderboard`, `/admin/api/bookings/stats`, `/admin/api/faculty/invite`, `/admin/api/faculty/:id`, `/admin/api/notifications/send`)
- [ ] Protect all endpoints with auth middleware (public-read intelligence endpoints require `authenticated`; faculty-only and admin-only endpoints enforce role)
- [ ] Implement the write-transaction workflows from Document 5 (e.g. solving a question inserts `question_completions`, bumps `xp_total`, updates `roadmap_weeks`, inserts a notification)

**Test:** Hit each endpoint with a valid session and confirm correct data + role enforcement (a student token must be rejected on `/admin/api/*`). Confirm a question-solve write updates all four downstream tables in one transaction.

---

## Phase 4 — Replace mock-data.ts with Live API Calls (Admin Portal First)  *(Status: NOT STARTED — biggest product gap)*

*Every page across all three portals reads from a local `lib/mock-data.ts` / `lib/types.ts` module (student 56KB, plus faculty and admin), not a network call. The admin portal is the best starting point: it is the only portal with `swr` installed plus dedicated `lib/hooks.ts` and `lib/types.ts` — it was built anticipating real API calls, so it needs the least rework.*

**Deliverables:**
- [ ] **Admin Portal (wire first):** point the existing SWR hooks in `lib/hooks.ts` (`useOverviewData`, `useStudents`, `useFaculty`, `useEngagementData`, `useLeaderboard`, `useBookingsData`, etc.) at the real `/admin/api/*` endpoints instead of mock fetchers; remove the simulated 500ms delay
- [ ] **Student Portal:** replace `mock-data.ts` reads one entity at a time — companies → questions → roadmap → progress → doubts → sessions → experiences → notifications; migrate onboarding to persist to `student_onboarding` + `user_roadmaps` + `roadmap_weeks` (currently sessionStorage only)
- [ ] **Faculty Portal:** wire dashboard, session requests, doubts, student matrix, rankings, and curriculum gap matrix to real endpoints
- [ ] Reconcile the three separate mock-data type shapes into one shared data model (shared types package or generated Prisma types) so "student" and "company" have a single definition across portals
- [ ] Preserve all existing empty/loading/error states (see Document 3); add the missing `error.tsx`/`loading.tsx` boundaries the student and faculty portals lack

**Test:** For each portal, create/read/update/delete a record and confirm it persists after refresh (no longer resets like mock state). Confirm the admin overview reflects real counts from the DB.

---

## Phase 5 — Data Pipeline Productionization (Scrapers → Supabase)  *(Status: NOT STARTED — 100% undone)*

*The entire pipeline exists only as READMEs with status tables — scrapers, ingestion, dedup, Claude classification, and syllabus mapping have zero code written. This can proceed in parallel with Phases 3–4 (it does not block them), but the intelligence pages stay on seed data until it runs.*

**Deliverables:**
- [ ] Build ONE scraper end-to-end first (recommend GeeksForGeeks): scrape → `data/raw/` → `ingest.py` → `transform.py` — to validate the schema design against real data before building all 12 planned scrapers
- [ ] Implement the pipeline scripts: `ingest.py`, `deduplicate.py` (fuzzy match ≥90% on company+round_type+problem_summary OR same source_url; keep higher frequency_score, merge sources), `transform.py` (company-name normalization, encoding fixes, HTML removal), `classify.py` (Claude API tags topic/difficulty/round_type/syllabus mapping), `export.py`, `run_all.py`
- [ ] Build the remaining scrapers with shared utils (`browser`, `rate_limiter`, `tos_check`): leetcode, interviewbit, ambitionbox, glassdoor, hackerrank, coding_ninjas, prepinsta, naukri, linkedin, reddit, github_repos
- [ ] Build the intelligence-computation jobs: `engine/frequency.py` → `company_topic_frequency`; `engine/difficulty.py` → `company_difficulty_distribution`; `engine/gap_matrix.py` → `curriculum_gap_cache`; `engine/leaderboard.py` → `leaderboard_cache`
- [ ] Schedule the frequency/gap/leaderboard jobs (nightly or pipeline-triggered upserts)
- [ ] Gate NST-internal `interview_experiences` behind `is_verified` before they feed the frequency engine

**Test:** Run the GeeksForGeeks scraper → confirm rows land in `data/raw/`, then in `questions` after ingest/transform/classify. Run the frequency engine and confirm a company profile page shows real topic-frequency percentages.

---

## Phase 6 — (Reserved / Not Applicable) Payments & Billing  *(Status: N/A)*

Not part of this project's scope — PlacePrep is a university-internal tool with no monetization in V1. No Stripe or billing concepts appear anywhere in the repo. This phase is intentionally skipped; the phase number is retained to keep the standard build sequence aligned.

---

## Phase 7 — User Settings, Profile & Faculty Onboarding  *(Status: UI built, not wired)*

*`/profile` pages exist in student (31KB), faculty, and admin portals, but forms edit local component state against mock data with no persistence. No avatar upload / file storage, and no password-change flow (consistent with there being no real auth yet).*

**Deliverables:**
- [ ] Wire `/profile` edit forms in all three portals to persist to `student_profiles` / `faculty_profiles` via the API layer
- [ ] Avatar upload to Supabase Storage; store the returned URL in `avatar_url`
- [ ] Password change / account management flow (via the chosen auth provider from Phase 2)
- [ ] Notification preferences (if applicable)
- [ ] **Faculty invite → registration flow:** admin `POST /admin/api/faculty/invite` writes `faculty_invites` (email, token, 7-day expiry) and sends an invite email; faculty clicks link → registration → inserts `users` + `faculty_profiles`, sets `faculty_invites.accepted_at`; supports the `INVITE PENDING` → `ACTIVE` status transition shown on the manage-faculty page
- [ ] Admin student/faculty status management (PLACED / IN PROGRESS / INACTIVE; ACTIVE / INACTIVE / PENDING) persisting to the DB

**Test:** Update a profile name, upload an avatar, change a password — confirm all persist. Send a faculty invite, complete registration from the token link, and confirm the faculty appears as ACTIVE in manage-faculty.

---

## Phase 8 — Polish & Edge Cases  *(Status: NOT STARTED)*

**Deliverables:**
- [ ] **Bug (live-verified 2026-07-10):** Admin `/faculty` page shows populated summary KPI cards (Total Faculty: 12, Active Now: 9, Avg Satisfaction: 4.29, Avg Response Rate: 84%) directly above a data table that renders **"0 members found"** with an empty body — the cards and table are reading from two different, out-of-sync data/mock sources. Fix before wiring real data so the same bug doesn't get baked into the live API integration.
- [ ] Systematic empty-state audit across all pages (many "Not implemented" states noted in Document 3 — especially loading/error states on student and faculty pages)
- [ ] Add missing `loading.tsx` / `error.tsx` boundaries to student and faculty portals (only admin has them today)
- [ ] Standardize a toast system across all portals (`sonner` is installed in faculty-portal only)
- [ ] All error states handled gracefully (no raw errors shown to users)
- [ ] Form validation on every form (client + server side)
- [ ] Responsive layout pass across mobile/tablet/desktop for all three portals (no confirmed pass yet)
- [ ] Favicon, Open Graph meta tags, page titles on every route (only default Next.js layout metadata confirmed)
- [ ] Remove `console.log` / debug artifacts (the `add_loading.py` scripts suggest ad-hoc scripted edits that may have left artifacts)

**Test:** Manually walk every route in all three portals; confirm no blank screens, no raw errors, and correct titles/meta.

---

## Phase 9 — Testing  *(Status: NOT STARTED — zero tests today)*

*No test files, test directories, or testing libraries exist in any `package.json`; no documented end-to-end journey testing; no Lighthouse artifacts.*

**Deliverables:**
- [ ] Add a testing library to each portal and cover the core user journeys from Document 3 end-to-end
- [ ] Auth flows tested for all three portals (login, logout, protected-route redirects, faculty invite/registration)
- [ ] Data-persistence tests (create → refresh → still there) per entity
- [ ] Pipeline validation test (one scraper → DB → API → UI)
- [ ] Mobile layout tested on a real device / devtools
- [ ] Performance tested (Lighthouse > 80 per TRD target)
- [ ] All broken links fixed; no unhandled promise rejections in console

---

## Phase 10 — Deployment & Production Hardening  *(Status: PARTIAL — frontends live, no backend behind them)*

*All three portals are already live on Vercel, but on mock data with no production database, no error monitoring, no analytics, and default Vercel subdomains.*

**Deliverables:**
- [ ] Set production environment variables per-project in the Vercel dashboard (Supabase, Clerk, Anthropic, portal URLs)
- [ ] Deploy the FastAPI backend (Supabase Edge Functions or standalone) and point `NEXT_PUBLIC_API_URL` at it
- [ ] Connect the production Supabase database (migrations + RLS applied, seed + pipeline data loaded)
- [ ] Confirm Student Portal Clerk protection is re-enabled in production (no more DEMO MODE) before any real student data is loaded
- [ ] Configure CSP headers, CSRF protection for custom auth, rate limiting on auth endpoints, and audit logging for admin actions (all listed as unimplemented in the TRD)
- [ ] Configure error monitoring (e.g. Sentry) — none in any portal today
- [ ] Configure analytics (e.g. PostHog / Plausible) — none in any portal today
- [ ] Optional: custom domain(s) (currently all three use default Vercel subdomains)
- [ ] Final smoke test on production per portal (sign up/in, core feature, data persistence)

**Test:** Full production smoke test across all three portals: authenticated login enforced, a student can complete onboarding and solve a question that persists, faculty can answer a doubt, admin sees real analytics — all against the live database.

---
---

# MASTER PROMPT — Use This to Continue Building

Copy this prompt and send it — together with this file — to your AI coding tool:

```
I am continuing to build an app called PlacePrep (NST Interview Intelligence Portal)
using AI coding tools. It is NOT a greenfield project: three Next.js 16 frontends
(Student, Faculty, Admin) already exist and are deployed on Vercel, all running on
local mock data with no live backend, no database, and no enforced authentication.

The 6 pre-build documents describing both the current state and the target
architecture are:
1. Product Requirements Document (PRD)
2. Technical Requirements Document (TRD)
3. App Flow Document
4. UI/UX Design Brief
5. Backend Schema Document
6. Implementation Plan

All 6 documents appear in full above this Master Prompt, in this same file.

Before writing any code:
1. Read all documents carefully.
2. Summarize what you understood about the app — and its current implementation
   state (what's built vs. stubbed) — in 5–7 bullet points.
3. Flag any gaps, contradictions, or missing details.
4. Confirm the tech stack and architecture you will use.
5. Identify which Phase from the Implementation Plan we will start with (note that
   Phases 0 and 3 are largely already done, and Phase 1 — Supabase schema + RLS — is
   the primary blocker).
6. Remember: this Next.js 16 release has breaking API changes vs. most training data —
   check node_modules/next/dist/docs/ before writing any new pages.

Do NOT generate any code yet. Wait for my confirmation before starting the next phase.
```

---

*Framework: Vibe Coding Pre-Build Template. This instance is fully populated with real PlacePrep content derived from an exhaustive audit of the existing codebase — no placeholder text remains.*

