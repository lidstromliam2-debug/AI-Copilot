export default function AnalyticsPage() {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="card p-6 flex flex-col gap-2">
        <span className="font-bold text-primary">KPI</span>
        <span className="text-slate-300">--</span>
      </div>
      <div className="card p-6 flex flex-col gap-2">
        <span className="font-bold text-primary">Diagram</span>
        <span className="text-slate-300">[Chart Placeholder]</span>
      </div>
      <div className="card p-6 flex flex-col gap-2">
        <span className="font-bold text-primary">Best Days</span>
        <span className="text-slate-300">--</span>
      </div>
    </div>
  );
}
