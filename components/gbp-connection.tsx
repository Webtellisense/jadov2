"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GbpStatus } from "./gbp-status";
import type { GbpAccount, GbpLocation, Page } from "@/server/gbp/contracts";
type Status = {
  available: boolean;
  providerReason: string | null;
  connection: string;
  state: string;
  reason: string | null;
  canonicalLocation: string | null;
  checkedAt: string | null;
  validUntil: string | null;
};
export function GbpConnection({ id }: { id: string }) {
  const router = useRouter(),
    base = `/api/my-business/${id}/gbp`;
  const [status, setStatus] = useState<Status | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false);
  const [accounts, setAccounts] = useState<Page<GbpAccount> | null>(null),
    [account, setAccount] = useState(""),
    [locations, setLocations] = useState<Page<GbpLocation> | null>(null),
    [locationPage, setLocationPage] = useState<string | undefined>();
  useEffect(() => {
    const controller = new AbortController();
    fetch(base, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Could not load Google connection.");
        setStatus(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setFailed(true);
          setMessage(error.message);
        }
      });
    return () => controller.abort();
  }, [base]);
  async function request(path: string, body?: unknown) {
    const response = await fetch(path, {
      cache: "no-store",
      ...(body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.message || "Google connection unavailable. Try again.",
      );
    return data;
  }
  async function perform(operation: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      await operation();
    } catch (error) {
      setFailed(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not connect. Your private draft is safe.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    await perform(async () => {
      const result = await request(`${base}/connect`, {});
      if (result.pending) {
        setMessage(
          "Google Business Profile access is pending. Your private draft is safe.",
        );
        return;
      }
      // Only the server constructs this fixed Google authorization URL.
      const target = new URL(result.url);
      if (
        target.origin !== "https://accounts.google.com" ||
        target.pathname !== "/o/oauth2/v2/auth"
      )
        throw new Error("Google connection unavailable.");
      window.location.assign(target.href);
    });
  }
  async function loadAccounts(page?: string) {
    await perform(async () => {
      setAccounts(
        await request(
          `${base}?kind=accounts${page ? `&page=${encodeURIComponent(page)}` : ""}`,
        ),
      );
      setLocations(null);
      setAccount("");
    });
  }
  async function loadLocations(selected: string, page?: string) {
    await perform(async () => {
      setLocations(
        await request(
          `${base}?kind=locations&account=${encodeURIComponent(selected)}${page ? `&page=${encodeURIComponent(page)}` : ""}`,
        ),
      );
      setLocationPage(page);
      setAccount(selected);
    });
  }
  async function action(body: unknown) {
    await perform(async () => {
      const result = await request(base, body);
      setStatus(await request(base));
      setMessage(
        result.connection === "revocation_pending"
          ? "Disconnected locally. Google revocation still needs a retry."
          : result.connection === "revoked"
            ? "Google connection revoked. Your business data is preserved."
            : "Google check completed. Your business remains private.",
      );
      setAccounts(null);
      setLocations(null);
      router.refresh();
    });
  }
  return (
    <section className="panel section" aria-busy={busy}>
      <h2>Connect Google Business Profile</h2>
      {status ? (
        <>
          <GbpStatus state={status.state} reason={status.reason} />
          {!status.available ? (
            <>
              <p>
                {status.providerReason === "ACCESS_PENDING"
                  ? "Google Business Profile access is pending. Your draft is saved privately while synchronization and verification are unavailable."
                  : "Google Business Profile connection is not configured. Your draft is saved privately."}
              </p>
              <button className="button secondary" disabled>
                Google connection unavailable
              </button>
            </>
          ) : (
            <>
              <p>
                This is a separate business authorization, not your Jado
                sign-in. Connect the Google account that manages this business.
              </p>
              <button className="button" disabled={busy} onClick={connect}>
                {status.connection === "connected"
                  ? "Switch Google Account"
                  : "Connect Google Business Profile"}
              </button>
              {status.connection === "reauthorization_required" && (
                <p>
                  Google authorization needs to be renewed. Reconnect to check
                  access again.
                </p>
              )}
              {status.connection === "connected" && (
                <>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => loadAccounts()}
                  >
                    Choose a Google business
                  </button>
                  {status.canonicalLocation && (
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => action({ action: "recheck" })}
                    >
                      Re-check status
                    </button>
                  )}
                </>
              )}
            </>
          )}
          {[
            "connected",
            "reauthorization_required",
            "revocation_pending",
          ].includes(status.connection) && (
            <>
              <p className="small muted">
                Disconnecting a primary authority affects every business using
                this connection. Only an authorized OWNER can disconnect it.
              </p>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => action({ action: "disconnect" })}
              >
                {status.connection === "revocation_pending"
                  ? "Retry Google revocation"
                  : "Disconnect Google authority"}
              </button>
            </>
          )}
          {status.checkedAt && (
            <p className="small muted">
              Last successful check:{" "}
              {new Date(status.checkedAt).toLocaleString()}. Re-checking never
              publishes a business automatically.
            </p>
          )}
        </>
      ) : (
        !message && <p role="status">Loading Google connection…</p>
      )}
      {accounts && (
        <div className="section">
          <h3>Google business accounts</h3>
          {accounts.items.length ? (
            <ul>
              {accounts.items.map((a) => (
                <li key={a.name}>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => loadLocations(a.name)}
                  >
                    {a.accountName}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No accessible business accounts on this page. You may be signed
              into the wrong Google account or may not manage a Google Business
              Profile. Switch Google Account or request access from its owner.
            </p>
          )}
          {accounts.nextPageToken && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => loadAccounts(accounts.nextPageToken)}
            >
              Next accounts
            </button>
          )}
        </div>
      )}
      {locations && (
        <div className="section">
          <h3>Manageable Google locations</h3>
          <p className="small muted">
            Private, live Google response. Selecting a business does not by
            itself establish Jado ownership.
          </p>
          {locations.items.length ? (
            <ul>
              {locations.items.map((l) => (
                <li key={l.name}>
                  <h4>{l.title}</h4>
                  <p>
                    {l.category || "Category unavailable"} ·{" "}
                    {l.address ||
                      (l.serviceArea
                        ? "Service-area business"
                        : "Location unavailable")}
                  </p>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      action({
                        action: "select",
                        account,
                        location: l.name,
                        page: locationPage,
                      })
                    }
                  >
                    Select {l.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No manageable locations on this page. Try another Google account
              or request Google Business Profile access from its owner.
            </p>
          )}
          {locations.nextPageToken && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => loadLocations(account, locations.nextPageToken)}
            >
              Next locations
            </button>
          )}
        </div>
      )}
      <p className="small muted">
        No public listing or verification badge is created here. Ambiguous
        ownership stays pending. Complete Google verification in Google Business
        Profile if required.
      </p>
      {busy && <p role="status">Contacting Google…</p>}
      {message && <p role={failed ? "alert" : "status"}>{message}</p>}
      {!status && failed && (
        <button
          className="button secondary"
          onClick={() => perform(async () => setStatus(await request(base)))}
        >
          Reload workspace
        </button>
      )}
    </section>
  );
}
