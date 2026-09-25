import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="mono inline-flex items-center justify-center border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] text-text-2 shadow-none">
      {children}
    </kbd>
  );
}
