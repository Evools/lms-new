export type PracticeTab = "students" | "movements-log" | "companies" | "diary-plan";

export type PracticeType = "Учебная (ознакомительная)" | "Производственная" | "Преддипломная";

export type StudentPracticeStatus =
  | "Не распределен"
  | "Направлен"
  | "Проходит практику"
  | "Переведен на другую базу"
  | "Практика завершена";

export type MovementType =
  | "Первичное направление"
  | "Перевод на другую базу"
  | "Смена вида практики"
  | "Досрочный отзыв"
  | "Завершение практики";

export interface PracticeMovementRecord {
  id: string;
  date: string;
  type: MovementType;
  fromCompany?: string;
  toCompany: string;
  practiceType: PracticeType;
  reason: string;
  mentor?: string;
  notes?: string;
}

export interface StudentPracticeRecord {
  id: string;
  studentName: string;
  groupId: string;
  groupName: string;
  course: number;
  specialty: string;
  practiceType: PracticeType;
  companyId?: string;
  companyName?: string;
  collegeMentor: string;
  companyMentor?: string;
  startDate: string;
  endDate: string;
  status: StudentPracticeStatus;
  feedbackNote?: string;
  movements: PracticeMovementRecord[];
}

export interface CompanyPartner {
  id: string;
  name: string;
  industry: string;
  specialtyFocus: string;
  contactPerson: string;
  position: string;
  phone: string;
  email: string;
  address: string;
  contractNumber: string;
  contractValidUntil: string;
  quotaTotal: number;
  quotaUsed: number;
  notes?: string;
}

export interface DiaryDayTopic {
  id: string;
  dayNumber: number;
  topic: string;
  tasksContent: string;
  hours: number;
  section: string;
}

export interface SpecialtyDiaryPlan {
  id: string;
  groupName: string;
  groupId?: string;
  title: string;
  specialty: string;
  course: number;
  practiceType: PracticeType;
  startDate?: string;
  dailyHours: number;
  totalDays: number;
  totalHours: number;
  days: DiaryDayTopic[];
}

export type GroupDiaryPlan = SpecialtyDiaryPlan;

export interface CollegeGroupInfo {
  id: string;
  name: string;
  course: number;
  specialty: string;
}

export interface PracticeViewProps {
  userRole: string;
  currentUserName: string;
  initialCompanies?: CompanyPartner[];
  initialStudents?: StudentPracticeRecord[];
  initialDiaryPlans?: SpecialtyDiaryPlan[];
  initialRewrittenDays?: string[];
  initialGroups?: CollegeGroupInfo[];
}
