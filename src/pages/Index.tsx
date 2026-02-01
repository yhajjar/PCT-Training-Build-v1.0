import { useTraining } from '@/context/TrainingContext';
import { Layout } from '@/components/layout/Layout';
import { HeroSlider } from '@/components/training/HeroSlider';
import { TrainingCard } from '@/components/training/TrainingCard';
import { LearningPlatforms } from '@/components/training/LearningPlatforms';
import { TrainingUpdates } from '@/components/training/TrainingUpdates';
import { AnimateIn } from '@/components/ui/animate-in';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { trainings, getFeaturedTrainings, getRecommendedTrainings, isLoading } = useTraining();

  const featuredTrainings = getFeaturedTrainings();
  const recommendedTrainings = getRecommendedTrainings();
  const featuredGridTrainings = trainings.slice(0, 6);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading trainings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Slider */}
      <HeroSlider trainings={featuredTrainings} />

      {/* Featured Trainings Section */}
      <section className="py-12 bg-secondary/50">
        <div className="container mx-auto px-4">
          <AnimateIn>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Upcoming Trainings</h2>
                <p className="text-muted-foreground mt-1">Browse and register for available training sessions</p>
              </div>
              <Link 
                to="/calendar" 
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </AnimateIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGridTrainings.map((training, index) => (
              <AnimateIn key={training.id} delay={index * 75} from="bottom">
                <TrainingCard training={training} />
              </AnimateIn>
            ))}
          </div>

          <Link 
            to="/calendar" 
            className="flex sm:hidden items-center justify-center gap-1 mt-6 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All Trainings
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Recommended Trainings Section with Updates Sidebar */}
      {recommendedTrainings.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <AnimateIn>
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Recommended for You</h2>
                <p className="text-muted-foreground mt-1">Trainings selected based on your interests</p>
              </div>
            </AnimateIn>
            
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Recommended Trainings Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendedTrainings.map((training, index) => (
                    <AnimateIn key={training.id} delay={index * 100} from="bottom">
                      <TrainingCard training={training} />
                    </AnimateIn>
                  ))}
                </div>
              </div>
              
              {/* Updates Sidebar */}
              <div className="lg:w-80 shrink-0">
                <AnimateIn from="right" delay={200}>
                  <TrainingUpdates />
                </AnimateIn>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Learning Platforms */}
      <AnimateIn>
        <div className="bg-secondary/50">
          <LearningPlatforms />
        </div>
      </AnimateIn>
    </Layout>
  );
};

export default Index;
