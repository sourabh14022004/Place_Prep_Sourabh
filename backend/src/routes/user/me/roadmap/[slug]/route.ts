import connectDB from '../../../../../config/db';
import { requireStudent } from '../../../../../utils/authMiddleware';
import { studentService } from '../../../../../services/student.service';
import { successResponse } from '../../../../../utils/apiResponse';
import { handleApiError } from '../../../../../utils/apiError';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
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
