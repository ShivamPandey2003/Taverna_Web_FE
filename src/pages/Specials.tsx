import { useEffect, useRef } from "react";
import { useMarkSpecialsSeen } from "@/services/queries/offerQueries";
import { useProfile } from "@/services/queries/profileQueries";
import { SpecialsFilters } from "@/components/features/specials/SpecialsFilters";
import { SpecialsList } from "@/components/features/specials/SpecialsList";
import { useOverflowing } from "@/hooks/useOverflowing";
import { cn } from "@/libs/utils";

export function Specials() {
  // Room for the status bubbles under the pagination, only once the page scrolls
  const { containerRef, contentRef, overflowing } = useOverflowing<HTMLElement, HTMLDivElement>();

  // A visit while there are new specials marks them seen, which clears the
  // navbar's dot. Once a visit at most, so a failed call isn't repeated.
  const { data: profile } = useProfile();
  const hasNewSpecials = profile?.hasNewSpecials === true;
  const { mutate: markSeen } = useMarkSpecialsSeen();
  const marked = useRef(false);
  useEffect(() => {
    if (!hasNewSpecials || marked.current) return;
    marked.current = true;
    markSeen();
  }, [hasNewSpecials, markSeen]);

  return (
    // Scrolls inside the layout (which clips its content)
    <section
      ref={containerRef}
      className={cn(
        "h-full overflow-y-auto bg-[#f8f9fa] px-6 py-4 lg:px-10",
        overflowing && "pb-24",
      )}
    >
      <div ref={contentRef} className="mx-auto">
        {/* The title on the left and the filters on the right, on one line; on
            a narrow screen the filters drop below the title */}
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Offers Picked for You
          </h1>

          <SpecialsFilters />
        </header>

        <div className="mt-6">
          <SpecialsList />
        </div>
      </div>
    </section>
  );
}
