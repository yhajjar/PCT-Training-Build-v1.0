import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Training } from '@/types/training';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { Progress } from '@/components/ui/progress';
import { safeDate, formatTimeRange } from '@/lib/dateUtils';

interface HeroSliderProps {
  trainings: Training[];
}

export function HeroSlider({ trainings }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (trainings.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trainings.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [trainings.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + trainings.length) % trainings.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % trainings.length);
  };

  if (trainings.length === 0) {
    return (
      <div className="relative h-[400px] md:h-[500px] bg-muted flex items-center justify-center rounded-2xl mx-4 my-6">
        <p className="text-muted-foreground text-lg">No featured trainings available</p>
      </div>
    );
  }

  const currentTraining = trainings[currentIndex];
  const trainingDate = safeDate(currentTraining.date);
  const slotsPercentage = currentTraining.maxRegistrations 
    ? (currentTraining.availableSlots / currentTraining.maxRegistrations) * 100 
    : 50;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="relative h-[400px] md:h-[480px] overflow-hidden rounded-2xl shadow-xl">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: currentTraining.heroImage
              ? `url(${currentTraining.heroImage})`
              : 'none',
            backgroundColor: currentTraining.heroImage ? undefined : 'hsl(var(--muted))',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/40" />
        </div>

        {/* Content */}
        <div className="relative h-full flex items-center px-8 md:px-12">
          <div className="max-w-xl text-primary-foreground">
            <div className="flex flex-wrap gap-2 mb-4">
              <CategoryBadge categoryId={currentTraining.categoryId} />
              <StatusBadge status={currentTraining.status} />
            </div>
            
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {currentTraining.name}
            </h2>
            
            {currentTraining.shortDescription && (
              <p className="text-base md:text-lg mb-6 opacity-90 line-clamp-2">
                {currentTraining.shortDescription}
              </p>
            )}
            
            <div className="flex flex-wrap gap-6 text-sm md:text-base mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 opacity-80" />
                <span>
                  {format(trainingDate, 'MMMM d, yyyy')}
                  {currentTraining.endDate && safeDate(currentTraining.endDate).getTime() !== trainingDate.getTime() && 
                    ` - ${format(safeDate(currentTraining.endDate), 'MMMM d, yyyy')}`
                  }
                </span>
              </div>
              {currentTraining.timeFrom && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 opacity-80" />
                  <span>{formatTimeRange(currentTraining.timeFrom, currentTraining.timeTo)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 opacity-80" />
                <span>{currentTraining.availableSlots} slots available</span>
              </div>
            </div>

            {/* Registration Progress */}
            <div className="max-w-xs mb-6">
              <div className="flex justify-between text-xs mb-1.5 opacity-80">
                <span>Registration</span>
                <span>{currentTraining.availableSlots} / {currentTraining.maxRegistrations || currentTraining.availableSlots} slots</span>
              </div>
              <Progress value={100 - slotsPercentage} className="h-2 bg-primary-foreground/20" />
            </div>

            {/* Learn More Button */}
            <Button
              onClick={() => navigate(`/training/${currentTraining.id}`)}
              className="gap-2"
              size="lg"
            >
              Learn More
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {trainings.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Dots Indicator */}
        {trainings.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {trainings.map((_, index) => (
              <button
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-primary-foreground w-8' 
                    : 'bg-primary-foreground/40 hover:bg-primary-foreground/60'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
