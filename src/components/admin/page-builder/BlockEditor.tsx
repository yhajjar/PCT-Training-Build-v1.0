import React from 'react';
import { 
  Monitor, Users, Phone, Mail, MessageCircle, HelpCircle,
  FileText, BookOpen, Headphones, Globe, Shield, Heart,
  Star, Clock, Calendar, MapPin, Building, Briefcase,
  GraduationCap, Award, Target, Lightbulb, Rocket, Zap,
  Trash2, Plus, GripVertical, X, ChevronUp, ChevronDown,
  LucideIcon
} from 'lucide-react';
import { ContentBlock, HeadingLevel, TextAlign, LinkStyle, availableIcons } from '@/types/pageBuilder';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateBlockId } from '@/lib/pageBuilder';

// Icon mapping
const iconComponents: Record<string, LucideIcon> = {
  Monitor, Users, Phone, Mail, MessageCircle, HelpCircle,
  FileText, BookOpen, Headphones, Globe, Shield, Heart,
  Star, Clock, Calendar, MapPin, Building, Briefcase,
  GraduationCap, Award, Target, Lightbulb, Rocket, Zap,
};

interface BlockEditorProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

// Helper to get icon component
function getIconPreview(iconName: string): React.ReactNode {
  const IconComponent = iconComponents[iconName];
  return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
}

export function BlockEditor({ 
  block, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast 
}: BlockEditorProps) {
  const renderEditor = () => {
    switch (block.type) {
      case 'heading':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Content</Label>
              <Input
                value={block.content}
                onChange={(e) => onUpdate({ ...block, content: e.target.value })}
                placeholder="Heading text..."
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Level</Label>
                <Select 
                  value={String(block.level)} 
                  onValueChange={(v) => onUpdate({ ...block, level: parseInt(v) as HeadingLevel })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">H1</SelectItem>
                    <SelectItem value="2">H2</SelectItem>
                    <SelectItem value="3">H3</SelectItem>
                    <SelectItem value="4">H4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Align</Label>
                <Select 
                  value={block.align} 
                  onValueChange={(v) => onUpdate({ ...block, align: v as TextAlign })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Icon</Label>
                <Select 
                  value={block.icon || 'none'} 
                  onValueChange={(v) => onUpdate({ ...block, icon: v === 'none' ? undefined : v })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableIcons.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <span className="flex items-center gap-2">
                          {getIconPreview(icon)}
                          {icon}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'paragraph':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Content</Label>
              <Textarea
                value={block.content}
                onChange={(e) => onUpdate({ ...block, content: e.target.value })}
                placeholder="Paragraph text..."
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs">Align</Label>
              <Select 
                value={block.align} 
                onValueChange={(v) => onUpdate({ ...block, align: v as TextAlign })}
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Text</Label>
                <Input
                  value={block.text}
                  onChange={(e) => onUpdate({ ...block, text: e.target.value })}
                  placeholder="Link text..."
                />
              </div>
              <div>
                <Label className="text-xs">URL</Label>
                <Input
                  value={block.url}
                  onChange={(e) => onUpdate({ ...block, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Style</Label>
                <Select 
                  value={block.style} 
                  onValueChange={(v) => onUpdate({ ...block, style: v as LinkStyle })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="button">Button</SelectItem>
                    <SelectItem value="button-outline">Outline</SelectItem>
                    <SelectItem value="text">Text Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Align</Label>
                <Select 
                  value={block.align} 
                  onValueChange={(v) => onUpdate({ ...block, align: v as TextAlign })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Icon</Label>
                <Select 
                  value={block.icon || 'none'} 
                  onValueChange={(v) => onUpdate({ ...block, icon: v === 'none' ? undefined : v })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableIcons.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <span className="flex items-center gap-2">
                          {getIconPreview(icon)}
                          {icon}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'row':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Columns ({block.columns.length})</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newColumns = [...block.columns, { id: generateBlockId(), blocks: [] }];
                    onUpdate({ ...block, columns: newColumns });
                  }}
                  disabled={block.columns.length >= 4}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Column
                </Button>
              </div>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${block.columns.length}, 1fr)` }}>
              {block.columns.map((column, colIndex) => (
                <div key={column.id} className="relative border border-dashed border-border rounded p-2 min-h-[100px]">
                  <div className="absolute top-1 right-1 flex gap-1">
                    {block.columns.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => {
                          const newColumns = block.columns.filter((_, i) => i !== colIndex);
                          onUpdate({ ...block, columns: newColumns });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Col {colIndex + 1}
                    <br />
                    <span className="text-[10px]">{column.blocks.length} block(s)</span>
                  </p>
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs">Gap</Label>
              <Select 
                value={block.gap || 'md'} 
                onValueChange={(v) => onUpdate({ ...block, gap: v as 'sm' | 'md' | 'lg' })}
              >
                <SelectTrigger className="h-8 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'spacer':
        return (
          <div>
            <Label className="text-xs">Height</Label>
            <Select 
              value={block.height} 
              onValueChange={(v) => onUpdate({ ...block, height: v as 'sm' | 'md' | 'lg' | 'xl' })}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'divider':
        return (
          <p className="text-xs text-muted-foreground">Horizontal divider line</p>
        );

      case 'icon-card':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Icon</Label>
                <Select 
                  value={block.icon} 
                  onValueChange={(v) => onUpdate({ ...block, icon: v })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <span className="flex items-center gap-2">
                          {getIconPreview(icon)}
                          {icon}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Title</Label>
                <Input
                  value={block.title}
                  onChange={(e) => onUpdate({ ...block, title: e.target.value })}
                  placeholder="Card title..."
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                value={block.description}
                onChange={(e) => onUpdate({ ...block, description: e.target.value })}
                placeholder="Card description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Link Text (optional)</Label>
                <Input
                  value={block.linkText || ''}
                  onChange={(e) => onUpdate({ ...block, linkText: e.target.value || undefined })}
                  placeholder="Learn more..."
                />
              </div>
              <div>
                <Label className="text-xs">Link URL</Label>
                <Input
                  value={block.linkUrl || ''}
                  onChange={(e) => onUpdate({ ...block, linkUrl: e.target.value || undefined })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const blockTypeLabels: Record<string, string> = {
    heading: 'Heading',
    paragraph: 'Paragraph',
    link: 'Link / Button',
    row: 'Row Layout',
    divider: 'Divider',
    spacer: 'Spacer',
    'icon-card': 'Icon Card',
  };

  return (
    <Card className="border-2 border-border">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <CardTitle className="text-sm font-medium">
              {blockTypeLabels[block.type] || block.type}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {onMoveUp && !isFirst && (
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
            {onMoveDown && !isLast && (
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {renderEditor()}
      </CardContent>
    </Card>
  );
}