import type { PaymentMethod } from '../store/types';
import type { WhatsAppTemplateKind } from './types';

const SCHOOL = 'Student Ops';

function methodLabel(method: PaymentMethod): string {
  if (method === 'upi') return 'UPI';
  if (method === 'bank') return 'Bank';
  return 'Cash';
}

export function buildFeeReceiptMessage(args: {
  studentName: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  collectedByName: string;
}): string {
  return (
    `${SCHOOL} — Fee receipt / फीस रसीद\n` +
    `Student: ${args.studentName}\n` +
    `Amount: ₹${args.amount.toLocaleString('en-IN')} (${methodLabel(args.method)})\n` +
    `Date: ${args.date}\n` +
    `Collected by: ${args.collectedByName}\n` +
    `धन्यवाद! Thank you.`
  );
}

export function buildTestProgressMessage(args: {
  studentName: string;
  testName: string;
  scored: number;
  maxMarks: number;
  date: string;
}): string {
  return (
    `${SCHOOL} — Test progress / परीक्षा परिणाम\n` +
    `Student: ${args.studentName}\n` +
    `Test: ${args.testName}\n` +
    `Score: ${args.scored}/${args.maxMarks}\n` +
    `Date: ${args.date}`
  );
}

export function buildAbsenceAlertMessage(args: {
  studentName: string;
  className: string;
  date: string;
}): string {
  return (
    `${SCHOOL} — Absence alert / अनुपस्थिति\n` +
    `Student: ${args.studentName} (Class ${args.className})\n` +
    `was marked ABSENT on ${args.date}.\n` +
    `कृपया स्कूल से संपर्क करें / Please contact the school if needed.`
  );
}

export function templateKindLabel(kind: WhatsAppTemplateKind): string {
  switch (kind) {
    case 'fee_receipt':
      return 'Fee receipt';
    case 'test_progress':
      return 'Test progress';
    case 'absence_alert':
      return 'Absence alert';
    default:
      return kind;
  }
}
