import { cn } from '@/lib/utils';
import { EnrollmentStatus, AttendanceStatus } from '@/types/training';
import { 
  CheckCircle, Clock, XCircle, AlertCircle, UserX, UserCheck, 
  FileCheck, FileClock, ShieldCheck, PauseCircle 
} from 'lucide-react';

interface EnrollmentStatusBadgeProps {
  status: EnrollmentStatus;
  className?: string;
  showIcon?: boolean;
}

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  className?: string;
  showIcon?: boolean;
}

const enrollmentStatusConfig: Record<EnrollmentStatus, { label: string; className: string; icon: React.ReactNode }> = {
  registered: {
    label: 'Registered',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: <FileCheck className="h-3 w-3" />,
  },
  pending_approval: {
    label: 'Pending Approval',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: <FileClock className="h-3 w-3" />,
  },
  hr_approval: {
    label: 'HR Approval',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-primary/10 text-primary border-primary/20',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <XCircle className="h-3 w-3" />,
  },
  on_hold: {
    label: 'On Hold',
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    icon: <PauseCircle className="h-3 w-3" />,
  },
  waitlisted: {
    label: 'Waitlisted',
    className: 'bg-muted text-muted-foreground border-border',
    icon: <Clock className="h-3 w-3" />,
  },
};

const attendanceStatusConfig: Record<AttendanceStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    className: 'bg-muted text-muted-foreground border-border',
    icon: <Clock className="h-3 w-3" />,
  },
  attended: {
    label: 'Attended',
    className: 'bg-primary/10 text-primary border-primary/20',
    icon: <UserCheck className="h-3 w-3" />,
  },
  no_show: {
    label: 'No Show',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <UserX className="h-3 w-3" />,
  },
};

// Fallback configuration
const defaultEnrollmentConfig = enrollmentStatusConfig.registered;
const defaultAttendanceConfig = attendanceStatusConfig.pending;

export function EnrollmentStatusBadge({ status, className, showIcon = true }: EnrollmentStatusBadgeProps) {
  const config = enrollmentStatusConfig[status] || defaultEnrollmentConfig;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
        config.className,
        className
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}

export function AttendanceStatusBadge({ status, className, showIcon = true }: AttendanceStatusBadgeProps) {
  const config = attendanceStatusConfig[status] || defaultAttendanceConfig;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
        config.className,
        className
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}
