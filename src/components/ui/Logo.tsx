import { siteConfig } from "@/config/site.config";
import { cn } from "@/libs/utils";

// The brand mark (green "T" tile) and name, the same on every page.
// The green is fixed: `primary` is only green inside the staff pages.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008f6b] text-sm font-extrabold text-white">
        {siteConfig.name.charAt(0)}
      </span>
      <span className="text-[17px] font-extrabold tracking-tight text-text">{siteConfig.name}</span>
    </span>
  );
}
