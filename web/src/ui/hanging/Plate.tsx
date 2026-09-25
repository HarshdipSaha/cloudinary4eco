import type { ReactNode } from "react";

export interface Corner {
  tl?: ReactNode;
  tr?: ReactNode;
  bl?: ReactNode;
  br?: ReactNode;
}

/** A photograph hung on the station: 1px frame, dark mat, mono annotations in the corners. */
export function Plate({
  aspect,
  children,
  corners,
  label,
}: {
  aspect: number;
  children: ReactNode;
  corners?: Corner;
  label: string;
}) {
  const c =
    "pointer-events-none absolute mono text-[11px] leading-tight text-[#E4E7EA] [text-shadow:0_0_2px_#000,0_0_1px_#000] px-2 py-1.5";
  return (
    <figure
      className="relative m-0 border border-line bg-plate-mat"
      style={{ aspectRatio: String(aspect) }}
      aria-label={label}
    >
      {children}
      {corners?.tl && <div className={`${c} left-0 top-0`}>{corners.tl}</div>}
      {corners?.tr && <div className={`${c} right-0 top-0 text-right`}>{corners.tr}</div>}
      {corners?.bl && <div className={`${c} bottom-0 left-0`}>{corners.bl}</div>}
      {corners?.br && <div className={`${c} bottom-0 right-0 text-right`}>{corners.br}</div>}
    </figure>
  );
}
