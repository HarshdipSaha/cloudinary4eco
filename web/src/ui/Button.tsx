import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "quiet";
  size?: "console" | "paper";
  children: ReactNode;
}

export function Button({
  variant = "quiet",
  size = "console",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium cursor-pointer transition-colors duration-150 select-none disabled:opacity-40 disabled:cursor-not-allowed";
  const sizeStyles =
    size === "paper" ? "h-11 px-4 text-[14px] rounded-[2px]" : "h-8 px-3 text-[12px] rounded-[2px]";
  const variantStyles =
    variant === "primary"
      ? "bg-measure text-measure-ink hover:opacity-90 active:opacity-95"
      : "border border-line bg-surface-1 text-text hover:bg-surface-2 active:bg-surface-1";

  return (
    <button className={`${base} ${sizeStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
}
