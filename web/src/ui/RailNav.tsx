"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LineChart,
  Inbox,
  CheckSquare,
  Search,
  FileText,
  ShieldCheck,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/sites", label: "Reading", icon: LineChart },
  { href: "/intake", label: "Intake", icon: Inbox },
  { href: "/review", label: "Review", icon: CheckSquare },
  { href: "/search", label: "Search", icon: Search },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/trust", label: "Trust", icon: ShieldCheck },
  { href: "/setup", label: "Setup", icon: Settings },
];

export function RailNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={`flex flex-col items-center bg-surface-1 py-3 ${className}`}
      aria-label="Main Navigation"
    >
      <div className="mb-4 flex size-10 items-center justify-center font-bold tracking-wider text-measure">
        <span className="mono text-[14px]">सा</span>
      </div>

      <div className="flex w-full flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href)) ||
            (href === "/sites" && pathname.startsWith("/sites"));

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex h-14 w-full flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-text"
                  : "text-text-3 hover:text-text-2"
              }`}
            >
              {isActive && (
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-[2px] bg-measure"
                />
              )}
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
              <span className="mono text-[10px] tracking-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
