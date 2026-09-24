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
        "mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-0",
        className
      )}
    >
      {children}
    </div>
  );
}