import {
  BusinessLogo,
  BusinessCover,
  BusinessGallery,
  SocialLinks,
  ProductImage,
  BusinessIdentity,
  PostMediaGallery,
} from "@/components/business-media";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { Sun, ArrowRight, Plus, MessageCircle, Bookmark } from "lucide-react";
import {
  BackLink,
  Badge,
  ButtonLink,
  CategoryIcon,
  PageHeading,
  SearchBar,
  StateCard,
} from "@/components/ui/core";
import { Sheet } from "@/components/ui/dialog";
import {
  AreaPicker,
  CompareToggle,
  CompareTray,
  RefreshButton,
  ShareButton,
} from "@/components/discovery-interactions";
import {
  BusinessCard,
  PostCard,
  ComparisonCard,
  ComparisonTable,
  actionHref,
  discoveryHref,
} from "@/components/discovery-cards";
import {
  parseFilters,
  comparisonIds,
  money,
  typeLabels,
  type Query,
  type DiscoveryData,
  type Filters,
  type BusinessRecord,
} from "@/lib/discovery";
import { safeReturnPath } from "@/lib/navigation";
import { getRuntime } from "@/server/runtime";
import { readPrototype } from "@/server/prototype-repository";
import { type Principal, requirePrincipal } from "@/server/authorization";
import { AppError } from "@/server/errors";

const routes = [
  "",
  "location",
  "search",
  "feed",
  "compare",
  "messages",
  "notifications",
  "following",
  "action",
  "b",
  "posts",
  "explore",
];
function suffix(query: Query) {
  const result = new URLSearchParams();
  for (const [k, v] of Object.entries(query))
    if (typeof v === "string") result.set(k, v);
  return result.size ? `?${result}` : "";
}
function FiltersForm({
  filters,
  prefix,
  category = false,
  data,
}: {
  filters: Filters;
  prefix: string;
  category?: boolean;
  data: DiscoveryData;
}) {
  return (
    <form action={`${prefix}/search`} className="filters-grid">
      <input type="hidden" name="q" value={filters.q} />
      <input type="hidden" name="ids" value={filters.ids} />
      <div className="stack">
        <label htmlFor="filter-area">Area</label>
        <select id="filter-area" name="area" defaultValue={filters.area}>
          <option value="Uyo">Uyo</option>
          <option value="Eket">Eket</option>
        </select>
      </div>
      {!category && (
        <div className="stack">
          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            name="category"
            defaultValue={filters.category}
          >
            <option value="">All categories</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="stack">
        <label htmlFor="filter-type">Post type</label>
        <select id="filter-type" name="type" defaultValue={filters.type}>
          <option value="">All types</option>
          {Object.entries(typeLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="stack">
        <label htmlFor="filter-sort">Sort by</label>
        <select id="filter-sort" name="sort" defaultValue={filters.sort}>
          <option value="name">Business name A–Z</option>
          <option value="newest">Newest business</option>
          <option value="active">Latest post</option>
        </select>
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          name="offers"
          value="yes"
          defaultChecked={filters.offers === "yes"}
        />
        Current offers only
      </label>
      <button className="button" type="submit">
        Apply filters
      </button>
    </form>
  );
}
function EmptyDiscovery({
  area,
  prefix,
  query = "",
}: {
  area: string;
  prefix: string;
  query?: string;
}) {
  return (
    <StateCard
      title="No matching businesses yet"
      href={`${prefix}/location?next=${encodeURIComponent(prefix || "/")}`}
      action="Change area"
    >
      We don&apos;t have verified businesses matching{" "}
      {query ? `“${query}”` : "this search"} in {area} yet. Try another area or
      a wider category.
    </StateCard>
  );
}
function Cards({
  data,
  prefix,
  filters,
}: {
  data: DiscoveryData;
  prefix: string;
  filters: Filters;
}) {
  return (
    <div className="business-grid">
      {data.businesses.map((b) => (
        <BusinessCard
          key={b.id}
          business={b}
          posts={data.posts}
          prefix={prefix}
          area={filters.area}
          ids={filters.ids}
        />
      ))}
    </div>
  );
}
function Explore({
  data,
  prefix,
  filters,
}: {
  data: DiscoveryData;
  prefix: string;
  filters: Filters;
}) {
  const solar = data.businesses.filter((b) => b.categoryId === "solar");
  const currentOffers = data.posts.filter(
    (p) => p.type === "offer" && p.expiresAt && p.expiresAt > new Date(),
  );
  return (
    <>
      <div className="search-sticky">
        <h1 className="sr-only">Explore businesses in {filters.area}</h1>
        <SearchBar prefix={prefix} area={filters.area} />
        {data.categories.length > 0 && (
          <div className="category-row" aria-label="Business categories">
            {[...data.categories]
              .sort((a, b) =>
                a.id === "solar"
                  ? -1
                  : b.id === "solar"
                    ? 1
                    : a.name.localeCompare(b.name),
              )
              .map((c) => (
                <Link
                  key={c.id}
                  className="chip"
                  href={discoveryHref(
                    prefix,
                    `/explore/${c.id}`,
                    filters.area,
                    filters.ids,
                  )}
                >
                  <CategoryIcon category={c.icon} />
                  {c.name}
                </Link>
              ))}
          </div>
        )}
      </div>
      {data.businesses.length === 0 ? (
        <EmptyDiscovery area={filters.area} prefix={prefix} />
      ) : (
        <>
          {solar.length >= 3 && (
            <section className="showcase">
              <div className="section-head">
                <div>
                  <p className="eyebrow">A little side by side</p>
                  <h2>Compare solar installers in {filters.area}</h2>
                  <p className="small muted">
                    Explore the differences. Choose what fits.
                  </p>
                </div>
                <Sun aria-hidden="true" />
              </div>
              <div className="feature-grid">
                {solar.slice(0, 3).map((b, i) => (
                  <BusinessCard
                    key={b.id}
                    business={b}
                    posts={data.posts}
                    prefix={prefix}
                    area={filters.area}
                    ids={filters.ids}
                    featured
                    priority={i === 0}
                  />
                ))}
              </div>
              <div className="flex-wrap section">
                <ButtonLink
                  href={`${prefix}/compare?area=${filters.area}&ids=${solar
                    .slice(0, 3)
                    .map((b) => b.id)
                    .join(",")}`}
                >
                  Compare these three
                  <ArrowRight aria-hidden="true" />
                </ButtonLink>
                <span className="caption muted">
                  No overall quality ranking
                </span>
              </div>
            </section>
          )}
          {currentOffers.length >= 3 && (
            <section className="section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Something worth a look</p>
                  <h2>New offers</h2>
                </div>
                <Link href={`${prefix}/search?area=${filters.area}&offers=yes`}>
                  See all
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
              <div className="business-grid">
                {currentOffers.slice(0, 3).map((post) => {
                  const b = data.businesses.find(
                    (b) => b.id === post.businessId,
                  )!;
                  return (
                    <article key={post.id} className="panel">
                      <PostMediaGallery post={post} />
                      <Badge tone="offer">Offer</Badge>
                      <h3>
                        <Link
                          href={discoveryHref(
                            prefix,
                            `/posts/${post.id}`,
                            filters.area,
                            filters.ids,
                          )}
                        >
                          {post.title}
                        </Link>
                      </h3>
                      <BusinessIdentity
                        business={b}
                        href={discoveryHref(
                          prefix,
                          `/b/${b.slug}`,
                          filters.area,
                          filters.ids,
                        )}
                      />
                      <p className="small muted">{post.description}</p>
                      <p className="price">{money(post.priceNaira)}</p>
                      <p className="caption muted">
                        Ends{" "}
                        {post.expiresAt?.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Africa/Lagos",
                        })}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          {["Just joined", "Recently active"].map(
            (section) =>
              data.businesses.length >= 3 && (
                <section className="section" key={section}>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">
                        {section === "Just joined"
                          ? "Profile dates"
                          : "Post dates"}
                      </p>
                      <h2>{section}</h2>
                    </div>
                    <Link
                      href={`${prefix}/search?area=${filters.area}&sort=${section === "Just joined" ? "newest" : "active"}`}
                    >
                      See all
                    </Link>
                  </div>
                  <div className="feature-grid">
                    {[...data.businesses]
                      .sort((a, b) =>
                        section === "Just joined"
                          ? b.createdAt.getTime() - a.createdAt.getTime()
                          : (data.posts
                              .find((p) => p.businessId === b.id)
                              ?.publishedAt.getTime() ?? 0) -
                            (data.posts
                              .find((p) => p.businessId === a.id)
                              ?.publishedAt.getTime() ?? 0),
                      )
                      .slice(0, 3)
                      .map((b) => (
                        <BusinessCard
                          key={b.id}
                          business={b}
                          posts={data.posts}
                          prefix={prefix}
                          area={filters.area}
                          ids={filters.ids}
                          featured
                        />
                      ))}
                  </div>
                </section>
              ),
          )}
          <section className="section">
            <div className="section-head">
              <h2>All businesses in {filters.area}</h2>
              <span className="small muted">
                {data.businesses.length} businesses
              </span>
            </div>
            <Cards data={data} prefix={prefix} filters={filters} />
          </section>
        </>
      )}
      <section className="panel section">
        <p className="eyebrow">For our local business owners</p>
        <h2>Own a business?</h2>
        <p className="muted">
          Get your free Jado page. A Google Business Profile and authorised
          management access are required.
        </p>
        <ButtonLink variant="secondary" href="/my-business">
          Add your business
          <ArrowRight aria-hidden="true" />
        </ButtonLink>
      </section>
    </>
  );
}
function SearchScreen({
  data,
  all,
  prefix,
  filters,
  categoryName,
}: {
  data: DiscoveryData;
  all: DiscoveryData;
  prefix: string;
  filters: Filters;
  categoryName?: string;
}) {
  return (
    <>
      <BackLink
        href={discoveryHref(prefix, "", filters.area, filters.ids) || "/"}
      />
      <PageHeading
        eyebrow={categoryName ? "Explore a category" : "Find what you need"}
        title={categoryName || "Search businesses"}
      />
      <div className="search-sticky">
        <SearchBar
          area={filters.area}
          q={filters.q}
          prefix={prefix}
          category={filters.category}
        />
      </div>
      <div className="filter-summary">
        <p className="small">
          {data.businesses.length} {prefix ? "fictional " : ""}results ·{" "}
          {filters.area}
        </p>
        <Sheet title="Refine your search" trigger="Filters">
          <FiltersForm filters={filters} prefix={prefix} data={all} />
        </Sheet>
      </div>
      <p className="caption muted">
        {filters.sort === "name"
          ? "Business name A–Z"
          : filters.sort === "newest"
            ? "Newest business first"
            : "Latest post first"}{" "}
        · Matches describe published content, not stock availability.
      </p>
      {data.businesses.length ? (
        <Cards data={data} prefix={prefix} filters={filters} />
      ) : (
        <EmptyDiscovery prefix={prefix} area={filters.area} query={filters.q} />
      )}
    </>
  );
}
function BusinessProfile({
  business,
  data,
  prefix,
  filters,
  query,
}: {
  business: BusinessRecord;
  data: DiscoveryData;
  prefix: string;
  filters: Filters;
  query: Query;
}) {
  const tab = typeof query.tab === "string" ? query.tab : "about";
  const tabs = [
    ["about", "About"],
    ["posts", "Offers and posts"],
    ["products", "Products and services"],
    ["gallery", "Gallery"],
    ["reviews", "Reviews (Google)"],
    ["details", "Details"],
  ];
  if (!tabs.some((t) => t[0] === tab)) notFound();
  const posts = data.posts.filter((p) => p.businessId === business.id);
  return (
    <>
      <BackLink
        href={discoveryHref(prefix, "", filters.area, filters.ids) || "/"}
      />
      <div className="profile-layout">
        <div>
          <div className="profile-cover">
            <BusinessCover business={business} eager />
          </div>
          <div className="profile-intro">
            <BusinessLogo business={business} large />
            <PageHeading title={business.name}>
              <p>
                {business.categoryName} · {business.neighbourhood},{" "}
                {business.city}
              </p>
            </PageHeading>
            <SocialLinks business={business} />
            <div className="flex-wrap">
              <ButtonLink
                variant="secondary"
                href={actionHref(prefix, "follow", business, filters.area)}
              >
                <Bookmark aria-hidden="true" />
                Follow
              </ButtonLink>
              <CompareToggle id={business.id} name={business.name} />
              <ShareButton />
            </div>
          </div>
          <nav className="profile-tabs" aria-label="Business sections">
            {tabs.map(([id, label]) => (
              <Link
                key={id}
                className={`chip ${tab === id ? "selected" : ""}`}
                href={`${discoveryHref(prefix, `/b/${business.slug}`, filters.area, filters.ids)}&tab=${id}`}
                aria-current={tab === id ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <section className="panel">
            {tab === "about" ? (
              <>
                <h2>A little about {business.name}</h2>
                <p>{business.presentation?.about ?? business.description}</p>
                <h3 className="section">A closer look</h3>
                <BusinessGallery business={business} />
                <div className="flex-wrap">
                  {business.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </>
            ) : tab === "posts" ? (
              <>
                <h2>Offers and posts</h2>
                <div className="post-feed">
                  {posts.map((p) => (
                    <PostCard
                      key={p.id}
                      post={p}
                      business={business}
                      prefix={prefix}
                      area={filters.area}
                      ids={filters.ids}
                    />
                  ))}
                </div>
              </>
            ) : tab === "products" ? (
              <>
                <h2>Products and services</h2>
                <div className="product-grid">
                  {business.presentation?.services.map((service) => (
                    <article className="product-card" key={service.title}>
                      <ProductImage photo={service.image} />
                      <div className="product-body">
                        <h3>{service.title}</h3>
                        <p className="small muted">{service.description}</p>
                        <p className="price">{money(service.priceNaira)}</p>
                        <ButtonLink
                          href={actionHref(
                            prefix,
                            "message",
                            business,
                            filters.area,
                          )}
                        >
                          Ask about this
                        </ButtonLink>
                      </div>
                    </article>
                  )) ??
                    posts
                      .filter((p) => p.type !== "offer")
                      .map((p) => (
                        <div key={p.id}>
                          <h3>{p.title}</h3>
                          <p>{money(p.priceNaira)}</p>
                        </div>
                      ))}
                </div>
                <p className="muted">
                  A mention isn&apos;t a promise of stock. Ask the business
                  about availability.
                </p>
              </>
            ) : tab === "gallery" ? (
              <>
                <h2>Gallery</h2>
                <BusinessGallery business={business} />
              </>
            ) : tab === "reviews" ? (
              <>
                <h2>Google reviews</h2>
                <p>
                  Not available. This fictional business has no Google listing
                  or genuine reviews. Jado does not collect customer ratings.
                </p>
              </>
            ) : (
              <>
                <h2>Business details</h2>
                <ul className="details-list">
                  {[
                    ["Business name", business.name],
                    ["Address", business.presentation?.address],
                    [
                      "Opening hours",
                      business.presentation?.hours
                        .map((h) => `${h.days}: ${h.opens}–${h.closes}`)
                        .join("; "),
                    ],
                    ["Phone", business.presentation?.phone],
                    ["Website", business.presentation?.website],
                    ["Email", business.presentation?.email],
                    ["Distance", null],
                  ].map(([label, value]) => (
                    <li key={label}>
                      <strong>{label}</strong>
                      <span>{value ?? "Not listed"}</span>
                    </li>
                  ))}
                </ul>
                <p className="caption muted">
                  Details provided for this business profile. Google information
                  is unavailable.
                </p>
                <Link href="/help">Report a concern</Link>
              </>
            )}
          </section>
        </div>
        <aside className="stack">
          <section className="panel">
            <h2 className="section">Let&apos;s talk about what you need.</h2>
            <p className="muted">
              Have a question? Start with the business on Jado.
            </p>
            <ButtonLink
              href={actionHref(prefix, "message", business, filters.area)}
            >
              <MessageCircle aria-hidden="true" />
              Message on Jado
            </ButtonLink>
          </section>
          <section className="panel">
            <h3>What does verified mean?</h3>
            <p className="small muted">
              Authorised business management access, checked through Google.
              This business has not been verified.
            </p>
            <Link className="text-link" href="/verification">
              Read about verification
            </Link>
          </section>
        </aside>
      </div>
      <div className="action-bar section">
        <ButtonLink
          href={actionHref(prefix, "message", business, filters.area)}
        >
          Message on Jado
        </ButtonLink>
        <Sheet title="Other contact options" trigger="More">
          <p>Message on Jado is the primary contact option.</p>
          <ShareButton />
          <Link className="text-link" href="/help">
            Get help
          </Link>
        </Sheet>
      </div>
    </>
  );
}
function Compare({
  data,
  prefix,
  filters,
}: {
  data: DiscoveryData;
  prefix: string;
  filters: Filters;
}) {
  const ids = comparisonIds(filters.ids);
  const selected = ids
    .map((id) => data.businesses.find((b) => b.id === id))
    .filter((b): b is BusinessRecord => !!b);
  if (selected.length !== ids.length)
    return (
      <StateCard
        title="One of those businesses isn't available"
        href={`${prefix}/compare?area=${filters.area}`}
        action="Choose businesses"
      >
        Clear the selection and choose from the available records.
      </StateCard>
    );
  const result = selected.length >= 2;
  return (
    <>
      <BackLink
        href={discoveryHref(prefix, "", filters.area, filters.ids) || "/"}
      />
      <PageHeading
        eyebrow="A clearer shortlist"
        title={result ? "Side by side, your way." : "Compare local businesses"}
      >
        <p>
          Choose two or three businesses. Compare available facts, then decide
          what fits.
        </p>
      </PageHeading>
      {!result ? (
        <>
          <div className="compare-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="compare-slot">
                {selected[i] ? (
                  <>
                    <BusinessIdentity business={selected[i]} heading />
                    <CompareToggle
                      id={selected[i].id}
                      name={selected[i].name}
                    />
                  </>
                ) : (
                  <>
                    <Plus aria-hidden="true" />
                    <h2>Business {i + 1}</h2>
                    <a href="#pick-businesses" className="text-link">
                      Choose a business
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="notice section">
            {selected.length === 1
              ? "One selected. Choose another to compare."
              : "Choose at least two businesses to view the comparison."}
          </p>
          <h2 className="section" id="pick-businesses">
            Choose from {filters.area}
          </h2>
          <Cards data={data} prefix={prefix} filters={filters} />
        </>
      ) : (
        <>
          {new Set(selected.map((b) => b.categoryId)).size > 1 && (
            <p className="notice">
              These businesses offer different kinds of services. Some details
              may not be comparable.
            </p>
          )}
          <div className="flex-wrap">
            <ShareButton label="Share on WhatsApp" whatsapp />
            <ShareButton />
            <ButtonLink
              href={`${prefix}/compare?area=${filters.area}`}
              variant="secondary"
            >
              Start again
            </ButtonLink>
          </div>
          <div className="desktop-comparison section">
            <ComparisonTable
              businesses={selected}
              posts={data.posts}
              prefix={prefix}
              area={filters.area}
              ids={filters.ids}
            />
          </div>
          <div className="compare-facts section">
            {selected.map((b) => (
              <ComparisonCard
                key={b.id}
                business={b}
                posts={data.posts}
                prefix={prefix}
                area={filters.area}
                ids={filters.ids}
              />
            ))}
          </div>
          <div className="section">
            <Sheet
              title="How Jado compares businesses"
              trigger="How Jado compares businesses"
            >
              <p>
                This comparison uses categories, listed prices, post dates and
                unexpired offers. Unknown facts stay unknown.
              </p>
              <p>
                Google ratings and response-time metrics are unavailable. There
                is no overall winner or quality score.
              </p>
            </Sheet>
          </div>
        </>
      )}
    </>
  );
}
export async function DiscoveryScreen({
  path = [],
  query = {},
}: {
  path?: string[];
  query?: Query;
}) {
  const prefix = "";
  const key = path[0] ?? "";
  if (!routes.includes(key)) notFound();
  const nextPath = `${prefix}/${path.join("/")}${suffix(query)}`.replace(
    /^\/\?/,
    "/?",
  );
  const principal: Principal | null = null;
  let filters: Filters;
  try {
    filters = parseFilters({
      ...query,
      category: key === "explore" ? path[1] : query.category,
    });
    comparisonIds(filters.ids);
  } catch {
    return (
      <StateCard
        title="Check your search"
        href={prefix || "/"}
        action="Start again"
      >
        Use a shorter search, a listed area, and no more than three different
        businesses.
      </StateCard>
    );
  }
  if (
    key === "location" ||
    (!filters.area &&
      ["", "search", "feed", "compare", "explore"].includes(key))
  ) {
    const raw =
      typeof query.next === "string"
        ? safeReturnPath(query.next)
        : prefix || "/";
    const next = raw;
    return (
      <div className="narrow">
        <BackLink href={prefix || "/"} />
        <PageHeading
          eyebrow="Your neighbourhood, your choice"
          title="Where are you looking?"
        />
        <AreaPicker next={next} prefix={prefix} current={filters.area} />
      </div>
    );
  }
  const { db } = getRuntime();
  const all = await readPrototype(db, parseFilters({ area: "Uyo" }));
  const data = await readPrototype(db, filters);

  let content;
  if (key === "")
    content = <Explore data={data} prefix={prefix} filters={filters} />;
  else if (key === "search" || key === "explore")
    content = (
      <SearchScreen
        data={data}
        all={all}
        prefix={prefix}
        filters={filters}
        categoryName={
          key === "explore"
            ? all.categories.find((c) => c.id === path[1])?.name
            : undefined
        }
      />
    );
  else if (key === "b") {
    const b = all.businesses.find((b) => b.slug === path[1]);
    if (!b) notFound();
    content = (
      <BusinessProfile
        business={b}
        data={all}
        prefix={prefix}
        filters={filters}
        query={query}
      />
    );
  } else if (key === "posts") {
    const post = all.posts.find((p) => p.id === path[1]);
    const b = all.businesses.find((b) => b.id === post?.businessId);
    if (!post || !b) notFound();
    content = (
      <>
        <BackLink
          href={discoveryHref(
            prefix,
            `/b/${b.slug}`,
            filters.area,
            filters.ids,
          )}
        />
        <h1>{post.title}</h1>
        <div className="post-feed">
          <PostCard
            business={b}
            post={post}
            priority
            prefix={prefix}
            area={filters.area}
          />
        </div>
      </>
    );
  } else if (key === "feed") {
    const type = filters.type;
    const posts = data.posts.filter(
      (p) =>
        (!type || p.type === type) &&
        (!p.expiresAt || p.expiresAt > new Date()),
    );
    content = (
      <>
        <BackLink href={discoveryHref(prefix, "", filters.area) || "/"} />
        <PageHeading
          eyebrow="What's happening nearby"
          title="From local businesses"
        />
        <div className="flex-wrap">
          <Badge>For you</Badge>
          {principal && (
            <ButtonLink
              variant="secondary"
              href={discoveryHref(prefix, "/following", filters.area)}
            >
              Following
            </ButtonLink>
          )}
          <RefreshButton />
        </div>
        <div className="category-row">
          {[["", "All posts"], ...Object.entries(typeLabels)].map(
            ([id, label]) => (
              <Link
                key={id}
                className={`chip ${type === id ? "selected" : ""}`}
                href={`${prefix}/feed?area=${filters.area}&type=${id}`}
              >
                {label}
              </Link>
            ),
          )}
        </div>
        {data.categories.length > 0 && (
          <div className="category-row" aria-label="Feed categories">
            <Link
              className={`chip ${!filters.category ? "selected" : ""}`}
              href={`${prefix}/feed?area=${filters.area}&type=${filters.type}`}
            >
              All categories
            </Link>
            {data.categories.map((c) => (
              <Link
                className={`chip ${filters.category === c.id ? "selected" : ""}`}
                key={c.id}
                href={`${prefix}/feed?area=${filters.area}&type=${filters.type}&category=${c.id}`}
              >
                <CategoryIcon category={c.icon} />
                {c.name}
              </Link>
            ))}
          </div>
        )}
        <p className="caption muted">
          Newest posts first · no engagement boost or live ranking.
        </p>
        <div className="post-feed">
          {posts.length ? (
            posts.map((p, i) => (
              <PostCard
                key={p.id}
                post={p}
                priority={i === 0}
                business={data.businesses.find((b) => b.id === p.businessId)!}
                prefix={prefix}
                area={filters.area}
              />
            ))
          ) : (
            <StateCard title="No business posts yet" href={prefix || "/"}>
              Try another area or post type.
            </StateCard>
          )}
        </div>
      </>
    );
  } else if (key === "compare")
    content = <Compare data={all} prefix={prefix} filters={filters} />;
  else if (["messages", "notifications", "following", "action"].includes(key)) {
    let viewer: Principal | null = principal;
    if (!viewer) {
      try {
        const { db, auth } = getRuntime();
        viewer = await requirePrincipal(db, auth, await headers());
      } catch (e) {
        if (e instanceof AppError && e.status === 401)
          redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
        throw e;
      }
    }
    const b = all.businesses.find((b) => b.id === query.business);
    const kind = z.enum(["message", "follow", "like"]).safeParse(query.kind);
    if (key === "action") {
      if (!b || !kind.success) notFound();
      content = (
        <>
          <BackLink
            href={discoveryHref(prefix, `/b/${b.slug}`, filters.area)}
          />
          <PageHeading
            eyebrow="Your sign-in is complete"
            title={
              kind.data === "message"
                ? `Message ${b.name}`
                : kind.data === "follow"
                  ? `Follow ${b.name}`
                  : `Like ${b.name}'s post`
            }
          />
          <StateCard
            title={
              kind.data === "message"
                ? "Messaging isn't connected yet"
                : "This interaction isn't connected yet"
            }
            href={discoveryHref(prefix, `/b/${b.slug}`, filters.area)}
            action="Back to the business"
          >
            Your intended business{query.post ? " and post" : ""} have been
            preserved.{" "}
            {kind.data === "message"
              ? "No message has been sent. Messaging arrives in M4."
              : "No follow or like was recorded. These actions arrive in M3."}
          </StateCard>
        </>
      );
    } else
      content = (
        <>
          <BackLink href={prefix || "/"} />
          <PageHeading
            title={
              key === "messages"
                ? "Your messages"
                : key === "following"
                  ? "Following"
                  : "Notifications"
            }
          />
          <StateCard
            title={
              key === "messages"
                ? "No messages yet"
                : key === "following"
                  ? "Follow businesses to see their updates here"
                  : "You're all caught up"
            }
            href={discoveryHref(prefix, "", filters.area) || "/"}
            action="Explore businesses"
          >
            {key === "messages"
              ? "Message history and sending are not connected in this prototype. No conversation has been created."
              : key === "following"
                ? "Following is not connected in M0.5. You can browse business pages now."
                : "No real notifications are available. Notification delivery is not connected."}
          </StateCard>
        </>
      );
  }
  return (
    <>
      {content}
      {all.businesses.length > 0 && (
        <CompareTray
          businesses={all.businesses.map((b) => ({ id: b.id, name: b.name }))}
          prefix={prefix}
        />
      )}
    </>
  );
}
