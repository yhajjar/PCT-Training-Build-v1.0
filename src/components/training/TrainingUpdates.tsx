import { useTraining } from '@/context/TrainingContext';
import { TrainingUpdate } from '@/types/training';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Plus, 
  Trash2, 
  Edit, 
  RefreshCw, 
  AlertTriangle, 
  XCircle,
  Bell
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimateIn } from '@/components/ui/animate-in';

const getUpdateIcon = (type: TrainingUpdate['type']) => {
  switch (type) {
    case 'training_added':
      return <Plus className="h-4 w-4 text-green-500" />;
    case 'training_removed':
      return <Trash2 className="h-4 w-4 text-destructive" />;
    case 'training_modified':
      return <Edit className="h-4 w-4 text-blue-500" />;
    case 'status_changed':
      return <RefreshCw className="h-4 w-4 text-orange-500" />;
    case 'capacity_low':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'capacity_full':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const getUpdateBgColor = (type: TrainingUpdate['type']) => {
  switch (type) {
    case 'training_added':
      return 'bg-green-500/10 border-green-500/20';
    case 'training_removed':
      return 'bg-destructive/10 border-destructive/20';
    case 'training_modified':
      return 'bg-blue-500/10 border-blue-500/20';
    case 'status_changed':
      return 'bg-orange-500/10 border-orange-500/20';
    case 'capacity_low':
      return 'bg-yellow-500/10 border-yellow-500/20';
    case 'capacity_full':
      return 'bg-destructive/10 border-destructive/20';
    default:
      return 'bg-muted border-border';
  }
};

export function TrainingUpdates() {
  const { trainingUpdates } = useTraining();

  // Sort updates by timestamp, most recent first
  const sortedUpdates = [...trainingUpdates].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Latest Updates</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Recent training activity
        </p>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-3 space-y-2">
          {sortedUpdates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No updates yet</p>
            </div>
          ) : (
            sortedUpdates.map((update, index) => (
              <AnimateIn key={update.id} delay={index * 50} from="right">
                <div
                  className={`p-3 rounded-lg border ${getUpdateBgColor(update.type)} transition-all hover:shadow-sm`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">{getUpdateIcon(update.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {update.trainingName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {update.message}
                      </p>
                      {update.previousValue && update.newValue && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="line-through">{update.previousValue}</span>
                          {' → '}
                          <span className="font-medium text-foreground">{update.newValue}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}