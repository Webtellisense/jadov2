import { DiscoveryScreen } from "@/features/discovery/screens";
import type { Query } from "@/lib/discovery";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Query>;
}) {
  return (
    <DiscoveryScreen
      path={["posts", (await params).id]}
      query={await searchParams}
    />
  );
}
