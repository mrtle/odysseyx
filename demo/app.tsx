/**
 * The static demo shell: the same AppShell as the Next.js layout, with the
 * hash router rendering the real page components.
 */
import { Component, Suspense, use, useEffect, useSyncExternalStore, type ReactNode } from "react";
import ErrorPage from "@/app/error";
import { AppShell } from "@/components/layout/app-shell";
import { StoreHydrator } from "@/components/layout/store-hydrator";
import { Skeleton } from "@/components/ui/loading";
import { NotFoundError, RouteParamsContext } from "./shims/next-navigation";
import { getLocation, subscribeLocation, type DemoLocation } from "./router-store";
import { LearnNotFound, RootNotFound, matchRoute, type RouteMatch } from "./routes";

// Async pages (they await their params) resolve once per URL.
const pageCache = new Map<string, Promise<ReactNode>>();

function PageHost({ match, location, cacheKey }: { match: RouteMatch; location: DemoLocation; cacheKey: string }) {
  let pending = pageCache.get(cacheKey);
  if (!pending) {
    const props = {
      params: Promise.resolve(match.params),
      searchParams: Promise.resolve(Object.fromEntries(new URLSearchParams(location.search))),
    };
    pending = Promise.resolve().then(() => match.route.page(props));
    if (pageCache.size > 50) pageCache.clear();
    pageCache.set(cacheKey, pending);
  }
  return <>{use(pending)}</>;
}

/** The not-found page for a path: the Learn one inside /learn, the root one elsewhere. */
function NotFoundPage({ pathname }: { pathname: string }) {
  return pathname.startsWith("/learn") ? <LearnNotFound /> : <RootNotFound />;
}

interface BoundaryProps {
  pathname: string;
  onRetry: () => void;
  children: ReactNode;
}

class RouteBoundary extends Component<BoundaryProps, { error: unknown }> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error == null) return this.props.children;
    if (error instanceof NotFoundError) return <NotFoundPage pathname={this.props.pathname} />;
    const retry = () => {
      this.props.onRetry();
      this.setState({ error: null });
    };
    return <ErrorPage error={error instanceof Error ? error : new Error(String(error))} retry={retry} />;
  }
}

function PageFallback() {
  return (
    <div aria-busy="true" className="space-y-4">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-40" />
    </div>
  );
}

export function DemoApp() {
  const location = useSyncExternalStore(subscribeLocation, getLocation, getLocation);
  const match = matchRoute(location.pathname);
  const cacheKey = `${location.pathname}${location.search}`;

  useEffect(() => {
    const title = match?.route.title;
    document.title = title ? `${title} · OdysseusX` : "OdysseusX";
  }, [match]);

  let content: ReactNode;
  if (!match) {
    content = <NotFoundPage pathname={location.pathname} />;
  } else {
    content = (
      <RouteBoundary key={cacheKey} pathname={location.pathname} onRetry={() => pageCache.delete(cacheKey)}>
        <RouteParamsContext.Provider value={match.params}>
          <Suspense fallback={<PageFallback />}>
            <PageHost match={match} location={location} cacheKey={cacheKey} />
          </Suspense>
        </RouteParamsContext.Provider>
      </RouteBoundary>
    );
  }

  return (
    <>
      <StoreHydrator />
      <AppShell>{content}</AppShell>
    </>
  );
}
