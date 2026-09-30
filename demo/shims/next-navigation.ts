/**
 * Static-demo stand-in for "next/navigation", backed by the hash router.
 */
import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { getLocation, navigate, subscribeLocation } from "../router-store";

export class NotFoundError extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export function notFound(): never {
  throw new NotFoundError();
}

export function redirect(href: string): never {
  navigate(href, { replace: true });
  throw new NotFoundError();
}

export const permanentRedirect = redirect;

export const RouteParamsContext = createContext<Record<string, string>>({});

function useDemoLocation() {
  return useSyncExternalStore(subscribeLocation, getLocation, getLocation);
}

export function usePathname(): string {
  return useDemoLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  const { search } = useDemoLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useContext(RouteParamsContext) as T;
}

export interface DemoRouter {
  push(href: string, options?: { scroll?: boolean }): void;
  replace(href: string, options?: { scroll?: boolean }): void;
  back(): void;
  forward(): void;
  refresh(): void;
  prefetch(href: string): void;
}

const router: DemoRouter = {
  push: (href) => navigate(href),
  replace: (href) => navigate(href, { replace: true }),
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  refresh: () => {},
  prefetch: () => {},
};

export function useRouter(): DemoRouter {
  return router;
}
