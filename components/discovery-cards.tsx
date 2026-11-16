import {
  BusinessLogo,
  BusinessIdentity,
  BusinessCover,
  PostMediaGallery,
} from "./business-media";
import Link from "next/link";
import {
  MessageCircle,
  Heart,
  ShoppingBag,
  Clock,
  Package,
  Megaphone,
  CalendarDays,
  Images,
} from "lucide-react";
import { Badge, ButtonLink } from "./ui/core";
import { CompareToggle, ShareButton } from "./discovery-interactions";
import {
  money,
  typeLabels,
  type BusinessRecord,
  type PostRecord,
} from "@/lib/discovery";

export function discoveryHref(
  prefix: string,
  path: string,
  area: string,
  ids = "",
) {
  const q = new URLSearchParams();
  if (area) q.set("area", area);
  if (ids) q.set("ids", ids);
  return `${prefix || path ? `${prefix}${path}` : "/"}${q.size ? `?${q}` : ""}`;
}
export function actionHref(
  prefix: string,
  kind: string,
  business: BusinessRecord,
  area: string,
  post?: string,
) {
  const params = new URLSearchParams({
    kind,
    business: business.id,
    area,
    return: discoveryHref(prefix, `/b/${business.slug}`, area),
  });
  if (post) params.set("post", post);
  return `${prefix}/action?${params}`;
}
export function BusinessCard({
  business,
  posts,
  prefix,
  area,
  ids = "",
  featured = false,
  priority = false,
}: {
  business: BusinessRecord;
  posts: PostRecord[];
  prefix: string;
  area: string;
  ids?: string;
  featured?: boolean;
  priority?: boolean;
}) {
  const offer = posts.find(
    (p) =>
      p.businessId === business.id &&
      p.type === "offer" &&
      p.expiresAt &&
      p.expiresAt > new Date(),
  );
  if (featured)
    return (
      <article className="featured-card">
        <Link
          className="feature-link"
          href={discoveryHref(prefix, `/b/${business.slug}`, area, ids)}
        >
          <BusinessCover business={business} eager={priority} sizes="260px" />
          <div className="feature-body">
            <BusinessIdentity business={business} heading />
          </div>
        </Link>
        <CompareToggle id={business.id} name={business.name} />
      </article>
    );
  return (
    <article className="business-card">
      <Link
        className="business-summary"
        href={discoveryHref(prefix, `/b/${business.slug}`, area, ids)}
      >
        <BusinessCover
          business={business}
          sizes="(max-width:389px) 92vw, 96px"
        />
        <div className="business-summary-text">
          <BusinessIdentity business={business} heading />
          <p>{business.tagline}</p>
        </div>
      </Link>
      {offer && (
        <Link
          href={discoveryHref(prefix, `/posts/${offer.id}`, area, ids)}
          className="offer-link"
        >
          <Badge tone="offer">Offer · {offer.title}</Badge>
        </Link>
      )}
      <div className="business-actions">
        <ButtonLink href={actionHref(prefix, "message", business, area)}>
          <MessageCircle aria-hidden="true" />
          Message
        </ButtonLink>
        <CompareToggle id={business.id} name={business.name} />
      </div>
    </article>
  );
}
const typeIcons = {
  service: ShoppingBag,
  offer: Clock,
  arrival: Package,
  update: Megaphone,
  event: CalendarDays,
  portfolio: Images,
};
export function TypeIndicator({ type }: { type: PostRecord["type"] }) {
  const Icon = typeIcons[type];
  return (
    <span className="type-indicator">
      <Icon aria-hidden="true" />
      {typeLabels[type]}
    </span>
  );
}
export function PostCard({
  post,
  business,
  prefix,
  area,
  ids = "",
  priority = false,
}: {
  post: PostRecord;
  business: BusinessRecord;
  prefix: string;
  area: string;
  ids?: string;
  priority?: boolean;
}) {
  const expired = !!post.expiresAt && post.expiresAt <= new Date();
  return (
    <article className="post-card">
      <div className="post-top">
        <BusinessLogo business={business} />
        <div>
          <Link href={discoveryHref(prefix, `/b/${business.slug}`, area, ids)}>
            {business.name}
          </Link>
          <div>
            <span className="caption muted">
              {post.publishedAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                timeZone: "Africa/Lagos",
              })}
            </span>
          </div>
        </div>
      </div>
      <div className={`post-type post-type-${post.type}`}>
        <TypeIndicator type={post.type} />
      </div>
      <PostMediaGallery post={post} eager={priority} />
      <div className="post-body">
        <h2>
          <Link href={discoveryHref(prefix, `/posts/${post.id}`, area, ids)}>
            {post.title}
          </Link>
        </h2>
        <p>{post.description}</p>
        {post.priceNaira !== null && (
          <>
            <p className="price">{money(post.priceNaira)}</p>
          </>
        )}
        {post.presentation?.eventAt && (
          <p className="event-date">
            <CalendarDays aria-hidden="true" />
            {new Date(post.presentation.eventAt).toLocaleDateString("en-GB", {
              timeZone: "Africa/Lagos",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
        {post.expiresAt && (
          <p className={expired ? "muted" : "small"}>
            {expired
              ? "This offer has ended"
              : `Ends ${post.expiresAt.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos" })}`}
          </p>
        )}
      </div>
      <div className="post-actions">
        <ButtonLink
          variant="secondary"
          href={actionHref(prefix, "like", business, area, post.id)}
        >
          <Heart aria-hidden="true" />
          Like
        </ButtonLink>
        <ButtonLink
          href={actionHref(prefix, "message", business, area, post.id)}
        >
          Message
        </ButtonLink>
        <ShareButton label="Share" />
      </div>
    </article>
  );
}
export function ComparisonCard({
  business: b,
  posts,
  prefix,
  area,
  ids = "",
}: {
  business: BusinessRecord;
  posts: PostRecord[];
  prefix: string;
  area: string;
  ids?: string;
}) {
  const offers = posts.filter(
    (p) =>
      p.businessId === b.id &&
      p.type === "offer" &&
      p.expiresAt &&
      p.expiresAt > new Date(),
  );
  const latest = posts.find((p) => p.businessId === b.id);
  return (
    <article className="panel comparison-card">
      <BusinessLogo business={b} />
      <h2 className="section">{b.name}</h2>
      <CompareToggle id={b.id} name={b.name} />
      <dl>
        <dt>Category</dt>
        <dd>{b.categoryName}</dd>
        <dt>Google rating and review count</dt>
        <dd>Not available · no Google data</dd>
        <dt>Management verification</dt>
        <dd>Not verified</dd>
        <dt>Latest post</dt>
        <dd>
          {latest?.publishedAt.toLocaleDateString("en-GB", {
            timeZone: "Africa/Lagos",
          }) ?? "Unknown"}
        </dd>
        <dt>Current offers</dt>
        <dd>{offers.length}</dd>
        <dt>Listed price</dt>
        <dd>{money(latest?.priceNaira ?? null)}</dd>
        <dt>Opening hours</dt>
        <dd>
          {b.presentation?.hours
            .map((h) => `${h.days}: ${h.opens}–${h.closes}`)
            .join("; ") ?? "Not listed"}
        </dd>
        <dt>Distance</dt>
        <dd>Not available</dd>
      </dl>
      <div className="stack">
        <ButtonLink href={actionHref(prefix, "message", b, area)}>
          Message
        </ButtonLink>
        <ButtonLink
          variant="secondary"
          href={discoveryHref(prefix, `/b/${b.slug}`, area, ids)}
        >
          View profile
        </ButtonLink>
      </div>
    </article>
  );
}
export function ComparisonTable({
  businesses,
  posts,
  prefix,
  area,
  ids,
}: {
  businesses: BusinessRecord[];
  posts: PostRecord[];
  prefix: string;
  area: string;
  ids: string;
}) {
  const rows = [
    ["Category", (b: BusinessRecord) => b.categoryName],
    ["Google rating and review count", () => "Not available · no Google data"],
    ["Management verification", () => "Not verified"],
    [
      "Latest post",
      (b: BusinessRecord) =>
        posts
          .find((p) => p.businessId === b.id)
          ?.publishedAt.toLocaleDateString("en-GB", {
            timeZone: "Africa/Lagos",
          }) ?? "Unknown",
    ],
    [
      "Current offers",
      (b: BusinessRecord) =>
        `${posts.filter((p) => p.businessId === b.id && p.type === "offer" && p.expiresAt && p.expiresAt > new Date()).length}`,
    ],
    [
      "Listed price",
      (b: BusinessRecord) =>
        money(posts.find((p) => p.businessId === b.id)?.priceNaira ?? null),
    ],
    [
      "Opening hours",
      (b: BusinessRecord) =>
        b.presentation?.hours
          .map((h) => `${h.days}: ${h.opens}–${h.closes}`)
          .join("; ") ?? "Not listed",
    ],
    ["Distance", () => "Not available"],
  ] as const;
  return (
    <table className="comparison-table">
      <caption>Available facts, with no overall quality ranking</caption>
      <thead>
        <tr>
          <th scope="col">Compare by</th>
          {businesses.map((b) => (
            <th scope="col" key={b.id}>
              <BusinessLogo business={b} />
              {b.name}
              <CompareToggle id={b.id} name={b.name} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            {businesses.map((b) => (
              <td key={b.id}>{value(b)}</td>
            ))}
          </tr>
        ))}
        <tr>
          <th scope="row">Your next step</th>
          {businesses.map((b) => (
            <td key={b.id}>
              <div className="stack">
                <ButtonLink href={actionHref(prefix, "message", b, area)}>
                  Message
                </ButtonLink>
                <ButtonLink
                  variant="secondary"
                  href={discoveryHref(prefix, `/b/${b.slug}`, area, ids)}
                >
                  View profile
                </ButtonLink>
              </div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
