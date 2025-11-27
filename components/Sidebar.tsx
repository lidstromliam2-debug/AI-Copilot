// components/Sidebar.tsx
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="bg-white border-r border-gray-200 h-screen w-56 flex flex-col py-6 px-4 text-sm">
      <div className="mb-8">
        <span className="font-bold text-lg tracking-wide">Quantpilot</span>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          <li className="font-semibold text-black"><Link href="/copilot">AI Copilot</Link></li>
          <li className="text-gray-700">Watchlist</li>
          <li className="text-gray-700">Alerts</li>
          <li className="text-gray-700">Backtests</li>
        </ul>
        <div className="mt-10 mb-2 text-xs text-gray-400 uppercase tracking-wider">Account</div>
        <ul>
          <li className="text-gray-700">Pro + Monthly</li>
        </ul>
      </nav>
      <div className="mt-auto flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">N</div>
      </div>
    </aside>
  );
}