import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ManageTrainings } from '@/components/admin/ManageTrainings';
import { ManageCategories } from '@/components/admin/ManageCategories';
import { ManageEnrollment } from '@/components/admin/ManageEnrollment';
import { ManageResources } from '@/components/admin/ManageResources';
import { ManageRoles } from '@/components/admin/ManageRoles';
import { PageBuilder } from '@/components/admin/page-builder/PageBuilder';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookOpen, Tag, Users, FileText, Palette, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminTab = 'dashboard' | 'trainings' | 'categories' | 'enrollment' | 'resources' | 'page-builder' | 'roles';

const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'trainings', label: 'Trainings', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'categories', label: 'Categories', icon: <Tag className="h-4 w-4" /> },
  { id: 'enrollment', label: 'Enrollment', icon: <Users className="h-4 w-4" /> },
  { id: 'resources', label: 'Resources', icon: <FileText className="h-4 w-4" /> },
  { id: 'page-builder', label: 'Support Page', icon: <Palette className="h-4 w-4" /> },
  { id: 'roles', label: 'Team Roles', icon: <Shield className="h-4 w-4" /> },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Admin Portal</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b-2 border-border pb-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={cn('gap-2')}
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'trainings' && <ManageTrainings />}
          {activeTab === 'categories' && <ManageCategories />}
          {activeTab === 'enrollment' && <ManageEnrollment />}
          {activeTab === 'resources' && <ManageResources />}
          {activeTab === 'page-builder' && <PageBuilder pageSlug="support" />}
          {activeTab === 'roles' && <ManageRoles />}
        </div>
      </div>
    </Layout>
  );
};

export default AdminPage;
