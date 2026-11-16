"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";
export function AreaLink({ href, ...props }: ComponentProps<typeof Link>) {
  const area = useSearchParams().get("area");
  if (
    typeof href === "string" &&
    href.startsWith("/") &&
    !href.startsWith("//") &&
    (area === "Uyo" || area === "Eket")
  ) {
    const url = new URL(href, "https://jado.invalid");
    if (!url.searchParams.has("area")) url.searchParams.set("area", area);
    href = url.pathname + url.search + url.hash;
  }
  return <Link href={href} {...props} />;
}
