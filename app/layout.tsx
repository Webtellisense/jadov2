import type { Metadata } from "next";
import localFont from "next/font/local";
import { CardSkeleton } from "@/components/ui/core";
import { Suspense } from "react";
import { ComparisonProvider } from "@/components/comparison-context";
import { AppChrome } from "@/components/app-chrome";
import "./globals.css";
const inter = localFont({
  src: "../public/fonts/inter.woff2",
  display: "swap",
  variable: "--font-inter",
  weight: "400 600",
});
const bricolage = localFont({
  src: "../public/fonts/bricolage.woff2",
  display: "swap",
  variable: "--font-bricolage",
  weight: "600 800",
});
export const metadata: Metadata = {
  title: {
    default: "Jado — Good businesses, close to you.",
    template: "%s | Jado",
  },
  description:
    "Discover owner-verified local businesses, compare useful information and start a conversation.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bricolage.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Suspense
          fallback={
            <div className="wrap">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          }
        >
          <ComparisonProvider>
            <AppChrome>{children}</AppChrome>
          </ComparisonProvider>
        </Suspense>
      </body>
    </html>
  );
}
