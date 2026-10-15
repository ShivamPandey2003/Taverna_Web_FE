import { SpecialsFilters } from "@/components/features/specials/SpecialsFilters";
import { SpecialsList } from "@/components/features/specials/SpecialsList";
import { useOverflowing } from "@/hooks/useOverflowing";
import { cn } from "@/libs/utils";

export function Specials() {
  // Room for the status bubbles under the pagination, only once the page scrolls
  const { containerRef, contentRef, overflowing } = useOverflowing<HTMLElement, HTMLDivElement>();

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
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Offers Picked for You & Your Vehicle
        </h1>

        <div className="mt-6">
          <SpecialsFilters />
        </div>

        <div className="mt-6">
          <SpecialsList />
        </div>
      </div>
    </section>
  );
}
