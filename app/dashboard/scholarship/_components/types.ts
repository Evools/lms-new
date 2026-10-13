export type ScholarshipStatus = "EXCELLENT" | "GOOD" | "NO_SCHOLARSHIP" | "PENDING";

export interface StudentScholarshipRow {
  studentId: string;
  studentName: string;
  avatar?: string | null;
  rollNumber: string; // Поименный номер, например "3969"
  grades: Record<string, string>; // subjectName -> grades string, e.g. "54554" or "5, 4, 5"
  subjectAverages: Record<string, number | null>;
  count5: number;
  count4: number;
  count3: number;
  count2: number;
  totalGrades: number;
  averageGrade: number;
  status: ScholarshipStatus;
  statusReason: string;
}

export interface ScholarshipGroupInfo {
  id: string;
  name: string;
  course: number;
  specialtyName?: string;
  curatorName?: string;
  students: {
    id: string;
    name: string;
    avatar?: string | null;
    rollNumber?: string | null;
  }[];
  defaultSubjects: string[];
}

export interface SavedScholarshipRecord {
  id: string;
  groupId: string;
  month: string;
  monthLabel?: string | null;
  subjects: string[];
  gradesData: Record<
    string,
    {
      grades: Record<string, string | number>;
      rollNumber?: string;
      status?: ScholarshipStatus;
    }
  >;
  updatedAt: string;
}

export interface ScholarshipSummaryKPI {
  totalStudents: number;
  gradedStudents: number;
  excellentCount: number;
  goodCount: number;
  noScholarshipCount: number;
  pendingCount: number;
  groupAverageGrade: number;
}
