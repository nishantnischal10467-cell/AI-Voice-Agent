import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Spinner({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      {...props}
    />
  );
}
