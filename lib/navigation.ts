export function safeReturnPath(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  )
    return "/account";
  const url = new URL(value, "https://jado.invalid");
  if (url.origin !== "https://jado.invalid" || url.pathname === "/sign-in")
    return "/account";
  return url.pathname + url.search + url.hash;
}
