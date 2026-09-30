/**
 * Runs the app's own API route handlers inside the browser for the static
 * demo build. fetch("/api/...") calls are answered by calling the route's
 * GET/POST function with a real Request, so the demo build uses exactly
 * the same validation and offline coach as the server.
 */
import * as status from "@/app/api/status/route";
import * as coachChat from "@/app/api/coach/chat/route";
import * as coachEvaluate from "@/app/api/coach/evaluate/route";
import * as labLogline from "@/app/api/lab/logline/route";
import * as labStory from "@/app/api/lab/story/route";
import * as labShots from "@/app/api/lab/shots/route";
import * as daily from "@/app/api/daily/route";

type Handler = (req: Request) => Response | Promise<Response>;
type RouteModule = Partial<Record<"GET" | "POST", Handler>>;

const ROUTES: Record<string, RouteModule> = {
  "/api/status": status as RouteModule,
  "/api/coach/chat": coachChat as RouteModule,
  "/api/coach/evaluate": coachEvaluate as RouteModule,
  "/api/lab/logline": labLogline as RouteModule,
  "/api/lab/story": labStory as RouteModule,
  "/api/lab/shots": labShots as RouteModule,
  "/api/daily": daily as RouteModule,
};

export function installLocalApi() {
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);
    const route = url.origin === window.location.origin ? ROUTES[url.pathname] : undefined;
    if (!route) return realFetch(input, init);

    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase() as "GET" | "POST";
    const handler = route[method];
    if (!handler) {
      return Response.json({ error: "That method isn't supported here.", code: "bad_request" }, { status: 405 });
    }
    const request = input instanceof Request ? new Request(input, init) : new Request(url, init);
    try {
      return await handler(request);
    } catch (err) {
      console.error("[odysseusx demo] route failed", url.pathname, err);
      return Response.json({ error: "The demo coach hit a snag. Try again.", code: "unknown" }, { status: 500 });
    }
  };
}
