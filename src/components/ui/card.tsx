import * as React from "react";
type DivProps = React.HTMLAttributes<HTMLDivElement>;
export function Card({ className = "", ...props }: DivProps) {
  return <div className={`rounded-2xl border border-gray-200 bg-white shadow ${className}`} {...props} />;
}
export function CardContent({ className = "", ...props }: DivProps) {
  return <div className={className} {...props} />;
}
