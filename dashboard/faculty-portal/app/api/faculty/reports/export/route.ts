/**
 * dashboard/faculty-portal/app/api/faculty/reports/export/route.ts
 * POST /api/faculty/reports/export — generates a CSV report.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { featureFlagService } from 'placeprep-backend/src/services/featureFlag.service';
import { requireFaculty } from 'placeprep-backend/src/utils/authMiddleware';
import { facultyService } from 'placeprep-backend/src/services/faculty.service';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
  await featureFlagService.assertEnabled('faculty.reports');
    await requireFaculty(request);
    
    const body = await request.json();
    const { sections } = body;

    let csvContent = "NST PlacePrep Portal - Curriculum Intelligence Report\n";
    csvContent += `Generated At,${new Date().toISOString()}\n\n`;

    if (sections.gapMatrix || sections.subjectBreakdown) {
      const curriculumGap = await facultyService.getCurriculumGap();
      csvContent += "=== Curriculum Gap Matrix ===\n";
      csvContent += "Subject,Course Code,Alignment %,Status,Topics Covered\n";
      curriculumGap.subjects.forEach((sub: any) => {
        csvContent += `"${sub.subjectName}","${sub.courseCode}",${sub.alignment},"${sub.status}","${sub.topics.join(', ')}"\n`;
      });
      csvContent += "\n";
    }

    if (sections.companyRankings) {
      const rankings = await facultyService.getCompanyRankings();
      csvContent += "=== Company Rankings ===\n";
      csvContent += "Company Name,Category,Top Tested Subject,Alignment Score,Student Interest Count\n";
      rankings.forEach((r: any) => {
        csvContent += `"${r.name}","${r.category}","${r.topTestedSubject}",${r.alignmentScore},${r.studentCount}\n`;
      });
      csvContent += "\n";
    }

    if (sections.industryTrends) {
      const trends = await facultyService.getIndustryTrends();
      csvContent += "=== Industry Trends ===\n";
      csvContent += "Trend,Severity,Source,Detected At\n";
      trends.forEach((t: any) => {
        csvContent += `"${t.trend}","${t.severity}","${t.source}","${t.detectedAt}"\n`;
      });
      csvContent += "\n";
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="report_export.csv"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
