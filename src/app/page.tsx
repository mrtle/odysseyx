import { cookies } from "next/headers";
import { buildCatalog } from "@/components/home/catalog";
import { HomeView } from "@/components/home/home-view";
import { PROFILE_COOKIE, isProfileCookieValue } from "@/components/home/profile-cookie";
import { SCENARIOS } from "@/content/scenarios";
import { TRACKS } from "@/content/tracks";

/**
 * Newcomers get the landing page server-rendered; browsers that have saved a
 * profile (hinted by a cookie, since progress lives in localStorage) get the
 * dashboard shell. HomeView corrects the choice after hydration if the hint
 * and the saved progress disagree.
 */
export default async function HomePage() {
  const hasProfile = isProfileCookieValue((await cookies()).get(PROFILE_COOKIE)?.value);
  // Built on the server so the browser gets titles and skills, not lesson bodies or persona briefs.
  return <HomeView catalog={buildCatalog(TRACKS, SCENARIOS)} profileHint={hasProfile} />;
}
