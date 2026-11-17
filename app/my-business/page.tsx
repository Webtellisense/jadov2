import { BusinessWorkspace } from "@/components/business-workspace";
export const metadata = {
  title: "My Business",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Page() {
  return <BusinessWorkspace />;
}
