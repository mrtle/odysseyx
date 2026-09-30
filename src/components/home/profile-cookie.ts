/**
 * A tiny "this browser has a profile" hint for the server.
 *
 * Progress lives in localStorage, which the server can't see, so without a
 * hint `/` could only render a placeholder until the store hydrated. The
 * cookie lets the page choose on the server: the landing page (real,
 * crawlable content) for newcomers, the dashboard shell for returning
 * learners. localStorage stays the source of truth — HomeView re-syncs the
 * cookie whenever the two disagree.
 *
 * Safe to import on the server (only the constant is read there).
 */
export const PROFILE_COOKIE = "ox_profile";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** True when the request's cookie value means "has a profile". */
export function isProfileCookieValue(value: string | undefined): boolean {
  return value === "1";
}

/** The `document.cookie` assignment that sets (or clears) the hint. */
export function profileCookieString(present: boolean, secure = false): string {
  const attributes = `Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
  return present
    ? `${PROFILE_COOKIE}=1; Max-Age=${ONE_YEAR_SECONDS}; ${attributes}`
    : `${PROFILE_COOKIE}=; Max-Age=0; ${attributes}`;
}

/** Read the hint in the browser (false on the server). */
export function readProfileCookie(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.cookie.split(/;\s*/).some((part) => part === `${PROFILE_COOKIE}=1`);
  } catch {
    return false;
  }
}

/** Set or clear the hint in the browser. A no-op on the server or when cookies are blocked. */
export function writeProfileCookie(present: boolean): void {
  if (typeof document === "undefined") return;
  try {
    if (readProfileCookie() === present) return;
    document.cookie = profileCookieString(present, window.location.protocol === "https:");
  } catch {
    // Cookies blocked: the page still works, it just can't pick the right shell on the server.
  }
}
