import { LucideIcon } from 'lucide-react';

export type BlockType = 'heading' | 'paragraph' | 'row' | 'link' | 'divider' | 'spacer' | 'icon-card';

export type TextAlign = 'left' | 'center' | 'right';
export type HeadingLevel = 1 | 2 | 3 | 4;
export type LinkStyle = 'text' | 'button' | 'button-outline';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: HeadingLevel;
  content: string;
  align: TextAlign;
  icon?: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;
  align: TextAlign;
}

export interface LinkBlock extends BaseBlock {
  type: 'link';
  text: string;
  url: string;
  style: LinkStyle;
  align: TextAlign;
  icon?: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  height: 'sm' | 'md' | 'lg' | 'xl';
}

export interface IconCardBlock extends BaseBlock {
  type: 'icon-card';
  icon: string;
  title: string;
  description: string;
  linkText?: string;
  linkUrl?: string;
}

export interface ColumnContent {
  id: string;
  blocks: ContentBlock[];
}

export interface RowBlock extends BaseBlock {
  type: 'row';
  columns: ColumnContent[];
  gap?: 'sm' | 'md' | 'lg';
}

export type ContentBlock = 
  | HeadingBlock 
  | ParagraphBlock 
  | LinkBlock 
  | RowBlock 
  | DividerBlock 
  | SpacerBlock
  | IconCardBlock;

export interface PageContent {
  id: string;
  pageSlug: string;
  title: string;
  blocks: ContentBlock[];
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageVersion {
  id: string;
  pageId: string;
  versionNumber: number;
  blocks: ContentBlock[];
  createdAt: Date;
  notes?: string;
}

// Available icons for the editor
export const availableIcons = [
  'Monitor', 'Users', 'Phone', 'Mail', 'MessageCircle', 'HelpCircle',
  'FileText', 'BookOpen', 'Headphones', 'Globe', 'Shield', 'Heart',
  'Star', 'Clock', 'Calendar', 'MapPin', 'Building', 'Briefcase',
  'GraduationCap', 'Award', 'Target', 'Lightbulb', 'Rocket', 'Zap'
] as const;

export type AvailableIcon = typeof availableIcons[number];