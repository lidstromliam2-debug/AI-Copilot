import React from "react";
import { cn } from "../../lib/utils";

export function Button({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn("btn-primary", className)} {...props}>
      {children}
    </button>
  );
}
