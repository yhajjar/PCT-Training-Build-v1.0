import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save, Eye, Plus, Undo2, History, 
  Type, AlignLeft, Link2, Columns, Minus, Square, CreditCard, Loader2, Check
} from 'lucide-react';
import { ContentBlock, PageContent, PageVersion } from '@/types/pageBuilder';
import { 
  fetchPageContent, 
  savePageContent, 
  createPageVersion, 
  fetchPageVersions, 
  restorePageVersion,
  createDefaultBlock 
} from '@/lib/pageBuilder';
import { BlockEditor } from './BlockEditor';
import { BlockRenderer } from './BlockRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PageBuilderProps {
  pageSlug: string;
}

const blockTypes = [
  { type: 'heading' as const, icon: Type, label: 'Heading' },
  { type: 'paragraph' as const, icon: AlignLeft, label: 'Paragraph' },
  { type: 'link' as const, icon: Link2, label: 'Link / Button' },
  { type: 'row' as const, icon: Columns, label: 'Row Layout' },
  { type: 'divider' as const, icon: Minus, label: 'Divider' },
  { type: 'spacer' as const, icon: Square, label: 'Spacer' },
  { type: 'icon-card' as const, icon: CreditCard, label: 'Icon Card' },
];

export function PageBuilder({ pageSlug }: PageBuilderProps) {
  const { toast } = useToast();
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Load page content
  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      const content = await fetchPageContent(pageSlug);
      if (content) {
        setPageContent(content);
        setBlocks(content.blocks);
      }
      setIsLoading(false);
    }
    loadContent();
  }, [pageSlug]);

  // Track changes
  useEffect(() => {
    if (pageContent) {
      const hasModifications = JSON.stringify(blocks) !== JSON.stringify(pageContent.blocks);
      setHasChanges(hasModifications);
    }
  }, [blocks, pageContent]);

  const loadVersions = useCallback(async () => {
    if (pageContent) {
      const versionList = await fetchPageVersions(pageContent.id);
      setVersions(versionList);
    }
  }, [pageContent]);

  const handleAddBlock = (type: ContentBlock['type']) => {
    const newBlock = createDefaultBlock(type);
    setBlocks(prev => [...prev, newBlock]);
  };

  const handleUpdateBlock = (index: number, updatedBlock: ContentBlock) => {
    setBlocks(prev => prev.map((b, i) => i === index ? updatedBlock : b));
  };

  const handleDeleteBlock = (index: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    setBlocks(prev => {
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      return newBlocks;
    });
  };

  const handleSave = async (publish: boolean = false) => {
    setIsSaving(true);
    
    // Validate blocks
    if (blocks.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Page must have at least one block',
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    // Create version before saving
    if (pageContent) {
      await createPageVersion(pageContent.id, pageContent.blocks, `Auto-save before ${publish ? 'publish' : 'save'}`);
    }

    const result = await savePageContent(pageSlug, blocks, publish);
    
    if (result.success) {
      toast({
        title: publish ? 'Published!' : 'Saved!',
        description: publish 
          ? 'Your changes are now live on the Support page' 
          : 'Your changes have been saved as a draft',
      });
      
      // Refresh content
      const content = await fetchPageContent(pageSlug);
      if (content) {
        setPageContent(content);
        setBlocks(content.blocks);
      }
      setHasChanges(false);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to save changes',
        variant: 'destructive',
      });
    }
    
    setIsSaving(false);
  };

  const handleRestoreVersion = async (version: PageVersion) => {
    const result = await restorePageVersion(pageSlug, version);
    if (result.success) {
      setBlocks(version.blocks);
      setShowVersions(false);
      toast({
        title: 'Version Restored',
        description: `Restored to version ${version.versionNumber}. Save to apply changes.`,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to restore version',
        variant: 'destructive',
      });
    }
  };

  const handleResetChanges = () => {
    if (pageContent) {
      setBlocks(pageContent.blocks);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Support Page Builder</h2>
          <p className="text-sm text-muted-foreground">
            Visually create and edit your Support page
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={handleResetChanges}>
              <Undo2 className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              loadVersions();
              setShowVersions(true);
            }}
          >
            <History className="h-4 w-4 mr-1" />
            Versions
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSave(false)}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Draft
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      {pageContent && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
            pageContent.isPublished 
              ? "bg-green-500/10 text-green-600" 
              : "bg-yellow-500/10 text-yellow-600"
          )}>
            {pageContent.isPublished ? 'Published' : 'Draft'}
          </span>
          {pageContent.publishedAt && (
            <span>Last published: {format(pageContent.publishedAt, 'MMM d, yyyy h:mm a')}</span>
          )}
          {hasChanges && (
            <span className="text-orange-500">• Unsaved changes</span>
          )}
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
        <TabsList>
          <TabsTrigger value="edit" className="gap-2">
            <AlignLeft className="h-4 w-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Block Palette */}
            <Card className="lg:col-span-1 h-fit">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Add Blocks</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {blockTypes.map(({ type, icon: Icon, label }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => handleAddBlock(type)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Block List */}
            <div className="lg:col-span-3 space-y-3">
              {blocks.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No blocks yet</p>
                    <p className="text-sm text-muted-foreground">Click a block type to add content</p>
                  </CardContent>
                </Card>
              ) : (
                blocks.map((block, index) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    onUpdate={(updated) => handleUpdateBlock(index, updated)}
                    onDelete={() => handleDeleteBlock(index)}
                    onMoveUp={() => handleMoveBlock(index, 'up')}
                    onMoveDown={() => handleMoveBlock(index, 'down')}
                    isFirst={index === 0}
                    isLast={index === blocks.length - 1}
                  />
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-4xl mx-auto py-8 space-y-6">
                {blocks.map((block) => (
                  <BlockRenderer key={block.id} block={block} isPreview />
                ))}
                {blocks.length === 0 && (
                  <p className="text-center text-muted-foreground py-12">
                    No content to preview. Add some blocks in the Edit tab.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Version History Sheet */}
      <Sheet open={showVersions} onOpenChange={setShowVersions}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Version History</SheetTitle>
            <SheetDescription>
              Restore previous versions of this page
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-150px)] mt-4">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No previous versions found
              </p>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <Card key={version.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Version {version.versionNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(version.createdAt, 'MMM d, yyyy h:mm a')}
                        </p>
                        {version.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{version.notes}</p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRestoreVersion(version)}
                      >
                        Restore
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}