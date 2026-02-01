import * as XLSX from 'xlsx';
import { Registration, Training, Category, EnrollmentStatus, AttendanceStatus } from '@/types/training';
import { format } from 'date-fns';
import { safeDate } from './dateUtils';

// Status label mappings for export
const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  registered: 'Registered',
  pending_approval: 'Pending Approval',
  hr_approval: 'HR Approval',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
  waitlisted: 'Waitlisted',
};

const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  pending: 'Pending',
  attended: 'Attended',
  no_show: 'No Show',
};

function formatEnrollmentStatus(status: EnrollmentStatus): string {
  return enrollmentStatusLabels[status] || status;
}

function formatAttendanceStatus(status: AttendanceStatus): string {
  return attendanceStatusLabels[status] || status;
}

export interface EnrollmentExportRow {
  'Participant Name': string;
  'Email': string;
  'Phone': string;
  'Training Name': string;
  'Category': string;
  'Training Date': string;
  'Registered At': string;
  'Status': string;
  'Attendance': string;
  'Notes': string;
}

export function prepareEnrollmentExportData(
  registrations: Registration[],
  trainings: Training[],
  categories: Category[]
): EnrollmentExportRow[] {
  return registrations.map((reg) => {
    const training = trainings.find((t) => t.id === reg.trainingId);
    const category = categories.find((c) => c.id === training?.categoryId);

    return {
      'Participant Name': reg.participantName,
      'Email': reg.participantEmail,
      'Phone': reg.participantPhone || '',
      'Training Name': training?.name || 'Unknown',
      'Category': category?.name || 'Unknown',
      'Training Date': training ? format(safeDate(training.date), 'yyyy-MM-dd') : '',
      'Registered At': format(safeDate(reg.registeredAt), 'yyyy-MM-dd HH:mm'),
      'Status': formatEnrollmentStatus(reg.status),
      'Attendance': formatAttendanceStatus(reg.attendanceStatus),
      'Notes': reg.notes || '',
    };
  });
}

export function exportToCSV(data: EnrollmentExportRow[], filename: string): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof EnrollmentExportRow];
          // Escape quotes and wrap in quotes if contains comma or newline
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function exportToXLS(data: EnrollmentExportRow[], filename: string): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Enrollments');

  // Auto-size columns
  const colWidths = Object.keys(data[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...data.map((row) => String(row[key as keyof EnrollmentExportRow]).length)
    ),
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}