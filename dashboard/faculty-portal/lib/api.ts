const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

/**
 * Fetch Faculty Profile from MongoDB Atlas
 */
export async function fetchFacultyProfile(clerkUserId?: string, email?: string): Promise<any> {
  try {
    const params = new URLSearchParams();
    if (clerkUserId) params.append("clerkUserId", clerkUserId);
    if (email) params.append("email", email);

    const res = await fetch(`${API_BASE_URL}/faculty/profile?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.warn("Failed to fetch faculty profile from backend:", error);
    return null;
  }
}

/**
 * Update Faculty Profile in MongoDB Atlas
 */
export async function updateFacultyProfile(data: {
  clerkUserId?: string;
  email?: string;
  name?: string;
  title?: string;
  experience?: string;
  campus?: string;
  department?: string;
  employeeId?: string;
  joined?: string;
  expertises?: string[];
  officeHours?: any;
}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/faculty/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("Failed to update faculty profile:", error);
    return { success: false };
  }
}

/**
 * Fetch All Faculty Members
 */
export async function fetchFacultyList(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/faculty/all`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.warn("Failed to fetch faculty list from backend:", error);
    return [];
  }
}
