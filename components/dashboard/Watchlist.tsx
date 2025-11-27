import React from "react";
import { Card } from "../ui/Card";

const watchlist = [
  { asset: "BTCUSD", price: "$50,200", change: "+2.1%" },
  { asset: "ETHUSD", price: "$2,700", change: "-0.5%" },
  { asset: "AAPL", price: "$190", change: "+0.3%" },
];

export default function Watchlist() {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <span className="text-slate-400 text-xs">Watchlist</span>
        <div className="flex flex-col gap-1 mt-2">
          {watchlist.map((item, i) => (
            <div key={i} className="flex justify-between text-slate-100">
              <span>{item.asset}</span>
              <span>{item.price}</span>
              <span className={item.change.startsWith("-") ? "text-red-400" : "text-green-400"}>{item.change}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
