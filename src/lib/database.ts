import { supabase } from '@/integrations/supabase/client';
import { Category, Training, Registration, Resource, TrainingUpdate, TrainingAttachment } from '@/types/training';

// ============= Categories =============

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    name: row.name,
    color: row.color,
  }));
}

export async function createCategory(category: Omit<Category, 'id'>): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: category.name,
      color: category.color,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    color: data.color,
  };
}

export async function updateCategoryDb(category: Category): Promise<boolean> {
  const { error } = await supabase
    .from('categories')
    .update({
      name: category.name,
      color: category.color,
    })
    .eq('id', category.id);

  if (error) {
    console.error('Error updating category:', error);
    return false;
  }

  return true;
}

export async function deleteCategoryDb(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }

  return true;
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
    heroImage: row.hero_image || undefined,
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
  const { data: trainingsData, error: trainingsError } = await supabase
    .from('trainings')
    .select('*')
    .order('date', { ascending: true });

  if (trainingsError) {
    console.error('Error fetching trainings:', trainingsError);
    return [];
  }

  // Fetch attachments for all trainings
  const { data: attachmentsData, error: attachmentsError } = await supabase
    .from('training_attachments')
    .select('*');

  if (attachmentsError) {
    console.error('Error fetching attachments:', attachmentsError);
  }

  const attachmentsByTraining = new Map<string, TrainingAttachment[]>();
  (attachmentsData || []).forEach(att => {
    const list = attachmentsByTraining.get(att.training_id) || [];
    list.push({
      id: att.id,
      name: att.name,
      fileUrl: att.file_url,
      fileType: att.file_type,
      uploadedAt: new Date(att.uploaded_at),
    });
    attachmentsByTraining.set(att.training_id, list);
  });

  return trainingsData.map(row => dbToTraining(row as DbTraining, attachmentsByTraining.get(row.id) || []));
}

export async function createTraining(training: Omit<Training, 'id'> & { id?: string }): Promise<Training | null> {
  const { data, error } = await supabase
    .from('trainings')
    .insert({
      // Let the database generate the UUID - don't pass id
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
      hero_image: training.heroImage || null,
      is_featured: training.isFeatured,
      is_recommended: training.isRecommended,
      is_registration_open: training.isRegistrationOpen,
      display_order: training.displayOrder || null,
      location: training.location || null,
      speakers: training.speakers || null,
      target_audience: training.targetAudience || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating training:', error);
    return null;
  }

  // Insert attachments if any
  if (training.attachments && training.attachments.length > 0) {
    const { error: attError } = await supabase
      .from('training_attachments')
      .insert(training.attachments.map(att => ({
        training_id: data.id,
        name: att.name,
        file_url: att.fileUrl,
        file_type: att.fileType,
      })));

    if (attError) {
      console.error('Error creating attachments:', attError);
    }
  }

  return dbToTraining(data as DbTraining, training.attachments || []);
}

export async function updateTrainingDb(training: Training): Promise<boolean> {
  const { error } = await supabase
    .from('trainings')
    .update({
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
      hero_image: training.heroImage || null,
      is_featured: training.isFeatured,
      is_recommended: training.isRecommended,
      is_registration_open: training.isRegistrationOpen,
      display_order: training.displayOrder || null,
      location: training.location || null,
      speakers: training.speakers || null,
      target_audience: training.targetAudience || null,
    })
    .eq('id', training.id);

  if (error) {
    console.error('Error updating training:', error);
    return false;
  }

  // Update attachments - delete old ones and insert new ones
  if (training.attachments) {
    await supabase
      .from('training_attachments')
      .delete()
      .eq('training_id', training.id);

    if (training.attachments.length > 0) {
      const { error: attError } = await supabase
        .from('training_attachments')
        .insert(training.attachments.map(att => ({
          training_id: training.id,
          name: att.name,
          file_url: att.fileUrl,
          file_type: att.fileType,
        })));

      if (attError) {
        console.error('Error updating attachments:', attError);
      }
    }
  }

  return true;
}

export async function deleteTrainingDb(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('trainings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting training:', error);
    return false;
  }

  return true;
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
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('registered_at', { ascending: false });

  if (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }

  return data.map(row => dbToRegistration(row as DbRegistration));
}

export async function createRegistration(registration: Omit<Registration, 'id'> & { id?: string }): Promise<Registration | null> {
  const { data, error } = await supabase
    .from('registrations')
    .insert({
      // Let the database generate the UUID - don't pass id
      training_id: registration.trainingId,
      user_id: null,
      participant_name: registration.participantName,
      participant_email: registration.participantEmail,
      participant_phone: registration.participantPhone || null,
      status: registration.status,
      attendance_status: registration.attendanceStatus,
      notes: registration.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating registration:', error);
    return null;
  }

  return dbToRegistration(data as DbRegistration);
}

export async function updateRegistrationDb(registration: Registration): Promise<boolean> {
  const { error } = await supabase
    .from('registrations')
    .update({
      participant_name: registration.participantName,
      participant_email: registration.participantEmail,
      participant_phone: registration.participantPhone || null,
      status: registration.status,
      attendance_status: registration.attendanceStatus,
      notes: registration.notes || null,
      notified_at: registration.notifiedAt ? registration.notifiedAt.toISOString() : null,
    })
    .eq('id', registration.id);

  if (error) {
    console.error('Error updating registration:', error);
    return false;
  }

  return true;
}

export async function deleteRegistrationDb(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting registration:', error);
    return false;
  }

  return true;
}

// ============= Resources =============

interface DbResource {
  id: string;
  title: string;
  type: string;
  file_url: string | null;
  file_path: string | null;
  external_link: string | null;
}

function dbToResource(row: DbResource): Resource {
  return {
    id: row.id,
    title: row.title,
    type: row.type as Resource['type'],
    fileUrl: row.file_url || undefined,
    filePath: row.file_path || undefined,
    externalLink: row.external_link || undefined,
  };
}

export async function fetchResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('title');

  if (error) {
    console.error('Error fetching resources:', error);
    return [];
  }

  return data.map(row => dbToResource(row as DbResource));
}

export async function createResource(resource: Omit<Resource, 'id'>): Promise<Resource | null> {
  const { data, error } = await supabase
    .from('resources')
    .insert({
      // Let the database generate the UUID - don't pass id
      title: resource.title,
      type: resource.type,
      file_url: resource.fileUrl || null,
      file_path: resource.filePath || null,
      external_link: resource.externalLink || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating resource:', error);
    return null;
  }

  return dbToResource(data as DbResource);
}

export async function updateResourceDb(resource: Resource): Promise<boolean> {
  const { error } = await supabase
    .from('resources')
    .update({
      title: resource.title,
      type: resource.type,
      file_url: resource.fileUrl || null,
      file_path: resource.filePath || null,
      external_link: resource.externalLink || null,
    })
    .eq('id', resource.id);

  if (error) {
    console.error('Error updating resource:', error);
    return false;
  }

  return true;
}

export async function deleteResourceDb(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting resource:', error);
    return false;
  }

  return true;
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
  const { data, error } = await supabase
    .from('training_updates')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching training updates:', error);
    return [];
  }

  return data.map(row => dbToTrainingUpdate(row as DbTrainingUpdate));
}

export async function createTrainingUpdate(update: Omit<TrainingUpdate, 'id' | 'timestamp'>): Promise<TrainingUpdate | null> {
  const { data, error } = await supabase
    .from('training_updates')
    .insert({
      type: update.type,
      training_id: update.trainingId || null,
      training_name: update.trainingName,
      message: update.message,
      previous_value: update.previousValue || null,
      new_value: update.newValue || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating training update:', error);
    return null;
  }

  return dbToTrainingUpdate(data as DbTrainingUpdate);
}
