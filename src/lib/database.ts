import { pb } from '@/integrations/pocketbase/client';
import { Category, Training, Registration, Resource, TrainingUpdate, TrainingAttachment, LearningPlatform } from '@/types/training';

// ============= Categories =============

export async function fetchCategories(): Promise<Category[]> {
  try {
    const result = await pb.collection('categories').getList(1, 100, {
      sort: 'name'
    });
    return result.items.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function createCategory(category: Omit<Category, 'id'>): Promise<Category | null> {
  try {
    const result = await pb.collection('categories').create({
      name: category.name,
      color: category.color,
    });
    return {
      id: result.id,
      name: result.name,
      color: result.color,
    };
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
}

export async function updateCategoryDb(category: Category): Promise<boolean> {
  try {
    await pb.collection('categories').update(category.id, {
      name: category.name,
      color: category.color,
    });
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    return false;
  }
}

export async function deleteCategoryDb(id: string): Promise<boolean> {
  try {
    await pb.collection('categories').delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
}

// ============= Trainings =============

interface DbTraining {
  id: string;
  name: string;
  description: string;
  short_description: string | null;
  category_id: string | null;
  date: string;
  end_date: string | null;
  time_from: string | null;
  time_to: string | null;
  duration: string | null;
  status: string;
  available_slots: number;
  max_registrations: number;
  registration_method: string;
  external_link: string | null;
  hero_image: string | null;
  is_featured: boolean;
  is_recommended: boolean;
  is_registration_open: boolean;
  display_order: number | null;
  location: string | null;
  speakers: string | null;
  target_audience: string | null;
}

function getTrainingHeroUrl(row: DbTraining): string | undefined {
  if (!row.hero_image) {
    return undefined;
  }
  try {
    return pb.files.getURL(row as any, row.hero_image);
  } catch {
    return row.hero_image || undefined;
  }
}

interface DbTrainingAttachment {
  id: string;
  training_id: string;
  name: string;
  file_url?: string | null;
  file?: string | null;
  file_type: string;
  created: string;
}

function getAttachmentUrl(row: DbTrainingAttachment): string {
  if (row.file) {
    try {
      return pb.files.getURL(row as any, row.file);
    } catch {
      return row.file;
    }
  }
  return row.file_url || '';
}

function dbToTraining(row: DbTraining, attachments: TrainingAttachment[] = []): Training {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    shortDescription: row.short_description || undefined,
    categoryId: row.category_id || '',
    date: new Date(row.date),
    endDate: row.end_date ? new Date(row.end_date) : undefined,
    timeFrom: row.time_from || undefined,
    timeTo: row.time_to || undefined,
    duration: row.duration || undefined,
    status: row.status as Training['status'],
    availableSlots: row.available_slots,
    maxRegistrations: row.max_registrations,
    registrationMethod: row.registration_method as Training['registrationMethod'],
    externalLink: row.external_link || undefined,
    heroImage: getTrainingHeroUrl(row),
    isFeatured: row.is_featured,
    isRecommended: row.is_recommended,
    isRegistrationOpen: row.is_registration_open,
    displayOrder: row.display_order || undefined,
    location: row.location || undefined,
    speakers: row.speakers || undefined,
    targetAudience: row.target_audience as Training['targetAudience'] || undefined,
    attachments,
  };
}

export async function fetchTrainings(): Promise<Training[]> {
  try {
    // Fetch trainings
    const trainingsResult = await pb.collection('trainings').getList(1, 100, {
      sort: 'date'
    });

    // Fetch attachments
    const attachmentsResult = await pb.collection('training_attachments').getList(1, 500);

    const attachmentsByTraining = new Map<string, TrainingAttachment[]>();
    attachmentsResult.items.forEach(att => {
      const row = att as unknown as DbTrainingAttachment;
      const list = attachmentsByTraining.get(att.training_id) || [];
      list.push({
        id: row.id,
        name: row.name,
        fileUrl: getAttachmentUrl(row),
        fileType: row.file_type,
        uploadedAt: new Date(row.created),
      });
      attachmentsByTraining.set(att.training_id, list);
    });

    return trainingsResult.items.map(row => dbToTraining(row as DbTraining, attachmentsByTraining.get(row.id) || []));
  } catch (error) {
    console.error('Error fetching trainings:', error);
    return [];
  }
}

export async function createTraining(training: Omit<Training, 'id'> & { id?: string; heroImageFile?: File | null; attachmentFiles?: { file: File; name: string; fileType: string }[] }): Promise<Training | null> {
  try {
    const hasHeroFile = Boolean(training.heroImageFile);
    const payload = {
      name: training.name,
      description: training.description,
      short_description: training.shortDescription || null,
      category_id: training.categoryId || null,
      date: training.date instanceof Date ? training.date.toISOString() : training.date,
      end_date: training.endDate instanceof Date ? training.endDate.toISOString() : training.endDate || null,
      time_from: training.timeFrom || null,
      time_to: training.timeTo || null,
      duration: training.duration || null,
      status: training.status,
      available_slots: training.availableSlots,
      max_registrations: training.maxRegistrations,
      registration_method: training.registrationMethod,
      external_link: training.externalLink || null,
      is_featured: training.isFeatured,
      is_recommended: training.isRecommended,
      is_registration_open: training.isRegistrationOpen,
      display_order: training.displayOrder || null,
      location: training.location || null,
      speakers: training.speakers || null,
      target_audience: training.targetAudience || null,
    } as Record<string, any>;

    let result;
    if (hasHeroFile) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      formData.append('hero_image', training.heroImageFile as File);
      result = await pb.collection('trainings').create(formData);
    } else {
      result = await pb.collection('trainings').create(payload);
    }

    // Insert attachments if any (upload files to PocketBase)
    if (training.attachmentFiles && training.attachmentFiles.length > 0) {
      for (const att of training.attachmentFiles) {
        const formData = new FormData();
        formData.append('training_id', result.id);
        formData.append('name', att.name);
        formData.append('file_type', att.fileType);
        formData.append('file', att.file);
        await pb.collection('training_attachments').create(formData);
      }
    }

    return dbToTraining(result as DbTraining, training.attachments || []);
  } catch (error) {
    console.error('Error creating training:', error);
    return null;
  }
}

export async function updateTrainingDb(training: Training & { heroImageFile?: File | null; attachmentFiles?: { file: File; name: string; fileType: string }[]; removedAttachmentIds?: string[] }): Promise<boolean> {
  try {
    const hasHeroFile = Boolean(training.heroImageFile);
    const payload = {
      name: training.name,
      description: training.description,
      short_description: training.shortDescription || null,
      category_id: training.categoryId || null,
      date: training.date instanceof Date ? training.date.toISOString() : training.date,
      end_date: training.endDate instanceof Date ? training.endDate.toISOString() : training.endDate || null,
      time_from: training.timeFrom || null,
      time_to: training.timeTo || null,
      duration: training.duration || null,
      status: training.status,
      available_slots: training.availableSlots,
      max_registrations: training.maxRegistrations,
      registration_method: training.registrationMethod,
      external_link: training.externalLink || null,
      is_featured: training.isFeatured,
      is_recommended: training.isRecommended,
      is_registration_open: training.isRegistrationOpen,
      display_order: training.displayOrder || null,
      location: training.location || null,
      speakers: training.speakers || null,
      target_audience: training.targetAudience || null,
    } as Record<string, any>;

    if (!hasHeroFile && training.heroImage === '') {
      payload.hero_image = null;
    }

    if (hasHeroFile) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      formData.append('hero_image', training.heroImageFile as File);
      await pb.collection('trainings').update(training.id, formData);
    } else {
      await pb.collection('trainings').update(training.id, payload);
    }

    // Remove deleted attachments
    if (training.removedAttachmentIds && training.removedAttachmentIds.length > 0) {
      for (const attachmentId of training.removedAttachmentIds) {
        await pb.collection('training_attachments').delete(attachmentId);
      }
    }

    // Add new attachments
    if (training.attachmentFiles && training.attachmentFiles.length > 0) {
      for (const att of training.attachmentFiles) {
        const formData = new FormData();
        formData.append('training_id', training.id);
        formData.append('name', att.name);
        formData.append('file_type', att.fileType);
        formData.append('file', att.file);
        await pb.collection('training_attachments').create(formData);
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating training:', error);
    return false;
  }
}

export async function deleteTrainingDb(id: string): Promise<boolean> {
  try {
    await pb.collection('trainings').delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting training:', error);
    return false;
  }
}

// ============= Registrations =============

interface DbRegistration {
  id: string;
  training_id: string;
  user_id: string | null;
  participant_name: string;
  participant_email: string;
  participant_phone: string | null;
  registered_at: string;
  status: string;
  attendance_status: string;
  notes: string | null;
  notified_at: string | null;
}

function dbToRegistration(row: DbRegistration): Registration {
  return {
    id: row.id,
    trainingId: row.training_id,
    participantName: row.participant_name,
    participantEmail: row.participant_email,
    participantPhone: row.participant_phone || undefined,
    registeredAt: new Date(row.registered_at),
    status: row.status as Registration['status'],
    attendanceStatus: row.attendance_status as Registration['attendanceStatus'],
    notes: row.notes || undefined,
    notifiedAt: row.notified_at ? new Date(row.notified_at) : undefined,
  };
}

export async function fetchRegistrations(): Promise<Registration[]> {
  try {
    const result = await pb.collection('registrations').getList(1, 100, {
      sort: 'registered_at'
    });
    return result.items.map(row => dbToRegistration(row as DbRegistration));
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

export async function createRegistration(registration: Omit<Registration, 'id'> & { id?: string }): Promise<Registration | null> {
  try {
    const result = await pb.collection('registrations').create({
      training_id: registration.trainingId,
      user_id: null,
      participant_name: registration.participantName,
      participant_email: registration.participantEmail,
      participant_phone: registration.participantPhone || null,
      status: registration.status,
      attendance_status: registration.attendanceStatus,
      notes: registration.notes || null,
    });
    return dbToRegistration(result as DbRegistration);
  } catch (error) {
    console.error('Error creating registration:', error);
    return null;
  }
}

export async function updateRegistrationDb(registration: Registration): Promise<boolean> {
  try {
    await pb.collection('registrations').update(registration.id, {
      participant_name: registration.participantName,
      participant_email: registration.participantEmail,
      participant_phone: registration.participantPhone || null,
      status: registration.status,
      attendance_status: registration.attendanceStatus,
      notes: registration.notes || null,
      notified_at: registration.notifiedAt ? registration.notifiedAt.toISOString() : null,
    });
    return true;
  } catch (error) {
    console.error('Error updating registration:', error);
    return false;
  }
}

export async function deleteRegistrationDb(id: string): Promise<boolean> {
  try {
    await pb.collection('registrations').delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting registration:', error);
    return false;
  }
}

// ============= Resources =============

interface DbResource {
  id: string;
  title: string;
  type: string;
  file_url: string | null;
  file_path: string | null;
  external_link: string | null;
  file?: string | null;
}

function getResourceFileUrl(row: DbResource): string | undefined {
  if (row.file) {
    try {
      return pb.files.getURL(row as any, row.file);
    } catch {
      return row.file || undefined;
    }
  }
  return row.file_url || undefined;
}

function dbToResource(row: DbResource): Resource {
  return {
    id: row.id,
    title: row.title,
    type: row.type as Resource['type'],
    fileUrl: getResourceFileUrl(row),
    filePath: row.file_path || undefined,
    externalLink: row.external_link || undefined,
  };
}

export async function fetchResources(): Promise<Resource[]> {
  try {
    const result = await pb.collection('resources').getList(1, 100, {
      sort: 'title'
    });
    return result.items.map(row => dbToResource(row as DbResource));
  } catch (error) {
    console.error('Error fetching resources:', error);
    return [];
  }
}

export async function createResource(
  resource: Omit<Resource, 'id'> & { resourceFile?: File | null }
): Promise<Resource | null> {
  try {
    let result;
    if (resource.resourceFile) {
      const formData = new FormData();
      formData.append('title', resource.title);
      formData.append('type', resource.type);
      if (resource.externalLink) formData.append('external_link', resource.externalLink);
      formData.append('file', resource.resourceFile);
      result = await pb.collection('resources').create(formData);
    } else {
      result = await pb.collection('resources').create({
        title: resource.title,
        type: resource.type,
        file_url: resource.fileUrl || null,
        file_path: resource.filePath || null,
        external_link: resource.externalLink || null,
      });
    }
    return dbToResource(result as DbResource);
  } catch (error) {
    console.error('Error creating resource:', error);
    return null;
  }
}

export async function updateResourceDb(
  resource: Resource & { resourceFile?: File | null; removeFile?: boolean }
): Promise<boolean> {
  try {
    if (resource.resourceFile) {
      const formData = new FormData();
      formData.append('title', resource.title);
      formData.append('type', resource.type);
      if (resource.externalLink) formData.append('external_link', resource.externalLink);
      formData.append('file', resource.resourceFile);
      await pb.collection('resources').update(resource.id, formData);
    } else {
      await pb.collection('resources').update(resource.id, {
        title: resource.title,
        type: resource.type,
        file_url: resource.fileUrl || null,
        file_path: resource.filePath || null,
        external_link: resource.externalLink || null,
        ...(resource.removeFile ? { file: null } : {}),
      });
    }
    return true;
  } catch (error) {
    console.error('Error updating resource:', error);
    return false;
  }
}

export async function deleteResourceDb(id: string): Promise<boolean> {
  try {
    await pb.collection('resources').delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting resource:', error);
    return false;
  }
}

// ============= Training Updates =============

interface DbTrainingUpdate {
  id: string;
  type: string;
  training_id: string | null;
  training_name: string;
  message: string;
  timestamp: string;
  previous_value: string | null;
  new_value: string | null;
}

function dbToTrainingUpdate(row: DbTrainingUpdate): TrainingUpdate {
  return {
    id: row.id,
    type: row.type as TrainingUpdate['type'],
    trainingId: row.training_id || undefined,
    trainingName: row.training_name,
    message: row.message,
    timestamp: new Date(row.timestamp),
    previousValue: row.previous_value || undefined,
    newValue: row.new_value || undefined,
  };
}

export async function fetchTrainingUpdates(): Promise<TrainingUpdate[]> {
  try {
    const result = await pb.collection('training_updates').getList(1, 50, {
      sort: 'created'
    });
    return result.items.map(row => dbToTrainingUpdate(row as DbTrainingUpdate));
  } catch (error) {
    console.error('Error fetching training updates:', error);
    return [];
  }
}

export async function createTrainingUpdate(update: Omit<TrainingUpdate, 'id' | 'timestamp'>): Promise<TrainingUpdate | null> {
  try {
    const result = await pb.collection('training_updates').create({
      type: update.type,
      training_id: update.trainingId || null,
      training_name: update.trainingName,
      message: update.message,
      previous_value: update.previousValue || null,
      new_value: update.newValue || null,
    });
    return dbToTrainingUpdate(result as DbTrainingUpdate);
  } catch (error) {
    console.error('Error creating training update:', error);
    return null;
  }
}

// ============= Learning Platforms =============

interface DbLearningPlatform {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export async function fetchLearningPlatforms(): Promise<LearningPlatform[]> {
  try {
    const result = await pb.collection('learning_platforms').getList(1, 50, {
      sort: 'name'
    });
    return result.items.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      url: row.url,
    } as LearningPlatform));
  } catch (error) {
    console.error('Error fetching learning platforms:', error);
    return [];
  }
}
