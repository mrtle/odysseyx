import { buildCatalog } from "@/components/home/catalog";
import { HomeView } from "@/components/home/home-view";
import { SCENARIOS } from "@/content/scenarios";
import { TRACKS } from "@/content/tracks";

export default function HomePage() {
  // Built on the server so the browser gets titles and skills, not lesson bodies or persona briefs.
  return <HomeView catalog={buildCatalog(TRACKS, SCENARIOS)} />;
}
