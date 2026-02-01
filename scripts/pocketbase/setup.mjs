import PocketBase from 'pocketbase';
import {
  seedCategories,
  seedTrainings,
  seedRegistrations,
  seedResources,
  seedLearningPlatforms,
} from './seedData.mjs';

const POCKETBASE_URL = process.env.POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!POCKETBASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing env vars. Required: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD');
  process.exit(1);
}

const pb = new PocketBase(POCKETBASE_URL);

const textField = (name, required = false) => ({
  name,
  type: 'text',
  required,
  unique: false,
  options: { min: null, max: null, pattern: '' },
});

const numberField = (name, required = false, noDecimal = false) => ({
  name,
  type: 'number',
  required,
  unique: false,
  options: { min: null, max: null, noDecimal },
});

const boolField = (name) => ({
  name,
  type: 'bool',
  required: false,
  unique: false,
  options: {},
});

const dateField = (name, required = false) => ({
  name,
  type: 'date',
  required,
  unique: false,
  options: { min: '', max: '' },
});

const jsonField = (name, required = false) => ({
  name,
  type: 'json',
  required,
  unique: false,
  options: { maxSize: 1048576 },
});

async function ensureCollection(name, schema) {
  try {
    const existing = await pb.collections.getOne(name);
    const existingFields = new Set((existing.schema || []).map((f) => f.name));
    const mergedSchema = [...existing.schema];
    schema.forEach((field) => {
      if (!existingFields.has(field.name)) {
        mergedSchema.push(field);
      }
    });
    if (mergedSchema.length !== existing.schema.length) {
      await pb.collections.update(existing.id, { schema: mergedSchema });
      console.log(`Updated collection schema: ${name}`);
    } else {
      console.log(`Collection exists: ${name}`);
    }
    return existing.id;
  } catch (error) {
    const created = await pb.collections.create({
      name,
      type: 'base',
      schema,
    });
    console.log(`Created collection: ${name}`);
    return created.id;
  }
}

async function ensureRoleField() {
  const users = await pb.collections.getOne('users');
  const hasRole = (users.schema || []).some((f) => f.name === 'role');
  if (hasRole) {
    console.log('Users collection already has role field');
    return;
  }
  const updatedSchema = [...users.schema, textField('role')];
  await pb.collections.update(users.id, { schema: updatedSchema });
  console.log('Added role field to users collection');
}

async function seedIfEmpty(collectionName, items, mapFn) {
  const list = await pb.collection(collectionName).getList(1, 1);
  if (list.totalItems > 0) {
    console.log(`Skipping seed for ${collectionName} (already has data)`);
    return;
  }

  for (const item of items) {
    await pb.collection(collectionName).create(mapFn(item));
  }
  console.log(`Seeded ${collectionName} (${items.length} records)`);
}

async function run() {
  console.log('Authenticating admin...');
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

  await ensureRoleField();

  await ensureCollection('categories', [
    textField('name', true),
    textField('color', true),
  ]);

  await ensureCollection('trainings', [
    textField('name', true),
    textField('description', true),
    textField('short_description'),
    textField('category_id'),
    dateField('date', true),
    dateField('end_date'),
    textField('time_from'),
    textField('time_to'),
    textField('duration'),
    textField('status'),
    numberField('available_slots', false, true),
    numberField('max_registrations', false, true),
    textField('registration_method'),
    textField('external_link'),
    textField('hero_image'),
    boolField('is_featured'),
    boolField('is_recommended'),
    boolField('is_registration_open'),
    numberField('display_order', false, true),
    textField('location'),
    textField('speakers'),
    textField('target_audience'),
  ]);

  await ensureCollection('training_attachments', [
    textField('training_id', true),
    textField('name', true),
    textField('file_url', true),
    textField('file_type', true),
  ]);

  await ensureCollection('registrations', [
    textField('training_id', true),
    textField('user_id'),
    textField('participant_name', true),
    textField('participant_email', true),
    textField('participant_phone'),
    dateField('registered_at'),
    textField('status'),
    textField('attendance_status'),
    textField('notes'),
    dateField('notified_at'),
  ]);

  await ensureCollection('resources', [
    textField('title', true),
    textField('type', true),
    textField('file_url'),
    textField('file_path'),
    textField('external_link'),
  ]);

  await ensureCollection('training_updates', [
    textField('type', true),
    textField('training_id'),
    textField('training_name', true),
    textField('message', true),
    dateField('timestamp'),
    textField('previous_value'),
    textField('new_value'),
  ]);

  await ensureCollection('page_content', [
    textField('page_slug', true),
    textField('title', true),
    jsonField('blocks', true),
    boolField('is_published'),
    dateField('published_at'),
  ]);

  await ensureCollection('page_versions', [
    textField('page_id', true),
    numberField('version_number', true, true),
    jsonField('blocks', true),
    textField('notes'),
  ]);

  await ensureCollection('learning_platforms', [
    textField('name', true),
    textField('icon', true),
    textField('url', true),
  ]);

  // Seed data
  const categoryIdMap = new Map();
  await seedIfEmpty('categories', seedCategories, (cat) => {
    return { name: cat.name, color: cat.color };
  });

  // Build category map from current data
  const categories = await pb.collection('categories').getList(1, 200, { sort: '+name' });
  categories.items.forEach((item) => {
    const match = seedCategories.find((c) => c.name === item.name);
    if (match) {
      categoryIdMap.set(match.legacyId, item.id);
    }
  });

  const trainingIdMap = new Map();
  await seedIfEmpty('trainings', seedTrainings, (t) => ({
    name: t.name,
    description: t.description,
    short_description: t.short_description || null,
    category_id: categoryIdMap.get(t.categoryLegacyId) || null,
    date: t.date,
    end_date: t.end_date || null,
    time_from: t.time_from || null,
    time_to: t.time_to || null,
    duration: t.duration || null,
    status: t.status,
    available_slots: t.available_slots,
    max_registrations: t.max_registrations,
    registration_method: t.registration_method,
    external_link: t.external_link || null,
    hero_image: t.hero_image || null,
    is_featured: t.is_featured,
    is_recommended: t.is_recommended,
    is_registration_open: t.is_registration_open,
    display_order: t.display_order,
    location: t.location || null,
    speakers: t.speakers || null,
    target_audience: t.target_audience || null,
  }));

  const trainings = await pb.collection('trainings').getList(1, 500, { sort: '+created' });
  trainings.items.forEach((item, index) => {
    const seed = seedTrainings[index];
    if (seed) {
      trainingIdMap.set(seed.legacyId, item.id);
    }
  });

  await seedIfEmpty('registrations', seedRegistrations, (r) => ({
    training_id: trainingIdMap.get(r.trainingLegacyId) || null,
    participant_name: r.participant_name,
    participant_email: r.participant_email,
    registered_at: r.registered_at,
    status: r.status,
    attendance_status: r.attendance_status,
  }));

  await seedIfEmpty('resources', seedResources, (r) => ({
    title: r.title,
    type: r.type,
    external_link: r.external_link || null,
  }));

  await seedIfEmpty('learning_platforms', seedLearningPlatforms, (lp) => ({
    name: lp.name,
    icon: lp.icon,
    url: lp.url,
  }));

  console.log('Setup complete.');
}

run().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
