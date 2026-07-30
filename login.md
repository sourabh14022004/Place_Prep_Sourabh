## Don't remove it 

Click any of the 1-Click Auto Login buttons on the screen or enter:
🎓 Student: `student@newtonschool.co / Student123#`
👨‍🏫 Faculty: `faculty@newtonschool.co / faculty123`
🛡️ Admin: `admin@newtonschool.co / admin123`

# 🔐 PlacePrep Clerk Authentication

All portal access is managed natively via **Clerk Authentication**.

### How Portal Access Works:
1. **Dedicated Central Auth Portal (`auth-portal`)**:
   - Local: `http://localhost:3003/login`
   - Production (Deployed): `https://<your-auth-portal-url>.vercel.app/login`
2. The auth-portal inspects your Clerk User metadata (`role`: `student`, `faculty`, or `admin`) or registered email pattern:
   - 🎓 **Student**: Automatically routes to **Student Portal** (`http://localhost:3000/dashboard`)
   - 👨‍🏫 **Faculty**: Automatically routes to **Faculty Portal** (`http://localhost:3001/`)
   - 🛡️ **Admin**: Automatically routes to **Admin Portal** (`http://localhost:3002/overview`)
3. **Role Protection**: Server Middleware and Client `RoleGuard` in each portal prevent unauthorized cross-portal access.

### Environment Variables for Deployment:
Set `NEXT_PUBLIC_AUTH_PORTAL_URL` in the 3 functional portals.
Set `NEXT_PUBLIC_STUDENT_PORTAL_URL`, `NEXT_PUBLIC_FACULTY_PORTAL_URL`, and `NEXT_PUBLIC_ADMIN_PORTAL_URL` in `auth-portal`.

---

### Managing User Roles in Clerk Dashboard:
To set a specific user's role, go to [dashboard.clerk.com](https://dashboard.clerk.com/), select the user, and set `publicMetadata` or `unsafeMetadata`:
```json
{
  "role": "student" // or "faculty", "admin"
}
```