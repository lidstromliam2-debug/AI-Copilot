export function cleanOutput(text: string): string {
  return text
    .replace(/```/g, "")
    .replace(/_/g, "")
    .replace(/\u00A0/g, " ")
    .trim();
}