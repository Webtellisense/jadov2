import { BusinessWorkspace } from "@/components/business-workspace";
export const metadata = {
  title: "Private business draft",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <BusinessWorkspace id={(await params).id} />;
}
