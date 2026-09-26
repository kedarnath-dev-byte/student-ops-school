import type {
  Partner,
  Student,
  FeeCollection,
  Expense,
  AttendanceRecord,
  Employee,
  SalaryPayment,
  StudentTest,
} from './types';

export const SEED_PARTNERS: Partner[] = [
  { id: 'partner-a', name: 'Partner A', label: 'A', color: '#2563eb', role: 'partner' },
  { id: 'partner-b', name: 'Partner B', label: 'B', color: '#16a34a', role: 'partner' },
  { id: 'partner-c', name: 'Partner C', label: 'C', color: '#ca8a04', role: 'partner' },
  {
    id: 'teacher-1',
    name: 'Teacher',
    label: 'T',
    color: '#7c3aed',
    role: 'teacher',
  },
];

/** Purple-ish cycle for newly added teachers */
export const TEACHER_COLORS = [
  '#7c3aed',
  '#9333ea',
  '#a855f7',
  '#6d28d9',
  '#8b5cf6',
  '#5b21b6',
];

const today = new Date();
const isoToday = today.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const CLASS_OPTIONS = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7'];

/** Demo guardian phones are 10-digit India locals (e.g. 9876543210).
 * WhatsApp normalizes with country code 91 — never put Meta test / Phone Number ID digits in settings Country code.
 */
export const SEED_STUDENTS: Student[] = [
  {
    id: 'stu-001',
    name: 'Aarav Sharma',
    className: '5',
    guardianName: 'Ravi Sharma',
    guardianPhone: '9876543210',
    admissionDate: '2024-06-01',
    monthlyFee: 2500,
    createdAt: daysAgo(90),
    createdBy: 'partner-a',
  },
  {
    id: 'stu-002',
    name: 'Diya Patel',
    className: '5',
    guardianName: 'Meena Patel',
    guardianPhone: '9876543211',
    admissionDate: '2024-06-01',
    monthlyFee: 2500,
    createdAt: daysAgo(90),
    createdBy: 'partner-a',
  },
  {
    id: 'stu-003',
    name: 'Kabir Reddy',
    className: '3',
    guardianName: 'Suresh Reddy',
    guardianPhone: '9876543212',
    admissionDate: '2024-06-15',
    monthlyFee: 2000,
    createdAt: daysAgo(80),
    createdBy: 'partner-b',
  },
  {
    id: 'stu-004',
    name: 'Ananya Iyer',
    className: '3',
    guardianName: 'Lakshmi Iyer',
    guardianPhone: '9876543213',
    admissionDate: '2024-07-01',
    monthlyFee: 2000,
    createdAt: daysAgo(70),
    createdBy: 'partner-b',
  },
  {
    id: 'stu-005',
    name: 'Vihaan Khan',
    className: 'LKG',
    guardianName: 'Fatima Khan',
    guardianPhone: '9876543214',
    admissionDate: '2025-01-10',
    monthlyFee: 1500,
    createdAt: daysAgo(40),
    createdBy: 'partner-c',
  },
  {
    id: 'stu-006',
    name: 'Saanvi Gupta',
    className: 'LKG',
    guardianName: 'Pooja Gupta',
    guardianPhone: '9876543215',
    admissionDate: '2025-01-15',
    monthlyFee: 1500,
    createdAt: daysAgo(35),
    createdBy: 'partner-c',
  },
];
