import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Plus, Pencil, Trash2, FileText, Search, 
  Star, Sparkles, Calendar, Users, MapPin,
  GraduationCap, Filter, MoreHorizontal,
  CheckCircle, XCircle, Eye, X
} from 'lucide-react';
import { useTraining } from '@/context/TrainingContext';
import { Training } from '@/types/training';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryBadge } from '@/components/training/CategoryBadge';
import { StatusBadge } from '@/components/training/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { safeDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type SortField = 'name' | 'date' | 'status' | 'availableSlots';
type SortDirection = 'asc' | 'desc';

export function ManageTrainings() {
  const navigate = useNavigate();
  const { trainings, categories, deleteTraining, getTrainingById, addTrainingUpdate } = useTraining();
  const { toast } = useToast();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filtered and sorted trainings
  const filteredTrainings = useMemo(() => {
    let result = [...trainings];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.speakers?.toLowerCase().includes(query) ||
        t.location?.toLowerCase().includes(query)
      );
    }

    if (filterCategory !== 'all') {
      result = result.filter(t => t.categoryId === filterCategory);
    }

    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = safeDate(a.date).getTime() - safeDate(b.date).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'availableSlots':
          comparison = a.availableSlots - b.availableSlots;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [trainings, searchQuery, filterCategory, filterStatus, sortField, sortDirection]);

  // KPIs
  const kpis = useMemo(() => ({
    total: trainings.length,
    featured: trainings.filter(t => t.isFeatured).length,
    recommended: trainings.filter(t => t.isRecommended).length,
    open: trainings.filter(t => t.isRegistrationOpen).length,
    scheduled: trainings.filter(t => t.status === 'Scheduled').length,
  }), [trainings]);

  const handleDelete = async (id: string) => {
    const training = getTrainingById(id);
    await deleteTraining(id);
    if (training) {
      await addTrainingUpdate({
        type: 'training_removed',
        trainingId: id,
        trainingName: training.name,
        message: 'Training removed',
      });
    }
    toast({ title: 'Success', description: 'Training deleted successfully' });
    setDeleteConfirm(null);
  };

  const hasActiveFilters = filterCategory !== 'all' || filterStatus !== 'all' || searchQuery;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Training Management</h1>
            <p className="text-sm text-muted-foreground">Create and manage training sessions</p>
          </div>
        </div>
        <Button onClick={() => navigate('/admin/training/new')} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add Training
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{kpis.total}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Trainings</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-3xl font-bold tracking-tight text-amber-600">{kpis.featured}</p>
            <p className="text-xs text-muted-foreground font-medium">Featured</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold tracking-tight text-purple-600">{kpis.recommended}</p>
            <p className="text-xs text-muted-foreground font-medium">Recommended</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold tracking-tight text-primary">{kpis.open}</p>
            <p className="text-xs text-muted-foreground font-medium">Open Registration</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold tracking-tight text-blue-600">{kpis.scheduled}</p>
            <p className="text-xs text-muted-foreground font-medium">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trainings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-background/50 border-border/50 focus:border-primary/50"
          />
        </div>
        <Button 
          variant={showFilters ? "secondary" : "outline"} 
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2 h-11"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {[filterCategory !== 'all', filterStatus !== 'all'].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm animate-scale-in">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Sort By</Label>
                <Select value={`${sortField}-${sortDirection}`} onValueChange={(v) => {
                  const [field, dir] = v.split('-') as [SortField, SortDirection];
                  setSortField(field);
                  setSortDirection(dir);
                }}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="availableSlots-desc">Slots (Most)</SelectItem>
                    <SelectItem value="availableSlots-asc">Slots (Least)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
              <Button variant="ghost" size="sm" onClick={() => {
                setFilterCategory('all');
                setFilterStatus('all');
                setSearchQuery('');
              }} className="text-muted-foreground">
                <X className="h-3 w-3 mr-1" /> Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trainings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTrainings.length === 0 ? (
          <Card className="col-span-full border-border/50">
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">No trainings found</p>
              <p className="text-sm text-muted-foreground/70">Try adjusting your filters or add a new training</p>
            </CardContent>
          </Card>
        ) : (
          filteredTrainings.map((training, index) => {
            const category = categories.find(c => c.id === training.categoryId);
            const isOpen = training.isRegistrationOpen ?? true;
            const capacityPercent = ((training.maxRegistrations - training.availableSlots) / training.maxRegistrations) * 100;

            return (
              <Card 
                key={training.id} 
                className={cn(
                  "group overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300",
                  training.isFeatured && "ring-2 ring-amber-500/30",
                  training.isRecommended && !training.isFeatured && "ring-2 ring-purple-500/30"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Image Section */}
                <div className="relative h-36 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                  {training.heroImage ? (
                    <img 
                      src={training.heroImage} 
                      alt={training.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Featured/Recommended Badges */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                    {training.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-amber-500 text-white shadow-sm">
                        <Star className="h-3 w-3" />
                        Featured
                      </span>
                    )}
                    {training.isRecommended && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-500 text-white shadow-sm">
                        <Sparkles className="h-3 w-3" />
                        Recommended
                      </span>
                    )}
                  </div>

                  {/* Registration Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm",
                      isOpen 
                        ? "bg-primary/90 text-primary-foreground" 
                        : "bg-destructive/90 text-destructive-foreground"
                    )}>
                      {isOpen ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/training/${training.id}/edit`)} className="gap-2">
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="gap-2">
                          <a href={`/training/${training.id}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" /> View Page
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirm(training.id)} 
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Content Section */}
                <CardContent className="p-4 space-y-3">
                  {/* Category & Status */}
                  <div className="flex flex-wrap gap-1.5">
                    <CategoryBadge categoryId={training.categoryId} showIcon={false} />
                    <StatusBadge status={training.status} showIcon={false} />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-base line-clamp-2 min-h-[2.5rem]">
                    {training.name}
                  </h3>

                  {/* Meta Info */}
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{format(safeDate(training.date), 'MMM d, yyyy')}</span>
                      {training.timeFrom && (
                        <span className="text-xs">• {training.timeFrom}</span>
                      )}
                    </div>
                    {training.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{training.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{training.availableSlots} / {training.maxRegistrations} slots</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="pt-2">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          capacityPercent >= 90 ? "bg-destructive" :
                          capacityPercent >= 70 ? "bg-amber-500" : "bg-primary"
                        )}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(capacityPercent)}% filled
                    </p>
                  </div>

                  {/* Attachments indicator */}
                  {training.attachments && training.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <FileText className="h-3 w-3" />
                      {training.attachments.length} attachment{training.attachments.length > 1 ? 's' : ''}
                    </div>
                  )}
                </CardContent>

                {/* Footer Actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1.5"
                    onClick={() => navigate(`/admin/training/${training.id}/edit`)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirm(training.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All associated data including registrations may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
