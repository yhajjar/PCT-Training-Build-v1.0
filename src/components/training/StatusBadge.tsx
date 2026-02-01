import { TrainingStatus } from '@/types/training';
import { cn } from '@/lib/utils';
import { Clock, Play, CheckCircle, XCircle, Pause, RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  status: TrainingStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<TrainingStatus, { 
  className: string; 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = {
  'Scheduled': {
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: Clock,
    label: 'Scheduled',
  },
  'Rescheduled': {
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: RefreshCw,
    label: 'Rescheduled',
  },
  'Cancelled': {
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
    icon: XCircle,
    label: 'Cancelled',
  },
  'In Progress': {
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: Play,
    label: 'In Progress',
  },
  'On Hold': {
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    icon: Pause,
    label: 'On Hold',
  },
  'Completed': {
    className: 'bg-muted text-muted-foreground border-border',
    icon: CheckCircle,
    label: 'Completed',
  },
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig['Scheduled'];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-200',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
