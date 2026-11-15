import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Jado — local connections, built on trust",
    template: "%s | Jado",
  },
  description:
    "Jado is being built to help you discover owner-verified local businesses, compare useful information and start a conversation.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="wrap" tabIndex={-1}>
          {children}
        </main>
        <footer className="wrap site-footer">
          <p>A local beginning. A lasting connection.</p>
          <p>
            Built by Webtellisense Consult <span aria-hidden="true">·</span>{" "}
            <Link href="/">Jado</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
