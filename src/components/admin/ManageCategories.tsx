import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTraining } from '@/context/TrainingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { categorySchema, validateForm } from '@/lib/validation';

export function ManageCategories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useTraining();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setColor('#3b82f6');
  };

  const handleEdit = (category: { id: string; name: string; color: string }) => {
    setEditingId(category.id);
    setName(category.name);
    setColor(category.color);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateForm(categorySchema, {
      name,
      color,
    });

    if (!validation.success) {
      toast({ title: 'Validation Error', description: 'error' in validation ? validation.error : 'Validation failed', variant: 'destructive' });
      return;
    }

    if (editingId) {
      await updateCategory({ id: editingId, name: name.trim(), color });
      toast({ title: 'Success', description: 'Category updated successfully' });
    } else {
      await addCategory({ name: name.trim(), color });
      toast({ title: 'Success', description: 'Category created successfully' });
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    toast({ title: 'Success', description: 'Category deleted successfully' });
    if (editingId === id) resetForm();
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Category' : 'Add New Category'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter category name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-14 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="gap-2">
                {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? 'Update' : 'Add'} Category
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border-2 border-border bg-secondary"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 border-2 border-border"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
