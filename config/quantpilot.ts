export interface QuantpilotConfig {
  minRR: number;
  model: string;
  deterministic: boolean;
  version: string;
}

export const CONFIG: QuantpilotConfig = {
  minRR: 1.5,
  model: "gpt-4.1",
  deterministic: true,
  version: "QUANTPILOT-PRO v1.0"
};