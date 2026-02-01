import { useTraining } from '@/context/TrainingContext';
import { cn } from '@/lib/utils';
import { Tag } from 'lucide-react';

interface CategoryBadgeProps {
  categoryId: string;
  className?: string;
  showIcon?: boolean;
}

export function CategoryBadge({ categoryId, className, showIcon = true }: CategoryBadgeProps) {
  const { getCategoryById } = useTraining();
  const category = getCategoryById(categoryId);

  if (!category) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-200',
        className
      )}
      style={{ 
        backgroundColor: `${category.color}15`,
        color: category.color,
        borderColor: `${category.color}30`
      }}
    >
      {showIcon && <Tag className="h-3 w-3" />}
      {category.name}
    </span>
  );
}
