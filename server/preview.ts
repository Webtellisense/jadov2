import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { previewEnabled } from "@/lib/preview-policy";
import { requirePrincipal } from "./authorization";
import { getRuntime } from "./runtime";
import { AppError } from "./errors";

export async function requirePreview(next: string) {
  if (!previewEnabled()) notFound();
  const { db, auth } = getRuntime();
  try {
    const principal = await requirePrincipal(db, auth, await headers());
    if (!principal.isFixture) notFound();
    return principal;
  } catch (error) {
    if (error instanceof AppError && error.status === 401)
      redirect(`/sign-in?next=${encodeURIComponent(next)}`);
    throw error;
  }
}
