import { cn } from "@/libs/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({
  children,
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        // Keeps a gutter at every width, including small laptops and zoomed-in browsers
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10",
        className
      )}
    >
      {children}
    </div>
  );
}