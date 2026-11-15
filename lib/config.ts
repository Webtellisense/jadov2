import { z } from "zod";

export function readConfig(
  env: Record<string, string | undefined> = process.env,
) {
  const parsed = z
    .object({
      DATABASE_URL: z.url().refine((value) => /^postgres(ql)?:/.test(value)),
      APP_ORIGIN: z.url().refine((value) => new URL(value).origin === value),
      BETTER_AUTH_SECRET: z.string().min(32),
      SUPPORT_EMAIL: z.union([z.email(), z.literal("")]).optional(),
    })
    .safeParse(env);
  if (!parsed.success) {
    // Report only variable names, never supplied values or raw Zod input.
    throw new Error(
      `Invalid environment configuration: ${[...new Set(parsed.error.issues.map((issue) => issue.path[0]))].join(", ")}`,
    );
  }
  if (
    env.NODE_ENV === "production" &&
    !parsed.data.APP_ORIGIN.startsWith("https://")
  ) {
    throw new Error("Production APP_ORIGIN must use HTTPS.");
  }
  return parsed.data;
}
export type Config = ReturnType<typeof readConfig>;
