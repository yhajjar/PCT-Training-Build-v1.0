import { format } from 'date-fns';
import { Calendar, Users, Clock, ArrowRight, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Training } from '@/types/training';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { safeDate, formatTimeRange } from '@/lib/dateUtils';

interface TrainingCardProps {
  training: Training;
  onClick?: () => void;
}

export function TrainingCard({ training, onClick }: TrainingCardProps) {
  const navigate = useNavigate();
  const trainingDate = safeDate(training.date);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/training/${training.id}`);
    }
  };

  const handleLearnMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/training/${training.id}`);
  };

  return (
    <Card
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group overflow-hidden h-full flex flex-col"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative h-44 bg-muted overflow-hidden">
        {training.heroImage ? (
          <img
            src={training.heroImage}
            alt={training.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <ImageIcon className="h-12 w-12 text-primary/30" />
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <CategoryBadge categoryId={training.categoryId} className="shadow-sm bg-background/90 backdrop-blur-sm" />
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={training.status} className="shadow-sm bg-background/90 backdrop-blur-sm" />
        </div>
      </div>

      <CardHeader className="pb-2 pt-4">
        <h3 className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {training.name}
        </h3>
        {training.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {training.shortDescription}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-primary/70" />
            <span>
              {format(trainingDate, 'MMM d, yyyy')}
              {training.endDate && safeDate(training.endDate).getTime() !== trainingDate.getTime() && 
                ` - ${format(safeDate(training.endDate), 'MMM d, yyyy')}`
              }
            </span>
          </div>
          {(training.timeFrom || training.timeTo) && (
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-primary/70" />
              <span>{formatTimeRange(training.timeFrom, training.timeTo)}</span>
            </div>
          )}
          {training.duration && (
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-primary/70" />
              <span>Duration: {training.duration}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-primary/70" />
            <span className="font-medium text-foreground">{training.availableSlots}</span>
            <span>slots available</span>
          </div>
        </div>

        <div className="mt-auto">
          <Button 
            variant="outline" 
            className="w-full group/btn"
            onClick={handleLearnMore}
          >
            Learn More
            <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
