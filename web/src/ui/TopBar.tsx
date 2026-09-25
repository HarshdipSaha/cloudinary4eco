import { ServiceLamps } from "./ServiceLamps";

export function TopBar({ className = "" }: { className?: string }) {
  return (
    <header
      className={`flex h-11 items-center justify-between bg-surface-1 px-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="mono text-[12px] font-medium tracking-wide text-text">
          SAAKSHYA
        </span>
        <span className="text-text-3">/</span>
        <div className="flex items-center gap-1.5 text-[12px] text-text-2">
          <span>Yamuna Green Corridor</span>
          <span className="mono rounded-[2px] border border-line bg-surface-2 px-1 text-[10px] text-text-3">
            plantation
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <ServiceLamps />
      </div>
    </header>
  );
}
