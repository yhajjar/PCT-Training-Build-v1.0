import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLoading } from '@/context/LoadingContext';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Skip animation for reduced motion
      setDisplayChildren(children);
      return;
    }

    // Start transition
    setIsTransitioning(true);
    startLoading();

    const transitionTimer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
      stopLoading();
    }, 150);

    return () => clearTimeout(transitionTimer);
  }, [location.pathname, children, startLoading, stopLoading]);

  return (
    <div
      className={cn(
        "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
        isTransitioning 
          ? "opacity-0 translate-y-2" 
          : "opacity-100 translate-y-0"
      )}
    >
      {displayChildren}
    </div>
  );
}
