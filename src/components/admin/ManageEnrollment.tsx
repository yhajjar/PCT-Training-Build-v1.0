import { useState, useMemo, useCallback } from 'react';
import { format as formatDate } from 'date-fns';
import {
  Plus, Search, Filter, Download, ChevronDown, ChevronUp,
  Users, CheckCircle, Clock, XCircle, UserCheck, UserX,
  MoreHorizontal, Mail, Trash2, Eye, X, FileSpreadsheet, FileText, AlertTriangle,
  FileCheck, FileClock, ShieldCheck, PauseCircle, Sparkles, TrendingUp
} from 'lucide-react';
import { useTraining } from '@/context/TrainingContext';
import { Registration, EnrollmentStatus, AttendanceStatus } from '@/types/training';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { EnrollmentStatusBadge, AttendanceStatusBadge } from './EnrollmentStatusBadge';
import { CategoryBadge } from '@/components/training/CategoryBadge';
import { useToast } from '@/hooks/use-toast';
import { safeDate } from '@/lib/dateUtils';
import { registrationSchema, validateForm } from '@/lib/validation';
import { prepareEnrollmentExportData, exportToCSV, exportToXLS } from '@/lib/exportUtils';
import { cn } from '@/lib/utils';
import {
  statusesRequiringConfirmation,
  enrollmentStatusLabels,
  attendanceStatusLabels,
} from '@/lib/enrollmentValidation';

type SortField = 'participantName' | 'registeredAt' | 'status' | 'attendanceStatus';
type SortDirection = 'asc' | 'desc';

interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
}

interface FilterState {
  search: string;
  status: EnrollmentStatus | 'all';
  attendance: AttendanceStatus | 'all';
  trainingId: string;
  categoryId: string;
}

interface StatusChangeConfirmation {
  registrationId: string;
  newStatus: EnrollmentStatus;
  reason: string;
}

interface BulkActionConfirmation {
  type: string;
  ids: string[];
  reason: string;
}

const defaultFilters: FilterState = {
  search: '',
  status: 'all',
  attendance: 'all',
  trainingId: 'all',
  categoryId: 'all',
};

const allEnrollmentStatuses: EnrollmentStatus[] = [
  'registered', 'pending_approval', 'hr_approval', 'confirmed', 'cancelled', 'on_hold', 'waitlisted'
];

const allAttendanceStatuses: AttendanceStatus[] = ['pending', 'attended', 'no_show'];

// Status icons mapping
const statusIcons: Record<EnrollmentStatus, React.ReactNode> = {
  registered: <FileCheck className="h-4 w-4" />,
  pending_approval: <FileClock className="h-4 w-4" />,
  hr_approval: <ShieldCheck className="h-4 w-4" />,
  confirmed: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
  on_hold: <PauseCircle className="h-4 w-4" />,
  waitlisted: <Clock className="h-4 w-4" />,
};

export function ManageEnrollment() {
  const { trainings, registrations, categories, addRegistration, updateRegistration, deleteRegistration } = useTraining();
  const { toast } = useToast();
  
  // State
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sortField, setSortField] = useState<SortField>('registeredAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [detailDrawerReg, setDetailDrawerReg] = useState<Registration | null>(null);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Confirmation dialogs
  const [statusConfirmation, setStatusConfirmation] = useState<StatusChangeConfirmation | null>(null);
  const [bulkConfirmation, setBulkConfirmation] = useState<BulkActionConfirmation | null>(null);
  const [confirmReason, setConfirmReason] = useState('');
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTrainingId, setFormTrainingId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Filtered and sorted registrations
  const filteredRegistrations = useMemo(() => {
    let result = [...registrations];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.participantName.toLowerCase().includes(searchLower) ||
          r.participantEmail.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== 'all') {
      result = result.filter((r) => r.status === filters.status);
    }

    if (filters.attendance !== 'all') {
      result = result.filter((r) => r.attendanceStatus === filters.attendance);
    }

    if (filters.trainingId !== 'all') {
      result = result.filter((r) => r.trainingId === filters.trainingId);
    }

    if (filters.categoryId !== 'all') {
      const trainingIds = trainings
        .filter((t) => t.categoryId === filters.categoryId)
        .map((t) => t.id);
      result = result.filter((r) => trainingIds.includes(r.trainingId));
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'participantName':
          comparison = a.participantName.localeCompare(b.participantName);
          break;
        case 'registeredAt':
          comparison = safeDate(a.registeredAt).getTime() - safeDate(b.registeredAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'attendanceStatus':
          comparison = a.attendanceStatus.localeCompare(b.attendanceStatus);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [registrations, filters, sortField, sortDirection, trainings]);

  // KPI calculations
  const kpis = useMemo(() => {
    const targetRegs = filters.trainingId !== 'all' 
      ? registrations.filter((r) => r.trainingId === filters.trainingId)
      : registrations;

    const registered = targetRegs.filter((r) => r.status === 'registered').length;
    const pendingApproval = targetRegs.filter((r) => r.status === 'pending_approval').length;
    const hrApproval = targetRegs.filter((r) => r.status === 'hr_approval').length;
    const confirmed = targetRegs.filter((r) => r.status === 'confirmed').length;
    const waitlisted = targetRegs.filter((r) => r.status === 'waitlisted').length;
    const onHold = targetRegs.filter((r) => r.status === 'on_hold').length;
    const cancelled = targetRegs.filter((r) => r.status === 'cancelled').length;
    const attended = targetRegs.filter((r) => r.attendanceStatus === 'attended').length;
    const noShow = targetRegs.filter((r) => r.attendanceStatus === 'no_show').length;

    return { 
      total: targetRegs.length, 
      registered,
      pendingApproval,
      hrApproval,
      confirmed, 
      waitlisted, 
      onHold,
      cancelled, 
      attended, 
      noShow 
    };
  }, [registrations, filters.trainingId]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRegistrations.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  // Admin can change status freely - only show confirmation for cancelled/on_hold
  const handleStatusChange = useCallback(async (reg: Registration, newStatus: EnrollmentStatus) => {
    if (statusesRequiringConfirmation.includes(newStatus)) {
      setStatusConfirmation({ registrationId: reg.id, newStatus, reason: '' });
      setConfirmReason('');
      return;
    }

    await updateRegistration({ ...reg, status: newStatus });
    toast({ title: 'Status Updated', description: `Changed to ${enrollmentStatusLabels[newStatus]}` });
    
    if (detailDrawerReg?.id === reg.id) {
      setDetailDrawerReg({ ...reg, status: newStatus });
    }
  }, [updateRegistration, toast, detailDrawerReg]);

  const executeStatusChange = useCallback(async () => {
    if (!statusConfirmation) return;
    
    const reg = registrations.find((r) => r.id === statusConfirmation.registrationId);
    if (!reg) return;

    const updatedReg = { 
      ...reg, 
      status: statusConfirmation.newStatus,
      notes: confirmReason 
        ? `${reg.notes ? reg.notes + '\n' : ''}[${formatDate(new Date(), 'yyyy-MM-dd')}] ${enrollmentStatusLabels[statusConfirmation.newStatus]}: ${confirmReason}`
        : reg.notes
    };
    
    await updateRegistration(updatedReg);
    toast({ title: 'Status Updated', description: `Changed to ${enrollmentStatusLabels[statusConfirmation.newStatus]}` });
    
    if (detailDrawerReg?.id === reg.id) {
      setDetailDrawerReg(updatedReg);
    }
    
    setStatusConfirmation(null);
    setConfirmReason('');
  }, [statusConfirmation, confirmReason, registrations, updateRegistration, toast, detailDrawerReg]);

  // Admin can change attendance freely
  const handleAttendanceChange = useCallback(async (reg: Registration, newStatus: AttendanceStatus) => {
    await updateRegistration({ ...reg, attendanceStatus: newStatus });
    toast({ title: 'Attendance Updated', description: `Marked as ${attendanceStatusLabels[newStatus]}` });
    
    if (detailDrawerReg?.id === reg.id) {
      setDetailDrawerReg({ ...reg, attendanceStatus: newStatus });
    }
  }, [updateRegistration, toast, detailDrawerReg]);

  // Bulk actions - admin can do anything
  const handleBulkAction = useCallback((action: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast({ title: 'No Selection', description: 'Please select enrollments first', variant: 'destructive' });
      return;
    }

    // Show confirmation for destructive or status changes that need reason
    if (action === 'delete' || action === 'cancelled' || action === 'on_hold') {
      setBulkConfirmation({ type: action, ids, reason: '' });
      setConfirmReason('');
      return;
    }

    // Execute immediately for other actions
    executeBulkActionDirect(action, ids);
  }, [selectedIds, toast]);

  const executeBulkActionDirect = useCallback(async (type: string, ids: string[]) => {
    let successCount = 0;

    for (const id of ids) {
      const reg = registrations.find((r) => r.id === id);
      if (!reg) continue;

      if (allEnrollmentStatuses.includes(type as EnrollmentStatus)) {
        await updateRegistration({ ...reg, status: type as EnrollmentStatus });
        successCount++;
      } else if (allAttendanceStatuses.includes(type as AttendanceStatus)) {
        await updateRegistration({ ...reg, attendanceStatus: type as AttendanceStatus });
        successCount++;
      } else if (type === 'notify') {
        await updateRegistration({ ...reg, notifiedAt: new Date() });
        successCount++;
      }
    }

    toast({ title: 'Success', description: `${successCount} enrollment(s) updated` });
    setSelectedIds(new Set());
  }, [registrations, updateRegistration, toast]);

  const executeBulkAction = useCallback(async () => {
    if (!bulkConfirmation) return;

    const { type, ids } = bulkConfirmation;
    let successCount = 0;

    for (const id of ids) {
      const reg = registrations.find((r) => r.id === id);
      if (!reg) continue;

      if (type === 'delete') {
        await deleteRegistration(id);
        successCount++;
      } else if (allEnrollmentStatuses.includes(type as EnrollmentStatus)) {
        const updatedNotes = confirmReason
          ? `${reg.notes ? reg.notes + '\n' : ''}[${formatDate(new Date(), 'yyyy-MM-dd')}] ${enrollmentStatusLabels[type as EnrollmentStatus]}: ${confirmReason}`
          : reg.notes;
        await updateRegistration({ ...reg, status: type as EnrollmentStatus, notes: updatedNotes });
        successCount++;
      }
    }

    toast({ title: 'Success', description: `${successCount} enrollment(s) updated` });
    setSelectedIds(new Set());
    setBulkConfirmation(null);
    setConfirmReason('');
  }, [bulkConfirmation, confirmReason, registrations, updateRegistration, deleteRegistration, toast]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm(registrationSchema, {
      participantName: formName,
      participantEmail: formEmail,
    });

    if (!validation.success) {
      toast({ title: 'Validation Error', description: 'error' in validation ? validation.error : 'Validation failed', variant: 'destructive' });
      return;
    }

    if (!formTrainingId) {
      toast({ title: 'Validation Error', description: 'Please select a training', variant: 'destructive' });
      return;
    }

    await addRegistration({
      trainingId: formTrainingId,
      participantName: formName.trim(),
      participantEmail: formEmail.trim(),
      participantPhone: formPhone.trim() || undefined,
      registeredAt: new Date(),
      status: 'registered',
      attendanceStatus: 'pending',
      notes: formNotes.trim() || undefined,
    });

    toast({ title: 'Success', description: 'Participant added successfully' });
    setShowAddForm(false);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormTrainingId('');
    setFormNotes('');
  };

  const handleExport = (exportFormat: 'csv' | 'xlsx', exportAll: boolean) => {
    try {
      const dataToExport = exportAll ? registrations : filteredRegistrations;
      const exportData = prepareEnrollmentExportData(dataToExport, trainings, categories);
      const filename = `enrollments_${formatDate(new Date(), 'yyyy-MM-dd_HHmm')}`;

      if (exportFormat === 'csv') {
        exportToCSV(exportData, filename);
      } else {
        exportToXLS(exportData, filename);
      }

      toast({ title: 'Export Complete', description: `Exported ${exportData.length} records` });
      setShowExportDialog(false);
    } catch (error) {
      toast({ title: 'Export Failed', description: String(error), variant: 'destructive' });
    }
  };

  const saveCurrentView = () => {
    const name = prompt('Enter a name for this view:');
    if (name) {
      setSavedViews([...savedViews, { id: Date.now().toString(), name, filters }]);
      toast({ title: 'View Saved', description: `"${name}" has been saved` });
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      className="flex items-center gap-1.5 font-semibold text-left hover:text-primary transition-colors group"
      onClick={() => handleSort(field)}
    >
      {label}
      <span className={cn(
        "transition-opacity",
        sortField === field ? "opacity-100" : "opacity-0 group-hover:opacity-50"
      )}>
        {sortField === field && sortDirection === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </span>
    </button>
  );

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.attendance !== 'all' || filters.trainingId !== 'all' || filters.categoryId !== 'all';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Enrollment Management</h1>
            <p className="text-sm text-muted-foreground">Manage participant registrations and attendance</p>
          </div>
        </div>
      </div>

      {/* KPI Cards - Modern Glass Design */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/30 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{kpis.total}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Enrollments</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <Sparkles className="h-4 w-4 text-blue-400/50" />
            </div>
            <p className="text-3xl font-bold tracking-tight text-blue-600">{kpis.registered}</p>
            <p className="text-xs text-muted-foreground font-medium">Registered</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileClock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold tracking-tight text-amber-600">{kpis.pendingApproval + kpis.hrApproval}</p>
            <p className="text-xs text-muted-foreground font-medium">Pending Approval</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold tracking-tight text-primary">{kpis.confirmed}</p>
            <p className="text-xs text-muted-foreground font-medium">Confirmed</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold tracking-tight text-emerald-600">{kpis.attended}</p>
            <p className="text-xs text-muted-foreground font-medium">Attended</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-destructive/10 to-destructive/5 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <UserX className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-3xl font-bold tracking-tight text-destructive">{kpis.noShow}</p>
            <p className="text-xs text-muted-foreground font-medium">No Show</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-11 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={showFilters ? "secondary" : "outline"} 
            onClick={() => setShowFilters(!showFilters)} 
            className="gap-2 h-11"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full font-medium">
                {[filters.status !== 'all', filters.attendance !== 'all', filters.trainingId !== 'all', filters.categoryId !== 'all'].filter(Boolean).length}
              </span>
            )}
          </Button>
          <Button variant="outline" onClick={() => setShowExportDialog(true)} className="gap-2 h-11">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="gap-2 h-11 shadow-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Participant</span>
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm animate-scale-in">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Training</Label>
                <Select value={filters.trainingId} onValueChange={(v) => setFilters({ ...filters, trainingId: v })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All trainings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trainings</SelectItem>
                    {trainings.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                <Select value={filters.categoryId} onValueChange={(v) => setFilters({ ...filters, categoryId: v })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Enrollment Status</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v as EnrollmentStatus | 'all' })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {allEnrollmentStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        <span className="flex items-center gap-2">
                          {statusIcons[status]}
                          {enrollmentStatusLabels[status]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Attendance</Label>
                <Select value={filters.attendance} onValueChange={(v) => setFilters({ ...filters, attendance: v as AttendanceStatus | 'all' })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All attendance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Attendance</SelectItem>
                    {allAttendanceStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {attendanceStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
              <Button variant="ghost" size="sm" onClick={() => setFilters(defaultFilters)} className="text-muted-foreground">
                <X className="h-3 w-3 mr-1" /> Clear All
              </Button>
              <Button variant="ghost" size="sm" onClick={saveCurrentView}>
                Save View
              </Button>
              {savedViews.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Load View
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {savedViews.map((view) => (
                      <DropdownMenuItem key={view.id} onClick={() => setFilters(view.filters)}>
                        {view.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/30 bg-primary/5 shadow-sm animate-scale-in">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm">
                <CheckCircle className="h-4 w-4" />
                {selectedIds.size} selected
              </div>
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary" className="gap-1.5">
                      <FileCheck className="h-3.5 w-3.5" /> Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {allEnrollmentStatuses.map((status) => (
                      <DropdownMenuItem key={status} onClick={() => handleBulkAction(status)} className="gap-2">
                        {statusIcons[status]}
                        {enrollmentStatusLabels[status]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary" className="gap-1.5">
                      <UserCheck className="h-3.5 w-3.5" /> Mark Attendance
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {allAttendanceStatuses.map((status) => (
                      <DropdownMenuItem key={status} onClick={() => handleBulkAction(status)} className="gap-2">
                        {status === 'attended' && <UserCheck className="h-4 w-4 text-primary" />}
                        {status === 'no_show' && <UserX className="h-4 w-4 text-destructive" />}
                        {status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                        {attendanceStatusLabels[status]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="secondary" onClick={() => handleBulkAction('notify')} className="gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Notify
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="ml-auto text-muted-foreground">
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <span>Enrollments</span>
              <span className="px-2 py-0.5 text-xs font-normal bg-background rounded-full border">
                {filteredRegistrations.length}
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full">
              <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm border-b z-10">
                <tr>
                  <th className="p-3 text-left w-10">
                    <Checkbox
                      checked={selectedIds.size === filteredRegistrations.length && filteredRegistrations.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-3 text-left min-w-[200px]">
                    <SortHeader field="participantName" label="Participant" />
                  </th>
                  <th className="p-3 text-left min-w-[180px]">Training</th>
                  <th className="p-3 text-left min-w-[100px]">
                    <SortHeader field="registeredAt" label="Registered" />
                  </th>
                  <th className="p-3 text-left min-w-[140px]">
                    <SortHeader field="status" label="Status" />
                  </th>
                  <th className="p-3 text-left min-w-[120px]">
                    <SortHeader field="attendanceStatus" label="Attendance" />
                  </th>
                  <th className="p-3 text-left w-14">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Users className="h-10 w-10 opacity-30" />
                        <div>
                          <p className="font-medium">No enrollments found</p>
                          <p className="text-sm">Try adjusting your filters or add a new participant</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg, index) => {
                    const training = trainings.find((t) => t.id === reg.trainingId);

                    return (
                      <tr
                        key={reg.id}
                        className={cn(
                          "hover:bg-muted/30 transition-colors",
                          selectedIds.has(reg.id) && "bg-primary/5"
                        )}
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={selectedIds.has(reg.id)}
                            onCheckedChange={(checked) => handleSelectOne(reg.id, !!checked)}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                              {reg.participantName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{reg.participantName}</p>
                              <p className="text-sm text-muted-foreground truncate">{reg.participantEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium line-clamp-1">{training?.name || 'Unknown'}</span>
                            {training && <CategoryBadge categoryId={training.categoryId} showIcon={false} />}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(safeDate(reg.registeredAt), 'MMM d, yyyy')}
                          </span>
                        </td>
                        <td className="p-3">
                          <EnrollmentStatusBadge status={reg.status} />
                        </td>
                        <td className="p-3">
                          <AttendanceStatusBadge status={reg.attendanceStatus} />
                        </td>
                        <td className="p-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => setDetailDrawerReg(reg)} className="gap-2">
                                <Eye className="h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                Change Status
                              </div>
                              {allEnrollmentStatuses
                                .filter((s) => s !== reg.status)
                                .map((status) => (
                                  <DropdownMenuItem 
                                    key={status}
                                    onClick={() => handleStatusChange(reg, status)}
                                    className="gap-2"
                                  >
                                    {statusIcons[status]}
                                    {enrollmentStatusLabels[status]}
                                  </DropdownMenuItem>
                                ))}
                              
                              <DropdownMenuSeparator />
                              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                Mark Attendance
                              </div>
                              {allAttendanceStatuses
                                .filter((s) => s !== reg.attendanceStatus)
                                .map((status) => (
                                  <DropdownMenuItem 
                                    key={status}
                                    onClick={() => handleAttendanceChange(reg, status)}
                                    className="gap-2"
                                  >
                                    {status === 'attended' && <UserCheck className="h-4 w-4 text-primary" />}
                                    {status === 'no_show' && <UserX className="h-4 w-4 text-destructive" />}
                                    {status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                                    {attendanceStatusLabels[status]}
                                  </DropdownMenuItem>
                                ))}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={() => setBulkConfirmation({ type: 'delete', ids: [reg.id], reason: '' })}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Participant Sheet */}
      <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Participant
            </SheetTitle>
            <SheetDescription>Add a new participant to a training session</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAddSubmit} className="space-y-5 mt-6">
            <div className="space-y-1.5">
              <Label className="text-sm">Training <span className="text-destructive">*</span></Label>
              <Select value={formTrainingId} onValueChange={setFormTrainingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a training" />
                </SelectTrigger>
                <SelectContent>
                  {trainings.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Full Name <span className="text-destructive">*</span></Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="john@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Phone</Label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Notes</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} placeholder="Any additional notes..." />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">Add Participant</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Detail Drawer */}
      <Sheet open={!!detailDrawerReg} onOpenChange={() => setDetailDrawerReg(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {detailDrawerReg && (() => {
            const training = trainings.find((t) => t.id === detailDrawerReg.trainingId);

            return (
              <>
                <SheetHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {detailDrawerReg.participantName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <SheetTitle>{detailDrawerReg.participantName}</SheetTitle>
                      <SheetDescription>{detailDrawerReg.participantEmail}</SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div className="flex flex-wrap gap-2">
                    <EnrollmentStatusBadge status={detailDrawerReg.status} />
                    <AttendanceStatusBadge status={detailDrawerReg.attendanceStatus} />
                  </div>

                  {training && (
                    <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                      <Label className="text-xs text-muted-foreground">Training</Label>
                      <p className="font-medium">{training.name}</p>
                      <CategoryBadge categoryId={training.categoryId} />
                      <p className="text-sm text-muted-foreground">
                        {formatDate(safeDate(training.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Registered</Label>
                      <p className="text-sm">{formatDate(safeDate(detailDrawerReg.registeredAt), 'MMM d, yyyy')}</p>
                    </div>
                    {detailDrawerReg.participantPhone && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <p className="text-sm">{detailDrawerReg.participantPhone}</p>
                      </div>
                    )}
                  </div>

                  {detailDrawerReg.notes && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <p className="text-sm whitespace-pre-line p-3 rounded-lg bg-muted/30">{detailDrawerReg.notes}</p>
                    </div>
                  )}

                  {detailDrawerReg.notifiedAt && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Last Notified</Label>
                      <p className="text-sm">{formatDate(safeDate(detailDrawerReg.notifiedAt), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-3">
                    <Label className="text-xs text-muted-foreground">Update Status</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {allEnrollmentStatuses
                        .filter((s) => s !== detailDrawerReg.status)
                        .map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(detailDrawerReg, status)}
                            className="justify-start gap-2 text-xs"
                          >
                            {statusIcons[status]}
                            {enrollmentStatusLabels[status]}
                          </Button>
                        ))}
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <Label className="text-xs text-muted-foreground">Mark Attendance</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {allAttendanceStatuses.map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={detailDrawerReg.attendanceStatus === status ? "secondary" : "outline"}
                          onClick={() => handleAttendanceChange(detailDrawerReg, status)}
                          className="text-xs"
                          disabled={detailDrawerReg.attendanceStatus === status}
                        >
                          {attendanceStatusLabels[status]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Export Dialog */}
      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Enrollments
            </AlertDialogTitle>
            <AlertDialogDescription>
              Choose your export format and data range.
              {hasActiveFilters && (
                <span className="block mt-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-600 text-sm">
                  You have active filters. Export filtered data or all records.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Card 
              className="border-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 group" 
              onClick={() => handleExport('csv', false)}
            >
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="font-medium text-sm">CSV (Filtered)</p>
                <p className="text-xs text-muted-foreground">{filteredRegistrations.length} records</p>
              </CardContent>
            </Card>
            <Card 
              className="border-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 group" 
              onClick={() => handleExport('xlsx', false)}
            >
              <CardContent className="p-4 text-center">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="font-medium text-sm">Excel (Filtered)</p>
                <p className="text-xs text-muted-foreground">{filteredRegistrations.length} records</p>
              </CardContent>
            </Card>
            <Card 
              className="border-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 group" 
              onClick={() => handleExport('csv', true)}
            >
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="font-medium text-sm">CSV (All)</p>
                <p className="text-xs text-muted-foreground">{registrations.length} records</p>
              </CardContent>
            </Card>
            <Card 
              className="border-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 group" 
              onClick={() => handleExport('xlsx', true)}
            >
              <CardContent className="p-4 text-center">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="font-medium text-sm">Excel (All)</p>
                <p className="text-xs text-muted-foreground">{registrations.length} records</p>
              </CardContent>
            </Card>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={!!statusConfirmation} onOpenChange={() => setStatusConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Status Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are changing the status to <strong>{statusConfirmation && enrollmentStatusLabels[statusConfirmation.newStatus]}</strong>.
              {statusConfirmation?.newStatus === 'cancelled' && ' This action marks the enrollment as cancelled.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter a reason for this change..."
              value={confirmReason}
              onChange={(e) => setConfirmReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeStatusChange}
              className={statusConfirmation?.newStatus === 'cancelled' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={!!bulkConfirmation} onOpenChange={() => setBulkConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkConfirmation?.type === 'delete'
                ? `Are you sure you want to delete ${bulkConfirmation.ids.length} enrollment(s)? This cannot be undone.`
                : `Update ${bulkConfirmation?.ids.length} enrollment(s) to "${bulkConfirmation?.type && enrollmentStatusLabels[bulkConfirmation.type as EnrollmentStatus] || bulkConfirmation?.type}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bulkConfirmation && (bulkConfirmation.type === 'cancelled' || bulkConfirmation.type === 'on_hold') && (
            <div className="py-4 space-y-2">
              <Label htmlFor="bulkReason">Reason (optional)</Label>
              <Textarea
                id="bulkReason"
                placeholder="Enter a reason..."
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              className={bulkConfirmation?.type === 'delete' || bulkConfirmation?.type === 'cancelled' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {bulkConfirmation?.type === 'delete' ? 'Delete' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
