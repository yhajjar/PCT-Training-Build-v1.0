import { FileText, BookOpen, FileCode, HelpCircle, ExternalLink, Download } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useTraining } from '@/context/TrainingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResourceType } from '@/types/training';

const iconMap: Record<ResourceType, React.ReactNode> = {
  Guideline: <FileText className="h-8 w-8" />,
  'User Guide': <BookOpen className="h-8 w-8" />,
  Template: <FileCode className="h-8 w-8" />,
  FAQ: <HelpCircle className="h-8 w-8" />,
};

const ToolsPage = () => {
  const { resources } = useTraining();

  const handleResourceClick = (resource: { externalLink?: string; fileUrl?: string }) => {
    const url = resource.externalLink || resource.fileUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tools & Guidelines</h1>
          <p className="text-muted-foreground">
            Access employee resources, guides, and templates for training and development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="border-2 transition-all hover:shadow-md hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-accent border-2 border-border">
                  {iconMap[resource.type]}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{resource.type}</p>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleResourceClick(resource)}
                >
                  {resource.externalLink ? (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Open Link
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {resources.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border-2 border-border border-dashed">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No resources available at the moment.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ToolsPage;
