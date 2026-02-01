export type TrainingStatus = 'Scheduled' | 'Rescheduled' | 'Cancelled' | 'In Progress' | 'On Hold' | 'Completed';

export type RegistrationMethod = 'internal' | 'external';

export type ResourceType = 'Guideline' | 'User Guide' | 'Template' | 'FAQ';

export type TargetAudience = 
  | 'General'
  | 'Specialist and Below'
  | 'Senior Specialist and Above'
  | 'Managers and Above'
  | 'Directors and Above';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface TrainingAttachment {
  id: string;
  name: string;
  fileUrl: string; // URL to the file in cloud storage
  filePath?: string; // Storage path for deletion
  fileType: string;
  uploadedAt: Date;
}

export interface Training {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  date: Date;
  endDate?: Date;
  timeFrom?: string; // Format: "HH:mm" (24-hour)
  timeTo?: string; // Format: "HH:mm" (24-hour)
  duration?: string; // Free text, e.g., "2 hours", "Half day"
  status: TrainingStatus;
  availableSlots: number;
  maxRegistrations: number;
  registrationMethod: RegistrationMethod;
  externalLink?: string;
  heroImage?: string;
  isFeatured: boolean;
  isRecommended: boolean;
  isRegistrationOpen: boolean; // Controls if registration is open or closed
  displayOrder?: number;
  attachments?: TrainingAttachment[];
  location?: string;
  speakers?: string;
  targetAudience?: TargetAudience;
}

export type EnrollmentStatus = 
  | 'registered'
  | 'pending_approval'
  | 'hr_approval'
  | 'confirmed'
  | 'cancelled'
  | 'on_hold'
  | 'waitlisted';

export type AttendanceStatus = 'pending' | 'attended' | 'no_show';

export interface Registration {
  id: string;
  trainingId: string;
  participantName: string;
  participantEmail: string;
  participantPhone?: string;
  registeredAt: Date;
  status: EnrollmentStatus;
  attendanceStatus: AttendanceStatus;
  notes?: string;
  notifiedAt?: Date;
}

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  fileUrl?: string;
  filePath?: string; // Storage path for deletion
  externalLink?: string;
}

export interface LearningPlatform {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export type TrainingUpdateType = 
  | 'training_added'
  | 'training_removed'
  | 'training_modified'
  | 'status_changed'
  | 'capacity_low'
  | 'capacity_full';

export interface TrainingUpdate {
  id: string;
  type: TrainingUpdateType;
  trainingId?: string;
  trainingName: string;
  message: string;
  timestamp: Date;
  previousValue?: string;
  newValue?: string;
}
