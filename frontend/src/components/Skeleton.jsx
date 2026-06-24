import { cn } from './ui/cn.js';

// Single shimmer bar. Use width/height/rounded as className overrides.
export function SkeletonBar({ className }) {
  return <span className={cn('skeleton-bar', className)} aria-hidden="true" />;
}

// Replaces <Loader full /> on pages that have a known structure.
export function SkeletonPage() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Loading…">
      {/* header */}
      <div className="flex flex-col gap-2 mb-6">
        <SkeletonBar className="h-7 w-48 rounded-lg" />
        <SkeletonBar className="h-4 w-72 rounded" />
      </div>
      {/* stat cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-card h-24" />
        ))}
      </div>
      {/* table rows */}
      <div className="skeleton-card p-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-[14px] border-b border-border last:border-0">
            <SkeletonBar className="size-8 rounded-full flex-shrink-0" />
            <SkeletonBar className="h-4 flex-1 rounded" />
            <SkeletonBar className="h-4 w-24 rounded" />
            <SkeletonBar className="h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Lightweight inline skeleton for smaller sections
export function SkeletonRows({ count = 4 }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonBar className="size-8 rounded-full flex-shrink-0" />
          <SkeletonBar className="h-4 flex-1 rounded" style={{ width: `${60 + (i * 13) % 35}%` }} />
        </div>
      ))}
    </div>
  );
}
