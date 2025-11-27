import React from "react";

export default function JournalList() {
  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-slate-400">
            <th className="px-4 py-2 text-left">Datum</th>
            <th className="px-4 py-2 text-left">Asset</th>
            <th className="px-4 py-2 text-left">Riktning</th>
            <th className="px-4 py-2 text-left">PnL</th>
            <th className="px-4 py-2 text-left">Taggar</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-2">2025-11-24</td>
            <td className="px-4 py-2">BTCUSD</td>
            <td className="px-4 py-2">Long</td>
            <td className="px-4 py-2">+2.5%</td>
            <td className="px-4 py-2">breakout, morning</td>
          </tr>
          <tr>
            <td className="px-4 py-2">2025-11-23</td>
            <td className="px-4 py-2">ETHUSD</td>
            <td className="px-4 py-2">Short</td>
            <td className="px-4 py-2">-1.2%</td>
            <td className="px-4 py-2">reversal</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
