import Link from "next/link";
import { MessageCircle, Heart } from "lucide-react";
import { Badge, ButtonLink, CategoryArt, DevelopmentNotice } from "./ui/core";
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
}: {
  business: BusinessRecord;
  posts: PostRecord[];
  prefix: string;
  area: string;
  ids?: string;
  featured?: boolean;
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
          <CategoryArt category={business.icon} name={business.name} />
          <div className="feature-body">
            <DevelopmentNotice compact />
            <h3>{business.name}</h3>
            <p className="muted">{business.neighbourhood}</p>
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
        <CategoryArt category={business.icon} name={business.name} />
        <div className="business-summary-text">
          <DevelopmentNotice compact />
          <h3>{business.name}</h3>
          <p>
            {business.categoryName} · {business.neighbourhood}
          </p>
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
export function PostCard({
  post,
  business,
  prefix,
  area,
  ids = "",
}: {
  post: PostRecord;
  business: BusinessRecord;
  prefix: string;
  area: string;
  ids?: string;
}) {
  const expired = !!post.expiresAt && post.expiresAt <= new Date();
  return (
    <article className="post-card">
      <div className="post-top">
        <CategoryArt category={business.icon} name={business.name} />
        <div>
          <Link href={discoveryHref(prefix, `/b/${business.slug}`, area, ids)}>
            {business.name}
          </Link>
          <div>
            <DevelopmentNotice compact /> ·{" "}
            <span className="caption muted">
              Sample post ·{" "}
              {post.publishedAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                timeZone: "Africa/Lagos",
              })}
            </span>
          </div>
        </div>
      </div>
      <Link
        href={discoveryHref(prefix, `/posts/${post.id}`, area, ids)}
        aria-label={`View ${post.title}`}
      >
        <CategoryArt category={business.icon} name={post.title} />
      </Link>
      <div className="post-body">
        <Badge tone={post.type === "offer" ? "offer" : "neutral"}>
          {typeLabels[post.type]}
        </Badge>
        <h2>
          <Link href={discoveryHref(prefix, `/posts/${post.id}`, area, ids)}>
            {post.title}
          </Link>
        </h2>
        <p>{post.description}</p>
        {post.priceNaira !== null && (
          <>
            <p className="price">{money(post.priceNaira)}</p>
            <p className="caption">Fictional development price · not a quote</p>
          </>
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
      <DevelopmentNotice compact />
      <CategoryArt category={b.icon} name={b.name} />
      <h2 className="section">{b.name}</h2>
      <CompareToggle id={b.id} name={b.name} />
      <dl>
        <dt>Category</dt>
        <dd>{b.categoryName}</dd>
        <dt>Google rating and review count</dt>
        <dd>Not available · no Google data</dd>
        <dt>Management verification</dt>
        <dd>Not verified · fictional business</dd>
        <dt>Latest sample post</dt>
        <dd>
          {latest?.publishedAt.toLocaleDateString("en-GB", {
            timeZone: "Africa/Lagos",
          }) ?? "Unknown"}
        </dd>
        <dt>Current sample offers</dt>
        <dd>{offers.length} · fictional, not live activity</dd>
        <dt>Sample price</dt>
        <dd>{money(latest?.priceNaira ?? null)}</dd>
        <dt>Hours and distance</dt>
        <dd>Unknown</dd>
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
    ["Management verification", () => "Not verified · fictional business"],
    [
      "Latest sample post",
      (b: BusinessRecord) =>
        posts
          .find((p) => p.businessId === b.id)
          ?.publishedAt.toLocaleDateString("en-GB", {
            timeZone: "Africa/Lagos",
          }) ?? "Unknown",
    ],
    [
      "Current sample offers",
      (b: BusinessRecord) =>
        `${posts.filter((p) => p.businessId === b.id && p.type === "offer" && p.expiresAt && p.expiresAt > new Date()).length} · fictional, not live activity`,
    ],
    [
      "Sample price",
      (b: BusinessRecord) =>
        money(posts.find((p) => p.businessId === b.id)?.priceNaira ?? null),
    ],
    ["Hours and distance", () => "Unknown"],
  ] as const;
  return (
    <table className="comparison-table">
      <caption>
        Development data · available facts, with no overall quality ranking
      </caption>
      <thead>
        <tr>
          <th scope="col">Compare by</th>
          {businesses.map((b) => (
            <th scope="col" key={b.id}>
              <CategoryArt category={b.icon} name={b.name} />
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
