import React from "react";
import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/copilot", label: "AI Copilot" },
  { href: "/market", label: "Market News" },
  { href: "/journal", label: "Trading Journal" },
  { href: "/backtest", label: "Backtest" },
  { href: "/analytics", label: "Analytics" },
  { href: "/alerts", label: "Alerts" },
];

export default function Header() {
  return (
    <header className="w-full h-16 flex items-center justify-between px-6 bg-card border-b border-border shadow-card">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="text-primary font-bold text-xl">Trading Copilot</span>
          <span className="text-xs text-slate-400 ml-2">v1.0</span>
        </div>
        <nav className="flex items-center gap-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-slate-200 hover:text-primary text-sm font-medium transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="btn-primary">Demo</button>
      </div>
    </header>
  );
}
