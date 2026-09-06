import connectDB from '../../../../../config/db';
import { requireStudent } from '../../../../../utils/authMiddleware';
import { studentService } from '../../../../../services/student.service';
import { successResponse } from '../../../../../utils/apiResponse';
import { handleApiError } from '../../../../../utils/apiError';

export async function POST(request: Request): Promise<Response> {
  try {
    await connectDB();
    const user = await requireStudent(request);
    const result = await studentService.resetRoadmap(user.userId);
    return successResponse(result, { message: 'Roadmap reset successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}
