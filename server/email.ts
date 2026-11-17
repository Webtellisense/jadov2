import { AppError } from "./errors";
export type TransactionalMessage = {
  to: string;
  subject: string;
  text: string;
};
export interface MailTransport {
  available: boolean;
  send(message: TransactionalMessage): Promise<void>;
}
export function createMailTransport(
  env: Record<string, string | undefined> = process.env,
): MailTransport {
  const available =
    env.EMAIL_ENABLED === "true" &&
    env.EMAIL_PROVIDER === "resend" &&
    !!env.EMAIL_API_KEY &&
    !!env.EMAIL_FROM;
  return {
    available,
    async send(message) {
      if (!available)
        throw new AppError(
          503,
          "EMAIL_UNAVAILABLE",
          "Email delivery is not configured.",
        );
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.EMAIL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        throw new AppError(
          503,
          "EMAIL_DELIVERY_FAILED",
          "Email delivery is unavailable. Try again later.",
        );
    },
  };
}
export function authAvailability(
  env: Record<string, string | undefined> = process.env,
) {
  return {
    google:
      env.AUTH_GOOGLE_ENABLED === "true" &&
      !!env.AUTH_GOOGLE_CLIENT_ID &&
      !!env.AUTH_GOOGLE_CLIENT_SECRET,
    email: createMailTransport(env).available,
  };
}
