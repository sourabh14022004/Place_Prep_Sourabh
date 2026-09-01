"use client";

/**
 * Skeleton primitives — every async section renders a shape-matched skeleton
 * (never a blank flash, never the empty state, never an unstyled spinner).
 */

export function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200/70 ${className}`} />;
}

/** Dashboard/Profile stat tile row */
export function StatTilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white p-4">
          <Shimmer className="h-11 w-11 !rounded-xl" />
          <div className="space-y-2 flex-1">
            <Shimmer className="h-5 w-16" />
            <Shimmer className="h-2.5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Generic card block */
export function CardSkeleton({ className = "", lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={`rounded-2xl border border-gray-200/80 bg-white p-5 ${className}`}>
      <Shimmer className="h-3 w-24 mb-4" />
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer key={i} className={`h-3 ${i % 2 ? "w-full" : "w-5/6"}`} />
        ))}
      </div>
    </div>
  );
}

/** Row list (tasks, notifications, sessions, doubts) */
export function ListSkeleton({ rows = 4, avatar = false }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white divide-y divide-gray-100 overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          {avatar && <Shimmer className="h-8 w-8 !rounded-full shrink-0" />}
          <div className="space-y-1.5 flex-1">
            <Shimmer className="h-3.5 w-2/3" />
            <Shimmer className="h-2.5 w-1/3" />
          </div>
          <Shimmer className="h-5 w-12 !rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Company/platform cards grid */
export function CardsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200/80 bg-white p-4 h-[120px]">
          <div className="flex items-start justify-between">
            <Shimmer className="h-9 w-9 !rounded-xl" />
            <Shimmer className="h-12 w-12 !rounded-full" />
          </div>
          <Shimmer className="mt-3 h-3.5 w-2/3" />
          <Shimmer className="mt-2 h-2 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/** Full progress/profile page skeleton matching final layout */
export function PageSkeleton() {
  return (
    <div className="max-w-5xl space-y-6">
      <Shimmer className="h-8 w-56" />
      <StatTilesSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} lines={3} />
        ))}
      </div>
      <CardSkeleton lines={5} />
    </div>
  );
}
