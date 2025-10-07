import * as React from "react";
import * as Lucide from "lucide-react";
type IconName = keyof typeof Lucide;
export function Icon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  const Cmp = Lucide[name] as React.ComponentType<{ size?: number; className?: string }>;
  return Cmp ? <Cmp size={size} className={className} /> : null;
}
