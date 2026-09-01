// Canonical role list — no mongoose dependency so it's safe to import
// in Next.js "use client" components via placeprep-backend/src/constants/roles.
export const TARGET_ROLES = [
  'SDE-1', 'SDE-2', 'SDE-3',
  'Data Analyst', 'Product Manager',
  'DevOps', 'ML Engineer', 'QA',
] as const;

export type TargetRole = typeof TARGET_ROLES[number];
