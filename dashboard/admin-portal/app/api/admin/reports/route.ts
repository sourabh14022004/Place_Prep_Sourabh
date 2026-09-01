/**
 * dashboard/admin-portal/app/api/admin/reports/route.ts
 * GET /api/admin/reports?type=<apiType>&format=csv
 *
 * apiType values (kebab-case, matches frontend):
 *   student-performance | faculty-engagement | system-utilization
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { checkRateLimit, getClientIp, RATE_LIMITS } from 'placeprep-backend/src/utils/rateLimiter';
import StudentProfile from 'placeprep-backend/src/models/StudentProfile';
import FacultyProfile from 'placeprep-backend/src/models/FacultyProfile';
import User from 'placeprep-backend/src/models/User';

/** Escape a CSV cell value — wrap in quotes and escape inner quotes */
function csvCell(val: unknown): string {
  const s = val === null || val === undefined ? '' : String(val);
  return `"${s.replace(/"/g, '""')}"`;
}

const ALLOWED_TYPES = new Set(['student-performance', 'faculty-engagement', 'system-utilization']);

export async function GET(request: NextRequest) {
  // Rate limit: CSV exports scan full collections, protect from spam
  const ip = getClientIp(request);
  const rl = checkRateLimit(`reports:${ip}`, RATE_LIMITS.WRITE); // 20/min
  if (!rl.allowed) {
    return new NextResponse('Rate limit exceeded. Try again shortly.', { status: 429 });
  }

  try {
    await connectDB();
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type')?.toLowerCase().trim() ?? '';

    // Allowlist validation — prevents enumeration attacks
    if (!ALLOWED_TYPES.has(type)) {
      return new NextResponse(
        JSON.stringify({ error: `Invalid report type. Allowed: ${[...ALLOWED_TYPES].join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let csvContent = '';
    let filename = 'report.csv';

    if (type === 'student-performance') {
      // Fetch student profiles — select only fields needed for the report
      const students = await StudentProfile
        .find({})
        .select('fullName batch branch xpTotal placementStatus placedCompany placedRole')
        .lean<{
          _id: unknown; fullName: string; batch: string; branch: string;
          xpTotal: number; placementStatus: string; placedCompany?: string; placedRole?: string;
        }[]>();

      csvContent = 'Name,Batch,Branch,XP Total,Progress %,Placement Status,Placed Company,Placed Role\n';
      students.forEach((s) => {
        const progress = Math.min(Math.round((s.xpTotal || 0) / 20), 100);
        csvContent += [
          csvCell(s.fullName),
          csvCell(s.batch),
          csvCell(s.branch),
          csvCell(s.xpTotal ?? 0),
          csvCell(`${progress}%`),
          csvCell(s.placementStatus),
          csvCell(s.placedCompany ?? ''),
          csvCell(s.placedRole ?? ''),
        ].join(',') + '\n';
      });
      filename = `student_performance_${new Date().toISOString().slice(0, 10)}.csv`;

    } else if (type === 'faculty-engagement') {
      const faculty = await FacultyProfile
        .find({})
        .select('fullName subject stream status acceptCount declineCount satisfactionAvg responseRate')
        .lean<{
          _id: unknown; fullName: string; subject: string; stream: string;
          status: string; acceptCount: number; declineCount: number;
          satisfactionAvg: number; responseRate: number;
        }[]>();

      csvContent = 'Name,Subject,Stream,Status,Sessions Accepted,Sessions Declined,Avg Satisfaction,Response Rate %\n';
      faculty.forEach((f) => {
        csvContent += [
          csvCell(f.fullName),
          csvCell(f.subject ?? ''),
          csvCell(f.stream ?? ''),
          csvCell(f.status),
          csvCell(f.acceptCount ?? 0),
          csvCell(f.declineCount ?? 0),
          csvCell(f.satisfactionAvg?.toFixed(2) ?? '0'),
          csvCell(`${f.responseRate ?? 0}%`),
        ].join(',') + '\n';
      });
      filename = `faculty_engagement_${new Date().toISOString().slice(0, 10)}.csv`;

    } else if (type === 'system-utilization') {
      // Privacy-safe: export aggregate stats by role, NOT individual user emails
      const [totalStudents, activeStudents, totalFaculty, activeFaculty, totalAdmins] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'student', isActive: true }),
        User.countDocuments({ role: 'faculty' }),
        User.countDocuments({ role: 'faculty', isActive: true }),
        User.countDocuments({ role: 'admin' }),
      ]);

      const reportDate = new Date().toISOString();
      csvContent = 'Metric,Value\n';
      csvContent += `Report Generated,${csvCell(reportDate)}\n`;
      csvContent += `Total Students,${csvCell(totalStudents)}\n`;
      csvContent += `Active Students,${csvCell(activeStudents)}\n`;
      csvContent += `Inactive Students,${csvCell(totalStudents - activeStudents)}\n`;
      csvContent += `Total Faculty,${csvCell(totalFaculty)}\n`;
      csvContent += `Active Faculty,${csvCell(activeFaculty)}\n`;
      csvContent += `Inactive Faculty,${csvCell(totalFaculty - activeFaculty)}\n`;
      csvContent += `Total Admins,${csvCell(totalAdmins)}\n`;
      csvContent += `Total Platform Users,${csvCell(totalStudents + totalFaculty + totalAdmins)}\n`;
      filename = `system_utilization_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('CSV Export Error:', error);
    return new NextResponse('Error generating report. Please try again.', { status: 500 });
  }
}
