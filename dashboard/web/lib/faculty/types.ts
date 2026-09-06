export type CompanyCategory = "maang" | "product" | "service" | "startup" | "bfsi" | "other";

export interface CompanyRanking {
  slug: string;
  name: string;
  type: string;
  category: CompanyCategory;
  alignmentScore: number;
  topTestedSubject: string;
}

export interface SubjectCoverage {
  subjectName: string;
  courseCode: string;
  coverage: {
    faang: number;
    indianProduct: number;
    indianService: number;
    startups: number;
  };
  industryDemand: "High" | "Medium" | "Low";
}

export type DoubtStatus = "pending" | "answered" | "resolved";
// Note: This DoubtTag type should stay in sync with dashboard/student-portal's DoubtTag type if/when a backend connects them.
export type DoubtTag = "DSA" | "System Design" | "LLD" | "HR" | "General" | "Web Development" | "Aptitude";

export interface DoubtReply {
  id: string;
  author: "faculty" | "student";
  authorName: string;
  body: string;
  sentAt: string;
}

export interface FacultyDoubt {
  id: string;
  studentName: string;
  studentInitials: string;
  subject: string;
  body: string;
  tag: DoubtTag;
  status: DoubtStatus;
  createdAt: string;
  replies: DoubtReply[];
}

export interface ReportHistory {
  id: string;
  name: string;
  date: string;
}

export type SessionStatus = "pending" | "confirmed" | "proposed" | "completed" | "cancelled";

export interface FacultySessionRequest {
  id: string;
  studentName: string;
  studentInitials: string;
  branch: string;
  year: string;
  topic: string;
  notes: string;
  date: string;
  time: string;
  duration: 30 | 60;
  status: SessionStatus;
  meetLink?: string;
  proposedDate?: string;
  proposedTime?: string;
}

export type AlertSeverity = "high" | "medium" | "info";

export interface TrendAlert {
  id: string;
  severity: AlertSeverity;
  timeAgo: string;
  source: string;
  headline: string;
  description: string;
  tags: string[];
}
