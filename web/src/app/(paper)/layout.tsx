import type { ReactNode } from "react";

export default function PaperLayout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="paper" className="min-h-screen bg-paper font-sans text-paper-ink">
      {children}
    </div>
  );
}
