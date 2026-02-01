import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addYears,
  subYears,
  isSameMonth,
  isSameDay,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, LayoutGrid, Columns, CalendarDays, CalendarRange } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useTraining } from '@/context/TrainingContext';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from '@/components/training/CategoryBadge';
import { StatusBadge } from '@/components/training/StatusBadge';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { Training } from '@/types/training';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { safeDate, formatTimeRange } from '@/lib/dateUtils';
import { AnimateIn } from '@/components/ui/animate-in';

type ViewType = 'day' | 'week' | 'month' | 'year';

const viewIcons: Record<ViewType, React.ReactNode> = {
  day: <CalendarDays className="h-4 w-4" />,
  week: <Columns className="h-4 w-4" />,
  month: <CalendarRange className="h-4 w-4" />,
  year: <LayoutGrid className="h-4 w-4" />,
};

const CalendarPage = () => {
  const { trainings, getCategoryById, categories } = useTraining();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [miniCalendarOpen, setMiniCalendarOpen] = useState(false);

  // Check if a date falls within a training's date range
  const isDateInTrainingRange = (date: Date, training: Training) => {
    const startDate = safeDate(training.date);
    const endDate = training.endDate ? safeDate(training.endDate) : startDate;
    
    // Normalize dates to start of day for comparison
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  };

  const getTrainingsForDate = (date: Date) => {
    return trainings.filter((training) => isDateInTrainingRange(date, training));
  };

  const getTrainingsForWeek = (date: Date) => {
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    return trainings.filter((training) => {
      const trainingStart = safeDate(training.date);
      const trainingEnd = training.endDate ? safeDate(training.endDate) : trainingStart;
      // Training overlaps with the week if it starts before week ends and ends after week starts
      return trainingStart <= end && trainingEnd >= start;
    });
  };

  const getTrainingsForMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return trainings.filter((training) => {
      const trainingStart = safeDate(training.date);
      const trainingEnd = training.endDate ? safeDate(training.endDate) : trainingStart;
      return trainingStart <= end && trainingEnd >= start;
    });
  };

  const getTrainingsForYear = (date: Date) => {
    const start = startOfYear(date);
    const end = endOfYear(date);
    return trainings.filter((training) => {
      const trainingStart = safeDate(training.date);
      const trainingEnd = training.endDate ? safeDate(training.endDate) : trainingStart;
      return trainingStart <= end && trainingEnd >= start;
    });
  };

  // Get category color for styling
  const getCategoryColor = (categoryId: string) => {
    const category = getCategoryById(categoryId);
    return category?.color || 'hsl(var(--primary))';
  };

  // Get sidebar trainings based on current view
  const sidebarData = useMemo(() => {
    switch (view) {
      case 'day':
        return {
          trainings: getTrainingsForDate(currentDate),
          label: format(currentDate, 'EEEE, MMMM d'),
          description: `Trainings for ${format(currentDate, 'MMMM d, yyyy')}`,
        };
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return {
          trainings: getTrainingsForWeek(currentDate),
          label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,
          description: 'Trainings for this week',
        };
      case 'month':
        return {
          trainings: getTrainingsForMonth(currentDate),
          label: format(currentDate, 'MMMM yyyy'),
          description: 'Trainings for this month',
        };
      case 'year':
        return {
          trainings: getTrainingsForYear(currentDate),
          label: format(currentDate, 'yyyy'),
          description: 'Trainings for this year',
        };
    }
  }, [view, currentDate, trainings]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const operations = {
      day: direction === 'prev' ? (d: Date) => addDays(d, -1) : (d: Date) => addDays(d, 1),
      week: direction === 'prev' ? subWeeks : addWeeks,
      month: direction === 'prev' ? subMonths : addMonths,
      year: direction === 'prev' ? subYears : addYears,
    };
    setCurrentDate(operations[view](currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleTrainingClick = (training: Training) => {
    navigate(`/training/${training.id}`);
  };

  // Parse time string (HH:mm) to get hour and minutes
  const parseTimeToHour = (time: string | undefined): { hour: number; minutes: number } | null => {
    if (!time) return null;
    const [hours, minutes] = time.split(':').map(Number);
    return { hour: hours, minutes: minutes || 0 };
  };

  // Calculate training position and height based on time
  const getTrainingTimeSlot = (training: Training) => {
    const fromTime = parseTimeToHour(training.timeFrom);
    const toTime = parseTimeToHour(training.timeTo);
    
    if (!fromTime) return null;
    
    const startHour = fromTime.hour + fromTime.minutes / 60;
    const endHour = toTime ? toTime.hour + toTime.minutes / 60 : startHour + 1;
    const duration = endHour - startHour;
    
    return { startHour, endHour, duration, fromHour: fromTime.hour };
  };

  const renderDayView = () => {
    const dayTrainings = getTrainingsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourHeight = 60; // Height of each hour slot in pixels

    // Get trainings with their time slots
    const trainingsWithSlots = dayTrainings
      .map(training => ({
        training,
        slot: getTrainingTimeSlot(training)
      }))
      .filter(item => item.slot !== null);

    return (
      <div className="border border-border rounded-xl overflow-hidden">
        {/* Day Header */}
        <div className={cn(
          "bg-primary text-primary-foreground p-4 text-center",
          isToday(currentDate) && "bg-primary"
        )}>
          <div className="text-sm font-medium opacity-90">{format(currentDate, 'EEEE')}</div>
          <div className="text-4xl font-bold">{format(currentDate, 'd')}</div>
          <div className="text-sm opacity-80">{format(currentDate, 'MMMM yyyy')}</div>
        </div>

        {/* Timeline */}
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map((hour) => {
            // Find trainings that START at this hour
            const hourTrainings = trainingsWithSlots.filter(({ slot }) => 
              slot && Math.floor(slot.startHour) === hour
            );
            
            // Check if this hour is within any training's time range (for background highlight)
            // Include the end hour in the highlight - if training ends at 15:00, highlight through 3 PM row
            const isWithinTraining = trainingsWithSlots.some(({ slot }) => 
              slot && hour >= Math.floor(slot.startHour) && hour < slot.endHour
            );

            return (
              <div 
                key={hour} 
                className={cn(
                  "flex border-b border-border last:border-b-0 relative",
                  isWithinTraining && "bg-primary/5"
                )}
                style={{ minHeight: hourHeight }}
              >
                {/* Time label */}
                <div className="w-16 shrink-0 p-2 text-xs text-muted-foreground text-right border-r border-border bg-muted/30">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>
                
                {/* Content area */}
                <div className="flex-1 relative p-1">
                  {hourTrainings.map(({ training, slot }) => {
                    if (!slot) return null;
                    const categoryColor = getCategoryColor(training.categoryId);
                    // Calculate height based on duration (spans multiple hours)
                    const durationHours = slot.endHour - slot.startHour;
                    // Height spans full duration, minimal gap for cleaner look
                    const height = Math.max(durationHours * hourHeight - 2, 52);
                    // Calculate top offset for minutes within the hour
                    const minuteOffset = (slot.startHour - Math.floor(slot.startHour)) * hourHeight;

                    return (
                      <button
                        key={training.id}
                        onClick={() => handleTrainingClick(training)}
                        className="absolute left-1 right-1 p-2 rounded-lg border-l-4 transition-all hover:shadow-md z-10 text-left overflow-hidden"
                        style={{
                          top: `${minuteOffset + 4}px`,
                          height: `${height}px`,
                          backgroundColor: `${categoryColor}15`,
                          borderLeftColor: categoryColor,
                          boxShadow: `0 1px 3px ${categoryColor}20`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: categoryColor }}
                          />
                          <div className="font-semibold text-sm truncate">{training.name}</div>
                        </div>
                        <div className="text-xs font-medium ml-5 mt-1" style={{ color: categoryColor }}>
                          {formatTimeRange(training.timeFrom, training.timeTo)}
                        </div>
                        {height > 80 && (
                          <>
                            <div className="text-xs text-muted-foreground ml-5 mt-1">
                              {training.duration}
                            </div>
                            <div className="text-xs text-muted-foreground ml-5">
                              📍 {training.location}
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayTrainings = getTrainingsForDate(day);
      const isCurrentDay = isToday(day);

      days.push(
        <div key={day.toString()} className="border border-border rounded-xl overflow-hidden">
          <div className={cn(
            "p-3 text-center font-semibold border-b border-border",
            isCurrentDay ? "bg-primary text-primary-foreground" : "bg-muted/50"
          )}>
            <div className="text-xs opacity-80">{format(day, 'EEE')}</div>
            <div className="text-xl">{format(day, 'd')}</div>
          </div>
          <div className="p-2 space-y-2 min-h-[200px] bg-background">
            {dayTrainings.map((training) => {
              const categoryColor = getCategoryColor(training.categoryId);
              return (
                <Tooltip key={training.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleTrainingClick(training)}
                      className="w-full text-left text-sm p-2 rounded-lg border transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: `${categoryColor}20`,
                        borderColor: `${categoryColor}40`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: categoryColor }}
                        />
                        <div className="font-medium truncate">{training.name}</div>
                      </div>
                      <div className="text-xs opacity-80 mt-0.5 ml-4">
                        {training.timeFrom ? formatTimeRange(training.timeFrom, training.timeTo) : format(safeDate(training.date), 'h:mm a')}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <TrainingTooltipContent training={training} />
                  </TooltipContent>
                </Tooltip>
              );
            })}
            {dayTrainings.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4 opacity-50">
                No trainings
              </div>
            )}
          </div>
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-2">{days}</div>;
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayTrainings = getTrainingsForDate(currentDay);
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isCurrentDay = isToday(currentDay);

        days.push(
          <div
            key={currentDay.toString()}
            className={cn(
              'min-h-[100px] border border-border p-2 transition-colors',
              !isCurrentMonth && 'bg-muted/30',
              isCurrentDay && 'ring-2 ring-primary ring-inset'
            )}
          >
            <div className={cn(
              'text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full',
              !isCurrentMonth && 'text-muted-foreground',
              isCurrentDay && 'bg-primary text-primary-foreground'
            )}>
              {format(currentDay, 'd')}
            </div>
            <div className="space-y-1">
              {dayTrainings.slice(0, 2).map((training) => {
                const categoryColor = getCategoryColor(training.categoryId);
                return (
                  <Tooltip key={training.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleTrainingClick(training)}
                        className="w-full text-left text-xs p-1.5 rounded border transition-colors hover:opacity-80 truncate flex items-center gap-1.5"
                        style={{
                          backgroundColor: `${categoryColor}20`,
                          borderColor: `${categoryColor}40`,
                        }}
                      >
                        <div 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: categoryColor }}
                        />
                        <span className="truncate">{training.name}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <TrainingTooltipContent training={training} />
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              {dayTrainings.length > 2 && (
                <div className="text-xs text-muted-foreground font-medium">
                  +{dayTrainings.length - 2} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-primary text-primary-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="p-3 text-center font-semibold text-sm">
              {d}
            </div>
          ))}
        </div>
        {rows}
      </div>
    );
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    // Get total trainings for the year
    const yearTrainings = trainings.filter(t => {
      const d = safeDate(t.date);
      return d >= yearStart && d <= yearEnd;
    });

    // Get category summary for the year
    const categorySummary = categories.reduce((acc, category) => {
      const count = yearTrainings.filter(t => t.categoryId === category.id).length;
      if (count > 0) {
        acc.push({ ...category, count });
      }
      return acc;
    }, [] as Array<{ id: string; name: string; color: string; count: number }>);

    // Handle month card click - navigate to month view
    const handleMonthClick = (month: Date) => {
      setCurrentDate(month);
      setView('month');
    };

    return (
      <div className="space-y-6">
        {/* Year Summary Header */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 rounded-2xl p-6 border border-border/50 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{format(currentDate, 'yyyy')} Overview</h2>
                  <p className="text-muted-foreground text-sm">
                    {yearTrainings.length} training{yearTrainings.length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
              </div>
            </div>
            
            {/* Category Legend */}
            {categorySummary.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categorySummary.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border bg-card/50 backdrop-blur-sm transition-all hover:scale-105 cursor-default"
                    style={{
                      borderColor: `${cat.color}40`,
                    }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold">{cat.name}</span>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      {cat.count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { 
              label: 'Total Trainings', 
              value: yearTrainings.length, 
              icon: CalendarIcon,
              color: 'text-primary'
            },
            { 
              label: 'Upcoming', 
              value: yearTrainings.filter(t => safeDate(t.date) >= new Date()).length,
              icon: CalendarRange,
              color: 'text-blue-500'
            },
            { 
              label: 'Completed', 
              value: yearTrainings.filter(t => t.status === 'Completed').length,
              icon: Users,
              color: 'text-green-500'
            },
            { 
              label: 'Categories', 
              value: categorySummary.length,
              icon: LayoutGrid,
              color: 'text-purple-500'
            },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-muted/50", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Months Grid - 3 columns layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {months.map((month) => {
            const monthTrainings = getTrainingsForMonth(month);
            const isCurrentMonth = isSameMonth(month, new Date());
            const isPastMonth = endOfMonth(month) < new Date() && !isCurrentMonth;

            return (
              <div 
                key={month.toString()} 
                className={cn(
                  "group relative bg-card border rounded-2xl overflow-hidden transition-all duration-300",
                  "hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1",
                  isCurrentMonth 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary/50" 
                    : "border-border hover:border-primary/30",
                  isPastMonth && "opacity-75"
                )}
              >
                {/* Current Month Indicator */}
                {isCurrentMonth && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 shadow-md">
                      Current
                    </Badge>
                  </div>
                )}

                {/* Clickable Month Header */}
                <button
                  onClick={() => handleMonthClick(month)}
                  className={cn(
                    "w-full relative px-4 py-4 border-b text-left transition-colors",
                    isCurrentMonth 
                      ? "bg-primary text-primary-foreground border-primary/30" 
                      : "bg-muted/30 border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{format(month, 'MMMM')}</h3>
                      <ChevronRight className={cn(
                        "w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5",
                        isCurrentMonth ? "text-primary-foreground/80" : "text-muted-foreground"
                      )} />
                    </div>
                    {!isCurrentMonth && (
                      <Badge 
                        variant="outline" 
                        className="text-[10px] bg-background/50"
                      >
                        {monthTrainings.length}
                      </Badge>
                    )}
                  </div>
                </button>

                {/* Mini Calendar Grid */}
                <div className="p-3 pb-2">
                  <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground/70 py-0.5">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: 42 }, (_, i) => {
                      const firstDayOfMonth = startOfMonth(month);
                      const startDay = firstDayOfMonth.getDay();
                      const dayNumber = i - startDay + 1;
                      const isValidDay = dayNumber > 0 && dayNumber <= endOfMonth(month).getDate();
                      const currentDayDate = isValidDay ? new Date(month.getFullYear(), month.getMonth(), dayNumber) : null;
                      const dayTrainings = currentDayDate ? getTrainingsForDate(currentDayDate) : [];
                      const hasTraining = dayTrainings.length > 0;
                      const isTodays = currentDayDate ? isToday(currentDayDate) : false;
                      const isPast = currentDayDate ? currentDayDate < new Date() && !isTodays : false;

                      const dateCell = (
                        <div
                          className={cn(
                            "aspect-square flex items-center justify-center text-[10px] rounded-md relative transition-colors cursor-default",
                            !isValidDay && "invisible",
                            isTodays && "bg-primary text-primary-foreground font-bold shadow-sm",
                            hasTraining && !isTodays && "font-bold bg-accent/30 hover:bg-accent/50",
                            isPast && !hasTraining && "text-muted-foreground/50",
                            hasTraining && "cursor-pointer"
                          )}
                        >
                          {isValidDay && (
                            <>
                              {dayNumber}
                              {hasTraining && !isTodays && (
                                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-px">
                                  {dayTrainings.slice(0, 3).map((t, idx) => (
                                    <div
                                      key={idx}
                                      className="w-1 h-1 rounded-full"
                                      style={{ backgroundColor: getCategoryColor(t.categoryId) }}
                                    />
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );

                      if (hasTraining && currentDayDate) {
                        return (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              {dateCell}
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs p-0">
                              <div className="p-2 space-y-1.5">
                                <div className="text-xs font-semibold text-foreground border-b border-border pb-1.5">
                                  {format(currentDayDate, 'EEEE, MMM d')}
                                </div>
                                {dayTrainings.map((training) => {
                                  const categoryColor = getCategoryColor(training.categoryId);
                                  return (
                                    <div key={training.id} className="flex items-start gap-2">
                                      <div 
                                        className="w-2 h-2 rounded-full mt-1 shrink-0"
                                        style={{ backgroundColor: categoryColor }}
                                      />
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium truncate">{training.name}</p>
                                        {training.timeFrom && (
                                          <p className="text-[10px] text-muted-foreground">
                                            {formatTimeRange(training.timeFrom, training.timeTo)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return <div key={i}>{dateCell}</div>;
                    })}
                  </div>
                </div>

                {/* Trainings List */}
                <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-border/50">
                  {monthTrainings.length > 0 ? (
                    <>
                      {monthTrainings.slice(0, 2).map((training) => {
                        const categoryColor = getCategoryColor(training.categoryId);
                        return (
                          <Tooltip key={training.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTrainingClick(training);
                                }}
                                className="w-full text-left text-xs p-2 rounded-lg border transition-all duration-200 hover:shadow-md flex items-center gap-2 group/item"
                                style={{
                                  backgroundColor: `${categoryColor}08`,
                                  borderColor: `${categoryColor}20`,
                                }}
                              >
                                <div 
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: categoryColor }}
                                />
                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                  <span className="font-semibold text-foreground shrink-0">{format(safeDate(training.date), 'd')}</span>
                                  <span className="text-muted-foreground shrink-0">•</span>
                                  <span className="truncate text-muted-foreground group-hover/item:text-foreground transition-colors">{training.name}</span>
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs z-[100]">
                              <TrainingTooltipContent training={training} />
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      {monthTrainings.length > 2 && (
                        <button
                          onClick={() => handleMonthClick(month)}
                          className="w-full text-[11px] text-primary font-semibold text-center py-1.5 rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
                        >
                          <span>+{monthTrainings.length - 2} more trainings</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-[11px] text-muted-foreground/60 text-center py-3 italic">
                      No trainings scheduled
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getHeaderText = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'year':
        return format(currentDate, 'yyyy');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <AnimateIn>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                <CalendarIcon className="h-8 w-8 text-primary" />
                Training Calendar
              </h1>
              <p className="text-muted-foreground mt-1">View and manage your training schedule</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(['day', 'week', 'month', 'year'] as ViewType[]).map((v) => (
                  <Button
                    key={v}
                    variant={view === v ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView(v)}
                    className={cn(
                      "capitalize rounded-none gap-1.5",
                      view !== v && "hover:bg-muted"
                    )}
                  >
                    {viewIcons[v]}
                    <span className="hidden sm:inline">{v}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </AnimateIn>

        {/* Navigation */}
        <AnimateIn delay={50}>
          <div className="flex items-center justify-between mb-6 bg-card border border-border rounded-xl p-3">
            <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            {/* Clickable header with mini calendar */}
            <Popover open={miniCalendarOpen} onOpenChange={setMiniCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-xl md:text-2xl font-bold text-foreground hover:bg-accent gap-2"
                >
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  {getHeaderText()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <div className="p-3 border-b border-border bg-muted/30">
                  <p className="text-sm font-medium text-center">Jump to date</p>
                </div>
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => {
                    if (date) {
                      setCurrentDate(date);
                      setMiniCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
                <div className="p-2 border-t border-border flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setCurrentDate(new Date());
                      setMiniCalendarOpen(false);
                    }}
                  >
                    Today
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </AnimateIn>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar */}
          <AnimateIn delay={100} className="flex-1 min-w-0">
            <div className="overflow-x-auto">
              {view === 'day' && renderDayView()}
              {view === 'week' && renderWeekView()}
              {view === 'month' && renderMonthView()}
              {view === 'year' && renderYearView()}
            </div>
          </AnimateIn>

          {/* Smart Sidebar */}
          <AnimateIn from="right" delay={150} className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-4">
              <CalendarSidebar
                trainings={sidebarData.trainings}
                viewLabel={sidebarData.label}
                viewDescription={sidebarData.description}
                categories={categories}
                showYearSummary={view === 'year'}
              />
            </div>
          </AnimateIn>
        </div>
      </div>
    </Layout>
  );
};

function TrainingTooltipContent({ training }: { training: Training }) {
  return (
    <div className="space-y-2 p-1">
      <div className="font-semibold">{training.name}</div>
      <div className="flex flex-wrap gap-1">
        <CategoryBadge categoryId={training.categoryId} className="text-xs" />
        <StatusBadge status={training.status} className="text-xs" />
      </div>
      <div className="text-sm flex items-center gap-2">
        <CalendarIcon className="h-4 w-4" />
        {format(safeDate(training.date), 'MMM d, yyyy')}
        {training.timeFrom && ` • ${formatTimeRange(training.timeFrom, training.timeTo)}`}
      </div>
      <div className="text-sm flex items-center gap-2">
        <Users className="h-4 w-4" />
        {training.availableSlots} slots available
      </div>
    </div>
  );
}

export default CalendarPage;