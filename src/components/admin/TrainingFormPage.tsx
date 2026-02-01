import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, ArrowRight, Check, X, Upload, Image, FileText, 
  GraduationCap, Calendar, Users, MapPin, Mic, Settings2,
  Star, Sparkles, CheckCircle, AlertCircle, Loader2, Save
} from 'lucide-react';
import { useTraining } from '@/context/TrainingContext';
import { Training, TrainingStatus, RegistrationMethod, TrainingAttachment, TargetAudience } from '@/types/training';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { safeDate } from '@/lib/dateUtils';
import { trainingSchema, validateForm, validateImageFile } from '@/lib/validation';
import { pb } from '@/integrations/pocketbase/client';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormData extends Omit<Training, 'id'> {
  attachments: TrainingAttachment[];
}

const emptyTraining: FormData = {
  name: '',
  description: '',
  shortDescription: '',
  categoryId: '',
  date: new Date(),
  endDate: new Date(),
  timeFrom: '09:00',
  timeTo: '17:00',
  duration: '',
  status: 'Scheduled',
  availableSlots: 20,
  maxRegistrations: 25,
  registrationMethod: 'internal',
  externalLink: '',
  heroImage: '',
  isFeatured: false,
  isRecommended: false,
  isRegistrationOpen: true,
  attachments: [],
  location: '',
  speakers: '',
  targetAudience: 'General',
};

const STEPS = [
  { id: 'basic', label: 'Basic Details', icon: GraduationCap, description: 'Name, category, and description' },
  { id: 'schedule', label: 'Schedule', icon: Calendar, description: 'Date, time, and duration' },
  { id: 'capacity', label: 'Capacity', icon: Users, description: 'Slots and registrations' },
  { id: 'instructors', label: 'Instructors', icon: Mic, description: 'Location and speakers' },
  { id: 'enrollment', label: 'Enrollment Rules', icon: Settings2, description: 'Visibility and promotion' },
];

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

interface FormErrors {
  [key: string]: string;
}

// Track files to upload on submit
interface PendingUpload {
  file: File;
  type: 'hero' | 'attachment';
  tempId?: string;
}

export function TrainingFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  
  const { trainings, categories, addTraining, updateTraining, getTrainingById, addTrainingUpdate } = useTraining();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(emptyTraining);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Load existing training if editing
  useEffect(() => {
    if (id) {
      const training = getTrainingById(id);
      if (training) {
        setFormData({
          name: training.name,
          description: training.description,
          shortDescription: training.shortDescription || '',
          categoryId: training.categoryId,
          date: training.date,
          endDate: training.endDate || training.date,
          timeFrom: training.timeFrom || '09:00',
          timeTo: training.timeTo || '17:00',
          duration: training.duration || '',
          status: training.status,
          availableSlots: training.availableSlots,
          maxRegistrations: training.maxRegistrations,
          registrationMethod: training.registrationMethod,
          externalLink: training.externalLink || '',
          heroImage: training.heroImage || '',
          isFeatured: training.isFeatured,
          isRecommended: training.isRecommended,
          isRegistrationOpen: training.isRegistrationOpen ?? true,
          attachments: training.attachments || [],
          location: training.location || '',
          speakers: training.speakers || '',
          targetAudience: training.targetAudience || 'General',
        });
        setImagePreview(training.heroImage || null);
      }
    }
  }, [id, getTrainingById]);

  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case 'name':
        if (!value?.trim()) return 'Training name is required';
        if (value.length > 200) return 'Name must be less than 200 characters';
        break;
      case 'categoryId':
        if (!value) return 'Category is required';
        break;
      case 'description':
        if (value && value.length > 5000) return 'Description must be less than 5000 characters';
        break;
      case 'shortDescription':
        if (value && value.length > 300) return 'Short description must be less than 300 characters';
        break;
      case 'availableSlots':
        if (value < 0) return 'Available slots cannot be negative';
        if (value > 10000) return 'Maximum 10,000 slots allowed';
        break;
      case 'maxRegistrations':
        if (value < 1) return 'Maximum registrations must be at least 1';
        if (value > 10000) return 'Maximum 10,000 registrations allowed';
        break;
      case 'externalLink':
        if (value && !value.startsWith('https://')) return 'URL must start with https://';
        break;
    }
    return undefined;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => new Set(prev).add(field));
    
    const error = validateField(field, value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const validateStep = (step: number): boolean => {
    const stepErrors: FormErrors = {};
    
    switch (step) {
      case 0: // Basic Details
        const nameError = validateField('name', formData.name);
        const categoryError = validateField('categoryId', formData.categoryId);
        const descError = validateField('description', formData.description);
        const shortDescError = validateField('shortDescription', formData.shortDescription);
        
        if (nameError) stepErrors.name = nameError;
        if (categoryError) stepErrors.categoryId = categoryError;
        if (descError) stepErrors.description = descError;
        if (shortDescError) stepErrors.shortDescription = shortDescError;
        break;
        
      case 2: // Capacity
        const slotsError = validateField('availableSlots', formData.availableSlots);
        const maxRegError = validateField('maxRegistrations', formData.maxRegistrations);
        const linkError = formData.registrationMethod === 'external' 
          ? validateField('externalLink', formData.externalLink) 
          : undefined;
        
        if (slotsError) stepErrors.availableSlots = slotsError;
        if (maxRegError) stepErrors.maxRegistrations = maxRegError;
        if (linkError) stepErrors.externalLink = linkError;
        
        if (formData.availableSlots > formData.maxRegistrations) {
          stepErrors.availableSlots = 'Available slots cannot exceed max registrations';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, ...stepErrors }));
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast({ title: 'Error', description: validation.error, variant: 'destructive' });
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Queue for upload on submit
      setPendingUploads(prev => {
        // Remove any existing hero image from pending
        const filtered = prev.filter(p => p.type !== 'hero');
        return [...filtered, { file, type: 'hero' }];
      });
      
      // Mark that we have a pending hero image
      setFormData(prev => ({ ...prev, heroImage: 'pending-upload' }));
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, heroImage: '' }));
    setImagePreview(null);
    setPendingUploads(prev => prev.filter(p => p.type !== 'hero'));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast({ title: 'Error', description: `File "${file.name}" exceeds 5MB limit`, variant: 'destructive' });
        return;
      }
      if (file.type !== 'application/pdf') {
        toast({ title: 'Error', description: `Only PDF files are allowed.`, variant: 'destructive' });
        return;
      }

      const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Add to pending uploads
      setPendingUploads(prev => [...prev, { file, type: 'attachment', tempId }]);
      
      // Add placeholder to form data
      const newAttachment: TrainingAttachment = {
        id: tempId,
        name: file.name,
        fileUrl: 'pending-upload',
        fileType: 'pdf',
        uploadedAt: new Date(),
      };
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment],
      }));
    });

    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    const attachment = formData.attachments.find(a => a.id === attachmentId);
    
    // Remove from pending uploads if it was pending
    setPendingUploads(prev => prev.filter(p => p.tempId !== attachmentId));
    
    // Note: File deletion handled by PocketBase when training is updated
    // No explicit delete needed here
    
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== attachmentId),
    }));
  };

  const handleSubmit = async () => {
    // Validate all steps
    for (let i = 0; i < STEPS.length; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        toast({ 
          title: 'Validation Error', 
          description: 'Please fix the errors before submitting', 
          variant: 'destructive' 
        });
        return;
      }
    }

    // PIN protection is handled by PinProtectedRoute wrapper

    setIsSubmitting(true);
    setIsUploading(pendingUploads.length > 0);

    try {
      // For new trainings, we'll upload files using a temp ID, then create training
      // For editing, we use the existing training ID
      const uploadId = id || `temp-${Date.now()}`;
      let heroImageUrl = formData.heroImage;
      let updatedAttachments = [...formData.attachments];

      // Note: PocketBase handles files directly via FormData
      // Files will be uploaded when creating/updating the training
      if (pendingUploads.length > 0) {
        // Update attachment records with file references
        updatedAttachments = formData.attachments.map(att => {
          const pending = pendingUploads.find(p => p.tempId === att.id);
          if (pending?.file) {
            return { ...att, fileUrl: 'pending-upload' };
          }
          return att;
        });
        heroImageUrl = formData.heroImage || '';
      }
          } else if (pending.type === 'attachment' && pending.tempId) {
            const result = await uploadTrainingFile(pending.file, 'attachments', uploadId);
            if (result.success && result.url) {
              // Update the attachment with the real URL
              updatedAttachments = updatedAttachments.map(att => 
                att.id === pending.tempId 
                  ? { ...att, fileUrl: result.url!, filePath: result.path }
                  : att
              );
            } else {
              toast({
                title: 'Upload Failed',
                description: `Failed to upload ${pending.file.name}: ${result.error}`,
                variant: 'destructive',
              });
              setIsSubmitting(false);
              setIsUploading(false);
              return;
            }
          }
        }
      }

      setIsUploading(false);
      
      const autoCloseRegistration = formData.availableSlots <= 0;
      
      // Build training data without id for new trainings
      const trainingFormData = {
        ...formData,
        heroImage: heroImageUrl === 'pending-upload' ? '' : heroImageUrl,
        attachments: updatedAttachments.filter(att => att.fileUrl !== 'pending-upload'),
        isRegistrationOpen: autoCloseRegistration ? false : formData.isRegistrationOpen,
      };

      if (isEditing) {
        // For editing, include the existing id
        const trainingData: Training = {
          ...trainingFormData,
          id: id!,
        };
        const existingTraining = getTrainingById(id!);
        await updateTraining(trainingData);
        
        if (existingTraining && existingTraining.status !== trainingData.status) {
          await addTrainingUpdate({
            type: 'status_changed',
            trainingId: trainingData.id,
            trainingName: trainingData.name,
            message: 'Status changed',
            previousValue: existingTraining.status,
            newValue: trainingData.status,
          });
        } else {
          await addTrainingUpdate({
            type: 'training_modified',
            trainingId: trainingData.id,
            trainingName: trainingData.name,
            message: 'Training details updated',
          });
        }
        
        toast({ 
          title: '✓ Training Updated',
          description: `"${trainingData.name}" has been updated successfully.`,
        });
      } else {
        // For new trainings, let database generate the ID and get it back
        const createdTraining = await addTraining(trainingFormData);
        
        if (createdTraining) {
          await addTrainingUpdate({
            type: 'training_added',
            trainingId: createdTraining.id,
            trainingName: createdTraining.name,
            message: 'New training added',
          });
          toast({ 
            title: '✓ Training Created',
            description: `"${createdTraining.name}" has been created successfully.`,
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create training. Please try again.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Clear pending uploads
      setPendingUploads([]);
      navigate('/admin');
    } catch (error) {
      console.error('Submit error:', error);
      toast({ 
        title: 'Error', 
        description: 'An error occurred. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Details
        return (
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Training Information
                </CardTitle>
                <CardDescription>Enter the basic details about this training session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1">
                    Training Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="e.g., Project Management Fundamentals"
                    className={cn(
                      "h-11",
                      errors.name && touched.has('name') && "border-destructive focus-visible:ring-destructive"
                    )}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && touched.has('name') && (
                    <p id="name-error" className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-1">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={formData.categoryId} 
                      onValueChange={(v) => handleFieldChange('categoryId', v)}
                    >
                      <SelectTrigger 
                        id="category"
                        className={cn(
                          "h-11",
                          errors.categoryId && touched.has('categoryId') && "border-destructive"
                        )}
                      >
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && touched.has('categoryId') && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.categoryId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => handleFieldChange('status', v as TrainingStatus)}
                    >
                      <SelectTrigger id="status" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => handleFieldChange('shortDescription', e.target.value)}
                    placeholder="Brief summary for cards and hero sections"
                    className="h-11"
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.shortDescription?.length || 0}/300 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Detailed description of the training, objectives, and what participants will learn..."
                    rows={5}
                    className="resize-none"
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description?.length || 0}/5000 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Hero Image Card */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Hero Image
                </CardTitle>
                <CardDescription>Upload a cover image for this training</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  {imagePreview ? (
                    <div className="relative group">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="h-40 w-64 object-cover rounded-lg border shadow-sm" 
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="h-40 w-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                      aria-label="Upload hero image"
                    >
                      <Image className="h-10 w-10 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                      <span className="text-xs text-muted-foreground mt-1">or drag and drop</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Recommended size: 1920x1080px (16:9 aspect ratio)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Formats: JPEG, PNG, GIF, WebP • Max size: 5MB
                    </p>
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2"
                      >
                        Change Image
                      </Button>
                    )}
                  </div>
                </div>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  aria-label="Upload hero image file"
                />
              </CardContent>
            </Card>
          </div>
        );

      case 1: // Schedule
        return (
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule & Timing
              </CardTitle>
              <CardDescription>Set the date, time, and duration of this training</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-1">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={format(safeDate(formData.date), 'yyyy-MM-dd')}
                    onChange={(e) => handleFieldChange('date', new Date(e.target.value))}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate ? format(safeDate(formData.endDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleFieldChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for single-day trainings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="timeFrom">Start Time</Label>
                  <Input
                    id="timeFrom"
                    type="time"
                    value={formData.timeFrom || '09:00'}
                    onChange={(e) => handleFieldChange('timeFrom', e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeTo">End Time</Label>
                  <Input
                    id="timeTo"
                    type="time"
                    value={formData.timeTo || '17:00'}
                    onChange={(e) => handleFieldChange('timeTo', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration || ''}
                  onChange={(e) => handleFieldChange('duration', e.target.value)}
                  placeholder="e.g., 2 hours, Half day, 3 days"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Describe the total duration in a user-friendly format
                </p>
              </div>

              <Alert className="bg-muted/50 border-muted-foreground/20">
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  For multi-day trainings, set both start and end dates. The training will appear on all days in the calendar view.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        );

      case 2: // Capacity
        return (
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Capacity Settings
                </CardTitle>
                <CardDescription>Configure registration limits and available slots</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="maxRegistrations" className="flex items-center gap-1">
                      Maximum Registrations <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="maxRegistrations"
                      type="number"
                      min={1}
                      max={10000}
                      value={formData.maxRegistrations}
                      onChange={(e) => handleFieldChange('maxRegistrations', parseInt(e.target.value) || 1)}
                      className={cn(
                        "h-11",
                        errors.maxRegistrations && "border-destructive"
                      )}
                    />
                    {errors.maxRegistrations && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.maxRegistrations}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availableSlots" className="flex items-center gap-1">
                      Available Slots <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="availableSlots"
                      type="number"
                      min={0}
                      max={10000}
                      value={formData.availableSlots}
                      onChange={(e) => handleFieldChange('availableSlots', parseInt(e.target.value) || 0)}
                      className={cn(
                        "h-11",
                        errors.availableSlots && "border-destructive"
                      )}
                    />
                    {errors.availableSlots && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.availableSlots}
                      </p>
                    )}
                  </div>
                </div>

                {formData.availableSlots <= 0 && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No slots available. Registration will automatically close when saved.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Visual capacity indicator */}
                <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capacity Overview</span>
                    <span className="font-medium">
                      {formData.maxRegistrations - formData.availableSlots} / {formData.maxRegistrations} filled
                    </span>
                  </div>
                  <Progress 
                    value={((formData.maxRegistrations - formData.availableSlots) / formData.maxRegistrations) * 100} 
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Registration Method
                </CardTitle>
                <CardDescription>How participants will register for this training</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="registrationMethod">Registration Type</Label>
                  <Select 
                    value={formData.registrationMethod} 
                    onValueChange={(v) => handleFieldChange('registrationMethod', v as RegistrationMethod)}
                  >
                    <SelectTrigger id="registrationMethod" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal Form (In-app registration)</SelectItem>
                      <SelectItem value="external">External Link (Redirect to another site)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.registrationMethod === 'external' && (
                  <div className="space-y-2">
                    <Label htmlFor="externalLink" className="flex items-center gap-1">
                      External Registration URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="externalLink"
                      type="url"
                      value={formData.externalLink}
                      onChange={(e) => handleFieldChange('externalLink', e.target.value)}
                      placeholder="https://..."
                      className={cn(
                        "h-11",
                        errors.externalLink && "border-destructive"
                      )}
                    />
                    {errors.externalLink && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.externalLink}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Participants will be redirected to this URL to complete registration
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 3: // Instructors
        return (
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </CardTitle>
                <CardDescription>Where this training will take place</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="location">Venue / Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    placeholder="e.g., Training Room A, Building 1, Floor 3"
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Speakers & Instructors
                </CardTitle>
                <CardDescription>Who will be conducting this training</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="speakers">Speaker(s) / Instructor(s)</Label>
                  <Input
                    id="speakers"
                    value={formData.speakers || ''}
                    onChange={(e) => handleFieldChange('speakers', e.target.value)}
                    placeholder="e.g., John Doe, Jane Smith"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple names with commas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select 
                    value={formData.targetAudience || 'General'} 
                    onValueChange={(v) => handleFieldChange('targetAudience', v as TargetAudience)}
                  >
                    <SelectTrigger id="targetAudience" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General (All Employees)</SelectItem>
                      <SelectItem value="Specialist and Below">Specialist and Below</SelectItem>
                      <SelectItem value="Senior Specialist and Above">Senior Specialist and Above</SelectItem>
                      <SelectItem value="Managers and Above">Managers and Above</SelectItem>
                      <SelectItem value="Directors and Above">Directors and Above</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Training Materials
                </CardTitle>
                <CardDescription>Upload PDF documents for participants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.attachments.length > 0 && (
                  <div className="space-y-2">
                    {formData.attachments.map((att) => (
                      <div 
                        key={att.id} 
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{att.name}</span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <input 
                  ref={attachmentInputRef} 
                  type="file" 
                  accept=".pdf" 
                  multiple 
                  onChange={handleAttachmentUpload} 
                  className="hidden" 
                  aria-label="Upload PDF attachments"
                />
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => attachmentInputRef.current?.click()} 
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload PDF Files
                </Button>
                <p className="text-xs text-muted-foreground">
                  Accepted format: PDF • Max size: 5MB per file
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 4: // Enrollment Rules
        return (
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Enrollment & Visibility
              </CardTitle>
              <CardDescription>Configure how this training appears and whether registration is open</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle Cards */}
              <div className="space-y-4">
                {/* Registration Status */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      formData.isRegistrationOpen ? "bg-primary/10" : "bg-muted"
                    )}>
                      <CheckCircle className={cn(
                        "h-5 w-5",
                        formData.isRegistrationOpen ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">Registration Open</p>
                      <p className="text-sm text-muted-foreground">
                        Allow new participants to register for this training
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isRegistrationOpen}
                    onCheckedChange={(checked) => handleFieldChange('isRegistrationOpen', checked)}
                    aria-label="Toggle registration status"
                  />
                </div>

                {/* Featured */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      formData.isFeatured ? "bg-amber-500/10" : "bg-muted"
                    )}>
                      <Star className={cn(
                        "h-5 w-5",
                        formData.isFeatured ? "text-amber-500" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">Featured Training</p>
                      <p className="text-sm text-muted-foreground">
                        Display prominently in the hero slider on the homepage
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => handleFieldChange('isFeatured', checked)}
                    aria-label="Toggle featured status"
                  />
                </div>

                {/* Recommended */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      formData.isRecommended ? "bg-purple-500/10" : "bg-muted"
                    )}>
                      <Sparkles className={cn(
                        "h-5 w-5",
                        formData.isRecommended ? "text-purple-500" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">Recommended</p>
                      <p className="text-sm text-muted-foreground">
                        Show in the "Recommended for You" section
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isRecommended}
                    onCheckedChange={(checked) => handleFieldChange('isRecommended', checked)}
                    aria-label="Toggle recommended status"
                  />
                </div>
              </div>

              {/* Warnings */}
              {formData.availableSlots <= 0 && formData.isRegistrationOpen && (
                <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/30">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    No slots are available. Registration will automatically close when you save.
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview Summary */}
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Training Summary</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">{formData.status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Available Slots</p>
                    <p className="font-medium">{formData.availableSlots} / {formData.maxRegistrations}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Registration</p>
                    <p className={cn(
                      "font-medium",
                      formData.isRegistrationOpen ? "text-primary" : "text-destructive"
                    )}>
                      {formData.isRegistrationOpen ? 'Open' : 'Closed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-medium capitalize">{formData.registrationMethod}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
                className="shrink-0"
                aria-label="Go back to admin"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  {isEditing ? 'Edit Training' : 'Create New Training'}
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {isEditing ? 'Update the training details below' : 'Fill in the details for the new training session'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? 'Update' : 'Create'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b bg-muted/30">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
              </span>
              <span className="text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="border-b bg-background">
        <div className="container max-w-5xl mx-auto px-4">
          <nav className="flex overflow-x-auto py-2 -mx-4 px-4 gap-1" aria-label="Form steps">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all min-w-fit",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : isCompleted
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground hover:bg-muted"
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container max-w-5xl mx-auto px-4 py-8">
        <div className="animate-fade-in">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isUploading ? 'Uploading files...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isEditing ? 'Update Training' : 'Create Training'}
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
