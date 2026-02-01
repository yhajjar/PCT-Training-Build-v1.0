import { useEffect, useState } from 'react';
import { useLoading } from '@/context/LoadingContext';
import { cn } from '@/lib/utils';

export function TopLoadingBar() {
  const { isLoading } = useLoading();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (isLoading) {
      setVisible(true);
      setProgress(0);
      
      if (prefersReducedMotion) {
        // Instant progress for reduced motion
        setProgress(90);
      } else {
        // Animate progress smoothly
        const timer1 = setTimeout(() => setProgress(30), 100);
        const timer2 = setTimeout(() => setProgress(60), 300);
        const timer3 = setTimeout(() => setProgress(80), 600);
        const timer4 = setTimeout(() => setProgress(90), 1000);
        
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
          clearTimeout(timer4);
        };
      }
    } else if (visible) {
      // Complete the bar then hide
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, prefersReducedMotion ? 100 : 300);
      
      return () => clearTimeout(hideTimer);
    }
  }, [isLoading, visible]);

  if (!visible) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-primary/10"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]",
          "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
