import { authAvailability } from "./email";
export function authEndpointAllowed(
  method: string,
  endpoint: string,
  env: Record<string, string | undefined> = process.env,
) {
  const available = authAvailability(env);
  if (method === "GET")
    return (
      endpoint === "/get-session" ||
      (available.email &&
        /^\/reset-password\/[A-Za-z0-9_-]{16,128}$/.test(endpoint)) ||
      (available.google && endpoint === "/callback/google")
    );
  if (method !== "POST") return false;
  if (["/sign-in/email", "/sign-out"].includes(endpoint)) return true;
  if (available.google && endpoint === "/sign-in/social") return true;
  return (
    available.email &&
    [
      "/sign-up/email",
      "/email-otp/send-verification-otp",
      "/email-otp/verify-email",
      "/request-password-reset",
      "/reset-password",
    ].includes(endpoint)
  );
}
