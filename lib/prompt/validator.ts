export function validateInjected(lines: string[]): "NO_INJECTION" | "INVALID_NUMERIC_DATA" | "OK" {
  if (!lines || lines.length === 0) return "NO_INJECTION";
  for (const line of lines) {
    if (line.includes("PRICE") && !/[0-9]/.test(line)) {
      return "INVALID_NUMERIC_DATA";
    }
  }
  return "OK";
}