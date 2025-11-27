// components/RiskCalculator.tsx
import { useState } from "react";

export default function RiskCalculator() {
const [portfolio, setPortfolio] = useState<number>(10000);
const [riskPct, setRiskPct] = useState<number>(1);
const [entry, setEntry] = useState<number | "">("");
const [stop, setStop] = useState<number | "">("");
const [result, setResult] = useState<string>("");

function calculate() {
if (!entry || !stop) {
setResult("Fyll i entry och stoploss.");
return;
}
const riskAmount = (portfolio * (riskPct / 100));
const distance = Math.abs(Number(entry) - Number(stop));
if (distance === 0) {
setResult("Fel: entry och stop är samma.");
return;
}
const units = Math.floor(riskAmount / distance);
setResult(`Risk: ${riskAmount.toFixed(2)} USD — Units: ${units}`);
}

return (
<div>
<div style={{ display: "grid", gap: 8 }}>
<label>Portfolio (USD)</label>
<input value={portfolio} onChange={(e) => setPortfolio(Number(e.target.value))} type="number" />
<label>Risk %</label>
<input value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} type="number" />
<label>Entry</label>
<input value={entry} onChange={(e) => setEntry(e.target.value === "" ? "" : Number(e.target.value))} type="number" />
<label>Stop</label>
<input value={stop} onChange={(e) => setStop(e.target.value === "" ? "" : Number(e.target.value))} type="number" />
<button onClick={calculate} style={{ marginTop: 8, padding: "8px 10px", borderRadius: 6 }}>Calculate</button>
</div>

<div style={{ marginTop: 10, padding: 8, background: "#f7f7f7", borderRadius: 6 }}>{result}</div>
</div>
);
}