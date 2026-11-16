import { DiscoveryScreen } from "@/features/discovery/screens";
import type { Query } from "@/lib/discovery";
export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
  title: "Private development prototype",
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Query>;
}) {
  return (
    <DiscoveryScreen
      path={(await params).path}
      query={await searchParams}
      preview
    />
  );
}
