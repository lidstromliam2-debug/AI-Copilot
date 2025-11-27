import React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn("w-full px-3 py-2 rounded-lg border border-border bg-background text-black focus:outline-none focus:ring-2 focus:ring-primary", className)}
      {...props}
    />
  )
);
Input.displayName = "Input";
