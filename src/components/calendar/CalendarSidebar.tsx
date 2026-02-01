import { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Training, TrainingStatus, Category } from '@/types/training';
import { CategoryBadge } from '@/components/training/CategoryBadge';
import { StatusBadge } from '@/components/training/StatusBadge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimateIn } from '@/components/ui/animate-in';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, MapPin, ChevronRight, Search, SortAsc, Filter, X } from 'lucide-react';
import { safeDate, formatTimeRange } from '@/lib/dateUtils';
import { Button } from '@/components/ui/button';

interface CalendarSidebarProps {
  trainings: Training[];
  viewLabel: string;
  viewDescription: string;
  categories: Category[];
  showYearSummary?: boolean;
}

type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc' | 'slots-asc' | 'slots-desc';

export function CalendarSidebar({ 
  trainings, 
  viewLabel, 
  viewDescription, 
  categories,
  showYearSummary = false 
}: CalendarSidebarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Category summary for year view
  const categorySummary = useMemo(() => {
    const summary: Record<string, { count: number; category: Category }> = {};
    trainings.forEach((training) => {
      const category = categories.find((c) => c.id === training.categoryId);
      if (category) {
        if (!summary[category.id]) {
          summary[category.id] = { count: 0, category };
        }
        summary[category.id].count++;
      }
    });
    return Object.values(summary).sort((a, b) => b.count - a.count);
  }, [trainings, categories]);

  // Filter and sort trainings
  const filteredAndSortedTrainings = useMemo(() => {
    let result = [...trainings];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.location?.toLowerCase().includes(query) ||
          t.speakers?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter((t) => t.categoryId === filterCategory);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter((t) => t.status === filterStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return safeDate(a.date).getTime() - safeDate(b.date).getTime();
        case 'date-desc':
          return safeDate(b.date).getTime() - safeDate(a.date).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'slots-asc':
          return a.availableSlots - b.availableSlots;
        case 'slots-desc':
          return b.availableSlots - a.availableSlots;
        default:
          return 0;
      }
    });

    return result;
  }, [trainings, searchQuery, filterCategory, filterStatus, sortBy]);

  const hasActiveFilters = searchQuery || filterCategory !== 'all' || filterStatus !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterStatus('all');
  };

  const statuses: TrainingStatus[] = ['Scheduled', 'Rescheduled', 'In Progress', 'On Hold', 'Cancelled', 'Completed'];

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">{viewLabel}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{viewDescription}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {filteredAndSortedTrainings.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {filteredAndSortedTrainings.length === 1 ? 'training' : 'trainings'}
            {hasActiveFilters ? ' found' : ' scheduled'}
          </span>
        </div>
      </div>

      {/* Year Summary */}
      {showYearSummary && categorySummary.length > 0 && (
        <div className="p-4 border-b border-border shrink-0">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Category Summary
          </h4>
          <div className="space-y-2">
            {categorySummary.map(({ count, category }) => (
              <button
                key={category.id}
                onClick={() => setFilterCategory(filterCategory === category.id ? 'all' : category.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                  filterCategory === category.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/30 hover:bg-accent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <span className="text-xs font-semibold bg-muted px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="p-3 border-b border-border shrink-0 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trainings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Sort & Filter Row */}
        <div className="flex gap-2">
          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SortAsc className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Date (Earliest)</SelectItem>
              <SelectItem value="date-desc">Date (Latest)</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="slots-asc">Slots (Low-High)</SelectItem>
              <SelectItem value="slots-desc">Slots (High-Low)</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs">
            <Filter className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="w-full h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </Button>
        )}
      </div>

      {/* Training List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {filteredAndSortedTrainings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {hasActiveFilters ? 'No trainings match your filters' : 'No trainings scheduled'}
              </p>
              <p className="text-xs mt-1">
                {hasActiveFilters ? 'Try adjusting your search or filters' : 'Check back later for updates'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-2 text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            filteredAndSortedTrainings.map((training, index) => {
              const category = categories.find((c) => c.id === training.categoryId);
              return (
                <AnimateIn key={training.id} delay={index * 30} from="right">
                  <button
                    onClick={() => navigate(`/training/${training.id}`)}
                    className="w-full text-left p-4 rounded-lg border border-border bg-background hover:bg-accent hover:border-primary/30 transition-all group"
                    style={{
                      borderLeftWidth: '3px',
                      borderLeftColor: category?.color || 'hsl(var(--border))',
                    }}
                  >
                    {/* Date & Time Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {format(safeDate(training.date), 'MMM d, yyyy')}
                          {training.endDate && safeDate(training.endDate).getTime() !== safeDate(training.date).getTime() && 
                            ` - ${format(safeDate(training.endDate), 'MMM d')}`
                          }
                        </span>
                        {training.timeFrom && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{formatTimeRange(training.timeFrom, training.timeTo)}</span>
                          </>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    {/* Training Name */}
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                      {training.name}
                    </h4>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <CategoryBadge categoryId={training.categoryId} className="text-xs" />
                      <StatusBadge status={training.status} className="text-xs" />
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span>{training.availableSlots} / {training.maxRegistrations} slots available</span>
                      </div>
                      {training.location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{training.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Time until training */}
                    <div className="mt-3 pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(safeDate(training.date), { addSuffix: true })}
                      </span>
                    </div>
                  </button>
                </AnimateIn>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}