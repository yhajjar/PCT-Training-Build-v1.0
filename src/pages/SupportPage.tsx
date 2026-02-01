import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { BlockRenderer } from '@/components/admin/page-builder/BlockRenderer';
import { fetchPageContent } from '@/lib/pageBuilder';
import { ContentBlock } from '@/types/pageBuilder';
import { Loader2 } from 'lucide-react';

const SupportPage = () => {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      const content = await fetchPageContent('support');
      if (content && content.isPublished) {
        setBlocks(content.blocks);
      }
      setIsLoading(false);
    }
    loadContent();
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
          {blocks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Support page content is being prepared.</p>
              <p className="text-sm mt-2">Please check back soon.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SupportPage;