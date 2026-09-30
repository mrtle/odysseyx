import "@/app/globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DemoApp } from "./app";
import { installDownloads } from "./downloads";
import { installLocalApi } from "./local-api";
import { NotFoundError } from "./shims/next-navigation";

installLocalApi();
installDownloads();

const container = document.getElementById("odysseusx-root");
if (container) {
  createRoot(container, {
    // notFound() is routing, not a failure: the boundary renders the not-found page.
    onCaughtError(error, info) {
      if (error instanceof NotFoundError) return;
      console.error(error, info.componentStack);
    },
  }).render(
    <StrictMode>
      <DemoApp />
    </StrictMode>,
  );
}
