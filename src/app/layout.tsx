import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { StoreHydrator } from "@/components/layout/store-hydrator";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OdysseusX — AI Storytelling Coach",
    template: "%s · OdysseusX",
  },
  description:
    "OdysseusX is an AI storytelling coach for storytellers and filmmakers: learn story craft, rehearse pitches with AI personas, and get scored feedback on your loglines, stories and shot lists.",
};

export const viewport: Viewport = {
  themeColor: "#050912",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <StoreHydrator />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
