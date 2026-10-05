// Placeholder in the shape of a booking page while it loads
export function BookingSkeleton() {
  return (
    <div className="page-body" aria-busy="true" aria-label="Loading booking">
      <div className="card space-y-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-7 w-48" />
        <div className="flex items-center gap-3 pt-2">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="skeleton h-4 flex-1" />
        </div>
      </div>
      <div className="card space-y-3">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-12 w-full" />
      </div>
      <div className="card space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="skeleton h-7 w-7 rounded-full" />
            <div className="skeleton h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
