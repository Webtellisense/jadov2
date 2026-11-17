import { AuthFlow } from "@/components/auth-flow";
import { authAvailability } from "@/server/email";
export const metadata = {
  title: "Jado account",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const query = await searchParams;
  return (
    <AuthFlow
      kind="register"
      available={authAvailability().email}
      token={query.token}
      next={query.next}
    />
  );
}
