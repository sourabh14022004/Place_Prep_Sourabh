Click any of the 1-Click Auto Login buttons on the screen or enter:
🎓 Student: `student@newtonschool.co / Student123#`
👨‍🏫 Faculty: `faculty@newtonschool.co / faculty123`
🛡️ Admin: `admin@newtonschool.co / admin123`

# 🔐 PlacePrep Clerk Authentication

All portal access is managed natively via **Clerk Authentication**.

### How Portal Access Works:
1. **Single Central Login URL**:
   - Local: `http://localhost:3000/login`
   - Production (Deployed): `https://place-prep-sourabh.vercel.app/login`
2. The login system inspects your Clerk User metadata (`role`: `student`, `faculty`, or `admin`) or registered email pattern:
   - 🎓 **Student**: Automatically routes to **Student Portal** (`/dashboard` or `/onboarding`)
   - 👨‍🏫 **Faculty**: Automatically routes to **Faculty Portal** (`NEXT_PUBLIC_FACULTY_PORTAL_URL` or `http://localhost:3001/`)
   - 🛡️ **Admin**: Automatically routes to **Admin Portal** (`NEXT_PUBLIC_ADMIN_PORTAL_URL` or `http://localhost:3002/overview`)
3. **Role Protection**: Server Middleware and Client `RoleGuard` prevent cross-portal access (e.g. Students cannot access Faculty or Admin URLs).

### Environment Variables for Deployment:
Set these environment variables on Vercel for cross-portal redirection:
- `NEXT_PUBLIC_STUDENT_PORTAL_URL`: `https://place-prep-sourabh.vercel.app`
- `NEXT_PUBLIC_FACULTY_PORTAL_URL`: `https://place-prep-faculty-portal-gkw93ncxs-sourabh14022004s-projects.vercel.app/`
- `NEXT_PUBLIC_ADMIN_PORTAL_URL`: `https://place-prep-admin-portal-okbo5332j-sourabh14022004s-projects.vercel.app/`

---

### Managing User Roles in Clerk Dashboard:
To set a specific user's role, go to [dashboard.clerk.com](https://dashboard.clerk.com/), select the user, and set `publicMetadata` or `unsafeMetadata`:
```json
{
  "role": "student" // or "faculty", "admin"
}
```