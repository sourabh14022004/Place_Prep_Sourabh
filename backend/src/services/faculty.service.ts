/**
 * backend/src/services/faculty.service.ts
 * Business logic for faculty operations.
 * Calls repositories only — never touches Mongoose directly.
 */

import { facultyRepository } from '../repositories/faculty.repository';
import { doubtRepository } from '../repositories/doubt.repository';
import { sessionRepository } from '../repositories/session.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { studentRepository } from '../repositories/student.repository';
import { questionRepository } from '../repositories/question.repository';
import { roadmapRepository } from '../repositories/roadmap.repository';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/apiError';
import { sanitizeAndLimit } from '../utils/sanitize';
import mongoose from 'mongoose';
import CurriculumTopic from '../models/CurriculumTopic';
import { DOUBT_DOMAINS } from '../types/shared.types';

/**
 * Resolve the doubt-visibility scope for one faculty member.
 *
 * Returns their admin-assigned domains plus the set of "uncovered" domains
 * (those with zero assigned faculty anywhere), which stay visible to everyone
 * so an admin gap can't strand a student's doubt. Both lists are needed by
 * every doubtRepository.findByFacultyId call, so this is the single place that
 * derives them — keeping the dashboard, list and stats views consistent.
 */
async function resolveDoubtScope(
  facultyUserId: string
): Promise<{ domains: string[]; unscopedTags: string[] }> {
  const [profile, covered] = await Promise.all([
    facultyRepository.findByUserId(facultyUserId),
    facultyRepository.findCoveredDoubtDomains(),
  ]);
  const coveredSet = new Set(covered);
  return {
    domains: profile?.doubtDomains ?? [],
    unscopedTags: DOUBT_DOMAINS.filter((d) => !coveredSet.has(d)),
  };
}

export const facultyService = {
  /**
   * Get faculty dashboard stats: pending doubts, upcoming sessions, recent activity.
   */
  async getDashboard(facultyUserId: string) {
    // Scope must resolve before the doubt queries so both see the same domains.
    const { domains, unscopedTags } = await resolveDoubtScope(facultyUserId);

    const [profile, pendingDoubts, allDoubts, pendingSessions, confirmedSessions, allStudents, heatmap] = await Promise.all([
      facultyRepository.findByUserId(facultyUserId),
      doubtRepository.findByFacultyId(facultyUserId, 'pending', domains, unscopedTags),
      doubtRepository.findByFacultyId(facultyUserId, undefined, domains, unscopedTags),
      sessionRepository.getFacultySessionsByStatus(facultyUserId, 'pending'),
      sessionRepository.getFacultySessionsByStatus(facultyUserId, 'confirmed'),
      studentRepository.findAllSimple(), // Just to get a count, though this might be heavy if many students
      this.getFacultyActivityHeatmap(facultyUserId)
    ]);

    if (!profile) {
      throw ApiError.notFound('Faculty profile not found.');
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const resolvedDoubts = allDoubts.filter(d => d.status === 'resolved');
    const doubtsSolvedThisMonth = resolvedDoubts.filter(d => d.resolvedAt && new Date(d.resolvedAt) >= currentMonthStart).length;

    const totalAssignedDoubts = allDoubts.length;
    const resolutionRate = totalAssignedDoubts > 0 ? Math.round((resolvedDoubts.length / totalAssignedDoubts) * 100) : 100;

    // isLive: if active within the last 10 minutes
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const isLive = profile.lastActiveAt ? new Date(profile.lastActiveAt) >= tenMinsAgo : false;

    return {
      faculty: {
        fullName: profile.fullName,
        initials: profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
        subject: profile.subject,
        stream: profile.stream || 'Technology',
        status: 'Active',
        acceptCount: profile.acceptCount,
        declineCount: profile.declineCount,
      },
      stats: {
        pendingSessions: pendingSessions.length,
        confirmedSessions: confirmedSessions.length,
        totalDoubts: allDoubts.length,
        unansweredDoubts: pendingDoubts.length,
        studentsAssigned: allStudents.length,
        avgResponseTimeHours: 2.5, // Mock for now unless tracked
        doubtsSolvedThisMonth,
        resolutionRate,
        isLive,
      },
      upcomingSessions: confirmedSessions.slice(0, 5),
      pendingDoubts: pendingDoubts.slice(0, 5),
      heatmap,
    };
  },

  /**
   * Get all doubt threads visible to this faculty member — scoped to the
   * doubt domains an admin assigned them, plus any uncovered domains.
   */
  async getDoubts(facultyUserId: string, status?: string) {
    const { domains, unscopedTags } = await resolveDoubtScope(facultyUserId);
    return doubtRepository.findByFacultyId(facultyUserId, status, domains, unscopedTags);
  },

  /**
   * Reply to a doubt thread.
   * Validates ownership, sanitizes input, updates status, notifies student.
   */
  async replyToDoubt(
    doubtId: string,
    facultyUserId: string,
    facultyName: string,
    body: string
  ) {
    const thread = await doubtRepository.findById(doubtId);
    if (!thread) throw ApiError.notFound('Doubt thread not found.');

    // Only block if explicitly assigned to a DIFFERENT faculty.
    const assignedId = thread.assignedFacultyId?.toString();
    if (assignedId && assignedId !== facultyUserId) {
      throw ApiError.forbidden('This doubt is assigned to another faculty member.');
    }

    // Open-pool doubts are now domain-scoped, so authorization has to match
    // visibility: without this check a faculty member could reply to a doubt
    // outside their domains by POSTing the id directly, even though the list
    // endpoint would never show it to them.
    if (!assignedId) {
      const { domains, unscopedTags } = await resolveDoubtScope(facultyUserId);
      const canReply = domains.includes(thread.tag) || unscopedTags.includes(thread.tag);
      if (!canReply) {
        throw ApiError.forbidden(
          `This doubt is outside your assigned domains. Ask an admin to add "${thread.tag}" to your profile.`
        );
      }
    }

    const sanitizedBody = sanitizeAndLimit(body, 5000);
    if (!sanitizedBody) throw ApiError.badRequest('Reply body cannot be empty.');

    const updated = await doubtRepository.addReply(doubtId, {
      authorId: facultyUserId,
      authorName: facultyName,
      authorRole: 'faculty',
      body: sanitizedBody,
    });

    // Notify student
    notificationRepository
      .create({
        userId: thread.studentId.toString(),
        type: 'doubt',
        title: 'Your doubt has been answered',
        subtitle: `${facultyName} replied to: ${thread.subject.slice(0, 60)}`,
        iconName: 'MessageSquare',
      })
      .catch(() => {}); // non-blocking

    return updated;
  },

  /**
   * Mark a doubt thread as resolved.
   */
  async resolveDoubt(doubtId: string, facultyUserId: string) {
    const thread = await doubtRepository.findById(doubtId);
    if (!thread) throw ApiError.notFound('Doubt thread not found.');

    const assignedId = thread.assignedFacultyId?.toString();
    if (assignedId && assignedId !== facultyUserId) {
      throw ApiError.forbidden('You do not have permission to resolve this doubt.');
    }

    return doubtRepository.updateStatus(doubtId, 'resolved');
  },

  /**
   * Get student matrix: all students with their stats.
   */
  async getStudentsMatrix() {
    const students = await studentRepository.findAllSimple();

    // Enrich with doubt and session counts per student
    const enriched = await Promise.all(
      students.map(async (s) => {
        const userId = s.userId?.toString() || (s._id as mongoose.Types.ObjectId).toString();
        const [openDoubts, sessionCount] = await Promise.all([
          doubtRepository.countByStudentIdAndStatus(userId, 'pending'),
          sessionRepository.countByStudentId(userId),
        ]);

        // Generate some realistic stats based on the xpTotal
        const xp = s.xpTotal || 0;
        const totalSolved = Math.floor(xp / 10);
        
        // Pseudo-random but consistent stats based on user ID length and xp (Fallback)
        const seed = userId.length + xp;
        
        // Use actual self ratings if available, otherwise fallback to seed logic
        const ratings = s.topicSelfRatings as any; // Map or object
        const getScore = (key: string, fb: number) => {
          if (!ratings) return fb;
          let val = typeof ratings.get === 'function' ? ratings.get(key) : ratings[key];
          return val !== undefined ? Math.min(100, Math.max(0, val * 20)) : fb;
        };
        
        const dsa = getScore('Data Structures', 40 + (seed % 60));
        const sysdesign = getScore('System Design', 30 + ((seed * 2) % 70));
        const webdev = getScore('Web Development', 50 + ((seed * 3) % 50));
        const dbms = getScore('DBMS', 45 + ((seed * 4) % 55));
        const cloud = getScore('Cloud Computing', 20 + ((seed * 5) % 80));

        const sessions = await sessionRepository.findByStudentId(userId);
        let recentMocks = sessions.filter(s => s.status === 'confirmed').slice(0, 2).map(s => ({
            topic: s.topic || 'Mock Interview',
            score: 3.5 + ((seed % 15) / 10), // We don't track score yet, so mock score for the real session
            date: new Date(s.requestedDate).toISOString().split('T')[0]
        }));
        
        // If they have no real sessions, provide an empty array to reflect reality
        if (recentMocks.length === 0) {
           recentMocks = [];
        }
        
        const rankChangeNum = (seed % 5) - 2; // -2 to +2
        const rankChange = rankChangeNum > 0 ? `↑ ${rankChangeNum}` : rankChangeNum < 0 ? `↓ ${Math.abs(rankChangeNum)}` : "—";

        return {
          studentId: s.userId || userId,
          userId,
          fullName: s.fullName,
          branch: s.branch,
          year: s.year,
          xpTotal: s.xpTotal,
          placementStatus: s.placementStatus,
          openDoubts,
          sessionCount,
          totalSolved,
          rankChange,
          subjectBreakdown: { dsa, sysdesign, webdev, dbms, cloud },
          recentMocks,
          lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * ((seed % 72) + 1)).toISOString()
        };
      })
    );

    return enriched;
  },

  /**
   * Get faculty's own profile with stats.
   */
  async getProfile(facultyUserId: string) {
    const profile = await facultyRepository.findByUserId(facultyUserId);
    if (!profile) throw ApiError.notFound('Faculty profile not found.');

    const user = await userRepository.findById(facultyUserId);

    // Count stats for profile — same domain scope as the doubts list, so the
    // numbers here match what the faculty member can actually open.
    const scope = await resolveDoubtScope(facultyUserId);
    const allDoubts = await doubtRepository.findByFacultyId(
      facultyUserId,
      undefined,
      scope.domains,
      scope.unscopedTags
    );
    const resolvedDoubts = allDoubts.filter(d => d.status === 'resolved');
    const allSessions = await sessionRepository.getFacultySessionsByStatus(facultyUserId, 'confirmed');

    // Calculate unique students mentored
    const uniqueStudentIds = new Set<string>();
    allDoubts.forEach(d => {
      if (d.studentId) uniqueStudentIds.add(d.studentId.toString());
    });
    allSessions.forEach(s => {
      if (s.studentId) uniqueStudentIds.add(s.studentId.toString());
    });

    let placementRate = 85; // Default fallback
    if (uniqueStudentIds.size > 0) {
      const allStudents = await studentRepository.findAllSimple();
      const studentMap = new Map(allStudents.map(s => [(s.userId?.toString() || s._id.toString()), s]));
      
      let placedCount = 0;
      let validMentored = 0;
      uniqueStudentIds.forEach(id => {
        const student = studentMap.get(id);
        if (student) {
          validMentored++;
          if (student.placementStatus === 'PLACED') placedCount++;
        }
      });
      if (validMentored > 0) placementRate = Math.round((placedCount / validMentored) * 100);
    }

    // Dynamic recent activity
    const merged = [
      ...resolvedDoubts.map(d => ({ title: `Resolved doubt: ${d.subject.substring(0, 30)}`, time: d.resolvedAt ?? d.createdAt })),
      ...allSessions.map(s => ({ title: `Hosted session: ${s.topic.substring(0, 30)}`, time: s.createdAt }))
    ]
      .filter(m => m.time)
      .sort((a, b) => new Date(b.time!).getTime() - new Date(a.time!).getTime())
      .slice(0, 5);

    return {
      ...profile,
      email: user?.email || '',
      stats: {
        studentsMentored: uniqueStudentIds.size,
        mockInterviews: allSessions.length,
        placementRate,
        rating: profile.satisfactionAvg || 4.8,
      },
      recentActivity: merged
    };
  },

  /**
   * Update faculty's own profile.
   */
  async updateProfile(
    facultyUserId: string,
    data: { 
      subject?: string; stream?: string; avatarUrl?: string; 
      fullName?: string; title?: string; department?: string; 
      email?: string; experience?: string; campus?: string; 
      employeeId?: string; joinedDate?: string; expertises?: string[]; 
    }
  ) {
    const sanitized: any = {
      subject: data.subject ? sanitizeAndLimit(data.subject, 200) : undefined,
      stream: data.stream ? sanitizeAndLimit(data.stream, 200) : undefined,
      avatarUrl: data.avatarUrl,
      fullName: data.fullName ? sanitizeAndLimit(data.fullName, 100) : undefined,
      title: data.title ? sanitizeAndLimit(data.title, 100) : undefined,
      department: data.department ? sanitizeAndLimit(data.department, 100) : undefined,
      experience: data.experience ? sanitizeAndLimit(data.experience, 100) : undefined,
      campus: data.campus ? sanitizeAndLimit(data.campus, 100) : undefined,
      employeeId: data.employeeId ? sanitizeAndLimit(data.employeeId, 100) : undefined,
      joinedDate: data.joinedDate ? sanitizeAndLimit(data.joinedDate, 100) : undefined,
      expertises: data.expertises && Array.isArray(data.expertises) ? data.expertises.map(e => sanitizeAndLimit(e, 50)) : undefined,
    };

    // Remove undefined fields
    Object.keys(sanitized).forEach(key => sanitized[key] === undefined && delete sanitized[key]);

    const updated = await facultyRepository.updateByUserId(facultyUserId, sanitized);
    if (!updated) throw ApiError.notFound('Faculty profile not found.');

    if (data.email) {
      // Production verification logic would normally trigger an email verification here.
      // For now, we update it directly to keep it in sync.
      await userRepository.updateEmail(facultyUserId, data.email);
    }

    return updated;
  },

  /**
   * Get curriculum coverage gap analysis.
   * Compares CurriculumTopic collection against interview question topic frequency.
   * Returns { subjects: [], hasData: false } when no curriculum data has been imported.
   */
  async getCurriculumGap() {
    const nameToSlug = (name: string) =>
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const curriculumTopics = await CurriculumTopic.find({}).lean<Array<{
      courseName: string; semester: number; topicSlug: string;
      taughtDepth: number; hoursAllocated: number;
    }>>();

    if (curriculumTopics.length === 0) {
      return { subjects: [], hasData: false };
    }

    // Aggregate question topic counts, keyed by slug
    const questions = await questionRepository.findAll({ limit: 2000 });
    const slugCounts: Record<string, number> = {};
    let totalTopicMentions = 0;
    for (const q of questions) {
      for (const topic of q.topics) {
        const slug = nameToSlug(topic);
        slugCounts[slug] = (slugCounts[slug] || 0) + 1;
        totalTopicMentions++;
      }
    }

    // Threshold: a topic mentioned this many times is "fully relevant"
    const uniqueTopicCount = Math.max(1, Object.keys(slugCounts).length);
    const avgCount = totalTopicMentions / uniqueTopicCount;
    const threshold = Math.max(3, Math.round(avgCount / 2));

    // Group by courseName
    const courseMap = new Map<string, { semester: number; topics: Array<{ slug: string; depth: number }> }>();
    for (const ct of curriculumTopics) {
      if (!courseMap.has(ct.courseName)) {
        courseMap.set(ct.courseName, { semester: ct.semester, topics: [] });
      }
      courseMap.get(ct.courseName)!.topics.push({ slug: ct.topicSlug, depth: ct.taughtDepth });
    }

    // alignment = mean( min(1, qCount/threshold) * depth/5 ) * 100, per course
    const subjects = Array.from(courseMap.entries())
      .map(([courseName, { semester, topics }]) => {
        const scores = topics.map(({ slug, depth }) =>
          Math.min(1, (slugCounts[slug] ?? 0) / threshold) * (depth / 5)
        );
        const alignment = scores.length > 0
          ? Math.min(100, Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 100))
          : 0;
        const status = alignment >= 75 ? 'Aligned' : alignment >= 40 ? 'Moderate' : 'Critical';
        return { courseName, semester, alignment, status, topicCount: topics.length };
      })
      .sort((a, b) => a.semester - b.semester || a.courseName.localeCompare(b.courseName));

    return { subjects, hasData: true };
  },

  /**
   * Company rankings by student roadmap interest count.
   */
  async getCompanyRankings(options?: { timeframe?: string, search?: string }) {
    let roadmaps = await roadmapRepository.findAll();

    const companyCount: Record<string, number> = {};
    for (const r of roadmaps) {
      const slug = r.companySlug;
      if (options?.search && !slug.toLowerCase().includes(options.search.toLowerCase())) continue;
      companyCount[slug] = (companyCount[slug] || 0) + 1;
    }

    // Fallback if no roadmaps exist yet (for new deployments)
    if (Object.keys(companyCount).length === 0) {
      const defaultCompanies = ['google', 'amazon', 'microsoft', 'meta', 'apple', 'netflix', 'uber', 'airbnb', 'stripe', 'plaid'];
      defaultCompanies.forEach((c, i) => {
         if (!options?.search || c.includes(options.search.toLowerCase())) {
             companyCount[c] = 50 - (i * 3);
         }
      });
    }

    return Object.entries(companyCount)
      .map(([companySlug, studentCount]) => {
         const seed = companySlug.length + studentCount;
         const categories = ['maang', 'product', 'service', 'startup'];
         const category = categories[seed % categories.length];
         const subjects = ['Data Structures', 'System Design', 'Web Development', 'DBMS', 'Cloud Computing'];
         const topTestedSubject = subjects[(seed * 2) % subjects.length];
         const alignmentScore = Math.min(100, Math.max(20, 30 + (seed % 70)));
         
         const name = companySlug.charAt(0).toUpperCase() + companySlug.slice(1);
         return { name, slug: companySlug, studentCount, category, topTestedSubject, alignmentScore, hiringStatus: 'Active' };
      })
      .sort((a, b) => b.alignmentScore - a.alignmentScore)
      .slice(0, 15);
  },

  async getLeaderboard(options?: { timeframe?: string, search?: string }) {
    let faculties = await facultyRepository.findAll();
    
    if (options?.search) {
      const q = options.search.toLowerCase();
      faculties = faculties.filter(f => f.fullName.toLowerCase().includes(q) || (f.department && f.department.toLowerCase().includes(q)));
    }

    // Uncovered domains are the same for everyone, so resolve once rather than
    // per faculty inside the map below.
    const covered = new Set(await facultyRepository.findCoveredDoubtDomains());
    const unscopedTags = DOUBT_DOMAINS.filter((d) => !covered.has(d));

    const leaderboard = await Promise.all(faculties.map(async (f) => {
       const [doubts, sessions] = await Promise.all([
         doubtRepository.findByFacultyId(
           f.userId?.toString() || (f._id as mongoose.Types.ObjectId).toString(),
           undefined,
           f.doubtDomains ?? [],
           unscopedTags
         ),
         sessionRepository.findByFacultyId(f.userId?.toString() || (f._id as mongoose.Types.ObjectId).toString())
       ]);
       
       const doubtsSolved = doubts.filter(d => d.status === 'resolved').length;
       const uniqueStudents = new Set<string>();
       doubts.forEach(d => { if (d.studentId) uniqueStudents.add(d.studentId.toString()); });
       sessions.forEach(s => { if (s.studentId) uniqueStudents.add(s.studentId.toString()); });
       
       const menteeCount = uniqueStudents.size;
       const studentRating = f.satisfactionAvg || 4.5;
       const totalScore = (doubtsSolved * 10) + (menteeCount * 5) + (studentRating * 20);
       
       return {
         id: f.userId?.toString() || (f._id as mongoose.Types.ObjectId).toString(),
         name: f.fullName,
         department: f.department || f.subject || 'Engineering',
         title: f.title || 'Faculty',
         doubtsSolved,
         studentRating,
         menteeCount,
         totalScore,
         isCurrentUser: false // populated by frontend check against actual user
       };
    }));

    return leaderboard
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 50)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        prevRank: index + 1 + ((entry.totalScore % 3) - 1) // slightly jittered for demo
      }));
  },

  /**
   * Get faculty activity heatmap data for the past 365 days.
   */
  async getFacultyActivityHeatmap(facultyUserId: string) {
    const scope = await resolveDoubtScope(facultyUserId);
    const allDoubts = await doubtRepository.findByFacultyId(
      facultyUserId,
      undefined,
      scope.domains,
      scope.unscopedTags
    );
    const resolvedDoubts = allDoubts.filter(d => d.status === 'resolved' && d.resolvedAt);

    // Create a 365-day array
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const oneYearAgo = new Date(now.getTime() - 364 * 24 * 60 * 60 * 1000);

    const dateCounts: Record<string, number> = {};

    resolvedDoubts.forEach(d => {
      if (d.resolvedAt) {
        const dDate = new Date(d.resolvedAt);
        dDate.setHours(0, 0, 0, 0);
        if (dDate >= oneYearAgo) {
          const dateStr = dDate.toISOString().split('T')[0];
          dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
        }
      }
    });

    const heatmapData: number[] = [];
    let maxStreak = 0;
    let currentStreak = 0;
    let activeDays = 0;

    for (let i = 0; i < 364; i++) {
      const d = new Date(oneYearAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const count = dateCounts[dateStr] || 0;
      
      // Determine level based on count
      let level = 0;
      if (count > 0) {
        activeDays++;
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;

        if (count >= 5) level = 4;
        else if (count >= 3) level = 3;
        else if (count >= 2) level = 2;
        else level = 1;
      } else {
        currentStreak = 0;
        level = 0;
      }
      
      heatmapData.push(level);
    }

    return {
      heatmapData,
      activeDays,
      maxStreak,
    };
  },

  /**
   * Returns real topic-demand signals derived from verified questions in the DB.
   * Sorted by aggregate frequencyScore so topics companies weight highly appear first.
   * No fabricated percentage deltas or hardcoded source strings.
   * Returns [] when no verified questions with topics exist → empty state fires.
   */
  async getIndustryTrends() {
    const rows = await questionRepository.getTopicDemandSignals();
    if (rows.length === 0) return [];

    return rows.map((r, i) => {
      const severity: 'High' | 'Medium' | 'Low' =
        r.hotCount > 0      ? 'High'   :
        r.companyCount >= 3 ? 'Medium' : 'Low';

      const source = r.companies.filter(Boolean).slice(0, 2).join(', ') || 'Multiple companies';

      return {
        id:         `topic-${i}`,
        trend:      `${r.topic} — ${r.questionCount.toLocaleString()} questions across ${r.companyCount} companies`,
        severity,
        source,
        detectedAt: new Date().toISOString(),
      };
    });
  },
};
