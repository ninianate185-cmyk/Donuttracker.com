import { useId } from "react";
import { motion, LayoutGroup } from "motion/react";
import { cn } from "@/lib/utils";

/* Adapted from Watermelon UI "continuous-tabs": controlled, themed, and exposed as a tablist. */
export interface TabItem<T extends string = string> {
  id: T;
  label: string;
}

interface ContinuousTabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
}

export function ContinuousTabs<T extends string>({ tabs, value, onChange, label, size = "md", className }: ContinuousTabsProps<T>) {
  const pill = useId();
  return (
    <LayoutGroup id={pill}>
      <div
        role="tablist"
        aria-label={label}
        className={cn("relative inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-1 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.35)]", className)}
      >
        {tabs.map((tab) => {
          const active = value === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative rounded-full font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
              )}
            >
              {active && (
                <motion.span
                  layoutId="active-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.9 }}
                  className="absolute inset-0 rounded-full bg-primary shadow-xs"
                />
              )}
              <span className={cn("relative z-10 transition-colors duration-200", active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
