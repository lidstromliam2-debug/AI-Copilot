import OpenAI from "openai";

interface IndicatorSpec { indicator: string; period?: number; fastPeriod?: number; slowPeriod?: number; signalPeriod?: number; }
interface RuleCondition {
  left: IndicatorSpec;
  op: 'crossesAbove' | 'crossesBelow' | 'greaterThan' | 'lessThan';
  right?: IndicatorSpec | { value: number };
}
export interface GenericRulesParams {
  indicators: IndicatorSpec[];
  entryRules: RuleCondition[];
  exitRules: RuleCondition[];
}

const SYSTEM = `You convert arbitrary trading strategy descriptions into structured JSON.
Allowed indicators: ema,sma,rsi,macd,price.
JSON schema:
{"strategy":"generic_rules","params":{"indicators":[{"indicator":"ema","period":50}],"entryRules":[{"left":{"indicator":"ema","period":50},"op":"crossesAbove","right":{"indicator":"ema","period":200}}],"exitRules":[{"left":{"indicator":"ema","period":50},"op":"crossesBelow","right":{"indicator":"ema","period":200}}]}}
Rules:
- Use ONLY listed indicators.
- For price threshold use {"indicator":"price"} and right {"value":12345}.
- Prefer crossover semantics where user mentions crosses.
- No commentary, ONLY JSON.`;

function safeParse(jsonText: string): any | null {
  try { return JSON.parse(jsonText.trim()); } catch { return null; }
}

export async function parseNaturalLanguageStrategy(prompt: string): Promise<{ strategy: string; params: GenericRulesParams } | null> {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) return null;
  const openai = new OpenAI({ apiKey });
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt }
      ]
    });
    const content = res.choices[0]?.message?.content || '';
    const parsed = safeParse(content);
    if (!parsed || parsed.strategy !== 'generic_rules') return null;
    return parsed;
  } catch (e) {
    console.error('[StrategyParser] OpenAI error', e);
    return null;
  }
}