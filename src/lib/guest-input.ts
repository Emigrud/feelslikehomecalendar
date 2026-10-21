/** Parse "3, 7" style kids' ages. Returns null when any entry is not a whole age 0–17. */
export function parseKidsAges(text: string): number[] | null {
  const parts = text.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
  const ages: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,2}$/.test(p)) return null;
    const n = Number(p);
    if (n > 17) return null;
    ages.push(n);
  }
  return ages;
}

/** Parse adults; empty means "not filled in" (null). Returns undefined when invalid. */
export function parseAdults(text: string): number | null | undefined {
  const t = text.trim();
  if (t === "") return null;
  if (!/^\d{1,2}$/.test(t)) return undefined;
  const n = Number(t);
  return n >= 1 && n <= 20 ? n : undefined;
}
