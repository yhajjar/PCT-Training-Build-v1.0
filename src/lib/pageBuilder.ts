import { pb } from '@/integrations/pocketbase/client';
import { PageContent, PageVersion, ContentBlock } from '@/types/pageBuilder';

interface DbPageContent {
  id: string;
  page_slug: string;
  title: string;
  blocks: ContentBlock[];
  is_published: boolean;
  published_at: string | null;
  created: string;
  updated: string;
}

interface DbPageVersion {
  id: string;
  page_id: string;
  version_number: number;
  blocks: ContentBlock[];
  created: string;
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
    createdAt: new Date(row.created),
    updatedAt: new Date(row.updated),
  };
}

function dbToPageVersion(row: DbPageVersion): PageVersion {
  return {
    id: row.id,
    pageId: row.page_id,
    versionNumber: row.version_number,
    blocks: row.blocks || [],
    createdAt: new Date(row.created),
    notes: row.notes || undefined,
  };
}

export async function fetchPageContent(pageSlug: string): Promise<PageContent | null> {
  try {
    const result = await pb.collection('page_content').getFirstListItem(`page_slug = "${pageSlug}"`);
    return dbToPageContent(result as DbPageContent);
  } catch (error) {
    console.error('Error fetching page content:', error);
    return null;
  }
}

export async function savePageContent(
  pageSlug: string,
  blocks: ContentBlock[],
  publish: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if page exists
    let existing: DbPageContent | null = null;
    try {
      existing = await pb.collection('page_content').getFirstListItem(`page_slug = "${pageSlug}"`) as DbPageContent;
    } catch (e) {
      // Page doesn't exist yet
    }

    const updateData: Record<string, unknown> = {
      blocks: JSON.parse(JSON.stringify(blocks)),
      updated: new Date().toISOString(),
    };

    if (publish) {
      (updateData as any).is_published = true;
      (updateData as any).published_at = new Date().toISOString();
    }

    if (existing) {
      await pb.collection('page_content').update(existing.id, updateData);
    } else {
      await pb.collection('page_content').create({
        page_slug: pageSlug,
        title: pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1),
        blocks: JSON.parse(JSON.stringify(blocks)),
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error saving page content:', error);
    return { success: false, error: error?.message };
  }
}

export async function createPageVersion(
  pageId: string,
  blocks: ContentBlock[],
  notes?: string
): Promise<{ success: boolean; versionNumber?: number; error?: string }> {
  try {
    // Get latest version number
    const latestVersions = await pb.collection('page_versions').getList(1, 1, {
      filter: `page_id = "${pageId}"`,
      sort: '-version_number'
    });
    
    const newVersionNumber = (latestVersions.items[0]?.version_number || 0) + 1;

    await pb.collection('page_versions').create({
      page_id: pageId,
      version_number: newVersionNumber,
      blocks: JSON.parse(JSON.stringify(blocks)),
      notes: notes || null,
    });

    return { success: true, versionNumber: newVersionNumber };
  } catch (error: any) {
    console.error('Error creating page version:', error);
    return { success: false, error: error?.message };
  }
}

export async function fetchPageVersions(pageId: string): Promise<PageVersion[]> {
  try {
    const result = await pb.collection('page_versions').getList(1, 50, {
      filter: `page_id = "${pageId}"`,
      sort: '-version_number'
    });
    return result.items.map(row => dbToPageVersion(row as DbPageVersion));
  } catch (error) {
    console.error('Error fetching page versions:', error);
    return [];
  }
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
