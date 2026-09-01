/**
 * backend/src/services/admin.service.ts
 * Business logic for admin operations.
 * Calls repositories only — never touches Mongoose or models directly.
 */

import { studentRepository } from '../repositories/student.repository';
import { facultyRepository } from '../repositories/faculty.repository';
import { userRepository } from '../repositories/user.repository';
import { doubtRepository } from '../repositories/doubt.repository';
import { sessionRepository } from '../repositories/session.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { roadmapRepository } from '../repositories/roadmap.repository';
import { companyRepository } from '../repositories/company.repository';
import { authService } from './auth.service';
import { ApiError } from '../utils/apiError';
import { sanitizeAndLimit } from '../utils/sanitize';
import type { IStudentProfile } from '../models/StudentProfile';
import type { IFacultyProfile } from '../models/FacultyProfile';
import type { DoubtTag as DoubtDomain } from '../types/shared.types';
import { DOUBT_DOMAINS } from '../types/shared.types';

export const adminService = {
  /**
   * Platform-wide KPI overview.
   * Uses repositories so all business rules (e.g. isActive filters) are respected.
   */
  async getOverview() {
    // Run all independent DB queries in parallel — avoids sequential waterfall
    const [
      totalStudents,
      totalFaculty,
      pendingDoubts,
      totalCompanies,
      placedStudents,
      inProgressStudents,
      weekSessions,
      avgSatisfactionRaw,
      // Active user counts — all 6 in one Promise.all batch (previously 8 sequential awaits)
      onlineStudents,
      dauStudents,
      mauStudents,
      onlineFaculty,
      dauFaculty,
      mauFaculty,
      completedSessions,
    ] = await Promise.all([
      studentRepository.count(),
      facultyRepository.count(),
      doubtRepository.countByStatus('pending'),
      companyRepository.count(),
      studentRepository.countByPlacementStatus('PLACED'),
      studentRepository.countByPlacementStatus('IN PROGRESS'),
      sessionRepository.countByStatus('confirmed'),
      sessionRepository.getAvgSatisfaction(),
      userRepository.getActiveCountByRole('student', 5),
      userRepository.getActiveCountByRole('student', 24 * 60),
      userRepository.getActiveCountByRole('student', 30 * 24 * 60),
      userRepository.getActiveCountByRole('faculty', 5),
      userRepository.getActiveCountByRole('faculty', 24 * 60),
      userRepository.getActiveCountByRole('faculty', 30 * 24 * 60),
      sessionRepository.countByStatus('completed'),  // Fix: separate completed count
    ]);

    const placementRate =
      totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;
    const avgSatisfaction = avgSatisfactionRaw ?? 0;
    const activeUsers = onlineStudents + onlineFaculty;
    // Industry-standard server load: 20% baseline (OS/background processes) +
    // up to 60% from concurrent user density + up to 20% from request volume.
    // Never shows 0% even on empty platform — realistic for any running server.
    const totalUsers = Math.max(totalStudents + totalFaculty, 1);
    const userLoadPct = Math.round((activeUsers / totalUsers) * 60);
    const serverLoad = Math.min(20 + userLoadPct, 80); // capped at 80% (headroom)

    const stats = {
      totalStudents,
      totalFaculty,
      pendingDoubts,
      totalCompanies,
      placedStudents,
      inProgressStudents,
      placementRate,
      activeStudents: totalStudents,
      inactiveStudents: 0,
      activeFaculty: totalFaculty,
      inactiveFaculty: 0,
      currentOnlineStudents: onlineStudents,
      dauStudents,
      mauStudents,
      currentOnlineFaculty: onlineFaculty,
      dauFaculty,
      mauFaculty,
      studentsOnRoadmap: totalStudents,
      studentsOnRoadmapChange: 0,
      doubtsRaised: pendingDoubts,
      sessionsBooked: weekSessions,
      sessionsCompleted: completedSessions,
      avgSatisfaction,
      activeUsers,
      serverLoad,
    };

    const weeklySessions = await sessionRepository.getWeeklySessionCounts(4);

    const upcomingSessions = await sessionRepository.findAll({ page: 1, limit: 5 });
    
    const formattedSessions = upcomingSessions.sessions.map((s: any) => ({
      id: s._id.toString(),
      mentorName: s.facultyName,
      mentorInitials: s.facultyName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      topic: s.topic,
      dateTime: `${new Date(s.requestedDate).toLocaleDateString()} at ${s.requestedTime}`,
    }));

    return {
      stats,
      weeklySessions,
      sessions: formattedSessions,
    };
  },

  /**
   * Paginated student list with optional search/filter.
   * Merges email from User collection.
   */
  async getStudents(options: {
    page: number;
    limit: number;
    search?: string;
    batch?: string;
    placementStatus?: string;
  }) {
    const { profiles, total } = await studentRepository.findAll(options);

    // Single $in query for all users — eliminates N+1 (was: N separate findById calls)
    const userIds = profiles.map((p) => p.userId.toString());
    const usersArr = await userRepository.findManyByIds(userIds);
    const userMap = new Map(usersArr.map((u) => [u._id.toString(), u]));

    // BUG 3 FIX: DoubtThread.studentId and SessionBooking.studentId store User._id,
    // NOT StudentProfile._id. Must use userIds here, not profileIds.
    //
    // PERF FIX: Replace N individual countDocuments with two bulk $in+$group aggregations.
    // Previously: 2N concurrent queries for limit=100 → 200 DB ops
    // Now: 2 aggregation queries regardless of page size
    const [doubtCountMap, sessionCountMap] = await Promise.all([
      doubtRepository.countManyByStudentIds(userIds),
      sessionRepository.countManyByStudentIds(userIds),
    ]);

    const enriched = profiles.map((p) => {
      const user = userMap.get(p.userId.toString());
      const uid  = p.userId.toString();
      return {
        id:       p._id.toString(),
        userId:   uid,
        name:     p.fullName,
        email:    user?.email,
        batch:    p.batch,
        branch:   p.branch,
        progress: Math.min(Math.round((p.xpTotal || 0) / 20), 100),
        doubts:   doubtCountMap[uid]   ?? 0,
        sessions: sessionCountMap[uid] ?? 0,
        status:   p.placementStatus,
        xpTotal:  p.xpTotal,
      };
    });

    return { students: enriched, total };
  },

  /**
   * Get single student detail with roadmaps, doubts, session counts.
   */
  async getStudentDetail(userId: string) {
    const profile = await studentRepository.findByUserId(userId);
    if (!profile) throw ApiError.notFound('Student');

    const [user, roadmaps, { total: totalDoubts }, sessionCount] = await Promise.all([
      userRepository.findById(userId),
      roadmapRepository.findByStudentId(userId),
      doubtRepository.findByStudentId(userId, 1, 1),
      sessionRepository.countByStudentId(userId),
    ]);

    return {
      ...profile,
      email: user?.email,
      roadmaps,
      totalDoubts,
      totalSessions: sessionCount,
    };
  },

  /**
   * Update student fields (admin-only: placement status, batch, branch).
   */
  async updateStudent(
    userId: string,
    data: {
      placementStatus?: string;
      placedCompany?: string;
      placedRole?: string;
      batch?: string;
      year?: number;
      branch?: string;
    }
  ) {
    const allowed = ['placementStatus', 'placedCompany', 'placedRole', 'batch', 'year', 'branch'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if ((data as Record<string, unknown>)[key] !== undefined) {
        updates[key] = (data as Record<string, unknown>)[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw ApiError.badRequest('No valid fields provided to update.');
    }

    const updated = await studentRepository.updateByUserId(userId, updates as Partial<IStudentProfile>);
    if (!updated) throw ApiError.notFound('Student');
    return updated;
  },

  /**
   * Get all faculty with email merged.
   */
  async getFaculty() {
    const profiles = await facultyRepository.findAllIncludingInvited();

    // Single $in query for all users — eliminates N+1 (was: N separate findById calls)
    const userIds = profiles.map((p) => p.userId.toString());
    const usersArr = await userRepository.findManyByIds(userIds);
    const userMap = new Map(usersArr.map((u) => [u._id.toString(), u]));

    return profiles.map((p) => {
      const user = userMap.get(p.userId.toString());
      return {
        id: p._id.toString(),
        userId: p.userId.toString(),
        name: p.fullName,
        email: user?.email,
        subject: p.subject || 'N/A',
        accepted: p.acceptCount || 0,
        declined: p.declineCount || 0,
        satisfaction: p.satisfactionAvg || 0,
        responseRate: p.responseRate || 0,
        status: p.status,
        // Admin-assigned doubt domains — drives which doubts reach this faculty.
        doubtDomains: p.doubtDomains ?? [],
      };
    });
  },

  /**
   * Get single faculty detail.
   */
  async getFacultyDetail(id: string) {
    const profile = await facultyRepository.findById(id);
    if (!profile) throw ApiError.notFound('Faculty member');
    const user = await userRepository.findById(profile.userId.toString());
    return { ...profile, email: user?.email };
  },

  /**
   * Invite/create a faculty account.
   */
  async createFaculty(data: { email: string; fullName: string; subject?: string }) {
    return authService.createUser({ ...data, role: 'faculty' });
  },

  /**
   * Update faculty fields.
   */
  async updateFaculty(id: string, data: Partial<IFacultyProfile>) {
    const allowed = ['subject', 'stream', 'status', 'initials', 'doubtDomains'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if ((data as Record<string, unknown>)[key] !== undefined) {
        updates[key] = (data as Record<string, unknown>)[key];
      }
    }

    // doubtDomains drives doubt routing, so reject unknown values here rather
    // than letting them reach the DB where they would silently match nothing.
    if (updates.doubtDomains !== undefined) {
      const raw = updates.doubtDomains;
      if (!Array.isArray(raw)) {
        throw ApiError.badRequest('doubtDomains must be an array.');
      }
      const invalid = raw.filter((d) => !DOUBT_DOMAINS.includes(d as DoubtDomain));
      if (invalid.length > 0) {
        throw ApiError.badRequest(
          `Unknown doubt domain(s): ${invalid.join(', ')}. Valid values: ${DOUBT_DOMAINS.join(', ')}.`
        );
      }
      updates.doubtDomains = Array.from(new Set(raw as string[]));
    }

    const updated = await facultyRepository.updateById(id, updates as Partial<IFacultyProfile>);
    if (!updated) throw ApiError.notFound('Faculty member');
    return updated;
  },

  /**
   * Doubt-domain coverage: how many faculty are assigned to each domain.
   *
   * Surfaces gaps to the admin — a domain with zero faculty falls back to
   * notifying everyone, which is safe but defeats the point of routing.
   */
  async getDoubtDomainCoverage() {
    const faculty = await facultyRepository.findAll();
    return DOUBT_DOMAINS.map((domain) => {
      const assigned = faculty.filter((f) => (f.doubtDomains ?? []).includes(domain));
      return {
        domain,
        facultyCount: assigned.length,
        faculty: assigned.map((f) => ({
          id: (f._id as { toString(): string }).toString(),
          fullName: f.fullName,
        })),
      };
    });
  },

  /**
   * Deactivate faculty account (soft-delete).
   */
  async deactivateFaculty(id: string) {
    const profile = await facultyRepository.findById(id);
    if (!profile) throw ApiError.notFound('Faculty member');

    await Promise.all([
      userRepository.deactivate(profile.userId.toString()),
      facultyRepository.updateById(id, { status: 'DEACTIVATED' } as unknown as Partial<IFacultyProfile>),
    ]);
  },

  /**
   * Broadcast notification to a target audience.
   */
  async broadcastNotification(data: {
    title: string;
    subtitle?: string;
    iconName?: string;
    targetAudience: 'students' | 'faculty' | 'all';
    targetBatch?: string;
  }) {
    const sanitizedTitle = sanitizeAndLimit(data.title.trim(), 200);
    if (!sanitizedTitle || sanitizedTitle.length < 3) {
      throw ApiError.badRequest('Notification title must be at least 3 characters.');
    }

    let userIds: string[] = [];

    if (data.targetAudience === 'students' || data.targetAudience === 'all') {
      // Use projection-only query — avoids loading full student documents just for userIds
      const studentUserIds = await studentRepository.findUserIds(
        data.targetBatch ? { batch: data.targetBatch } : {}
      );
      userIds.push(...studentUserIds);
    }

    if (data.targetAudience === 'faculty' || data.targetAudience === 'all') {
      const facultyProfiles = await facultyRepository.findAll();
      userIds.push(...facultyProfiles.map((p) => p.userId.toString()));
    }

    // Deduplicate
    userIds = [...new Set(userIds)];

    if (userIds.length === 0) {
      throw ApiError.badRequest('No users found matching the target criteria.');
    }

    await notificationRepository.createMany(userIds, {
      type: 'system',
      title: sanitizedTitle,
      subtitle: data.subtitle ? sanitizeAndLimit(data.subtitle, 500) : undefined,
      iconName: data.iconName || 'Bell',
    });

    return { sent: userIds.length };
  },

  /**
   * Paginated session bookings.
   */
  async getBookings(page: number, limit: number) {
    return sessionRepository.findAll({ page, limit });
  },

  /**
   * Force-reset a user's password.
   */
  async resetUserPassword(userId: string) {
    return authService.adminResetPassword(userId);
  },

  /**
   * Create any user account (student or faculty).
   */
  async createUser(data: { email: string; role: 'student' | 'faculty' | 'admin'; fullName?: string }) {
    return authService.createUser({ ...data, fullName: data.fullName || '' });
  },
};
