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
  label: string; // A / B / C / T
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

export interface AppState {
  partners: Partner[];
  activePartnerId: string | null;
  students: Student[];
  attendance: AttendanceRecord[];
  feeCollections: FeeCollection[];
  expenses: Expense[];
  progressNotes: ProgressNote[];
  hydrated: boolean;
}
