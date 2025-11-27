import React from "react";
import { Card } from "../ui/Card";

export default function Snapshot() {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <span className="text-slate-400 text-xs">Market Snapshot</span>
        <div className="flex gap-6 mt-2">
          <div>
            <span className="text-primary font-bold text-lg">BTC</span>
            <span className="block text-slate-100">$50,200</span>
          </div>
          <div>
            <span className="text-primary font-bold text-lg">ETH</span>
            <span className="block text-slate-100">$2,700</span>
          </div>
          <div>
            <span className="text-primary font-bold text-lg">S&P500</span>
            <span className="block text-slate-100">4,800</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
