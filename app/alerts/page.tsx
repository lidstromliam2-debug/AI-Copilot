export default function AlertsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <button className="btn-primary">Create Alert</button>
      </div>
      <div className="card p-4 flex flex-col gap-2">
        <span className="text-slate-400">No alerts yet.</span>
      </div>
      {/* Modal placeholder for alert creation */}
    </div>
  );
}
