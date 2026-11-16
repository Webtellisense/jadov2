import { z } from "zod";
import { postMediaLimits } from "./media-policy";
export { postMediaLimits } from "./media-policy";
const localPhoto = z
  .string()
  .regex(/^\/demo-businesses\/[a-z-]+\/photo-[1-6]\.webp$/);
export const photoSchema = z.object({
  src: localPhoto,
  alt: z.string().min(5).max(200),
});
export type BusinessPhoto = z.infer<typeof photoSchema>;
export const businessPresentationSchema = z.object({
  logo: z.string().regex(/^\/demo-businesses\/[a-z-]+\/logo\.svg$/),
  cover: photoSchema,
  gallery: z.array(photoSchema).min(3).max(6),
  about: z.string().min(80).max(2000),
  address: z.string().min(5).max(200),
  hours: z
    .array(
      z.object({
        days: z.string(),
        opens: z.string().regex(/^\d{2}:\d{2}$/),
        closes: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .min(1)
    .max(7),
  phone: z.string().max(50).nullable(),
  website: z.url().refine((v) => new URL(v).hostname.endsWith(".example")),
  email: z.email().refine((v) => v.endsWith(".example")),
  socials: z
    .array(
      z.object({
        label: z.enum(["Instagram", "Facebook"]),
        url: z.url().refine((v) => new URL(v).hostname.endsWith(".example")),
      }),
    )
    .max(2),
  services: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        priceNaira: z.number().int().nonnegative().nullable(),
        image: photoSchema,
      }),
    )
    .min(2)
    .max(5),
});
export type BusinessPresentation = z.infer<typeof businessPresentationSchema>;
export const postPresentationSchema = z.object({
  media: z.array(photoSchema).max(5),
  eventAt: z.iso.datetime().nullable(),
});
export type PostPresentation = z.infer<typeof postPresentationSchema>;
export function validatePostPresentation(
  type: keyof typeof postMediaLimits,
  value: unknown,
) {
  const result = postPresentationSchema.parse(value);
  if (result.media.length > postMediaLimits[type])
    throw new Error(`Too many images for ${type}.`);
  return result;
}
