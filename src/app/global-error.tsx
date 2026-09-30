"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort boundary when the root layout itself fails. It replaces the
 * whole document, so it brings its own <html>/<body> and the global styles.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full items-center justify-center px-4">
        <title>Something went wrong · OdysseusX</title>
        <main className="w-full max-w-md rounded-2xl border border-dashed border-sea-600 bg-sea-900/40 px-6 py-12 text-center">
          <p className="mb-3 font-display text-xl font-semibold text-sea-100">
            Odysseus<span className="text-bronze-400">X</span>
          </p>
          <h1 className="font-display text-lg font-semibold text-sea-100">The ship ran aground</h1>
          <p className="mt-2 text-sm text-sea-300">
            OdysseusX couldn&rsquo;t load. Your saved progress stays in this browser. Reload to try again.
          </p>
          {error.digest ? <p className="mt-2 text-xs text-sea-400">Reference: {error.digest}</p> : null}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex h-10 items-center rounded-xl bg-gradient-to-b from-bronze-400 to-bronze-600 px-4 text-sm font-semibold text-sea-950 hover:from-bronze-300 hover:to-bronze-500"
            >
              Try again
            </button>
            {/* A full page load, not client navigation: the app's router is what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex h-10 items-center rounded-xl border border-sea-600 bg-sea-800/70 px-4 text-sm font-semibold text-sea-100 hover:border-sea-500"
            >
              Back to Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
