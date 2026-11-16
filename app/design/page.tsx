import {
  BusinessLogo,
  BusinessCover,
  BusinessAvatar,
  BusinessIdentity,
  BusinessGallery,
  SocialLinks,
  PostMediaGallery,
} from "@/components/business-media";
import {
  BackLink,
  Badge,
  Button,
  CardSkeleton,
  CategoryArt,
  LocationChip,
  PageHeading,
  SearchBar,
  StateCard,
  VerifiedBadge,
  StatTile,
  StepIndicator,
  LogoTile,
} from "@/components/ui/core";
import { SignInForm } from "@/components/sign-in-form";
import { Sheet } from "@/components/ui/dialog";
import {
  BusinessCard,
  PostCard,
  ComparisonCard,
  ComparisonTable,
} from "@/components/discovery-cards";
import { readPrototype } from "@/server/prototype-repository";
import { getRuntime } from "@/server/runtime";
import { parseFilters } from "@/lib/discovery";
export const dynamic = "force-dynamic";
export default async function Design() {
  const data = await readPrototype(
    getRuntime().db,
    parseFilters({ area: "Uyo" }),
  );
  return (
    <>
      <BackLink href="/" />
      <PageHeading
        eyebrow="M0.5 · component library"
        title="Made for the neighbourhood."
      >
        <p>Shared patterns, clear states and a warm, practical foundation.</p>
      </PageHeading>
      <div className="gallery-grid">
        <section className="panel">
          <h2>Actions</h2>
          <Sheet title="Sign in to continue" trigger="Preview sign-in gate">
            <p>
              Existing development accounts only. Google and email registration
              are not connected.
            </p>
            <SignInForm next="/account" />
          </Sheet>
          <div className="flex-wrap">
            <Button>Message on Jado</Button>
            <Button variant="secondary">Compare</Button>
            <Button variant="ghost">Share</Button>
            <Button variant="destructive">Remove</Button>
            <Button variant="whatsapp">WhatsApp</Button>
            <Button disabled>Unavailable</Button>
            <Button disabled aria-busy="true">
              Saving…
            </Button>
          </div>
          <p className="muted">
            Tab to inspect focus. Press and hover states share the same tokens.
          </p>
        </section>
        <section className="panel">
          <h2>Find your next connection</h2>
          <LocationChip area="Uyo" href="/location" />
          <SearchBar prefix="" area="Uyo" />
          <label htmlFor="gallery-name">Business name</label>
          <input id="gallery-name" placeholder="Name" />
          <label htmlFor="gallery-notes">Notes</label>
          <textarea id="gallery-notes" />
          <label htmlFor="gallery-category">Category</label>
          <select id="gallery-category">
            <option>Solar and power</option>
          </select>
          <label className="check-label">
            <input type="checkbox" />
            Compare this business
          </label>
          <input
            aria-label="Example with error"
            aria-invalid="true"
            aria-describedby="gallery-error"
            defaultValue=""
          />
          <p id="gallery-error" className="form-error">
            Enter a business name.
          </p>
        </section>
        <section className="panel">
          <h2>Labels, never promises</h2>
          <div className="flex-wrap">
            <Badge>Service</Badge>
            <Badge tone="offer">Offer</Badge>
            <Badge tone="warning">Pending</Badge>
            <Badge>Expired</Badge>
          </div>
          <p>Genuine ownership badge specification (component sample only):</p>
          <VerifiedBadge />
          <p className="muted">Never used on fictional business cards.</p>
          <Sheet title="Verified on Jado" trigger="What does verified mean?">
            <p>
              The owner has proven they manage this business on Google. It does
              not guarantee the quality of their service.
            </p>
          </Sheet>
        </section>
        <section className="panel">
          <h2>Category fallback</h2>
          <LogoTile category="solar" name="Category placeholder" />
          <CategoryArt category="solar" name="No business photo" />
          <p className="muted">
            Category illustrations replace unavailable photos. Logos are
            contained, never cropped.
          </p>
        </section>
        <section className="panel">
          <h2>Loading</h2>
          <CardSkeleton />
          <CardSkeleton />
        </section>
        <section className="panel">
          <h2>Type and currency</h2>
          <h3>Good businesses, close to you.</h3>
          <p>Inter · ₦1,250,000</p>
          <h3>₦1,250,000</h3>
          <p className="muted">
            16px inputs · visible labels · 44px minimum targets.
          </p>
        </section>
      </div>
      <h2>Workspace patterns</h2>
      <div className="gallery-grid">
        <StatTile label="Profile views" />
        <StepIndicator
          steps={[
            "Find your business",
            "Confirm",
            "Prove management access",
            "Complete your page",
          ]}
        />
      </div>
      <h2>Business identity and media</h2>
      {data.businesses[0] && (
        <section className="panel stack">
          <BusinessLogo business={data.businesses[0]} large />
          <BusinessAvatar business={data.businesses[0]} />
          <BusinessIdentity business={data.businesses[0]} heading />
          <BusinessCover business={data.businesses[0]} />
          <BusinessGallery business={data.businesses[0]} />
          <SocialLinks business={data.businesses[0]} />
        </section>
      )}
      <div className="gallery-grid">
        {[1, 2, 3, 4, 5].map((count) => {
          const post = data.posts.find(
            (p) => (p.presentation?.media.length ?? 0) >= count,
          );
          return (
            post && (
              <section className="panel" key={count}>
                <h3>{count}-image layout</h3>
                <PostMediaGallery
                  post={{
                    ...post,
                    type: "portfolio",
                    presentation: {
                      ...post.presentation!,
                      media: post.presentation!.media.slice(0, count),
                    },
                  }}
                />
              </section>
            )
          );
        })}
      </div>
      <h2>Database-backed domain components</h2>
      {data.businesses.length > 1 && (
        <div className="gallery-table">
          <ComparisonTable
            businesses={data.businesses.slice(0, 2)}
            posts={data.posts}
            prefix=""
            area="Uyo"
            ids=""
          />
        </div>
      )}
      {data.businesses[0] && (
        <div className="gallery-grid">
          <ComparisonCard
            business={data.businesses[0]}
            posts={data.posts}
            prefix=""
            area="Uyo"
          />
          <BusinessCard
            business={data.businesses[0]}
            posts={data.posts}
            prefix=""
            area="Uyo"
          />
          <BusinessCard
            business={data.businesses[0]}
            posts={data.posts}
            prefix=""
            area="Uyo"
            featured
          />
          {data.posts.find((p) => p.businessId === data.businesses[0].id) && (
            <PostCard
              post={data.posts.find(
                (p) => p.businessId === data.businesses[0].id,
              )!}
              business={data.businesses[0]}
              prefix=""
              area="Uyo"
            />
          )}
        </div>
      )}
      <div className="gallery-grid">
        {[
          ["No matches yet", "Try another area or a wider category.", "empty"],
          [
            "Can't connect right now",
            "Check your data and try again.",
            "error",
          ],
          [
            "Sign in to continue",
            "We'll bring you right back.",
            "unauthorized",
          ],
          [
            "This account is unavailable",
            "Contact support for help.",
            "suspended",
          ],
        ].map(([title, body, kind]) => (
          <StateCard key={kind} title={title} kind={kind} href="/">
            {body}
          </StateCard>
        ))}
      </div>
    </>
  );
}
