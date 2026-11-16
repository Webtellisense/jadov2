import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  BackLink,
  ButtonLink,
  PageHeading,
  StateCard,
  StatTile,
  StepIndicator,
} from "@/components/ui/core";
import { requirePrincipal } from "@/server/authorization";
import { getRuntime } from "@/server/runtime";
import { AppError } from "@/server/errors";
export const dynamic = "force-dynamic";
export default async function Owner({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const key = (await params).path?.[0] ?? "today";
  const sections = [
    "today",
    "onboarding",
    "posts",
    "inbox",
    "insights",
    "profile",
    "share",
  ];
  if (!sections.includes(key)) notFound();
  try {
    const { db, auth } = getRuntime();
    await requirePrincipal(db, auth, await headers());
  } catch (e) {
    if (e instanceof AppError && e.status === 401)
      redirect(`/sign-in?next=${encodeURIComponent(`/owner/${key}`)}`);
    return (
      <StateCard
        kind="unauthorized"
        title="Account unavailable"
        href="/account"
      >
        You don&apos;t have access to this. Sign in with an active account.
      </StateCard>
    );
  }
  return (
    <>
      <BackLink href="/account" label="Back to account" />
      <PageHeading
        eyebrow="Business workspace · prototype shell"
        title={
          key === "today"
            ? "A good day starts here."
            : key === "onboarding"
              ? "Let's find your business."
              : key === "inbox"
                ? "Business messages"
                : key === "share"
                  ? "Share your Jado page"
                  : key.charAt(0).toUpperCase() + key.slice(1)
        }
      />
      <nav className="owner-nav" aria-label="Business workspace">
        {sections.map((s) => (
          <Link
            key={s}
            className={`chip ${s === key ? "selected" : ""}`}
            href={`/owner/${s}`}
            aria-current={s === key ? "page" : undefined}
          >
            {s === "today"
              ? "Today"
              : s === "inbox"
                ? "Messages"
                : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </nav>
      {key === "onboarding" ? (
        <section className="panel">
          <h2>Your own business, your own phone.</h2>
          <p>
            Sign in on your own phone so only you control this page. Staff can
            guide you, but cannot authorise Google access for you.
          </p>
          <StepIndicator
            steps={[
              "Find your Google Business Profile",
              "Confirm the matching business",
              "Prove authorised management access",
              "Complete your Jado page",
            ]}
          />
          <p className="notice">
            Google matching and ownership authorisation are not connected in
            M0.5. No application has been created and no business can be
            activated.
          </p>
          <div className="flex-wrap">
            <a
              className="button secondary"
              href="https://support.google.com/business/answer/3403100"
              rel="noreferrer"
            >
              Ask the current manager to add you
            </a>
            <a
              className="button secondary"
              href="https://support.google.com/business/answer/4566671"
              rel="noreferrer"
            >
              Request ownership through Google
            </a>
            <ButtonLink href="/help" variant="secondary">
              Get help from Jado
            </ButtonLink>
          </div>
        </section>
      ) : (
        <>
          <StateCard
            title={
              key === "today"
                ? "Your business isn't activated yet"
                : key === "share"
                  ? "A public page is needed first"
                  : key === "inbox"
                    ? "No business conversations yet"
                    : `No ${key} available yet`
            }
            href="/owner/onboarding"
            action="View the onboarding steps"
          >
            {key === "share"
              ? "No canonical public profile or QR exists before verified activation. No fictional QR is generated."
              : "This is an interactive workspace shell. Publishing, messages and live insights are not connected. Authentication alone does not grant business management access."}
          </StateCard>
          {key === "today" && (
            <div className="stat-grid">
              {[
                "Profile views",
                "New followers",
                "Unanswered messages",
                "Live posts",
              ].map((label) => (
                <StatTile key={label} label={label} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
