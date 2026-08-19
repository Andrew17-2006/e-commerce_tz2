import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

export function CategoryPill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all border cursor-pointer whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
