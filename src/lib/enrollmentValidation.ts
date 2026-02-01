import { EnrollmentStatus, AttendanceStatus, Training } from '@/types/training';

// Define valid transitions for enrollment status
const enrollmentTransitions: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  registered: ['pending_approval', 'confirmed', 'waitlisted', 'on_hold', 'cancelled'],
  pending_approval: ['hr_approval', 'confirmed', 'on_hold', 'cancelled'],
  hr_approval: ['confirmed', 'on_hold', 'cancelled'],
  waitlisted: ['confirmed', 'on_hold', 'cancelled'],
  on_hold: ['confirmed', 'cancelled'],
  confirmed: ['cancelled'], // Confirmed can only be cancelled
  cancelled: [], // Terminal state - no transitions allowed
};

// Statuses that require confirmation dialog with optional reason
export const statusesRequiringConfirmation: EnrollmentStatus[] = ['cancelled', 'on_hold'];

// Check if a status transition is valid
export function isValidStatusTransition(
  currentStatus: EnrollmentStatus,
  newStatus: EnrollmentStatus
): boolean {
  if (currentStatus === newStatus) return true; // No change
  const allowedTransitions = enrollmentTransitions[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

// Get allowed next statuses for a given status
export function getAllowedTransitions(currentStatus: EnrollmentStatus): EnrollmentStatus[] {
  return enrollmentTransitions[currentStatus] || [];
}

// Check if attendance can be marked based on enrollment status and training status
export function canMarkAttendance(
  enrollmentStatus: EnrollmentStatus,
  attendanceStatus: AttendanceStatus,
  training?: Training
): boolean {
  // Can always set to pending
  if (attendanceStatus === 'pending') return true;

  // For attended or no_show, enrollment must be confirmed OR training must be completed
  const isConfirmed = enrollmentStatus === 'confirmed';
  const isTrainingCompleted = training?.status === 'Completed';

  return isConfirmed || isTrainingCompleted;
}

// Get allowed attendance statuses based on enrollment status and training
export function getAllowedAttendanceStatuses(
  enrollmentStatus: EnrollmentStatus,
  training?: Training
): AttendanceStatus[] {
  const base: AttendanceStatus[] = ['pending'];
  
  const isConfirmed = enrollmentStatus === 'confirmed';
  const isTrainingCompleted = training?.status === 'Completed';

  if (isConfirmed || isTrainingCompleted) {
    return ['pending', 'attended', 'no_show'];
  }

  return base;
}

// Status display configuration
export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  registered: 'Registered',
  pending_approval: 'Pending Approval',
  hr_approval: 'HR Approval',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
  waitlisted: 'Waitlisted',
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  pending: 'Pending',
  attended: 'Attended',
  no_show: 'No Show',
};

// Get validation error message for invalid transition
export function getTransitionErrorMessage(
  currentStatus: EnrollmentStatus,
  attemptedStatus: EnrollmentStatus
): string {
  const currentLabel = enrollmentStatusLabels[currentStatus];
  const attemptedLabel = enrollmentStatusLabels[attemptedStatus];
  const allowed = getAllowedTransitions(currentStatus);
  
  if (allowed.length === 0) {
    return `Cannot change status from "${currentLabel}" - this is a terminal state.`;
  }
  
  const allowedLabels = allowed.map(s => enrollmentStatusLabels[s]).join(', ');
  return `Cannot transition from "${currentLabel}" to "${attemptedLabel}". Allowed: ${allowedLabels}`;
}

// Get attendance error message
export function getAttendanceErrorMessage(enrollmentStatus: EnrollmentStatus): string {
  return `Cannot mark attendance as Attended or No Show. Enrollment must be "Confirmed" or the training must be "Completed". Current status: ${enrollmentStatusLabels[enrollmentStatus]}`;
}
