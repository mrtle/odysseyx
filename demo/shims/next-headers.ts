/**
 * Static-demo stand-in for "next/headers": there is no request, so no
 * cookies or headers. Pages fall back to their client-side behaviour.
 */
const emptyCookies = {
  get: (): { name: string; value: string } | undefined => undefined,
  getAll: (): { name: string; value: string }[] => [],
  has: () => false,
};

export async function cookies() {
  return emptyCookies;
}

export async function headers() {
  return new Headers();
}
