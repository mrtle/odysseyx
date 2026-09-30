import type { Metadata } from "next";
import { buildCatalog } from "@/components/home/catalog";
import { ProgressView } from "@/components/progress/progress-view";
import { SCENARIOS } from "@/content/scenarios";
import { TRACKS } from "@/content/tracks";

export const metadata: Metadata = {
  title: "Captain's log",
  description: "Your OdysseusX progress: rank, streak, skill chart, lessons, practice and Story Lab history.",
};

export default function ProgressPage() {
  return <ProgressView catalog={buildCatalog(TRACKS, SCENARIOS)} />;
}
