/**
 * POST /api/sessions/book
 * Student books a 1:1 session with a faculty member.
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAuth } from 'placeprep-backend/src/utils/authMiddleware';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError, ApiError } from 'placeprep-backend/src/utils/apiError';
import SessionBooking from 'placeprep-backend/src/models/SessionBooking';
import StudentProfile from 'placeprep-backend/src/models/StudentProfile';
import FacultyProfile from 'placeprep-backend/src/models/FacultyProfile';
import Notification from 'placeprep-backend/src/models/Notification';
import { checkRateLimit, RATE_LIMITS } from 'placeprep-backend/src/utils/rateLimiter';
import { isValidObjectId, toObjectId } from 'placeprep-backend/src/utils/objectid';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.role !== 'student') return handleApiError(new ApiError('Students only', 403, 'FORBIDDEN'));

    await connectDB();

    // Spam guard: max 5 bookings per hour per student — prevents slot-flooding
    // that would spam faculty with notifications.
    const rl = checkRateLimit(`book:${auth.userId}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 });
    if (!rl.allowed) {
      return handleApiError(new ApiError('You are booking too many sessions. Please try again later.', 429, 'RATE_LIMITED'));
    }

    const body = await req.json();
    const { facultyId, topic, notes, requestedDate, requestedTime, durationMin } = body;

    if (!facultyId || !topic || !requestedDate || !requestedTime) {
      return handleApiError(new ApiError('facultyId, topic, requestedDate, and requestedTime are required', 400, 'BAD_REQUEST'));
    }

    if (!isValidObjectId(facultyId)) {
      return handleApiError(new ApiError('Invalid facultyId', 400, 'BAD_REQUEST'));
    }

    // requestedDate must be a REAL date in the future
    const parsedDate = new Date(requestedDate);
    if (isNaN(parsedDate.getTime())) {
      return handleApiError(new ApiError('requestedDate must be a valid date.', 400, 'BAD_REQUEST'));
    }
    if (parsedDate.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      return handleApiError(new ApiError('Please choose a future date for your session.', 400, 'BAD_REQUEST'));
    }

    // Verify faculty exists
    const faculty = await FacultyProfile.findOne({ userId: facultyId });
    if (!faculty) return handleApiError(new ApiError('Faculty not found', 404, 'NOT_FOUND'));

    // Get student profile for name
    const student = await StudentProfile.findOne({ userId: auth.userId });
    if (!student) return handleApiError(new ApiError('Student profile not found', 404, 'NOT_FOUND'));

    // Prevent duplicate booking for same slot
    const existing = await SessionBooking.findOne({
      facultyId,
      requestedDate: new Date(requestedDate),
      requestedTime,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (existing) {
      return handleApiError(new ApiError('This slot is already booked. Please choose another time.', 409, 'CONFLICT'));
    }

    const booking = await SessionBooking.create({
      studentId: auth.userId,
      facultyId,
      topic: topic.trim().slice(0, 200),
      notes: notes ? notes.trim().slice(0, 500) : undefined,
      requestedDate: new Date(requestedDate),
      requestedTime,
      durationMin: durationMin || 30,
      status: 'pending',
    });

    // Notify the faculty
    await Notification.create({
      userId: faculty.userId,
      type: 'session',
      title: 'New Session Request',
      subtitle: `${student.fullName} wants a session: "${topic.slice(0, 60)}"`,
      iconName: 'Calendar',
      isRead: false,
    });

    return NextResponse.json(successResponse({ booking }, { message: 'Session booked successfully', status: 201 }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
