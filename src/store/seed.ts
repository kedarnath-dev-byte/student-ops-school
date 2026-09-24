import type {
  Partner,
  Student,
  FeeCollection,
  Expense,
  AttendanceRecord,
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

const today = new Date();
const isoToday = today.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const SEED_STUDENTS: Student[] = [
  {
    id: 'stu-001',
    name: 'Aarav Sharma',
    className: 'Class 5',
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
    className: 'Class 5',
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
    className: 'Class 3',
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
    className: 'Class 3',
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
    className: 'Nursery',
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
    className: 'Nursery',
    guardianName: 'Pooja Gupta',
    guardianPhone: '9876543215',
    admissionDate: '2025-01-15',
    monthlyFee: 1500,
    createdAt: daysAgo(35),
    createdBy: 'partner-c',
  },
];

export const SEED_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-001',
    studentId: 'stu-001',
    className: 'Class 5',
    date: isoToday,
    status: 'present',
    recordedBy: 'partner-a',
    recordedAt: daysAgo(0),
  },
  {
    id: 'att-002',
    studentId: 'stu-002',
    className: 'Class 5',
    date: isoToday,
    status: 'late',
    recordedBy: 'partner-a',
    recordedAt: daysAgo(0),
  },
];

export const SEED_FEES: FeeCollection[] = [
  {
    id: 'fee-001',
    studentId: 'stu-001',
    amount: 2500,
    method: 'upi',
    note: 'March fee',
    collectedBy: 'partner-a',
    collectedAt: daysAgo(5),
  },
  {
    id: 'fee-002',
    studentId: 'stu-003',
    amount: 2000,
    method: 'cash',
    note: 'March fee',
    collectedBy: 'partner-b',
    collectedAt: daysAgo(3),
  },
  {
    id: 'fee-003',
    studentId: 'stu-005',
    amount: 1500,
    method: 'bank',
    note: 'March fee',
    collectedBy: 'partner-c',
    collectedAt: daysAgo(2),
  },
];

export const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp-001',
    amount: 8000,
    category: 'salaries',
    purpose: 'Teacher salary advance — March',
    method: 'bank',
    spentBy: 'partner-a',
    spentAt: daysAgo(7),
  },
  {
    id: 'exp-002',
    amount: 1200,
    category: 'supplies',
    purpose: 'Chalk, notebooks, markers',
    method: 'cash',
    spentBy: 'partner-b',
    spentAt: daysAgo(4),
  },
  {
    id: 'exp-003',
    amount: 3500,
    category: 'utilities',
    purpose: 'Electricity bill',
    method: 'upi',
    spentBy: 'partner-c',
    spentAt: daysAgo(1),
  },
];

export const CLASS_OPTIONS = ['Nursery', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];

export const EXPENSE_CATEGORIES = [
  'salaries',
  'rent',
  'utilities',
  'supplies',
  'transport',
  'maintenance',
  'food',
  'other',
] as const;

export const PAYMENT_METHODS = ['cash', 'upi', 'bank'] as const;
