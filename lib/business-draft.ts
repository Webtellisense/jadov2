import { z } from "zod";
const text = (max: number) => z.string().trim().max(max).default("");
export const draftDetailsSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    category: text(100),
    location: text(200),
    serviceArea: text(200),
    address: text(300),
    phone: text(40),
    website: z
      .union([
        z.literal(""),
        z.url().refine((v) => new URL(v).protocol === "https:"),
      ])
      .default(""),
    description: text(2000),
    contactEmail: z.union([z.literal(""), z.email()]).default(""),
  })
  .strict();
export type DraftDetails = z.infer<typeof draftDetailsSchema>;
export const draftSaveSchema = z
  .object({ version: z.number().int().positive(), details: draftDetailsSchema })
  .strict();
export const lifecycleStates = [
  "draft",
  "pending_gbp_approval",
  "gbp_unverified",
  "verified_eligible",
  "published",
  "reverification_required",
  "suspended",
] as const;
