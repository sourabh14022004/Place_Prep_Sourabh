Click any of the 1-Click Auto Login buttons on the screen or enter:
🎓 Student: `student@newtonschool.co / Student123#`
👨‍🏫 Faculty: `faculty@newtonschool.co / faculty123`
🛡️ Admin: `admin@newtonschool.co / admin123`

# 🔐 PlacePrep Clerk Authentication

All portal access is managed natively via **Clerk Authentication**.

### How Portal Access Works:
1. **Single Central Login URL**: Use `http://localhost:3000/login` to sign in regardless of your role.
2. The login system inspects your Clerk User metadata (`role`: `student`, `faculty`, or `admin`) or registered email pattern:
   - 🎓 **Student**: Automatically routes to **Student Portal** (`http://localhost:3000/dashboard` or `/onboarding`)
   - 👨‍🏫 **Faculty**: Automatically routes to **Faculty Portal** (`http://localhost:3001/`)
   - 🛡️ **Admin**: Automatically routes to **Admin Portal** (`http://localhost:3002/overview`)
3. **Role Protection**: Server Middleware and Client `RoleGuard` prevent cross-portal access (e.g. Students cannot access Faculty or Admin URLs).

---

### Managing User Roles in Clerk Dashboard:
To set a specific user's role, go to [dashboard.clerk.com](https://dashboard.clerk.com/), select the user, and set `publicMetadata` or `unsafeMetadata`:
```json
{
  "role": "student" // or "faculty", "admin"
}
```