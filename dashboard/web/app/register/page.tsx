/**
 * dashboard/student-portal/app/register/page.tsx
 * Registration page — redirects to login since accounts are created by admin.
 */

import { redirect } from 'next/navigation';

export default function RegisterPage() {
  redirect('/login');
}
