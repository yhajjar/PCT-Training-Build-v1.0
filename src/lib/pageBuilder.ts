import { supabase } from '@/integrations/supabase/client';
import { PageContent, PageVersion, ContentBlock } from '@/types/pageBuilder';
import { Json } from '@/integrations/supabase/types';

interface DbPageContent {
  id: string;
  page_slug: string;
  title: string;
  blocks: ContentBlock[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DbPageVersion {
  id: string;
  page_id: string;
  version_number: number;
  blocks: ContentBlock[];
  created_at: string;
  notes: string | null;
}

function dbToPageContent(row: DbPageContent): PageContent {
  return {
    id: row.id,
    pageSlug: row.page_slug,
    title: row.title,
    blocks: row.blocks || [],
    isPublished: row.is_published,
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function dbToPageVersion(row: DbPageVersion): PageVersion {
  return {
    id: row.id,
    pageId: row.page_id,
    versionNumber: row.version_number,
    blocks: row.blocks || [],
    createdAt: new Date(row.created_at),
    notes: row.notes || undefined,
  };
}

export async function fetchPageContent(pageSlug: string): Promise<PageContent | null> {
  const { data, error } = await supabase
    .from('page_content')
    .select('*')
    .eq('page_slug', pageSlug)
    .single();

  if (error) {
    console.error('Error fetching page content:', error);
    return null;
  }

  return dbToPageContent(data as unknown as DbPageContent);
}

export async function savePageContent(
  pageSlug: string,
  blocks: ContentBlock[],
  publish: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('page_content')
    .select('id, is_published')
    .eq('page_slug', pageSlug)
    .single();

  const updateData: Record<string, unknown> = {
    blocks: blocks,
    updated_at: new Date().toISOString(),
  };

  if (publish) {
    updateData.is_published = true;
    updateData.published_at = new Date().toISOString();
  }

  if (existing) {
    const { error } = await supabase
      .from('page_content')
      .update(updateData)
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating page content:', error);
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from('page_content')
      .insert([{
        page_slug: pageSlug,
        title: pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1),
        blocks: JSON.parse(JSON.stringify(blocks)) as Json,
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
      }]);

    if (error) {
      console.error('Error creating page content:', error);
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

export async function createPageVersion(
  pageId: string,
  blocks: ContentBlock[],
  notes?: string
): Promise<{ success: boolean; versionNumber?: number; error?: string }> {
  // Get the latest version number
  const { data: latestVersion } = await supabase
    .from('page_versions')
    .select('version_number')
    .eq('page_id', pageId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const newVersionNumber = (latestVersion?.version_number || 0) + 1;

  const { error } = await supabase
    .from('page_versions')
    .insert([{
      page_id: pageId,
      version_number: newVersionNumber,
      blocks: JSON.parse(JSON.stringify(blocks)) as Json,
      notes: notes || null,
    }]);

  if (error) {
    console.error('Error creating page version:', error);
    return { success: false, error: error.message };
  }

  return { success: true, versionNumber: newVersionNumber };
}

export async function fetchPageVersions(pageId: string): Promise<PageVersion[]> {
  const { data, error } = await supabase
    .from('page_versions')
    .select('*')
    .eq('page_id', pageId)
    .order('version_number', { ascending: false });

  if (error) {
    console.error('Error fetching page versions:', error);
    return [];
  }

  return data.map(row => dbToPageVersion(row as unknown as DbPageVersion));
}

export async function restorePageVersion(
  pageSlug: string,
  version: PageVersion
): Promise<{ success: boolean; error?: string }> {
  return savePageContent(pageSlug, version.blocks, false);
}

// Helper to generate unique IDs
export function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// Default block templates
export function createDefaultBlock(type: ContentBlock['type']): ContentBlock {
  const id = generateBlockId();
  
  switch (type) {
    case 'heading':
      return { id, type: 'heading', level: 2, content: 'New Heading', align: 'left' };
    case 'paragraph':
      return { id, type: 'paragraph', content: 'Enter your text here...', align: 'left' };
    case 'link':
      return { id, type: 'link', text: 'Click here', url: '#', style: 'button', align: 'left' };
    case 'row':
      return { 
        id, 
        type: 'row', 
        columns: [
          { id: generateBlockId(), blocks: [] },
          { id: generateBlockId(), blocks: [] }
        ],
        gap: 'md'
      };
    case 'divider':
      return { id, type: 'divider' };
    case 'spacer':
      return { id, type: 'spacer', height: 'md' };
    case 'icon-card':
      return { 
        id, 
        type: 'icon-card', 
        icon: 'HelpCircle', 
        title: 'Card Title', 
        description: 'Card description goes here...' 
      };
    default:
      return { id, type: 'paragraph', content: '', align: 'left' };
  }
}