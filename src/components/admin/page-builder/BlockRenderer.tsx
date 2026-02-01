import React from 'react';
import { 
  Monitor, Users, Phone, Mail, MessageCircle, HelpCircle,
  FileText, BookOpen, Headphones, Globe, Shield, Heart,
  Star, Clock, Calendar, MapPin, Building, Briefcase,
  GraduationCap, Award, Target, Lightbulb, Rocket, Zap,
  LucideIcon
} from 'lucide-react';
import { ContentBlock } from '@/types/pageBuilder';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Icon mapping
const iconComponents: Record<string, LucideIcon> = {
  Monitor, Users, Phone, Mail, MessageCircle, HelpCircle,
  FileText, BookOpen, Headphones, Globe, Shield, Heart,
  Star, Clock, Calendar, MapPin, Building, Briefcase,
  GraduationCap, Award, Target, Lightbulb, Rocket, Zap,
};

interface BlockRendererProps {
  block: ContentBlock;
  isPreview?: boolean;
}

// Helper to get icon component
function getIcon(iconName?: string): React.ReactNode {
  if (!iconName) return null;
  const IconComponent = iconComponents[iconName];
  return IconComponent ? <IconComponent className="h-6 w-6" /> : null;
}

export function BlockRenderer({ block, isPreview = false }: BlockRendererProps) {
  switch (block.type) {
    case 'heading': {
      const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      }[block.align];

      const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
      const sizeClass = {
        1: 'text-4xl font-bold',
        2: 'text-3xl font-bold',
        3: 'text-2xl font-semibold',
        4: 'text-xl font-semibold',
      }[block.level];

      return (
        <HeadingTag className={cn(sizeClass, alignClass, 'flex items-center gap-3', block.align === 'center' && 'justify-center')}>
          {block.icon && <span className="text-primary">{getIcon(block.icon)}</span>}
          {block.content}
        </HeadingTag>
      );
    }

    case 'paragraph': {
      const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      }[block.align];

      return (
        <p className={cn('text-muted-foreground', alignClass)}>
          {block.content}
        </p>
      );
    }

    case 'link': {
      const alignClass = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
      }[block.align];

      if (block.style === 'text') {
        return (
          <div className={cn('flex', alignClass)}>
            <a 
              href={block.url} 
              className="text-primary hover:underline inline-flex items-center gap-2"
              target={block.url.startsWith('http') ? '_blank' : undefined}
              rel={block.url.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {block.icon && getIcon(block.icon)}
              {block.text}
            </a>
          </div>
        );
      }

      return (
        <div className={cn('flex', alignClass)}>
          <Button
            variant={block.style === 'button-outline' ? 'outline' : 'default'}
            asChild
          >
            <a 
              href={block.url}
              target={block.url.startsWith('http') ? '_blank' : undefined}
              rel={block.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-2"
            >
              {block.icon && getIcon(block.icon)}
              {block.text}
            </a>
          </Button>
        </div>
      );
    }

    case 'row': {
      const gapClass = {
        sm: 'gap-4',
        md: 'gap-6',
        lg: 'gap-8',
      }[block.gap || 'md'];

      return (
        <div className={cn('grid', gapClass, `grid-cols-1 md:grid-cols-${block.columns.length}`)}>
          {block.columns.map((column) => (
            <div key={column.id} className="space-y-4">
              {column.blocks.map((childBlock) => (
                <BlockRenderer key={childBlock.id} block={childBlock} isPreview={isPreview} />
              ))}
            </div>
          ))}
        </div>
      );
    }

    case 'divider':
      return <hr className="border-t border-border my-4" />;

    case 'spacer': {
      const heightClass = {
        sm: 'h-4',
        md: 'h-8',
        lg: 'h-12',
        xl: 'h-16',
      }[block.height];

      return <div className={heightClass} />;
    }

    case 'icon-card':
      return (
        <div className="p-6 border border-border rounded-lg bg-card text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
            {getIcon(block.icon)}
          </div>
          <h3 className="text-lg font-semibold">{block.title}</h3>
          <p className="text-sm text-muted-foreground">{block.description}</p>
          {block.linkText && block.linkUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={block.linkUrl}>{block.linkText}</a>
            </Button>
          )}
        </div>
      );

    default:
      return null;
  }
}