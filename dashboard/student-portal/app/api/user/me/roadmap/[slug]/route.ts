import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireStudent } from 'placeprep-backend/src/utils/authMiddleware';
import { studentService } from 'placeprep-backend/src/services/student.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    await connectDB();
    const auth = await requireStudent(request);
    const { slug } = await params;
    
    await studentService.deleteRoadmap(auth.userId, slug);
    
    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
