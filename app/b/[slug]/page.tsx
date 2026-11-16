import { DiscoveryScreen } from "@/features/discovery/screens";
import type { Query } from "@/lib/discovery";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Query>;
}) {
  return (
    <DiscoveryScreen
      path={["b", (await params).slug]}
      query={await searchParams}
    />
  );
}
