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

export default function Sidebar() {
  return (
    <aside className="h-full w-60 bg-card border-r border-border flex flex-col py-6 px-4 gap-2">
      <nav className="flex flex-col gap-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-slate-200 hover:text-primary px-3 py-2 rounded transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
