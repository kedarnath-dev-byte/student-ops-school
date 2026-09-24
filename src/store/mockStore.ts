import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  Expense,
  ExpenseCategory,
  FeeCollection,
  Partner,
  PaymentMethod,
  ProgressNote,
  SalaryPayment,
  Student,
  StudentTest,
} from './types';
import {
  SEED_ATTENDANCE,
  SEED_EMPLOYEES,
  SEED_EXPENSES,
  SEED_FEES,
  SEED_PARTNERS,
  SEED_SALARIES,
  SEED_STUDENTS,
  SEED_TESTS,
  TEACHER_COLORS,
} from './seed';

const STORAGE_KEY = 'student-ops-school-v2';

/** Avoid AsyncStorage touching `window` during Expo web SSR / Metro evaluate. */
const memoryStorage = {
  getItem: async (_key: string) => null as string | null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
};

function getPersistStorage() {
  if (typeof window === 'undefined') {
    return memoryStorage;
  }
  return AsyncStorage;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function requireActor(activePartnerId: string | null): string {
  if (!activePartnerId) {
    throw new Error('No one logged in. Select a partner or teacher first.');
  }
  return activePartnerId;
}

function requirePartnerFinance(get: () => {
  activePartnerId: string | null;
  partners: { id: string; role: string }[];
}): string {
  const id = requireActor(get().activePartnerId);
  const user = get().partners.find((p) => p.id === id);
  if (!user || user.role !== 'partner') {
    throw new Error('Teachers can only take attendance. Fee and expense access is for partners.');
  }
  return id;
}

interface MockStore {
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

  setHydrated: (v: boolean) => void;
  setActivePartner: (partnerId: string) => void;
  clearActivePartner: () => void;
  getActivePartner: () => Partner | null;
  isTeacher: () => boolean;
  isPartner: () => boolean;

  addTeacher: (input: { name: string }) => Partner;
  addStudent: (input: Omit<Student, 'id' | 'createdAt' | 'createdBy'>) => Student;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  getStudent: (id: string) => Student | undefined;

  upsertAttendance: (input: {
    studentId: string;
    className: string;
    date: string;
    status: AttendanceStatus;
    note?: string;
  }) => AttendanceRecord;
  getAttendanceForClassDate: (className: string, date: string) => AttendanceRecord[];
  getAttendanceForStudent: (studentId: string) => AttendanceRecord[];

  collectFee: (input: {
    studentId: string;
    amount: number;
    method: PaymentMethod;
    note?: string;
  }) => FeeCollection;
  voidFee: (id: string, reason: string) => void;

  addExpense: (input: {
    amount: number;
    category: ExpenseCategory;
    purpose: string;
    method: PaymentMethod;
  }) => Expense;
  voidExpense: (id: string, reason: string) => void;

  addProgressNote: (studentId: string, note: string) => ProgressNote;

  addEmployee: (input: {
    name: string;
    title?: string;
    monthlySalary?: number;
  }) => Employee;
  recordSalary: (input: {
    employeeId: string;
    amount: number;
    method: PaymentMethod;
    periodLabel: string;
    note?: string;
  }) => SalaryPayment;
  voidSalary: (id: string, reason: string) => void;

  addStudentTest: (input: {
    studentId: string;
    testName: string;
    scored: number;
    maxMarks: number;
    testedAt: string;
    note?: string;
  }) => StudentTest;
  getTestsForStudent: (studentId: string) => StudentTest[];

  /** Active (non-voided) fee totals this calendar month, by partner */
  monthFeeTotalsByPartner: () => Record<string, number>;
  /** Active expense totals this calendar month, by partner */
  monthExpenseTotalsByPartner: () => Record<string, number>;
  monthNet: () => { in: number; out: number; net: number };

  resetToSeed: () => void;
}

function startOfMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function nextTeacherLabel(partners: Partner[]): string {
  const teacherCount = partners.filter((p) => p.role === 'teacher').length;
  if (teacherCount === 0) return 'T';
  if (teacherCount === 1) return 'T2';
  return `T${teacherCount + 1}`;
}

export const useMockStore = create<MockStore>()(
  persist(
    (set, get) => ({
      partners: SEED_PARTNERS,
      activePartnerId: null,
      students: SEED_STUDENTS,
      attendance: SEED_ATTENDANCE,
      feeCollections: SEED_FEES,
      expenses: SEED_EXPENSES,
      progressNotes: [],
      employees: SEED_EMPLOYEES,
      salaryPayments: SEED_SALARIES,
      studentTests: SEED_TESTS,
      hydrated: false,

      setHydrated: (v) => set({ hydrated: v }),

      setActivePartner: (partnerId) => {
        const exists = get().partners.some((p) => p.id === partnerId);
        if (!exists) throw new Error('Unknown partner');
        set({ activePartnerId: partnerId });
      },

      clearActivePartner: () => set({ activePartnerId: null }),

      getActivePartner: () => {
        const { partners, activePartnerId } = get();
        return partners.find((p) => p.id === activePartnerId) ?? null;
      },

      isTeacher: () => get().getActivePartner()?.role === 'teacher',
      isPartner: () => get().getActivePartner()?.role === 'partner',

      addTeacher: (input) => {
        const partnerId = requirePartnerFinance(get);
        const name = input.name.trim();
        if (!name) throw new Error('Teacher name required');
        const partners = get().partners;
        const label = nextTeacherLabel(partners);
        const colorIndex = partners.filter((p) => p.role === 'teacher').length % TEACHER_COLORS.length;
        const teacher: Partner = {
          id: uid('teacher'),
          name,
          label,
          color: TEACHER_COLORS[colorIndex],
          role: 'teacher',
        };
        void partnerId;
        set((s) => ({ partners: [...s.partners, teacher] }));
        return teacher;
      },

      addStudent: (input) => {
        const partnerId = requirePartnerFinance(get);
        const student: Student = {
          ...input,
          id: uid('stu'),
          createdAt: new Date().toISOString(),
          createdBy: partnerId,
        };
        set((s) => ({ students: [...s.students, student] }));
        return student;
      },

      updateStudent: (id, patch) => {
        requirePartnerFinance(get);
        set((s) => ({
          students: s.students.map((st) => (st.id === id ? { ...st, ...patch, id: st.id } : st)),
        }));
      },

      getStudent: (id) => get().students.find((s) => s.id === id),

      upsertAttendance: (input) => {
        const partnerId = requireActor(get().activePartnerId);
        const existing = get().attendance.find(
          (a) =>
            a.studentId === input.studentId &&
            a.date === input.date &&
            a.className === input.className
        );
        const record: AttendanceRecord = {
          id: existing?.id ?? uid('att'),
          studentId: input.studentId,
          className: input.className,
          date: input.date,
          status: input.status,
          note: input.note,
          recordedBy: partnerId,
          recordedAt: new Date().toISOString(),
        };
        set((s) => ({
          attendance: existing
            ? s.attendance.map((a) => (a.id === existing.id ? record : a))
            : [...s.attendance, record],
        }));
        return record;
      },

      getAttendanceForClassDate: (className, date) =>
        get().attendance.filter((a) => a.className === className && a.date === date),

      getAttendanceForStudent: (studentId) =>
        [...get().attendance.filter((a) => a.studentId === studentId)].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),

      collectFee: (input) => {
        const partnerId = requirePartnerFinance(get);
        if (!input.amount || input.amount <= 0) throw new Error('Amount must be positive');
        const fee: FeeCollection = {
          id: uid('fee'),
          studentId: input.studentId,
          amount: input.amount,
          method: input.method,
          note: input.note,
          collectedBy: partnerId,
          collectedAt: new Date().toISOString(),
          voidedAt: null,
          voidReason: null,
        };
        set((s) => ({ feeCollections: [...s.feeCollections, fee] }));
        return fee;
      },

      voidFee: (id, reason) => {
        const partnerId = requirePartnerFinance(get);
        if (!reason.trim()) throw new Error('Void reason required');
        set((s) => ({
          feeCollections: s.feeCollections.map((f) =>
            f.id === id
              ? {
                  ...f,
                  voidedAt: new Date().toISOString(),
                  voidReason: `${reason.trim()} (voided by ${partnerId})`,
                }
              : f
          ),
        }));
      },

      addExpense: (input) => {
        const partnerId = requirePartnerFinance(get);
        if (!input.amount || input.amount <= 0) throw new Error('Amount must be positive');
        if (!input.purpose.trim()) throw new Error('Purpose required');
        const expense: Expense = {
          id: uid('exp'),
          amount: input.amount,
          category: input.category,
          purpose: input.purpose.trim(),
          method: input.method,
          spentBy: partnerId,
          spentAt: new Date().toISOString(),
          voidedAt: null,
          voidReason: null,
        };
        set((s) => ({ expenses: [...s.expenses, expense] }));
        return expense;
      },

      voidExpense: (id, reason) => {
        const partnerId = requirePartnerFinance(get);
        if (!reason.trim()) throw new Error('Void reason required');
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id
              ? {
                  ...e,
                  voidedAt: new Date().toISOString(),
                  voidReason: `${reason.trim()} (voided by ${partnerId})`,
                }
              : e
          ),
        }));
      },

      addProgressNote: (studentId, note) => {
        const partnerId = requirePartnerFinance(get);
        const pn: ProgressNote = {
          id: uid('pn'),
          studentId,
          note: note.trim(),
          recordedBy: partnerId,
          recordedAt: new Date().toISOString(),
        };
        set((s) => ({ progressNotes: [...s.progressNotes, pn] }));
        return pn;
      },

      addEmployee: (input) => {
        const partnerId = requirePartnerFinance(get);
        const name = input.name.trim();
        if (!name) throw new Error('Employee name required');
        const emp: Employee = {
          id: uid('emp'),
          name,
          title: input.title?.trim() || undefined,
          monthlySalary: input.monthlySalary,
          createdAt: new Date().toISOString(),
          createdBy: partnerId,
          active: true,
        };
        set((s) => ({ employees: [...s.employees, emp] }));
        return emp;
      },

      recordSalary: (input) => {
        const partnerId = requirePartnerFinance(get);
        if (!input.amount || input.amount <= 0) throw new Error('Amount must be positive');
        if (!input.periodLabel.trim()) throw new Error('Period required (e.g. 2026-03)');
        const emp = get().employees.find((e) => e.id === input.employeeId);
        if (!emp) throw new Error('Employee not found');
        const pay: SalaryPayment = {
          id: uid('sal'),
          employeeId: input.employeeId,
          amount: input.amount,
          method: input.method,
          periodLabel: input.periodLabel.trim(),
          note: input.note?.trim() || undefined,
          paidBy: partnerId,
          paidAt: new Date().toISOString(),
          voidedAt: null,
          voidReason: null,
        };
        set((s) => ({ salaryPayments: [...s.salaryPayments, pay] }));
        return pay;
      },

      voidSalary: (id, reason) => {
        const partnerId = requirePartnerFinance(get);
        if (!reason.trim()) throw new Error('Void reason required');
        set((s) => ({
          salaryPayments: s.salaryPayments.map((p) =>
            p.id === id
              ? {
                  ...p,
                  voidedAt: new Date().toISOString(),
                  voidReason: `${reason.trim()} (voided by ${partnerId})`,
                }
              : p
          ),
        }));
      },

      addStudentTest: (input) => {
        const partnerId = requirePartnerFinance(get);
        const testName = input.testName.trim();
        if (!testName) throw new Error('Test name required');
        if (input.maxMarks <= 0) throw new Error('Max marks must be positive');
        if (input.scored < 0 || input.scored > input.maxMarks) {
          throw new Error('Score must be between 0 and max marks');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.testedAt)) {
          throw new Error('Date must be YYYY-MM-DD');
        }
        const t: StudentTest = {
          id: uid('test'),
          studentId: input.studentId,
          testName,
          scored: input.scored,
          maxMarks: input.maxMarks,
          testedAt: input.testedAt,
          note: input.note?.trim() || undefined,
          recordedBy: partnerId,
          recordedAt: new Date().toISOString(),
        };
        set((s) => ({ studentTests: [...s.studentTests, t] }));
        return t;
      },

      getTestsForStudent: (studentId) =>
        [...get().studentTests.filter((t) => t.studentId === studentId)].sort((a, b) =>
          b.testedAt.localeCompare(a.testedAt)
        ),

      monthFeeTotalsByPartner: () => {
        const start = startOfMonthISO();
        const totals: Record<string, number> = {};
        for (const p of get().partners) totals[p.id] = 0;
        for (const f of get().feeCollections) {
          if (f.voidedAt) continue;
          if (f.collectedAt.slice(0, 10) < start) continue;
          totals[f.collectedBy] = (totals[f.collectedBy] ?? 0) + f.amount;
        }
        return totals;
      },

      monthExpenseTotalsByPartner: () => {
        const start = startOfMonthISO();
        const totals: Record<string, number> = {};
        for (const p of get().partners) totals[p.id] = 0;
        for (const e of get().expenses) {
          if (e.voidedAt) continue;
          if (e.spentAt.slice(0, 10) < start) continue;
          totals[e.spentBy] = (totals[e.spentBy] ?? 0) + e.amount;
        }
        return totals;
      },

      monthNet: () => {
        const fees = get().monthFeeTotalsByPartner();
        const exps = get().monthExpenseTotalsByPartner();
        const inn = Object.values(fees).reduce((a, b) => a + b, 0);
        const out = Object.values(exps).reduce((a, b) => a + b, 0);
        return { in: inn, out, net: inn - out };
      },

      resetToSeed: () =>
        set({
          partners: SEED_PARTNERS,
          activePartnerId: null,
          students: SEED_STUDENTS,
          attendance: SEED_ATTENDANCE,
          feeCollections: SEED_FEES,
          expenses: SEED_EXPENSES,
          progressNotes: [],
          employees: SEED_EMPLOYEES,
          salaryPayments: SEED_SALARIES,
          studentTests: SEED_TESTS,
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(getPersistStorage),
      skipHydration: typeof window === 'undefined',
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('mockStore rehydrate error', error);
        }
        queueMicrotask(() => {
          useMockStore.setState({ hydrated: true });
        });
      },
      partialize: (s) => ({
        partners: s.partners,
        activePartnerId: s.activePartnerId,
        students: s.students,
        attendance: s.attendance,
        feeCollections: s.feeCollections,
        expenses: s.expenses,
        progressNotes: s.progressNotes,
        employees: s.employees,
        salaryPayments: s.salaryPayments,
        studentTests: s.studentTests,
      }),
    }
  )
);
