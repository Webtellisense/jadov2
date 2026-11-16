import { DiscoveryScreen } from "@/features/discovery/screens";
import type { Query } from "@/lib/discovery";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Query>;
}) {
  return (
    <DiscoveryScreen
      path={["explore", (await params).category]}
      query={await searchParams}
    />
  );
}
