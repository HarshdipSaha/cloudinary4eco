import type { ReactNode } from "react";
import { RailNav } from "@/ui/RailNav";
import { TopBar } from "@/ui/TopBar";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-[64px_1fr] grid-rows-[44px_1fr] bg-surface-0">
      <RailNav className="row-span-2 border-r border-line" />
      <TopBar className="border-b border-line" />
      <main className="min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
