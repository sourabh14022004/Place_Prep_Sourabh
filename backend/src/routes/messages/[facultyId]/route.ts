/**
 * dashboard/student-portal/app/api/messages/[facultyId]/route.ts
 * GET  /api/messages/:facultyId — fetch conversation with a specific faculty
 * POST /api/messages/:facultyId — send a message to a specific faculty
 *
 * Security:
 * - facultyId must be a valid ObjectId AND belong to an existing faculty user
 * - message bodies hard-capped at 2000 chars (storage/notification abuse guard)
 * - sends rate-limited per student (WRITE profile)
 */
import connectDB from '../../../config/db';
import { featureFlagService } from '../../../services/featureFlag.service';
import { requireStudent } from '../../../utils/authMiddleware';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError, ApiError } from '../../../utils/apiError';
import Message from '../../../models/Message';
import User from '../../../models/User';
import { checkRateLimit, RATE_LIMITS } from '../../../utils/rateLimiter';
import { isValidObjectId, toObjectId } from '../../../utils/objectid';

type RouteContext = { params: Promise<{ facultyId: string }> };

const MAX_MESSAGE_LENGTH = 2000;

/** Validate the path param is a real, active faculty user id. */
async function assertValidFaculty(facultyId: string): Promise<void> {
  if (!isValidObjectId(facultyId)) {
    throw ApiError.badRequest('Invalid faculty id.');
  }
  const faculty = await User.findOne({ _id: facultyId, role: 'faculty', isActive: true })
    .select('_id')
    .lean();
  if (!faculty) throw ApiError.notFound('Faculty');
}

export async function GET(request: Request, { params }: RouteContext): Promise<Response> {
  try {
    await connectDB();
    await featureFlagService.assertEnabled('student.faculty_connect');
    await featureFlagService.assertEnabled('student.messages');
    const student = await requireStudent(request);
    const { facultyId } = await params;
    await assertValidFaculty(facultyId);
    const conversationId = `${student.userId}_${facultyId}`;

    // Mark faculty messages as seen
    await Message.updateMany(
      { conversationId, senderRole: 'faculty', seen: false },
      { seen: true }
    );

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(200) // cap history payload per request
      .lean();

    const formatted = messages.map((m) => ({
      id: String(m._id),
      senderId: m.senderRole === 'student' ? 'student' : 'faculty',
      body: m.body,
      sentAt: m.createdAt,
      seen: m.seen,
    }));

    return successResponse({ messages: formatted });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext): Promise<Response> {
  try {
    await connectDB();
    await featureFlagService.assertEnabled('student.faculty_connect');
    await featureFlagService.assertEnabled('student.messages');
    const student = await requireStudent(request);
    const { facultyId } = await params;

    // Spam guard: max 20 messages/min per student
    const rl = checkRateLimit(`msg:${student.userId}`, RATE_LIMITS.WRITE);
    if (!rl.allowed) {
      return Response.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'You are sending messages too quickly.' } },
        { status: 429 }
      );
    }

    await assertValidFaculty(facultyId);

    const body = await request.json().catch(() => null);
    const text = typeof body?.body === 'string' ? body.body.trim() : '';
    if (!text) {
      return Response.json({ error: 'Message body is required' }, { status: 400 });
    }

    const conversationId = `${student.userId}_${facultyId}`;
    const message = await Message.create({
      conversationId,
      senderId: toObjectId(student.userId),
      senderRole: 'student',
      body: text.slice(0, MAX_MESSAGE_LENGTH),
      seen: false,
    });

    return successResponse(
      {
        id: String(message._id),
        senderId: 'student',
        body: message.body,
        sentAt: message.createdAt,
        seen: false,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
