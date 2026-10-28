
/** Link codes are 36 lowercase hex characters (18 random bytes). */
export function isCleanerToken(t: string): boolean {
  return /^[0-9a-f]{36}$/.test(t);
}

export function cleanerLink(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/c/${token}`;
}
