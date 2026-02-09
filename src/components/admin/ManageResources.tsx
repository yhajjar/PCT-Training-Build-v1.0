import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, FileText, BookOpen, FileCode, HelpCircle, Upload, ExternalLink, File, X, Loader2 } from 'lucide-react';
import { useTraining } from '@/context/TrainingContext';
import { Resource, ResourceType } from '@/types/training';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { resourceSchema, validateForm } from '@/lib/validation';
import { pb } from '@/integrations/pocketbase/client';

const resourceTypes: ResourceType[] = ['Guideline', 'User Guide', 'Template', 'FAQ'];

const iconMap: Record<ResourceType, React.ReactNode> = {
  Guideline: <FileText className="h-5 w-5" />,
  'User Guide': <BookOpen className="h-5 w-5" />,
  Template: <FileCode className="h-5 w-5" />,
  FAQ: <HelpCircle className="h-5 w-5" />,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ManageResources() {
  const { resources, addResource, updateResource, deleteResource } = useTraining();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ResourceType>('Guideline');
  const [externalLink, setExternalLink] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | undefined>(undefined);
  const [existingFilePath, setExistingFilePath] = useState<string | undefined>(undefined);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setType('Guideline');
    setExternalLink('');
    setPendingFile(null);
    setExistingFileUrl(undefined);
    setExistingFilePath(undefined);
    setShowForm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingId(resource.id);
    setTitle(resource.title);
    setType(resource.type);
    setExternalLink(resource.externalLink || '');
    setExistingFileUrl(resource.fileUrl);
    setExistingFilePath(resource.filePath);
    setPendingFile(null);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: 'File Too Large', 
        description: 'Maximum file size is 5MB', 
        variant: 'destructive' 
      });
      return;
    }

    setPendingFile(file);
    // Clear existing file when new one is selected
    setExistingFileUrl(undefined);
    setExistingFilePath(undefined);
  };

  const handleRemoveFile = () => {
    setPendingFile(null);
    setExistingFileUrl(undefined);
    setExistingFilePath(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateForm(resourceSchema, {
      title,
      externalLink: externalLink || undefined,
    });

    if (!validation.success) {
      toast({ title: 'Validation Error', description: 'error' in validation ? validation.error : 'Validation failed', variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    try {
      let fileUrl = existingFileUrl;
      let filePath = existingFilePath;

      // Upload new file if pending
      if (pendingFile) {
        // Note: File will be uploaded via FormData when creating/updating resource
        fileUrl = 'pending-upload';
        filePath = undefined;
      }

      const removeFile = !pendingFile && !existingFileUrl && !existingFilePath;
      if (editingId) {
        const resourceData: Resource = {
          id: editingId,
          title: title.trim(),
          type,
          fileUrl,
          filePath,
          externalLink: externalLink.trim() || undefined,
        };
        await updateResource({
          ...resourceData,
          resourceFile: pendingFile || undefined,
          removeFile,
        });
        toast({ title: 'Success', description: 'Resource updated successfully' });
      } else {
        const resourceData = {
          title: title.trim(),
          type,
          fileUrl,
          filePath,
          externalLink: externalLink.trim() || undefined,
        };
        await addResource({
          ...resourceData,
          resourceFile: pendingFile || undefined,
        });
        toast({ title: 'Success', description: 'Resource created successfully' });
      }
      resetForm();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: String(error), 
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    // Delete file from storage if exists
    // Note: File deletion handled by PocketBase when resource is deleted
    // No explicit delete needed here
    await deleteResource(resource.id);
    toast({ title: 'Success', description: 'Resource deleted successfully' });
  };

  const getFileName = (url?: string) => {
    if (!url) return null;
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    // Remove timestamp and random prefix
    const match = filename.match(/^\d+_[a-z0-9]+_(.+)$/);
    return match ? match[1] : filename;
  };

  return (
    <div className="space-y-6">
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Resource
        </Button>
      )}

      {showForm && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Resource' : 'Add New Resource'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                    placeholder="Enter resource title"
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(value) => setType(value as ResourceType)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="externalLink">External Link (optional)</Label>
                  <Input
                    id="externalLink"
                    type="url"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    className="mt-1"
                    placeholder="https://"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Upload File (optional)</Label>
                  <div className="mt-1 space-y-2">
                    {(pendingFile || existingFileUrl) && (
                      <div className="flex items-center gap-2 p-2 border border-border bg-secondary rounded">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">
                          {pendingFile ? pendingFile.name : getFileName(existingFileUrl)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleRemoveFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {pendingFile || existingFileUrl ? 'Replace File' : 'Choose File'}
                      </Button>
                      <span className="text-xs text-muted-foreground self-center">
                        PDF, Word, Excel, PowerPoint (max 5MB)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isUploading} className="gap-2">
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Update' : 'Create'} Resource
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isUploading}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-2">
        <CardHeader>
          <CardTitle>All Resources ({resources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No resources yet. Add your first resource above.</p>
          ) : (
            <div className="space-y-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 border-2 border-border bg-secondary"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-accent border border-border shrink-0">
                      {iconMap[resource.type]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{resource.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{resource.type}</span>
                        {resource.fileUrl && (
                          <span className="flex items-center gap-1">
                            <File className="h-3 w-3" />
                            File attached
                          </span>
                        )}
                        {resource.externalLink && (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            External link
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {resource.fileUrl && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                          <File className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {resource.externalLink && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={resource.externalLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="icon" onClick={() => handleEdit(resource)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(resource)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
