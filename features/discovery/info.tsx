import Link from "next/link";
import { BackLink, PageHeading, StateCard } from "@/components/ui/core";
export function InfoScreen({ kind }: { kind: string }) {
  return (
    <div className="narrow">
      <BackLink />
      <PageHeading
        title={
          kind === "verification"
            ? "Verified on Jado"
            : kind === "privacy"
              ? "Your privacy matters"
              : "A little help"
        }
      />
      {kind === "verification" ? (
        <>
          <p>
            The owner has proven they manage this business on Google. It does
            not guarantee the quality of their service.
          </p>
          <p>
            Google sign-in or a matching Google listing alone does not verify
            business ownership. Only confirmed access to the matching verified
            Google Business Profile can activate a public Jado listing.
          </p>
          <h2>Reviews stay on Google</h2>
          <p>Jado does not collect its own star ratings or customer reviews.</p>
          <Link className="text-link" href="/help">
            Need help with a business?
          </Link>
        </>
      ) : kind === "privacy" ? (
        <>
          <p>
            Public browsing does not require an account. You choose an area;
            sharing GPS is optional. Location suggestions run in your browser
            and coordinates are not saved.
          </p>
          <p>
            Sign-in uses a secure session cookie. Data saver stores one
            preference in your browser. Development accounts and fictional
            businesses are excluded from production.
          </p>
          <p className="notice">
            This prototype notice is not the final approved legal policy. Public
            registration and consumer messaging are not open.
          </p>
        </>
      ) : (
        <>
          <h2>Business access</h2>
          <p>
            Use the Google account that manages your business. If someone else
            manages it, ask them to invite your account or request ownership
            through Google. Staff can guide you on your own phone; they cannot
            verify a business manually.
          </p>
          <a
            className="text-link"
            href="https://support.google.com/business/answer/4566671"
            rel="noreferrer"
          >
            Google&apos;s ownership request guide
          </a>
          <StateCard
            title="Support contact isn't configured"
            href="/"
            action="Back to Explore"
          >
            {process.env.SUPPORT_EMAIL ? (
              <a href={`mailto:${process.env.SUPPORT_EMAIL}`}>
                {process.env.SUPPORT_EMAIL}
              </a>
            ) : (
              "An approved contact address will appear here when it is configured. This prototype doesn't submit support reports."
            )}
          </StateCard>
        </>
      )}
    </div>
  );
}
