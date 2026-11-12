import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  id,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
}) {
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={id} className="label">
          {label}
        </label>
      ) : null}
      <input id={id} className={`input ${className}`.trim()} {...props} />
    </div>
  );
}
