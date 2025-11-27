import React from "react";

export default function ChartPlaceholder({ height = 320 }: { height?: number }) {
  return (
    <div
      className="bg-gradient-to-br from-slate-800 to-slate-900 border border-border rounded-lg flex items-center justify-center text-slate-500 text-lg font-mono shadow-card"
      style={{ height }}
    >
      Chart Placeholder
    </div>
  );
}
