/** Core domain types for Student Ops school operations */

export type PaymentMethod = 'cash' | 'upi' | 'bank';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export type StaffRole = 'partner' | 'teacher';

export type ExpenseCategory =
  | 'salaries'
  | 'rent'
  | 'utilities'
  | 'supplies'
  | 'transport'
  | 'maintenance'
  | 'food'
  | 'other';

/** Partner = full access (fees/expenses). Teacher = attendance only. */
export interface Partner {
  id: string;
  name: string;
  label: string; // A / B / C / T / T2…
  color: string;
  role: StaffRole;
}

export interface Student {
  id: string;
  name: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
  admissionDate: string;
  monthlyFee: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  className: string;
  date: string;
  status: AttendanceStatus;
  recordedBy: string;
  recordedAt: string;
  note?: string;
}

export interface FeeCollection {
  id: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
  collectedBy: string;
  collectedAt: string;
  voidedAt?: string | null;
  voidReason?: string | null;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  purpose: string;
  method: PaymentMethod;
  spentBy: string;
  spentAt: string;
  voidedAt?: string | null;
  voidReason?: string | null;
}

export interface ProgressNote {
  id: string;
  studentId: string;
  note: string;
  recordedBy: string;
  recordedAt: string;
}

/** Staff on payroll (may or may not also be a teacher login). */
export interface Employee {
  id: string;
  name: string;
  title?: string;
  monthlySalary?: number;
  createdAt: string;
  createdBy: string;
  active: boolean;
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  amount: number;
  method: PaymentMethod;
  /** e.g. "2026-03" */
  periodLabel: string;
  note?: string;
  paidBy: string;
  paidAt: string;
  voidedAt?: string | null;
  voidReason?: string | null;
}

/** Per-student named test with score. Primary progress record. */
export interface StudentTest {
  id: string;
  studentId: string;
  testName: string;
  scored: number;
  maxMarks: number;
  /** ISO date YYYY-MM-DD */
  testedAt: string;
  note?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface AppState {
  partners: Partner[];
  activePartnerId: string | null;
  students: Student[];
  attendance: AttendanceRecord[];
  feeCollections: FeeCollection[];
  expenses: Expense[];
  progressNotes: ProgressNote[];
  employees: Employee[];
  salaryPayments: SalaryPayment[];
  studentTests: StudentTest[];
  hydrated: boolean;
}
