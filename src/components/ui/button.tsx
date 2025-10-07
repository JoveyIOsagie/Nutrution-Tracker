import * as React from "react";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "ghost" | "outline" };
export function Button({ className = "", variant = "default", ...props }: Props) {
  const base = "rounded-xl px-4 py-2 text-sm font-medium transition";
  const variants: Record<string, string> = {
    default: "bg-black text-white hover:opacity-90",
    ghost: "bg-transparent hover:bg-gray-100",
    outline: "border border-gray-300 hover:bg-gray-50"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
