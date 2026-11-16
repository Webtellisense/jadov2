import { DiscoveryScreen } from "@/features/discovery/screens";
import type { Query } from "@/lib/discovery";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  return <DiscoveryScreen path={["feed"]} query={await searchParams} />;
}
