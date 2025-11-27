import React from "react";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b shadow-sm px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <span className="font-extrabold text-xl tracking-tight text-black">Quantpilot</span>
        <a href="/" className="text-gray-700 hover:text-black font-medium">Home</a>
        <a href="/dashboard" className="text-gray-700 hover:text-black font-medium">Dashboard</a>
        <a href="/copilot" className="text-gray-700 hover:text-black font-medium">AI Copilot</a>
        <a href="/market" className="text-gray-700 hover:text-black font-medium">Market</a>
        <a href="/journal" className="text-gray-700 hover:text-black font-medium">Journal</a>
        <a href="/backtest" className="text-gray-700 hover:text-black font-medium">Backtest</a>
        <a href="/analytics" className="text-gray-700 hover:text-black font-medium">Analytics</a>
        <a href="/alerts" className="text-gray-700 hover:text-black font-medium">Alerts</a>
      </div>
      <div className="flex items-center gap-4">
        <a href="/auth/login" className="text-gray-700 hover:text-black font-medium">Sign in</a>
        <a href="/auth/signup" className="bg-black text-white px-4 py-1.5 rounded font-medium hover:bg-gray-900">Sign up</a>
      </div>
    </nav>
  );
}
