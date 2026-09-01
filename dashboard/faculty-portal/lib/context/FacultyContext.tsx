"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Minimal faculty shape used by context consumers
export interface FacultyMember {
  id: string;
  name: string;
  subjects: string[];
  doubtsSolvedThisMonth: number;
  doubtsSolvedAllTime: number;
}

// Default placeholder — real data comes from /api/faculty/dashboard via SWR
const DEFAULT_FACULTY: FacultyMember = {
  id: "current",
  name: "Faculty",
  subjects: [],
  doubtsSolvedThisMonth: 0,
  doubtsSolvedAllTime: 0,
};

interface FacultyContextType {
  facultyMembers: FacultyMember[];
  currentFaculty: FacultyMember;
  updateFacultySolvedCount: (facultyId: string) => void;
}

const FacultyContext = createContext<FacultyContextType | undefined>(undefined);

export function FacultyProvider({ children }: { children: ReactNode }) {
  const [facultyMembers, setFacultyMembers] = useState<FacultyMember[]>([DEFAULT_FACULTY]);

  const currentFaculty = facultyMembers[0] ?? DEFAULT_FACULTY;

  const updateFacultySolvedCount = (facultyId: string) => {
    setFacultyMembers((prev) =>
      prev.map((f) =>
        f.id === facultyId
          ? {
              ...f,
              doubtsSolvedThisMonth: f.doubtsSolvedThisMonth + 1,
              doubtsSolvedAllTime: f.doubtsSolvedAllTime + 1,
            }
          : f
      )
    );
  };

  return (
    <FacultyContext.Provider value={{ facultyMembers, currentFaculty, updateFacultySolvedCount }}>
      {children}
    </FacultyContext.Provider>
  );
}

export function useFaculty() {
  const context = useContext(FacultyContext);
  if (context === undefined) {
    throw new Error("useFaculty must be used within a FacultyProvider");
  }
  return context;
}
