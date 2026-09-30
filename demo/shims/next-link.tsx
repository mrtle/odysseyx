/**
 * Static-demo stand-in for "next/link": app paths become "#/path" links
 * handled by the hash router; external links and new-tab clicks behave
 * normally.
 */
import type { AnchorHTMLAttributes, MouseEvent, Ref } from "react";
import { navigate } from "../router-store";

type Href = string | { pathname?: string; query?: Record<string, string | number | undefined>; hash?: string };

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: Href;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean | null;
  ref?: Ref<HTMLAnchorElement>;
}

function hrefToString(href: Href): string {
  if (typeof href === "string") return href;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(href.query ?? {})) if (value !== undefined) query.set(key, String(value));
  const search = query.toString();
  return `${href.pathname ?? ""}${search ? `?${search}` : ""}${href.hash ? `#${href.hash.replace(/^#/, "")}` : ""}`;
}

export default function Link({ href, replace, scroll, prefetch, onClick, target, ...rest }: LinkProps) {
  void scroll; // the hash router always scrolls to the top on a new page
  void prefetch; // everything is already in the bundle
  const url = hrefToString(href);
  const appPath = url.startsWith("/");
  const fragment = url.startsWith("#");
  const resolved = appPath ? `#${url}` : url;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || !(appPath || fragment)) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (target && target !== "_self")) return;
    event.preventDefault();
    navigate(url, { replace });
  }

  return <a {...rest} target={target} href={resolved} onClick={handleClick} />;
}
