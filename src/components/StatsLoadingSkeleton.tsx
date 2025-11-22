import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

export function StatsLoadingSkeleton() {
  return (
    <div className="min-h-screen p-6 echo-dots">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Back Button Skeleton */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 text-muted-foreground/30" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        
        {/* Title Skeleton */}
        <div className="text-center space-y-2">
          <Skeleton className="h-12 w-96 mx-auto" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flat-card">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Performance Section Skeleton */}
        <div className="flat-card space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
        
        {/* Chapter Cards Skeleton */}
        <div className="flat-card space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg border-2 border-muted">
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full max-w-md" />
                  </div>
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-8 w-12 ml-auto" />
                    <Skeleton className="h-3 w-10 ml-auto" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border/50">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
