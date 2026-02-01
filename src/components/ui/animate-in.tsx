import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimateInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  from?: 'bottom' | 'left' | 'right' | 'scale';
}

export function AnimateIn({ 
  children, 
  className,
  delay = 0,
  duration = 500,
  from = 'bottom'
}: AnimateInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const getInitialTransform = () => {
    switch (from) {
      case 'left': return '-translate-x-4';
      case 'right': return 'translate-x-4';
      case 'scale': return 'scale-95';
      default: return 'translate-y-4';
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "motion-safe:transition-all motion-safe:ease-out",
        isVisible 
          ? "opacity-100 translate-x-0 translate-y-0 scale-100" 
          : `opacity-0 ${getInitialTransform()}`,
        className
      )}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

// Stagger container for list animations
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 100
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {Array.isArray(children) 
        ? children.map((child, index) => (
            <AnimateIn key={index} delay={index * staggerDelay}>
              {child}
            </AnimateIn>
          ))
        : children
      }
    </div>
  );
}
