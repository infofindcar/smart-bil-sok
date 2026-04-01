import { Skeleton } from '@/components/ui/skeleton';

export const CarCardSkeleton = () => (
  <div className="flex flex-col bg-card rounded-xl overflow-hidden border border-border/60 animate-fade-in">
    <Skeleton className="w-full h-48" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  </div>
);
