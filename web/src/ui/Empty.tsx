import type { ReactNode } from "react";

export function Empty({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-[13px] text-text-2">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
