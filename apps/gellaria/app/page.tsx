import { WorldExperience } from "@/components/world/WorldExperience";
import { getWorldContent } from "@/lib/gworkspace-content";

export default async function Home({ searchParams }: { searchParams: Promise<{ destination?: string }> }) {
  const { destination } = await searchParams;
  const content = await getWorldContent();
  return <WorldExperience initialDestination={destination} landmarks={content.landmarks} profile={content.profile} />;
}
