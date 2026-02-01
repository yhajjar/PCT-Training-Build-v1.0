import { useEffect, useState } from 'react';
import { GraduationCap, Linkedin, BookOpen, ExternalLink } from 'lucide-react';
import { learningPlatforms as fallbackPlatforms } from '@/data/mockData';
import { fetchLearningPlatforms } from '@/lib/database';
import { LearningPlatform } from '@/types/training';
import { Card, CardContent } from '@/components/ui/card';

const iconMap: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="h-10 w-10" />,
  Linkedin: <Linkedin className="h-10 w-10" />,
  BookOpen: <BookOpen className="h-10 w-10" />,
};

export function LearningPlatforms() {
  const [platforms, setPlatforms] = useState<LearningPlatform[]>(fallbackPlatforms);

  useEffect(() => {
    let isMounted = true;
    fetchLearningPlatforms()
      .then((data) => {
        if (!isMounted) return;
        if (data.length > 0) {
          setPlatforms(data);
        }
      })
      .catch((error) => {
        console.error('Failed to load learning platforms:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Learning Platforms</h2>
        <p className="text-muted-foreground mb-8">Access additional learning resources from our partner platforms</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <a
              key={platform.id}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50">
                <CardContent className="flex items-center gap-4 py-6 px-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {iconMap[platform.icon] || <BookOpen className="h-10 w-10" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {platform.name}
                    </span>
                    <p className="text-sm text-muted-foreground">Learn more →</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
