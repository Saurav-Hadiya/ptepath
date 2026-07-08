export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export function enforceWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}
