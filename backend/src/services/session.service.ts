/**
 * backend/src/services/session.service.ts
 * Business logic for session bookings — creates Jitsi links on confirmation.
 */

import { sessionRepository } from '../repositories/session.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { facultyRepository } from '../repositories/faculty.repository';
import { notificationService } from './notification.service';
import { ApiError } from '../utils/apiError';
import type { BookSessionInput } from '../validators/session.validator';

function generateJitsiLink(sessionId: string): string {
  return `https://meet.jit.si/NST-PlacePrep-${sessionId}`;
}

export const sessionService = {
  async bookSession(
    studentId: string,
    studentName: string,
    data: BookSessionInput
  ) {
    const facultyProfile = await facultyRepository.findByUserId(data.facultyId);
    const facultyName = facultyProfile?.fullName || 'Faculty';

    const session = await sessionRepository.create({
      studentId: studentId as never,
      studentName,
      facultyId: data.facultyId as never,
      facultyName,
      topic: data.topic,
      notes: data.notes,
      requestedDate: data.requestedDate,
      requestedTime: data.requestedTime,
      durationMin: data.durationMin,
      status: 'pending',
    });

    // Notify faculty
    await notificationRepository.create({
      userId: data.facultyId,
      type: 'session',
      title: 'New Session Request',
      subtitle: `${studentName} wants to discuss: ${data.topic.slice(0, 60)}`,
      iconName: 'Calendar',
    });

    // Notify all admins — fire-and-forget so it never blocks the response
    notificationService.notifyAdmins({
      type: 'session',
      title: 'New Session Request',
      subtitle: `${studentName} requested a session on: ${data.topic.slice(0, 60)}`,
      iconName: 'Calendar',
    }).catch(() => {});

    return session;
  },

  async getStudentSessions(studentId: string) {
    return sessionRepository.findByStudentId(studentId);
  },

  async getFacultySessions(facultyId: string, status?: string) {
    return sessionRepository.findByFacultyId(facultyId, status);
  },

  async confirmSession(sessionId: string, facultyId: string) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw ApiError.notFound('Session');
    if (session.facultyId.toString() !== facultyId) throw ApiError.forbidden();

    const meetLink = generateJitsiLink(sessionId);
    const updated = await sessionRepository.updateById(sessionId, {
      status: 'confirmed',
      meetLink,
    });

    // Increment accept count for faculty
    await facultyRepository.incrementAccept(facultyId);

    // Notify student
    await notificationRepository.create({
      userId: session.studentId.toString(),
      type: 'session',
      title: 'Session Confirmed',
      subtitle: `Your session on "${session.topic.slice(0, 50)}" has been confirmed.`,
      iconName: 'CheckCircle',
    });

    // Notify admins
    notificationService.notifyAdmins({
      type: 'session',
      title: 'Session Confirmed',
      subtitle: `${session.studentName} ↔ ${session.facultyName}: "${session.topic.slice(0, 50)}"`,
      iconName: 'CheckCircle',
    }).catch(() => {});

    return updated;
  },

  async declineSession(sessionId: string, facultyId: string) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw ApiError.notFound('Session');
    if (session.facultyId.toString() !== facultyId) throw ApiError.forbidden();

    await facultyRepository.incrementDecline(facultyId);
    const updated = await sessionRepository.updateById(sessionId, {
      status: 'cancelled',
    });

    await notificationRepository.create({
      userId: session.studentId.toString(),
      type: 'session',
      title: 'Session Declined',
      subtitle: `"${session.topic.slice(0, 50)}" could not be scheduled. Try another time.`,
      iconName: 'XCircle',
    });

    // Notify admins
    notificationService.notifyAdmins({
      type: 'session',
      title: 'Session Declined',
      subtitle: `${session.facultyName} declined ${session.studentName}'s session request.`,
      iconName: 'XCircle',
    }).catch(() => {});

    return updated;
  },

  async proposeAlternative(
    sessionId: string,
    facultyId: string,
    proposedDate: string,
    proposedTime: string
  ) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw ApiError.notFound('Session');
    if (session.facultyId.toString() !== facultyId) throw ApiError.forbidden();

    const updated = await sessionRepository.updateById(sessionId, {
      status: 'proposed',
      proposedDate,
      proposedTime,
    });

    await notificationRepository.create({
      userId: session.studentId.toString(),
      type: 'session',
      title: 'Alternative Time Proposed',
      subtitle: `Faculty suggested ${proposedDate} at ${proposedTime} for your session.`,
      iconName: 'Clock',
    });

    return updated;
  },

  /**
   * Mark a session completed. SECURITY: callerId (when provided) must be the
   * session's student — prevents one student from mutating another's booking.
   */
  async completeSession(sessionId: string, rating?: number, callerId?: string) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw ApiError.notFound('Session');
    if (callerId && session.studentId.toString() !== callerId) throw ApiError.forbidden();

    return sessionRepository.updateById(sessionId, {
      status: 'completed',
      ...(rating && { studentFeedbackRating: rating }),
    });
  },

  /** Student accepts a faculty-proposed alternative time → confirm with meet link.
   *  SECURITY: studentId must own this booking. */
  async acceptProposal(sessionId: string, studentId: string) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw ApiError.notFound('Session');
    if (session.studentId.toString() !== studentId) throw ApiError.forbidden('You can only manage your own sessions.');

    const meetLink = generateJitsiLink(sessionId);
    const updated = await sessionRepository.updateById(sessionId, {
      status: 'confirmed',
      meetLink,
      // Move proposed time to actual scheduled time
      ...(session.proposedDate && { requestedDate: session.proposedDate }),
      ...(session.proposedTime && { requestedTime: session.proposedTime }),
    });

    await notificationRepository.create({
      userId: session.facultyId.toString(),
      type: 'session',
      title: 'Proposal Accepted',
      subtitle: `Student accepted your proposed time for "${session.topic.slice(0, 50)}".`,
      iconName: 'CheckCircle',
    });

    return updated;
  },

  /** Student cancels their own session request.
   *  SECURITY: studentId must own this booking. */
  async cancelSession(sessionId: string, studentId: string) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw ApiError.notFound('Session');
    if (session.studentId.toString() !== studentId) throw ApiError.forbidden('You can only cancel your own sessions.');

    return sessionRepository.updateById(sessionId, { status: 'cancelled' });
  },
};
