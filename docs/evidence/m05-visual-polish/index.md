# M0.5 visual review screenshots

16 November 2026. Captured from the local application using the ten enriched, persisted fictional businesses and twenty structured posts in disposable PostgreSQL. These are not captures of the deployed Vercel site or the shared Supabase database. Fixture IDs and namespace are unchanged.

[390 px first-screen overview](mobile-overview.png) · [acceptance report](../../M05_VISUAL_POLISH_ACCEPTANCE.md) · [screen checks](screens.json) · [populated performance](performance.json)

Each capture is full-page. Intentionally swipeable category rows, galleries and mobile comparison panels stay contained; there is no horizontal page overflow. The gallery is shown in its normal page state; keyboard dialog navigation is covered by browser tests.

| Screen | 320 px | 390 px | 768 px | 1280 px |
| --- | --- | --- | --- | --- |
| Explore | [View](explore-320.png) | [View](explore-390.png) | [View](explore-768.png) | [View](explore-1280.png) |
| Feed | [View](feed-320.png) | [View](feed-390.png) | [View](feed-768.png) | [View](feed-1280.png) |
| Search: post content | [View](search-320.png) | [View](search-390.png) | [View](search-768.png) | [View](search-1280.png) |
| Solar category | [View](category-320.png) | [View](category-390.png) | [View](category-768.png) | [View](category-1280.png) |
| Profile: About | [View](profile-320.png) | [View](profile-390.png) | [View](profile-768.png) | [View](profile-1280.png) |
| Profile: Offers and posts | [View](profile-posts-320.png) | [View](profile-posts-390.png) | [View](profile-posts-768.png) | [View](profile-posts-1280.png) |
| Profile: Products and services | [View](products-320.png) | [View](products-390.png) | [View](products-768.png) | [View](products-1280.png) |
| Profile: Gallery | [View](gallery-320.png) | [View](gallery-390.png) | [View](gallery-768.png) | [View](gallery-1280.png) |
| Profile: Reviews (Google unavailable) | [View](profile-reviews-320.png) | [View](profile-reviews-390.png) | [View](profile-reviews-768.png) | [View](profile-reviews-1280.png) |
| Profile: Details | [View](details-320.png) | [View](details-390.png) | [View](details-768.png) | [View](details-1280.png) |
| Event post detail | [View](event-320.png) | [View](event-390.png) | [View](event-768.png) | [View](event-1280.png) |
| Portfolio post detail | [View](portfolio-320.png) | [View](portfolio-390.png) | [View](portfolio-768.png) | [View](portfolio-1280.png) |
| Two-business comparison | [View](compare-two-320.png) | [View](compare-two-390.png) | [View](compare-two-768.png) | [View](compare-two-1280.png) |
| Three-business comparison | [View](compare-three-320.png) | [View](compare-three-390.png) | [View](compare-three-768.png) | [View](compare-three-1280.png) |
| Shared component gallery | [View](design-320.png) | [View](design-390.png) | [View](design-768.png) | [View](design-1280.png) |

All 60 screen/viewport checks recorded zero broken images, zero horizontal page overflow and zero Axe violations. These automated checks do not replace a human screen-reader audit. The intentional [image unavailable state at 390 px](media-error-390.png) is a separate negative-path capture; reloading after the image request is restored recovers the photograph.

The quiet staging/demo disclosure is outside main content near the page footer. Cards do not repeat fictional/sample labels. No business is given a verified badge, Google rating, customer review or engagement count.

Founder visual approval is pending. No staging/main merge or deployment is included.
