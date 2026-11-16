import type { BusinessPresentation, PostPresentation } from "./business-media";
import { z } from "zod";
export const filtersSchema = z.object({
  q: z.string().trim().max(120).default(""),
  area: z.enum(["", "Uyo", "Eket"]).default(""),
  category: z
    .string()
    .regex(/^[a-z-]*$/)
    .max(40)
    .default(""),
  type: z
    .enum(["", "service", "offer", "arrival", "update", "event", "portfolio"])
    .default(""),
  sort: z.enum(["name", "newest", "active"]).default("name"),
  offers: z.enum(["", "yes"]).default(""),
  ids: z.string().max(200).default(""),
});
export type Filters = z.infer<typeof filtersSchema>;
export type Query = Record<string, string | string[] | undefined>;
export function parseFilters(query: Query): Filters {
  const values = Object.fromEntries(
    Object.keys(filtersSchema.shape).map((k) => [
      k,
      Array.isArray(query[k]) ? query[k][0] : query[k],
    ]),
  );
  return filtersSchema.parse(values);
}
export function comparisonIds(value: string) {
  const ids = value.split(",").filter(Boolean);
  if (
    ids.length > 3 ||
    new Set(ids).size !== ids.length ||
    ids.some((x) => !/^demo-[a-z0-9-]+$/.test(x))
  )
    throw new Error("Choose two or three different businesses.");
  return ids;
}
export function money(value: number | null) {
  return value === null ? "Not listed" : `₦${value.toLocaleString("en-NG")}`;
}
export const typeLabels = {
  service: "Product / service",
  offer: "Offer",
  arrival: "New arrival",
  update: "Update",
  event: "Event",
  portfolio: "Portfolio",
};
export type BusinessRecord = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  categoryName: string;
  icon: string;
  city: string;
  neighbourhood: string;
  description: string;
  tagline: string;
  presentation?: BusinessPresentation | null;
  tags: string[];
  createdAt: Date;
};
export type PostRecord = {
  id: string;
  businessId: string;
  type: keyof typeof typeLabels;
  title: string;
  description: string;
  tags: string[];
  priceNaira: number | null;
  presentation?: PostPresentation | null;
  publishedAt: Date;
  expiresAt: Date | null;
};
export type DiscoveryData = {
  businesses: BusinessRecord[];
  posts: PostRecord[];
  categories: { id: string; name: string; icon: string }[];
};
