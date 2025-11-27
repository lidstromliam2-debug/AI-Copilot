export default function PricingPage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <h1 className="text-3xl font-bold mb-4">Pricing</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card flex flex-col gap-2">
          <span className="font-bold text-lg text-primary">Free</span>
          <span className="text-2xl font-bold">0 kr/mån</span>
          <span className="text-slate-400">Basic AI, market data, alerts</span>
          <button className="btn-primary mt-4">Välj</button>
        </div>
        <div className="card flex flex-col gap-2 border-primary border-2 shadow-lg">
          <span className="font-bold text-lg text-primary">Pro</span>
          <span className="text-2xl font-bold">299 kr/mån</span>
          <span className="text-slate-400">Full AI, alla funktioner, prioriterad support</span>
          <button className="btn-primary mt-4">Välj Pro</button>
        </div>
      </div>
    </div>
  );
}
