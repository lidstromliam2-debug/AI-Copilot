import React from "react";
import { Card } from "../ui/Card";

const news = [
  { title: "BTC breaks $50k", category: "Crypto", time: "2 min ago" },
  { title: "Fed signals rate hike pause", category: "FX", time: "10 min ago" },
  { title: "Gold hits new high", category: "Commodities", time: "30 min ago" },
];

export default function NewsFeed() {
  return (
    <div className="flex flex-col gap-4">
      {news.map((item, i) => (
        <Card key={i} className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div>
            <span className="font-semibold text-slate-100">{item.title}</span>
            <span className="ml-2 text-xs text-primary">[{item.category}]</span>
          </div>
          <span className="text-xs text-slate-400">{item.time}</span>
        </Card>
      ))}
    </div>
  );
}
