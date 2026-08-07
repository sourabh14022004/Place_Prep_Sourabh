import { CompanyIntel, Question, QuestionFilter } from "./mock-data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

/**
 * Fetch all companies from Express backend with fallback handling
 */
export async function fetchCompanies(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/companies`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      return json.data;
    }
    if (Array.isArray(json)) {
      return json;
    }
    return [];
  } catch (error) {
    console.warn("Backend unavailable, using fallback company data:", error);
    return [];
  }
}

/**
 * Fetch specific company intelligence details
 */
export async function fetchCompanyIntel(slug: string): Promise<CompanyIntel | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/companies/${slug}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    if (json && json.data) {
      return json.data;
    }
    return json;
  } catch (error) {
    console.warn(`Backend unavailable for company '${slug}', using local fallback:`, error);
    return null;
  }
}

/**
 * Fetch filtered questions bank
 */
export async function fetchQuestions(filters: QuestionFilter): Promise<Question[]> {
  try {
    const params = new URLSearchParams();
    if (filters.company) params.append("company", filters.company);
    if (filters.topic) params.append("topic", filters.topic);
    if (filters.difficulty) params.append("difficulty", filters.difficulty);
    if (filters.roundType) params.append("round_type", filters.roundType);
    if (filters.search) params.append("search", filters.search);

    const res = await fetch(`${API_BASE_URL}/questions?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("Backend unavailable for questions search, using local fallback:", error);
    return [];
  }
}

/**
 * Save Student Onboarding selections to MongoDB Atlas
 */
export async function saveStudentOnboarding(data: {
  clerkUserId?: string;
  email?: string;
  name?: string;
  targetDomains?: string[];
  targetCategories?: string[];
  targetCompanies?: string[];
  prepDurationWeeks?: number;
  topicRatings?: Record<string, number>;
}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/user/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("Failed to save onboarding data to backend:", error);
    return { success: false };
  }
}

/**
 * Fetch Student Profile from MongoDB Atlas
 */
export async function fetchStudentProfile(clerkUserId?: string, email?: string): Promise<any> {
  try {
    const params = new URLSearchParams();
    if (clerkUserId) params.append("clerkUserId", clerkUserId);
    if (email) params.append("email", email);

    const res = await fetch(`${API_BASE_URL}/user/profile?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.warn("Failed to fetch student profile from backend:", error);
    return null;
  }
}

/**
 * Update Student Profile
 */
export async function updateStudentProfile(data: {
  clerkUserId?: string;
  email?: string;
  name?: string;
  phone?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  batch?: string;
  targetCompanies?: string[];
}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/user/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("Failed to update student profile:", error);
    return { success: false };
  }
}

/**
 * Mark a question as solved and earn XP
 */
export async function markQuestionSolved(data: {
  clerkUserId?: string;
  email?: string;
  questionId: string;
  xpValue?: number;
}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/user/solve-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("Failed to mark question as solved:", error);
    return { success: false };
  }
}

/**
 * Fetch College Leaderboard
 */
export async function fetchLeaderboard(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/user/leaderboard`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.warn("Failed to fetch leaderboard from backend:", error);
    return [];
  }
}
