import { DiscoveryScreen } from "@/features/discovery/screens";
import type { Query } from "@/lib/discovery";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  return <DiscoveryScreen query={await searchParams} />;
}
