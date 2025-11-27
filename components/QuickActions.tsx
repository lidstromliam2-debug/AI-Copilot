import React from "react";

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow border p-4 mb-4">
      <div className="font-semibold mb-2">Quick Actions</div>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Market Summary</li>
        <li className="flex items-center gap-2 text-red-600"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>Find Key Levels</li>
        <li className="flex items-center gap-2 text-yellow-600"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>Sentiment Analysis</li>
      </ul>
    </div>
  );
}
