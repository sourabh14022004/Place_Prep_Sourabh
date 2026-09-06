/**
 * dashboard/student-portal/app/api/messages/faculty/route.ts
 * GET /api/messages/faculty — list all faculty the student has messaged (inbox sidebar)
 */
import connectDB from '../../../config/db';
import { featureFlagService } from '../../../services/featureFlag.service';
import { requireStudent } from '../../../utils/authMiddleware';
import { successResponse } from '../../../utils/apiResponse';
import { handleApiError } from '../../../utils/apiError';
import Message from '../../../models/Message';
import FacultyProfile from '../../../models/FacultyProfile';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();
    await featureFlagService.assertEnabled('student.faculty_connect');
    await featureFlagService.assertEnabled('student.messages');
    const student = await requireStudent(request);
    const studentId = student.userId;

    // Get most recent message per faculty for this student.
    // Exact-match $in on known conversationIds — index-friendly and avoids
    // building a regex from an interpolated id.
    const allFaculty = await FacultyProfile.find({})
      .select('userId fullName subject title')
      .lean();
    const conversationIds = allFaculty.map((fp) => `${studentId}_${String(fp.userId)}`);

    const messages = await Message.find({
      conversationId: { $in: conversationIds },
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    // Build a map: facultyId → last message
    const lastMsgMap = new Map<string, typeof messages[0]>();
    for (const msg of messages) {
      const parts = (msg.conversationId as string).split('_');
      const facultyId = parts[1];
      if (facultyId && !lastMsgMap.has(facultyId)) {
        lastMsgMap.set(facultyId, msg);
      }
    }

    // Fetch all faculty profiles happens above (needed for conversation ids).

    // Unread count per faculty
    const unreadAgg = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          senderRole: 'faculty',
          seen: false,
        },
      },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } },
    ]);
    const unreadByFaculty = new Map<string, number>();
    for (const row of unreadAgg) {
      const parts = (row._id as string).split('_');
      unreadByFaculty.set(parts[1], row.count);
    }

    const facultyList = allFaculty.map((fp) => {
      const facultyUserId = String(fp.userId);
      const lastMsg = lastMsgMap.get(facultyUserId);
      const initials = (fp.fullName as string)
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return {
        id: facultyUserId,
        name: fp.fullName,
        initials,
        subject: fp.subject ?? 'Placement Mentor',
        online: false,
        lastMessage: lastMsg?.body ?? '',
        lastAt: lastMsg?.createdAt ?? new Date(0),
        unread: unreadByFaculty.get(facultyUserId) ?? 0,
      };
    });

    // Sort: faculty with conversations first, then by most recent message
    facultyList.sort((a, b) => {
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
    });

    return successResponse({ faculty: facultyList });
  } catch (error) {
    return handleApiError(error);
  }
}
