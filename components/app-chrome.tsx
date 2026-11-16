"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  Compass,
  Layers,
  Columns3,
  MessageCircle,
  UserRound,
  ArrowLeft,
} from "lucide-react";
import { useComparison } from "./comparison-context";
import { LocationChip } from "./ui/core";
const subscribe = (fn: () => void) => {
  window.addEventListener("online", fn);
  window.addEventListener("offline", fn);
  return () => {
    window.removeEventListener("online", fn);
    window.removeEventListener("offline", fn);
  };
};
function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  return (
    !online && (
      <div className="offline-banner" role="alert">
        You&apos;re offline. These results may be out of date. Reconnect to
        continue.
      </div>
    )
  );
}
export function AppChrome({ children }: { children: React.ReactNode }) {
  const selection = useComparison();
  const path = usePathname(),
    params = useSearchParams();
  const prefix = path.startsWith("/dev") ? "/dev" : "";
  const area = params.get("area") || "";
  const staff = path.startsWith("/admin");
  const gallery = path === "/design";
  const destinations = [
    { label: "Explore", path: prefix || "/", icon: Compass },
    { label: "Feed", path: `${prefix}/feed`, icon: Layers },
    { label: "Compare", path: `${prefix}/compare`, icon: Columns3 },
    { label: "Messages", path: `${prefix}/messages`, icon: MessageCircle },
    { label: "Account", path: "/account", icon: UserRound },
  ];
  const links = destinations.map((d) => (
    <Link
      key={d.label}
      className="nav-link"
      href={`${d.path}${area ? `?area=${encodeURIComponent(area)}${params.get("ids") ? `&ids=${encodeURIComponent(params.get("ids")!)}` : ""}` : ""}`}
      aria-current={path === d.path ? "page" : undefined}
    >
      <d.icon aria-hidden="true" />
      {d.label}
    </Link>
  ));
  return (
    <>
      <OfflineBanner />
      {staff || gallery ? (
        <header className="admin-header">
          <Link className="brand" href="/">
            jado<span className="brand-dot">.</span>
          </Link>
          <Link className="back-link" href={gallery ? "/dev" : "/account"}>
            <ArrowLeft aria-hidden="true" />
            Back to {gallery ? "preview" : "account"}
          </Link>
        </header>
      ) : (
        <header className="site-header">
          <div className="header-inner">
            <Link
              href={`${prefix || "/"}${area ? `?area=${area}` : ""}`}
              className="brand"
              aria-label="Jado home"
            >
              jado<span className="brand-dot">.</span>
            </Link>
            <div className="header-tools">
              <LocationChip
                area={area}
                href={`${prefix}/location?next=${encodeURIComponent(`${path}${params.size ? `?${params}` : ""}`)}${area ? `&area=${area}` : ""}`}
              />
            </div>
            <nav className="desktop-nav" aria-label="Main navigation">
              {links}
            </nav>
          </div>
        </header>
      )}
      <main
        id="main"
        className="wrap"
        tabIndex={-1}
        data-has-selection={selection.ids.length > 0}
      >
        {children}
      </main>
      {!staff && !gallery && (
        <>
          <footer className="site-footer wrap">
            <div className="footer-links">
              <Link href="/verification">What verified means</Link>
              <Link href="/help">Help</Link>
              <Link href="/privacy">Privacy</Link>
            </div>
            <p>jado. · Built by Webtellisense Consult</p>
          </footer>
          <nav className="bottom-nav" aria-label="Main navigation">
            {links}
          </nav>
        </>
      )}
    </>
  );
}
