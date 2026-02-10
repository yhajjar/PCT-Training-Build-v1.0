import { useState } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Users, ExternalLink, User, CheckCircle } from 'lucide-react';
import { Training } from '@/types/training';
import { useTraining } from '@/context/TrainingContext';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { safeDate } from '@/lib/dateUtils';

interface TrainingModalProps {
  training: Training;
  onClose: () => void;
}

export function TrainingModal({ training, onClose }: TrainingModalProps) {
  const { addRegistration, refreshData, getRegistrationsByTrainingId } = useTraining();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistrationOpen = training.isRegistrationOpen ?? true;
  const canRegister = isRegistrationOpen && training.status !== 'Completed' && training.availableSlots > 0;

  const isAlreadyRegistered = user?.email
    ? getRegistrationsByTrainingId(training.id).some(
        (r) => r.participantEmail.toLowerCase() === user.email!.toLowerCase()
      )
    : false;

  const handleRegister = async () => {
    if (!user?.name || !user?.email) {
      toast({
        title: 'Error',
        description: 'Unable to retrieve your SSO identity. Please try signing in again.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newRegistration = {
        id: Date.now().toString(),
        trainingId: training.id,
        participantName: user.name,
        participantEmail: user.email,
        registeredAt: new Date(),
        status: 'registered' as const,
        attendanceStatus: 'pending' as const,
      };

      await addRegistration(newRegistration);

      // Refresh data to get updated available_slots from database trigger
      await refreshData();

      toast({
        title: 'Success!',
        description: 'You have been registered for this training.',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to register. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50" onClick={onClose} />
      
      <div className="relative bg-background border-2 border-border max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="sticky top-0 bg-background border-b-2 border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Training Details</h2>
          <Button variant="outline" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <CategoryBadge categoryId={training.categoryId} />
            <StatusBadge status={training.status} />
          </div>

          <h3 className="text-2xl font-bold mb-4">{training.name}</h3>
          
          <p className="text-muted-foreground mb-6">{training.description}</p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>{format(safeDate(training.date), 'MMMM d, yyyy - h:mm a')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>{training.availableSlots} of {training.maxRegistrations} slots available</span>
            </div>
          </div>

          {canRegister && isAlreadyRegistered && (
            <div className="border-t-2 border-border pt-6 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">You are already registered for this training</span>
              </div>
            </div>
          )}

          {canRegister && !isAlreadyRegistered && (
            <div className="border-t-2 border-border pt-6">
              <h4 className="text-lg font-bold mb-4">Register for this Training</h4>

              {training.registrationMethod === 'external' && training.externalLink ? (
                <a
                  href={training.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Register Externally
                  </Button>
                </a>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleRegister} disabled={isSubmitting}>
                    {isSubmitting ? 'Registering...' : 'Confirm Registration'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {training.status === 'Completed' && (
            <div className="border-t-2 border-border pt-6 text-center text-muted-foreground">
              This training has been completed.
            </div>
          )}

          {!isRegistrationOpen && training.status !== 'Completed' && (
            <div className="border-t-2 border-border pt-6 text-center text-destructive">
              Registration is currently closed.
            </div>
          )}

          {isRegistrationOpen && training.availableSlots === 0 && training.status !== 'Completed' && (
            <div className="border-t-2 border-border pt-6 text-center text-muted-foreground">
              This training is fully booked.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
