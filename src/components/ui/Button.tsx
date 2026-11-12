import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "tp";
type Size = "md" | "sm";

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
  tp: "btn-tp",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      type={type}
      className={`btn ${variantClass[variant]} ${size === "sm" ? "btn-sm" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
