import type {
  Student, Faculty, Session, Notification, OverviewStats, WeeklySession,
  EngagementData, DoubtsData, PracticeData, PlacementData,
  LeaderboardEntry, BookingsData, SentNotification,
} from "./types";

// ─── Overview ───────────────────────────────────────────────────
export const mockOverviewStats: OverviewStats = {
  studentsOnRoadmap: 84,
  studentsOnRoadmapChange: 12,
  doubtsRaised: 210,
  sessionsBooked: 143,
  sessionsCompleted: 118,
  avgSatisfaction: 4.3,
  placementRate: 68,
  activeUsers: 1204,
  serverLoad: 14,
  // Phase 2
  totalStudents: 428,
  placedStudents: 292,
  inProgressStudents: 136,
  totalFaculty: 12,
  activeFaculty: 9,
  inactiveFaculty: 3,
  activeStudents: 312,
  inactiveStudents: 116,
  dauStudents: 187,
  dauFaculty: 7,
  mauStudents: 394,
  mauFaculty: 11,
  currentOnlineStudents: 43,
  currentOnlineFaculty: 3,
  requestsPerMinute: 0,
};

export const mockWeeklySessions: WeeklySession[] = [
  { week: "W1", count: 12 },
  { week: "W2", count: 24 },
  { week: "W3", count: 18 },
  { week: "W4", count: 42 },
  { week: "W5", count: 65 },
  { week: "W6", count: 54 },
  { week: "W7", count: 82 },
  { week: "W8", count: 112 },
];

export const mockSessions: Session[] = [
  { id: 1, mentorName: "Alice Johnson", mentorInitials: "AJ", topic: "Mock Interview: System Design", dateTime: "Today, 2:00 PM", status: "upcoming" },
  { id: 2, mentorName: "Bob Smith", mentorInitials: "BS", topic: "Resume Review Clinic", dateTime: "Today, 4:30 PM", status: "upcoming" },
  { id: 3, mentorName: "Charlie Davis", mentorInitials: "CD", topic: "Behavioral Q&A Session", dateTime: "Tomorrow, 10:00 AM", status: "upcoming" },
];

// ─── Students ───────────────────────────────────────────────────
export const mockStudents: Student[] = [
  { id: 1, name: "Arjun Sharma", batch: "2024", progress: 85, doubts: 2, sessions: 12, status: "PLACED" },
  { id: 2, name: "Meera Kapoor", batch: "2025", progress: 45, doubts: 5, sessions: 8, status: "IN PROGRESS" },
  { id: 3, name: "Rohan Desai", batch: "2024", progress: 92, doubts: 1, sessions: 15, status: "PLACED" },
  { id: 4, name: "Priya Singh", batch: "2025", progress: 30, doubts: 8, sessions: 4, status: "IN PROGRESS" },
  { id: 5, name: "Vikram Patel", batch: "2024", progress: 15, doubts: 12, sessions: 2, status: "INACTIVE" },
  { id: 6, name: "Ananya Iyer", batch: "2025", progress: 78, doubts: 4, sessions: 10, status: "IN PROGRESS" },
  { id: 7, name: "Karan Verma", batch: "2024", progress: 100, doubts: 0, sessions: 18, status: "PLACED" },
  { id: 8, name: "Sneha Reddy", batch: "2025", progress: 55, doubts: 6, sessions: 7, status: "IN PROGRESS" },
  { id: 9, name: "Amit Kumar", batch: "2023", progress: 100, doubts: 1, sessions: 20, status: "PLACED" },
  { id: 10, name: "Neha Gupta", batch: "2026", progress: 10, doubts: 3, sessions: 1, status: "IN PROGRESS" },
  { id: 11, name: "Rahul Jain", batch: "2023", progress: 90, doubts: 2, sessions: 14, status: "PLACED" },
  { id: 12, name: "Pooja Mishra", batch: "2026", progress: 20, doubts: 5, sessions: 3, status: "IN PROGRESS" },
  { id: 13, name: "Suresh Pillai", batch: "2024", progress: 88, doubts: 1, sessions: 11, status: "PLACED" },
  { id: 14, name: "Divya Das", batch: "2025", progress: 65, doubts: 4, sessions: 9, status: "IN PROGRESS" },
  { id: 15, name: "Manoj Tiwari", batch: "2023", progress: 95, doubts: 0, sessions: 16, status: "PLACED" },
  { id: 16, name: "Kavita R", batch: "2026", progress: 5, doubts: 2, sessions: 1, status: "IN PROGRESS" },
  { id: 17, name: "Nitin B", batch: "2024", progress: 75, doubts: 3, sessions: 10, status: "PLACED" },
  { id: 18, name: "Asha K", batch: "2025", progress: 50, doubts: 7, sessions: 6, status: "IN PROGRESS" },
  { id: 19, name: "Vikas M", batch: "2023", progress: 85, doubts: 2, sessions: 12, status: "PLACED" },
  { id: 20, name: "Rita P", batch: "2026", progress: 15, doubts: 4, sessions: 2, status: "IN PROGRESS" },
  { id: 21, name: "Ajay S", batch: "2024", progress: 10, doubts: 10, sessions: 1, status: "INACTIVE" },
  { id: 22, name: "Riya V", batch: "2025", progress: 80, doubts: 3, sessions: 11, status: "IN PROGRESS" },
  { id: 23, name: "Ravi D", batch: "2023", progress: 92, doubts: 1, sessions: 15, status: "PLACED" },
  { id: 24, name: "Sonia G", batch: "2026", progress: 25, doubts: 5, sessions: 4, status: "IN PROGRESS" },
  { id: 25, name: "Vijay N", batch: "2024", progress: 82, doubts: 2, sessions: 13, status: "PLACED" },
  { id: 26, name: "Tara S", batch: "2025", progress: 70, doubts: 4, sessions: 10, status: "IN PROGRESS" },
  { id: 27, name: "Anil C", batch: "2023", progress: 98, doubts: 0, sessions: 19, status: "PLACED" },
  { id: 28, name: "Bina R", batch: "2026", progress: 30, doubts: 6, sessions: 5, status: "IN PROGRESS" },
  { id: 29, name: "Sunil K", batch: "2024", progress: 0, doubts: 0, sessions: 0, status: "INACTIVE" },
  { id: 30, name: "Geeta M", batch: "2025", progress: 60, doubts: 5, sessions: 8, status: "IN PROGRESS" },
  { id: 31, name: "Raj P", batch: "2023", progress: 89, doubts: 1, sessions: 14, status: "PLACED" },
  { id: 32, name: "Simran K", batch: "2026", progress: 35, doubts: 4, sessions: 6, status: "IN PROGRESS" },
  { id: 33, name: "Prem T", batch: "2024", progress: 91, doubts: 2, sessions: 16, status: "PLACED" },
  { id: 34, name: "Lata S", batch: "2025", progress: 72, doubts: 3, sessions: 10, status: "IN PROGRESS" },
  { id: 35, name: "Dev A", batch: "2023", progress: 96, doubts: 0, sessions: 17, status: "PLACED" },
  { id: 36, name: "Mira B", batch: "2026", progress: 40, doubts: 5, sessions: 7, status: "IN PROGRESS" },
  { id: 37, name: "Gopal V", batch: "2024", progress: 87, doubts: 2, sessions: 12, status: "PLACED" },
  { id: 38, name: "Nisha D", batch: "2025", progress: 68, doubts: 4, sessions: 9, status: "IN PROGRESS" },
  { id: 39, name: "Hari R", batch: "2023", progress: 94, doubts: 1, sessions: 15, status: "PLACED" },
  { id: 40, name: "Jaya L", batch: "2026", progress: 45, doubts: 6, sessions: 8, status: "IN PROGRESS" },
];

// ─── Faculty ────────────────────────────────────────────────────
export const mockFaculty: Faculty[] = [
  { id: 1, name: "Dr. Alan Mathison", initials: "AM", subject: "Data Science", accepted: 45, declined: 2, satisfaction: 4.2, responseRate: 87, status: "ACTIVE", email: "alan@university.edu", stream: "Computer Science" },
  { id: 2, name: "Prof. Sarah Jenkins", initials: "SJ", subject: "Machine Learning", accepted: 32, declined: 8, satisfaction: 4.9, responseRate: 94, status: "ACTIVE", email: "s.jenkins@university.edu", stream: "Mathematics" },
  { id: 3, name: "Dr. Marcus Reed", initials: "MR", subject: "Web Development", accepted: 18, declined: 15, satisfaction: 2.5, responseRate: 42, status: "INACTIVE", email: "m.reed@university.edu", stream: "Software Engineering" },
  { id: 4, name: "Prof. Elena Lopez", initials: "EL", subject: "System Design", accepted: 56, declined: 4, satisfaction: 4.8, responseRate: 91, status: "ACTIVE", email: "elena.l@university.edu", stream: "Data Science" },
  { id: 5, name: "Dr. Rachel Green", initials: "RG", subject: "Algorithms", accepted: 41, declined: 5, satisfaction: 4.5, responseRate: 88, status: "ACTIVE", email: "r.green@university.edu", stream: "Machine Learning" },
  { id: 6, name: "Dr. Sheldon Cooper", initials: "SC", subject: "Database Mgmt", accepted: 29, declined: 12, satisfaction: 3.9, responseRate: 76, status: "PENDING", email: "s.cooper@university.edu", stream: "Quantitative Analysis" },
  { id: 7, name: "Prof. John Doe", initials: "JD", subject: "Cloud Computing", accepted: 50, declined: 1, satisfaction: 4.9, responseRate: 98, status: "ACTIVE", email: "j.doe@university.edu", stream: "Cybersecurity" },
  { id: 8, name: "Dr. Emily Brown", initials: "EB", subject: "DevOps", accepted: 38, declined: 3, satisfaction: 4.6, responseRate: 90, status: "ACTIVE", email: "e.brown@university.edu", stream: "Cloud Computing" },
  { id: 9, name: "Dr. Michael Chen", initials: "MC", subject: "AI & Deep Learning", accepted: 44, declined: 2, satisfaction: 4.7, responseRate: 95, status: "ACTIVE", email: "m.chen@university.edu", stream: "Artificial Intelligence" },
  { id: 10, name: "Prof. Lisa Wong", initials: "LW", subject: "Frontend Engineering", accepted: 35, declined: 7, satisfaction: 4.3, responseRate: 83, status: "ACTIVE", email: "l.wong@university.edu", stream: "Web Development" },
  { id: 11, name: "Dr. David Smith", initials: "DS", subject: "Backend Systems", accepted: 42, declined: 4, satisfaction: 4.4, responseRate: 86, status: "ACTIVE", email: "d.smith@university.edu", stream: "Database Systems" },
  { id: 12, name: "Prof. James Wilson", initials: "JW", subject: "Networks", accepted: 28, declined: 9, satisfaction: 3.8, responseRate: 72, status: "INACTIVE", email: "j.wilson@university.edu", stream: "Computer Networks" },
];

// ─── Notifications ──────────────────────────────────────────────
export const mockNotifications: Notification[] = [
  { id: 1, title: "New Student Registration", message: "Arjun Sharma has registered for the 2024 batch.", time: "5 minutes ago", isRead: false, type: "info" },
  { id: 2, title: "Session Cancelled", message: "Dr. Marcus Reed cancelled his Web Dev session scheduled for tomorrow.", time: "1 hour ago", isRead: false, type: "alert" },
  { id: 3, title: "Faculty Invite Accepted", message: "Prof. James Wilson has accepted the faculty invitation.", time: "3 hours ago", isRead: false, type: "success" },
  { id: 4, title: "Placement Update", message: "Batch 2023 placement rate has crossed 90%!", time: "Yesterday", isRead: true, type: "success" },
  { id: 5, title: "System Maintenance", message: "Scheduled downtime on July 5th, 2:00 AM - 4:00 AM IST.", time: "2 days ago", isRead: true, type: "info" },
];

// ─── Phase 2: Engagement ────────────────────────────────────────
const last30Days = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2025, 5, i + 2);
  return d.toISOString().split("T")[0];
});

export const mockEngagementData: EngagementData = {
  dailyActive: last30Days.map((date, i) => ({
    date,
    students: 120 + Math.floor(Math.sin(i * 0.4) * 40 + Math.random() * 30),
    faculty: 5 + Math.floor(Math.random() * 5),
  })),
  currentOnline: { students: 43, faculty: 3 },
  monthlyActive: [
    { month: "Jan", students: 280, faculty: 9 },
    { month: "Feb", students: 310, faculty: 10 },
    { month: "Mar", students: 340, faculty: 11 },
    { month: "Apr", students: 295, faculty: 8 },
    { month: "May", students: 360, faculty: 11 },
    { month: "Jun", students: 394, faculty: 11 },
    { month: "Jul", students: 412, faculty: 12 },
  ],
  hourlyHeatmap: Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const isPeak = hour >= 19 && hour <= 23;
      const isMorning = hour >= 9 && hour <= 12;
      return {
        day, hour,
        count: isPeak ? 30 + Math.floor(Math.random() * 60) :
               isMorning ? 10 + Math.floor(Math.random() * 30) :
               Math.floor(Math.random() * 15),
      };
    })
  ).flat(),
};

// ─── Phase 2: Doubts Intelligence ──────────────────────────────
export const mockDoubtsData: DoubtsData = {
  summary: { totalRaised: 1842, totalResolved: 1614, resolutionRate: 87.6, avgResolutionHours: 6.4 },
  timeline: [
    { period: "Jan", raised: 210, resolved: 188 },
    { period: "Feb", raised: 245, resolved: 220 },
    { period: "Mar", raised: 198, resolved: 175 },
    { period: "Apr", raised: 312, resolved: 278 },
    { period: "May", raised: 287, resolved: 260 },
    { period: "Jun", raised: 334, resolved: 298 },
    { period: "Jul", raised: 256, resolved: 195 },
  ],
  byBatch: [
    { batch: "2023", raised: 312, resolved: 298 },
    { batch: "2024", raised: 487, resolved: 432 },
    { batch: "2025", raised: 634, resolved: 556 },
    { batch: "2026", raised: 409, resolved: 328 },
  ],
  byFaculty: [
    { facultyId: 9, name: "Dr. Michael Chen", resolved: 312, rate: 96.2 },
    { facultyId: 4, name: "Prof. Elena Lopez", resolved: 289, rate: 94.8 },
    { facultyId: 7, name: "Prof. John Doe", resolved: 265, rate: 98.1 },
    { facultyId: 5, name: "Dr. Rachel Green", resolved: 241, rate: 91.3 },
    { facultyId: 2, name: "Prof. Sarah Jenkins", resolved: 198, rate: 88.7 },
    { facultyId: 8, name: "Dr. Emily Brown", resolved: 176, rate: 90.2 },
    { facultyId: 1, name: "Dr. Alan Mathison", resolved: 133, rate: 85.4 },
  ],
  bySubject: [
    { subject: "DSA", count: 642 },
    { subject: "DBMS", count: 389 },
    { subject: "OS", count: 287 },
    { subject: "System Design", count: 234 },
    { subject: "CN", count: 178 },
    { subject: "Others", count: 112 },
  ],
  hourlyPattern: Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => ({
      day, hour,
      count: hour >= 20 && hour <= 23 ? 20 + Math.floor(Math.random() * 50) :
             hour >= 9 && hour <= 12 ? 5 + Math.floor(Math.random() * 20) :
             Math.floor(Math.random() * 10),
    }))
  ).flat(),
};

// ─── Phase 2: Practice Zone ────────────────────────────────────
export const mockPracticeData: PracticeData = {
  summary: { totalSolved: 28_420, activeSolversToday: 94, topDomain: "DSA" },
  byDomain: [
    { domain: "DSA", questionsSolved: 12_480, uniqueStudents: 318 },
    { domain: "DBMS", questionsSolved: 6_240, uniqueStudents: 224 },
    { domain: "OS", questionsSolved: 4_120, uniqueStudents: 198 },
    { domain: "System Design", questionsSolved: 2_890, uniqueStudents: 156 },
    { domain: "CN", questionsSolved: 1_840, uniqueStudents: 134 },
    { domain: "Aptitude", questionsSolved: 850, uniqueStudents: 87 },
  ],
  batchDomainMatrix: [
    { batch: "2023", domains: { DSA: 3840, DBMS: 1920, OS: 1280, "System Design": 1200, CN: 640, Aptitude: 240 } },
    { batch: "2024", domains: { DSA: 4200, DBMS: 2100, OS: 1400, "System Design": 960, CN: 700, Aptitude: 320 } },
    { batch: "2025", domains: { DSA: 3120, DBMS: 1560, OS: 1040, "System Design": 480, CN: 340, Aptitude: 200 } },
    { batch: "2026", domains: { DSA: 1320, DBMS: 660, OS: 400, "System Design": 250, CN: 160, Aptitude: 90 } },
  ],
  dailySolvers: last30Days.map((date, i) => ({
    date,
    uniqueSolvers: 60 + Math.floor(Math.sin(i * 0.5) * 20 + Math.random() * 25),
  })),
};

// ─── Phase 2: Placement Tracker ───────────────────────────────
export const mockPlacementData: PlacementData = {
  companyInterest: [
    { company: "Google", studentCount: 187 },
    { company: "Microsoft", studentCount: 156 },
    { company: "Amazon", studentCount: 143 },
    { company: "Flipkart", studentCount: 128 },
    { company: "Infosys", studentCount: 112 },
    { company: "TCS", studentCount: 98 },
    { company: "Wipro", studentCount: 87 },
    { company: "Accenture", studentCount: 76 },
    { company: "Deloitte", studentCount: 62 },
    { company: "Capgemini", studentCount: 54 },
  ],
  batchPlacementRate: [
    { batch: "2023", rate: 91, placed: 91, total: 100 },
    { batch: "2024", rate: 68, placed: 78, total: 115 },
    { batch: "2025", rate: 24, placed: 34, total: 142 },
    { batch: "2026", rate: 0, placed: 0, total: 71 },
  ],
  assignmentSolveRate: [
    { period: "Week 1", rate: 72, completed: 308, assigned: 428 },
    { period: "Week 2", rate: 78, completed: 334, assigned: 428 },
    { period: "Week 3", rate: 65, completed: 278, assigned: 428 },
    { period: "Week 4", rate: 81, completed: 347, assigned: 428 },
    { period: "Week 5", rate: 74, completed: 317, assigned: 428 },
    { period: "Week 6", rate: 83, completed: 355, assigned: 428 },
    { period: "Week 7", rate: 79, completed: 339, assigned: 428 },
    { period: "Week 8", rate: 86, completed: 368, assigned: 428 },
  ],
};

// ─── Phase 2: Leaderboard ──────────────────────────────────────
export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, studentId: 7, name: "Karan Verma", batch: "2024", xp: 9840, tasksCompleted: 142, doubtsRaised: 0, initials: "KV" },
  { rank: 2, studentId: 27, name: "Anil C", batch: "2023", xp: 8760, tasksCompleted: 131, doubtsRaised: 0, initials: "AC" },
  { rank: 3, studentId: 3, name: "Rohan Desai", batch: "2024", xp: 8210, tasksCompleted: 124, doubtsRaised: 1, initials: "RD" },
  { rank: 4, studentId: 35, name: "Dev A", batch: "2023", xp: 7840, tasksCompleted: 118, doubtsRaised: 0, initials: "DA" },
  { rank: 5, studentId: 15, name: "Manoj Tiwari", batch: "2023", xp: 7320, tasksCompleted: 112, doubtsRaised: 0, initials: "MT" },
  { rank: 6, studentId: 9, name: "Amit Kumar", batch: "2023", xp: 6890, tasksCompleted: 108, doubtsRaised: 1, initials: "AK" },
  { rank: 7, studentId: 23, name: "Ravi D", batch: "2023", xp: 6440, tasksCompleted: 104, doubtsRaised: 1, initials: "RD" },
  { rank: 8, studentId: 39, name: "Hari R", batch: "2023", xp: 5970, tasksCompleted: 98, doubtsRaised: 1, initials: "HR" },
  { rank: 9, studentId: 33, name: "Prem T", batch: "2024", xp: 5480, tasksCompleted: 93, doubtsRaised: 2, initials: "PT" },
  { rank: 10, studentId: 13, name: "Suresh Pillai", batch: "2024", xp: 4930, tasksCompleted: 88, doubtsRaised: 1, initials: "SP" },
];

// ─── Phase 2: Slot Bookings ────────────────────────────────────
export const mockBookingsData: BookingsData = {
  summary: { today: 12, thisWeek: 67, thisMonth: 287 },
  byBatch: [
    { batch: "2023", upcoming: 18, completed: 94, cancelled: 4 },
    { batch: "2024", upcoming: 24, completed: 112, cancelled: 7 },
    { batch: "2025", upcoming: 31, completed: 134, cancelled: 12 },
    { batch: "2026", upcoming: 14, completed: 42, cancelled: 6 },
  ],
  dailyTrend: last30Days.map((date, i) => ({
    date,
    count: 4 + Math.floor(Math.sin(i * 0.6) * 5 + Math.random() * 8),
  })),
  topFaculty: [
    { facultyId: 7, name: "Prof. John Doe", bookings: 89 },
    { facultyId: 4, name: "Prof. Elena Lopez", bookings: 76 },
    { facultyId: 9, name: "Dr. Michael Chen", bookings: 71 },
    { facultyId: 5, name: "Dr. Rachel Green", bookings: 64 },
    { facultyId: 2, name: "Prof. Sarah Jenkins", bookings: 58 },
  ],
};

// ─── Phase 2: Sent Notifications ──────────────────────────────
export const mockSentNotifications: SentNotification[] = [
  { id: 1, title: "System Maintenance Tonight", message: "Scheduled downtime from 2:00 AM – 4:00 AM IST. Please save your work.", target: "all", sentAt: "2025-07-01T18:00:00Z", status: "sent" },
  { id: 2, title: "New DSA Module Available", message: "The Advanced DSA module is now live on your dashboard. Start practicing!", target: "students", sentAt: "2025-06-28T10:30:00Z", status: "sent" },
  { id: 3, title: "Monthly Review Reminder", message: "Kindly complete your student performance reviews by July 5th.", target: "faculty", sentAt: "2025-06-25T09:00:00Z", status: "sent" },
];
