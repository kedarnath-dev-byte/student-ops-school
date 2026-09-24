/** Core domain types for Student Ops school operations */

export type PaymentMethod = 'cash' | 'upi' | 'bank';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export type ExpenseCategory =
  | 'salaries'
  | 'rent'
  | 'utilities'
  | 'supplies'
  | 'transport'
  | 'maintenance'
  | 'food'
  | 'other';

export interface Partner {
  id: string;
  name: string;
  label: string; // Partner A / B / C
  color: string;
}

export interface Student {
  id: string;
  name: string;
  className: string; // e.g. "Class 5", "Nursery"
  guardianName: string;
  guardianPhone: string;
  admissionDate: string; // ISO date
  monthlyFee: number;
  notes?: string;
  createdAt: string;
  createdBy: string; // partner_id
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  className: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  recordedBy: string; // partner_id
  recordedAt: string; // ISO timestamp
  note?: string;
}

export interface FeeCollection {
  id: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
  collectedBy: string; // partner_id — NEVER anonymous
  collectedAt: string; // ISO timestamp
  voidedAt?: string | null;
  voidReason?: string | null;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  purpose: string;
  method: PaymentMethod;
  spentBy: string; // partner_id — NEVER anonymous
  spentAt: string; // ISO timestamp
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
