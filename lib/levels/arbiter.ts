export interface FusedLevelsResult {
  bias: "LONG" | "SHORT" | "NEUTRAL";
  justification: string;
}

export function fuseLevels(data: Array<{ levels?: string[] }>): FusedLevelsResult {
  const all: { name: string; price: number }[] = [];
  for (const arr of data) {
    if (!arr.levels) continue;
    for (const l of arr.levels) {
      const [name, price] = l.split("|");
      all.push({ name, price: Number(price) });
    }
  }
  if (all.length === 0) {
    return { bias: "NEUTRAL", justification: "Inga nivåer tillgängliga" };
  }
  const highs = all.filter((l) => l.name.includes("HIGH"));
  const lows = all.filter((l) => l.name.includes("LOW"));
  const avgHigh = highs.reduce((a, b) => a + b.price, 0) / (highs.length || 1);
  const avgLow = lows.reduce((a, b) => a + b.price, 0) / (lows.length || 1);
  if (highs.length && lows.length) {
    if (avgHigh > avgLow + 150) {
      return { bias: "LONG", justification: "Högre swing-highs än swing-lows" };
    }
    if (avgLow < avgHigh - 150) {
      return { bias: "SHORT", justification: "Lägre swing-lows än swing-highs" };
    }
  }
  return { bias: "NEUTRAL", justification: "Nivåstruktur ambivalent" };
}