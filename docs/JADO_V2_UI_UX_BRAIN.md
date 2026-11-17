# Jado v2: UI/UX Brain

**Status:** Binding design and experience spec · founder decisions consolidated 16 November 2026
**Who reads this:** Codex or any AI agent or developer building Jado screens.
**Read order:** after the PRD and Screen Map, before writing any UI code.

## 0. How to use this document

1. **What vs how.** The PRD and Screen Map decide **what** exists and who can do what. This document decides **how it looks, feels and behaves**. If they conflict on behaviour, the PRD wins. If they conflict on look and feel, this file wins. If something is missing from both, ask the founder. Do not invent.
2. **Tokens first.** In M0.5, build design tokens (section 2), the shared components **needed for M0.5** (section 5) and a development-only `/design` gallery page showing their relevant states **before** building screens. Extend the gallery in later milestones as new functional components become in scope; do not implement all M1–M4 components during M0.5. Screens are assembled from the approved shared components.
3. **No hard-coded styling.** Colours, sizes, radii, spacing and fonts come only from tokens. This makes the later brand-identity swap a one-file change.
4. **Every milestone report** must include screenshots at 320, 390, 768 and 1280 px for each screen touched, plus the Screen Definition of Done checklist (section 11) ticked with evidence.
5. **This is a placeholder brand.** Jado has no formal identity yet (Webtellisense's Swagger service will produce one). Everything in section 2 and 3 is a deliberate, high-quality stand-in. Do not add decorative elements that would be hard to remove.
6. **Verification is the public-listing gate.** Only genuinely Jado-verified businesses appear in public discovery, feeds, rankings and comparisons. Google Places matches are search results in the **owner-claim flow**, not automatically published Jado listings. No unclaimed public directory.
7. **Prototype data is not public supply.** M0.5 uses exactly ten realistic but fictional business records and representative structured posts in a dedicated, reversible **development-only database seed**. They are stored in PostgreSQL and loaded normally by the UI so search, category, feed and comparison really work against data. Every demo surface prominently says "Development data"; never assert a demo Google authorization, badge, review or metric is real. The seeded records and any mock-verification statuses are disabled and excluded from public/staging-production builds. When no real verified businesses exist on a public environment, show an honest empty state.

## 1. Product feel: the one-paragraph brief

Jado should feel like **a fresh, friendly neighbour who knows every good business in town**. It is photo-led, quick and alive. People should see real businesses within a second of opening it, contact one in a tap, and find a reason to open it again tomorrow (an offer, a reply, a like). It is a **digital passport and manual** for business owners and a **trustworthy shortlist** for customers. It is not a corporate directory, a news portal, or a brand-statement page.

**Personality words:** fresh, warm, quick, honest, neighbourly, confident.
**Not:** corporate, cluttered, loud, gimmicky, cold, "startup-generic".

**Three-second rule:** on a 390 px wide phone, the first screen of Explore shows the location, search bar and the start of the first business card **whenever eligible records exist**, with no sign-in prompt and no marketing paragraph. At public launch, all displayed cards are genuinely verified. In the private M0.5 preview, clearly marked fictional seed records exercise the same component; when there are no eligible records, show an honest empty state rather than a fabricated card. Do not make impossible live-data acceptance promises before M1.

**Lessons from the competitors we studied (applied throughout):**
- Yelp: a live activity feel with timestamps; persistent search and location.
- Tripadvisor: photo-first ranked carousels, save hearts, rating and price on every card.
- PageMe: one-tap Call and WhatsApp on cards, open-now status, data-saver toggle.
- Ranked: transparent scoring and WhatsApp sharing on compare. Avoid its text walls.
- Creda: owner-friendly shareable page. Avoid letter-in-a-box placeholders and thin coverage that is visible.
- Connect Nigeria: what to avoid (ads, clutter, cropped logos, empty star rows, mixed verticals).

## 2. Placeholder brand identity

### 2.1 Name and wordmark
- Wordmark: lowercase **jado** followed by a coloured full stop: **jado.** Bold display font, dot in Sunrise Amber. This continues what is already on staging.
- App icon and avatar: rounded square, Ink background, Sunrise "j." mark.
- Tagline (use sparingly): "Good businesses, close to you."
- Do not use the old "Good businesses. Closer connections." as a hero. It may appear once, in About or the footer.

### 2.2 Colour (named so they are easy to swap later)
| Token | Hex | Use |
|---|---|---|
| `ink-900` | #1B1740 | Primary text, headings, ink buttons, focus ring |
| `ink-700` | #3B3766 | Strong secondary text |
| `ink-500` | #5E5B80 | Secondary text, placeholders (6.2:1 on page background) |
| `ink-400` | #8C8AA6 | Disabled and decorative only (below AA for text) |
| `sunrise-500` | #FFB020 | **Primary action fill**, brand accent |
| `sunrise-600` | #F29900 | Primary pressed and hover |
| `sunrise-100` | #FFF1D6 | Soft highlight backgrounds |
| `coral-600` | #D6382E | Offer ends soon, unread badge, destructive accents |
| `coral-100` | #FFE6E3 | Tint for coral |
| `teal-600` | #0A7D91 | **Verified on Jado** badge and trust elements only |
| `teal-100` | #DDF3F7 | Tint for verified |
| `whatsapp-600` | #0A7A3C | WhatsApp buttons and icon **only** (confirm 4.5:1 in code, darken if needed) |
| `bg` | #FFFBF5 | Page background (warm white) |
| `surface` | #FFFFFF | Cards, sheets, inputs |
| `sand-100` | #F6EFE3 | Subtle sections, chips, skeleton base |
| `border` | #E9E1D3 | Hairlines and card borders |
| `success-text` / `success-bg` | #17703D / #E4F5EA | Success messages |
| `warning-text` / `warning-bg` | #8A5200 / #FFF1D6 | Warnings, pending states |
| `danger-text` | #B42318 | Errors |

**Colour rules**
- **Amber is the action colour.** Primary buttons are `sunrise-500` with `ink-900` text (9.2:1). Never put white text on amber.
- **Green means WhatsApp only.** It is never the brand colour, never used for "verified" and never used for generic success icons on cards. This avoids confusion with WhatsApp and with competitors.
- **Teal means verified ownership.** Nothing else is teal. Verification is binary and based solely on sanctioned Google Business Profile management authorization; activity levels never grant or upgrade verification.
- **Coral means urgency** (offer ending, unread). Use sparingly.
- Ratios verified: ink-900 on bg 16.4:1, ink-500 on white 6.4:1, ink-900 on amber 9.2:1, white on teal-600 4.8:1, white on coral-600 4.7:1. Codex must run an automated contrast check in CI and fix any failure.
- Light theme only at launch. Tokens must be structured so a dark theme can be added later without rewriting components.

### 2.3 Category tints (for fallback images, chips and icons)
Each category gets a soft tint plus an icon. Never a letter-in-a-box.
Solar and power `sunrise-100` · Food coral-100 · Beauty and wellness `#F3E6FA` · Home services `#E3EEFF` · Fashion `#FFE9F1` · Education `#E7F4E0` · Health `#DDF3F7` · Auto `#EAEAF2` · Other `sand-100`.
Fallback cover for a business with no photo: category tint background, large category icon in `ink-700` at 40% opacity, and the business name below. The listing must also show "Add photos" nudges to the owner, never to the customer.

### 2.4 Typography
- **Display and headings:** Bricolage Grotesque (variable, free). Semibold or bold, tight tracking.
- **Body and UI:** Inter (variable, free). Self-host through `next/font` with `display: swap` and only the weights used (400, 500, 600).
- **Must verify:** the naira sign **₦** renders correctly in both fonts. If either lacks the glyph, use a fallback font for that character only. Test with ₦1,250,000.
- **Scale (mobile / desktop):** Display 32/44 · H1 26/34 · H2 20/26 · H3 17/20 · Body 16/16 · Small 14/14 · Caption 12/12. **Body never below 16 px on mobile inputs** (prevents iOS zoom).
- Line height 1.45 for body, 1.15 for display. Max line length 70 characters for reading text.
- Large display type is for **at most one moment per screen** and never pushes businesses below the fold.

### 2.5 Shape, depth, spacing, motion
- **Radius:** cards 16 px · inputs and buttons 12 px · chips and pills 999 px · sheets 24 px top corners.
- **Depth:** 1 px `border` plus a very soft shadow (`0 1px 2px` ink at 6%). No heavy shadows. Sheets and trays may use `0 -8px 24px` ink at 10%.
- **Spacing:** 4 px base. Use 4, 8, 12, 16, 24, 32, 48. Mobile page margin 16 px.
- **Layout grid:** mobile one column, 16 px margins · tablet 8 columns · desktop 12 columns, max width 1200 px.
- **Touch targets:** at least 44 x 44 px, with 8 px between adjacent targets.
- **Motion:** 150 to 250 ms ease-out. Used for press feedback, sheet slide-in, tab switch, heart pop, skeleton shimmer. Respect `prefers-reduced-motion` (no movement, instant state change). No parallax, no autoplay video, no animated hero.
- **Icons:** Lucide, stroke 1.75, rounded caps. Icon-only buttons need an accessible label.
- **Imagery:** real owner photos first. Photos are cropped `object-cover` to fixed aspect ratios (cards 4:3, feed 1:1 or 4:5). **Logos are never cropped:** show them `object-contain` on a white padded tile.

## 3. Voice and microcopy
- **Tone:** warm, plain, short. Write like a helpful local friend. Nigerian English spelling with British conventions (neighbourhood, organisation). No slang overload and no pidgin by default.
- **Never use:** "unlock", "seamless", "leverage", "delve", "in today's digital landscape", or exclamation marks in errors.
- **Always say what happened and what to do next.**
- **Formats:** money ₦12,500 (no decimals unless needed) · phone +234 803 000 0000 · time "2h ago" under 24 h then "12 Nov" · distance "1.2 km" · counts "24 Google reviews".

| Moment | Copy |
|---|---|
| Search placeholder | Search businesses or services |
| Empty search | We don't have verified businesses matching "{query}" in {area} yet. Try another area or a wider category. |
| Sign-in gate (message) | Sign in to message {Business}. We'll bring you right back. |
| Message sent | Sent. {Business} usually replies on Jado. |
| Verified explainer title | Verified on Jado |
| Verified explainer body | The owner has proven they manage this business on Google. It does not guarantee the quality of their service. |
| Google rating | 4.4 · 24 Google reviews |
| Offer ending | Ends in 2 days |
| Unknown data | Not listed |
| Network error | Can't connect right now. Check your data and try again. |
| Permission error | You don't have access to this. |
| Pending claim | Your request is being checked. You'll hear from us here and on WhatsApp. |
| Owner WhatsApp alert | You have a new message on Jado about {post or business}. Open it: {link} (never include the customer's message text) |

## 4. Navigation and information architecture

### 4.1 Customer and public (mobile)
Bottom tab bar, five items, always visible except in full-screen flows:
**Explore · Feed · Compare · Messages · Account**
- Messages shows an unread badge in coral (when signed in). Signed out, the tab opens the sign-in gate.
- Learn and Jado AI are **post-launch**: do not show tabs, links or "coming soon" teasers for them. A missing feature is hidden, never advertised as dead space.
- A **location chip** (a map-pin icon followed by "Uyo"; never an emoji) sits at the top left of Explore, Feed and Compare. Tapping it opens the area sheet (L01).
- Desktop: a top bar with the wordmark, search, location chip and the same five destinations. Content centres in a 12-column grid.

### 4.2 Owner mode
After activation, Account offers **Switch to Business**. The owner tab bar becomes:
**Today · Posts · Messages · Insights · Profile**
Create post is a floating button on Today and Posts. Share and QR live under Profile and on Today.

### 4.3 Staff
`/admin` is a separate, plain, desktop-first layout. It reuses tokens and components but has no public navigation.

### 4.4 Rules
- Every screen has a visible way back. Browser back and forward must work. Never trap anyone in a modal.
- Anonymous browsing is complete. Sign-in is requested only at the moment of Message, Follow, Like or owner actions, via the gate sheet (section 6.4).
- No cookie or install banner may cover content or buttons. Any banner must be dismissible and non-overlapping.

## 5. Component library (build in the gallery first)

Each component must have: default, hover or focus, pressed, disabled, loading and error states where relevant, and a skeleton.

### 5.1 Core
- **Button:** Primary (amber fill, ink text) · Secondary (white, ink border) · Ghost · Destructive · Icon button · WhatsApp (whatsapp-600 fill, white text, WhatsApp icon) · Full-width variants for mobile bottom bars. Height 48 px on mobile, 44 minimum.
- **Input, Textarea, Select, Checkbox, Switch, OTP code input** with visible labels, helper text and inline error text. Labels are never placeholder-only.
- **Chip** (filter, category, selected) and **Segmented control**.
- **Badge:** VerifiedBadge (teal shield + "Verified"), TypeBadge (Offer, New arrival, Service, Update, Event, Portfolio), StatusPill (Pending, Active, Expired, Suspended), CountBadge (coral).
- **Future evidence badges:** Recency, consistency or responsiveness indicators are separate from VerifiedBadge and must describe real, windowed measurements (for example "Posted this week") with transparent thresholds. Their scoring and eligibility require later founder approval; **do not implement gamified achievement badges in M0.5**.
- **Avatar and LogoTile.**
- **Bottom sheet, Dialog, Toast, Tooltip.** Sheets are the default on mobile.
- **Skeletons** matching each card's real shape. No spinners for page content.

### 5.2 Domain components
- **SearchBar:** icon, input, clear button, optional filter button with active-count dot. Sticky on scroll.
- **LocationChip** and **AreaSheet.**
- **BusinessCard (list):** responsive. At 390 px and wider, show an approximately 96 px image alongside name, owner-verification badge, category/distance, Google rating **only when genuinely available**, open status when known and a short description/offer. Use **Message** as the main action; WhatsApp and Call are secondary. On narrow 320 px screens, collapse optional information, put secondary actions in a menu or profile, and stack the action area as needed. Maintain 44 px touch targets and no horizontal overflow. Do not force three contact buttons, a follow control and a 96 px image into one cramped row. The card body navigates to the profile; buttons have separate targets.
- **BusinessCard (featured):** vertical, 260 px wide, 4:3 photo, used in carousels.
- **PostCard (feed):** business avatar + name + verified + time ago · TypeBadge · image carousel (max 5, 1:1 or 4:5) · title · 3-line description with "more" · optional price in ₦ · expiry text for offers · action row: Like (heart with count) · Message · Share. **No comment box** (PRD has no public comments). "Reply" means Message.
- **OfferChip:** small coral-tinted chip, "Offer · ends in 2 days".
- **CompareTray:** floating above the tab bar when 1 to 3 businesses are selected; shows thumbnails, "Compare (2)" button, clear.
- **ComparisonCard and ComparisonTable** (section 6.8).
- **RatingGoogle:** star icon, rating, count, small "Google" label. This is a Google rating and is never styled as Jado's own.
- **OpenStatus:** "Open · closes 9 pm" or "Closed · opens 8 am". If unknown, show nothing.
- **ActionBar (sticky bottom on profile):** Message (primary, flexible width) · WhatsApp icon button · Call icon button · More (Directions, Website, Share, Report).
- **ConversationRow, MessageBubble, Composer, TypingNone** (no typing indicator at launch).
- **NotificationItem.**
- **StatTile** (number, label, window, info icon opening the definition).
- **ProgressCard (profile completeness):** real checklist with tick states.
- **EmptyState, ErrorState, UnauthorizedState, SuspendedState, NotFoundState.**
- **StepIndicator** for onboarding.
- **QRCard** for sharing.

## 6. Screen patterns (top to bottom on a 390 px phone)

Identifiers match JADO_V2_SCREEN_MAP.md. Only screens in scope for M0.5 to M4 are specified. Hide anything not built.

### 6.1 L01 Choose area
Bottom sheet or full page. Title "Where are you looking?" · primary button "Use my current location" · divider "or" · searchable list of areas (Uyo first at launch, then Eket and others as data exists) · note "We only use your location to show nearby businesses." Denying GPS never blocks anything.

### 6.2 P01 Explore (home)
1. Top bar: wordmark, location chip, notifications bell (signed in).
2. Search bar (sticky).
3. Category chips row (horizontal scroll), the launch vertical first (Solar and power).
4. **Launch showcase band** (only if the category has 3 or more verified businesses): "Compare solar installers in Uyo", showing 2 to 3 featured cards and a **Compare** button.
5. Sections as horizontal carousels, each shown **only if it has at least 3 real items**: New offers · Just joined · Recently active · Most viewed this week.
6. "All businesses in {area}" vertical list with infinite scroll or "Show more".
7. **Owner invitation card** near the bottom: "Own a business? Get your free Jado page." with CTA. Never above the fold for customers.
- If fewer than 3 businesses exist anywhere, the page shows the list directly plus an honest note ("We're adding verified businesses in {area} every week"). Never fill with fake or out-of-area items.
- All public lists contain **verified Jado businesses only**. A Google Places match found during owner onboarding does not qualify it for public Explore. In private M0.5 development, fetch the ten fictional seeded businesses from PostgreSQL with a prominent, persistent "Development data" notice; no public environment may treat these records as verified supply.
- No hero paragraph. No sign-in button above the fold (sign-in lives in Account).

### 6.3 P02 Search results and P03 Category
Sticky search + filter button · result count · sort chip (labelled honestly: Best match · Newest · Recently active · Most viewed) · filter sheet (category, area, offer type, open now, verified) · results as BusinessCard (list) · matching offers appear as small OfferChip rows inside the card, not as separate junk · checkbox to **Compare** on each card feeds the CompareTray. Filters persist in the URL.

### 6.4 Auth gate (Message, Follow, Like)
Bottom sheet: context line ("Sign in to message {Business}") · **Continue with Google** · "or use email" · email and password fields · after sign-up, a 6-digit code sent by email, with resend after 30 s · success returns the person to the exact place and **completes the original action automatically** where safe (message opens, follow applied). Errors are specific and friendly.

### 6.5 P04 Business profile
1. Cover image (4:3, or fallback) with back button and share button overlaid.
2. Logo tile overlapping the cover, name, VerifiedBadge (tap opens explainer sheet).
3. Meta row: category · area · distance · `4.4 · 24 Google reviews` · Open status.
4. Sticky **ActionBar** (Message primary, WhatsApp, Call, More).
5. Tab strip (sticky): About · Offers and posts · Products and services · Gallery · Reviews (Google) · Details.
6. About: owner-written description, supplementary contacts and social links.
7. Reviews tab: permitted Google excerpts with attribution and a "Read on Google" link only. No Jado ratings.
8. Details: Google-sourced address, hours, phone, "Last checked {date}", Report this business.
- Follow is a bookmark in the header. A **Compare** link adds this business to the tray.
- Pending applicants are never shown as verified or public.

### 6.6 P05 Post detail
Image carousel · TypeBadge · title · price (owner-declared, labelled "Price set by the business") · description · expiry · business strip (tap to profile) · sticky bar: **Message about this** (opens a conversation with the post attached) · Like · Share. States: active, expired (greyed "This offer has ended" plus link to the business), removed.

### 6.7 P06 Feed
Top: location chip + segmented control **For you / Following** (Following only when signed in). Filter chips by post type and category. PostCards in a single column. Newest first with a small boost for recently active businesses, labelled honestly. Pull to refresh. Empty Following state: "Follow businesses to see their updates here." with a button to Explore. No consumer posting UI anywhere.

### 6.8 P07 and P08 Compare
**Builder:** three slots with plus buttons, search or pick from the tray, same-category hint, "Compare" enabled at 2 or more. Mismatched categories show a calm explanation, not an error.
**Result (mobile):** swipeable head-to-head cards, one column per business with sticky header (logo, name, verified). Rows are grouped, each with the label, values, and a **"Leads"** marker on the stronger side only where the difference is clear:
- Google rating and number of reviews (always show both)
- Verified status
- Latest activity on Jado
- Current offers
- Hours and open now
- Distance
- Response time (**only** if enough real Jado replies exist, otherwise hidden)
Use small bars for ratings and counts. Show **Unknown** vs **Not available** distinctly. **No overall "best" label.** Footer: "How Jado compares businesses" opens a sheet listing exactly what is measured and what is not. Buttons per column: **Message** and view profile. Top actions: **Share on WhatsApp** (prominent) and Copy link.
**Desktop:** the same data as a side-by-side table with the same Leads markers.

### 6.9 Account (A01 to A04, A07)
Signed out: friendly sign-in card plus data-saver switch and help links. Signed in: name, area, **Following** list, saved items, notification preferences, data saver, privacy, delete account, sign out, **Add your business** and (if owner) **Switch to Business**.

### 6.10 A05 and A06 Messages
List of ConversationRows (business logo, name, last message, time, unread dot). Conversation page: header with business name and verified badge, the **post or business context card** pinned at top, bubbles (own right in `sunrise-100`, other left in white with border), timestamps grouped by day, composer with Send. States: sending, failed with Retry, empty ("No messages yet. Message a business from its page."). Menu: Report, Block. For customers, a quiet note: "Businesses usually reply here and on WhatsApp."

### 6.11 A07 Notifications
Reverse-chronological list. Types: new message, reply, post liked, new follower (owner), claim status, offer expiring (owner), followed business posted. Each item: icon, one-line text, time, unread dot; tap goes to the exact thing. Granular toggles in Account.

### 6.12 Owner onboarding (O01 to O07)
Step indicator across the top: **Find your business → Confirm → Prove it's yours → Complete your page**.
- O01: search by name and area, results from Google as simple rows. No match: explain that a Google Business Profile is needed and offer a short guide.
- O02: confirm card showing what we found. If already claimed: clear message and a "Request help" link.
- O03: one clear explanation ("Sign in with the Google account that manages this business"), the button, then loading and result. Handle cancelled, wrong account, expired, unavailable.
- O03: Google identity sign-in **alone** never proves ownership. The authorized Google Business Profile location list must include the exact claimed business. A missing authorized match does not activate a listing or its verified badge.
- O04 and O05: friendly pending page with status timeline and actionable ownership recovery, never a dead end. If an agency or another Google account manages the profile, offer **Try another Google account**, **Ask the current manager to add you**, **Request ownership through Google**, and **Get help from Jado**, linking to official Google guidance. Preserve the application and its current state so the applicant can return. Staff may guide on the owner's device, but cannot bypass sanctioned authorization or assign verification manually.
- O06 and O07: checklist-style completion with the **ProgressCard**. Google-sourced fields appear read-only with a small Google icon and "Change this on Google" link. Brand kit (logo, colours, tagline) is optional and framed as help, not a test.
- **The owner uses their own device.** Show a note: "Sign in on your own phone so only you control this page."

### 6.13 O08 Today (owner home)
1. Greeting and business name with status.
2. **One next-best-action card** (for example "Add 3 photos", "Reply to 1 message", "Post an offer").
3. Four StatTiles: Profile views · New followers · Unanswered messages · Live posts. Each shows its time window and an info icon with the exact definition. If data is too small: "Not enough data yet" (never zeros dressed as insight).
4. Quick actions: **Create post**, **Share your page**.
5. Latest messages preview.
6. Profile completeness (if under 100 percent).

### 6.14 O10 and O11 Posts
List grouped by Active, Draft, Expired, Archived. Composer is a bottom-up flow: choose type (chips) → add photos first (camera or gallery, up to 5, compressed on the device) → fields change by type (offer: price and end date; new arrival: item and price; event: date and place) → live preview → Publish. Validation inline. Expiry is explicit.

### 6.15 O12 Owner inbox
Same as customer inbox with a source-post tag per conversation, unread filter, and a pinned reminder for conversations unanswered for 24 h.

### 6.16 O13 and O14 Insights and competitors
Simple time window switch (7 or 30 days). Cards with plain-English definitions. Competitor view reuses the Compare components, always separating public competitor facts from the owner's private numbers.

### 6.17 O15 Share
Large QR card, **Copy link**, **Share on WhatsApp**, **Download QR**. The QR target opens the public profile without sign-in.

### 6.18 P12 and P13 Trust and support
Short pages. Verification meaning, how Google reviews are shown, how to report, contact, support@ address from config. Plain headings, short paragraphs, no legal wall.

### 6.19 S01 to S10 Admin (shell scope only through M4)
Dense, desktop-first tables with filters, clear action buttons and audit-log links. Same tokens.

## 7. State design (every screen, no exceptions)
| State | Requirement |
|---|---|
| Loading | Skeleton in the real shape. No full-page spinner. No layout jump. |
| Empty | Friendly one-line reason plus the next action. Illustration optional, simple. |
| Error | What happened plus Retry. Never raw error text. |
| Offline | Banner "You're offline. Showing saved results." and disabled actions that need a network. |
| Unauthorized | Explain and offer sign-in or back. |
| Suspended or deleted | Clear, neutral, with support link. |
| Partial data | Show what exists, label gaps as "Not listed". Never invent. |
| Development fixtures | A conspicuous "Development data" label, fictional identities and no appearance in public/staging-production routes (section 9). |

## 8. Performance, data and devices (Nigerian reality)
- **Target device:** mid-range Android on 4G with weak spells. Budget: LCP under 2.5 s on a throttled mobile profile, CLS under 0.1, initial JavaScript for Explore under about 170 KB gzipped. Codex records the real numbers in each milestone report.
- **Images:** `next/image`, responsive sizes, WebP or AVIF, blur placeholder, lazy-load below the fold, cards under about 60 KB, owner uploads compressed in the browser and re-encoded on the server (max 1600 px long edge).
- **Data saver:** a switch in Account, on by default when the browser reports Save-Data. It loads smaller images, disables carousels' auto-advance, and defers non-essential media.
- **No video autoplay.** No heavy libraries for simple needs. Prefer server rendering and streaming for lists.
- **Resilience:** retry with backoff for sends, keep typed message drafts, optimistic UI for like and follow with rollback.
- **Install:** make the web app installable (manifest and icons) so it can live on the home screen. Install prompts are non-blocking and appear only after meaningful use.

## 9. Truthfulness and trust (non-negotiable)
- No fake businesses, ratings, counts, activity or "trending" items. Development fixtures must carry a visible **Development data** label and be excluded from production builds.
- **Public listing rule:** only businesses with confirmed authorization to manage their matching Google Business Profile can appear as Jado listings. A Google Places lookup is not a listing import. No publicly visible unclaimed or pending listing.
- **Ten-business M0.5 dataset:** seed exactly ten **fictional**, category-diverse records, each with representative posts, logos/media placeholders, offers and search tags so real SQL-backed prototype interactions can be exercised. Use dedicated development-only seeding, stable IDs, idempotent reruns and a safe rollback. Never copy real Google ratings or falsely label mock owner access as genuine verification. The private visual preview may render demo states marked "Development data"; the public app shows honest empty states until authorized records exist.
- **Badges:** VerifiedBadge means authorized GBP management access—never a number of posts, popularity or engagement. Separate future factual activity badges must be earned using real metrics with explicit definitions and founder-approved rules, and must not imply service quality.
- Every number states its source and window ("Views, last 7 days"). Google data is labelled Google and attributed.
- No unqualified "best". Ranking and sorting labels say exactly what they do.
- No paid placement without a clear "Featured" label and no effect on rankings. (Not in the launch scope.)
- Verified badge appears only for real, authorised Google Business Profile access.

## 10. Accessibility (WCAG 2.2 AA)
Semantic landmarks and headings · all interactive elements keyboard reachable with a visible focus ring (2 px `ink-900` with 2 px offset) · labels for every input and icon-only button · colour never the only signal · alt text for photos (owner-supplied) and logos (business name) · sheets trap focus and close with Escape and back · respect reduced motion · text scales to 200 percent without breaking · errors announced to screen readers.

## 11. Screen Definition of Done (copy into every milestone report)
For **each** screen delivered, tick with evidence:
1. First screen shows eligible verified content at 390 px when it exists; a private M0.5 preview may show clearly labelled fictional database fixtures; otherwise show an honest empty state. Search and location are always immediately usable.
2. Layout verified at 320, 390, 768 and 1280 px, no horizontal scroll, no overlapping elements, nothing hidden behind sticky bars or banners.
3. Built only from gallery components and tokens (no hard-coded colours, sizes, or fonts).
4. Loading, empty, error, offline and unauthorized states exist and were seen.
5. Primary action is obvious and reachable with one thumb. Targets are at least 44 px.
6. Copy follows section 3 and has no placeholder or Lorem text.
7. Sign-in gates return to the intended place; automatic continuation is limited to safe actions. Never send a drafted message without deliberate user confirmation.
8. Public numbers and labels are real, sourced and windowed; development-only figures are explicitly fictional and never exposed as real usage.
9. Keyboard and screen-reader pass done. Contrast check passes in CI.
10. Performance numbers recorded. Images are compressed and lazy-loaded.
11. Back, forward, refresh and deep link all work. URLs are shareable.
12. Screenshots attached, plus a one-line note on any deviation from this document.

## 12. Anti-patterns (reject on sight)
A hero paragraph or brand statement above businesses · sign-in as the main button on the home screen · letter-in-a-box placeholders · cropped or stretched logos · empty star rows · link-farm footers · ads or promo banners overlapping content · mixing unrelated verticals (cars, jobs, property) · demo data in public routes · tables that need sideways scrolling on phones · giant type that pushes content down · modals that block navigation · invented metrics · dev indicators visible in staging screenshots shared with stakeholders.

## 13. M0.5 build order for design
1. Tokens, fonts, icons, global styles, theme file.
2. Gallery route (`/design`, development only and inaccessible in public deployments) with **M0.5-relevant** section 5 components and their states; extend later rather than building future-milestone components now.
3. App shell: tab bar, top bar, location chip, area sheet, auth gate sheet.
4. Explore, Search, Category backed by an idempotent ten-business **development-only PostgreSQL seed**; real filters and interactions, not hard-coded card arrays. Every fixture is prominently labelled; public builds exclude the seed.
5. Business profile, Post detail, Feed.
6. Compare builder and result.
7. Account, Messages shell, Notifications shell.
8. Owner shell: onboarding steps, Today, Posts, Inbox, Share (interactive UI shells and honest states only, per the milestone contract). **Do not** implement actual Google ownership authorization (M1), publishing/Feed backend (M2), discovery analytics and real comparison ranking (M3), or messaging persistence (M4) in this milestone. Real functionality must not be implied where it does not yet exist.
9. Screenshots at four widths, checklist, performance numbers, then stop for visual acceptance.

## 14. Change control
Any change to colour, type, navigation or a component's behaviour is recorded in `/docs/DECISION_LOG.md` with the reason. When the real Webtellisense identity arrives, only the tokens file, wordmark and icon are replaced. If a screen needs a pattern not defined here, add it to the gallery and this document first, then use it.

### M0.5 implementation clarification, 16 November 2026

The preserved `/sign-in?next=...` route hosts the shared native modal sheet. It traps focus, supports Escape/continue-browsing and retains the exact safe action URL. Provider and registration controls remain explicitly unavailable per M0 rather than simulating Google or email OTP. JS-dependent controls start disabled until hydration; authentication forms explicitly use POST even before JavaScript is ready. Local illustration fallbacks contain no claimed owner photographs.

### Founder review hosting exception, 16 November 2026

PRD section 13/Addendum D10 now allow the same labelled M0.5 fixtures in a password-protected Vercel Preview with the exact two server-side flags. This supersedes the earlier blanket staging exclusion only for this private founder review. Production stays fixture-free; no new look/feel or verified badge is introduced. Hosted reviewer access is read-only and is not consumer/owner authentication.

### Current staging override (PRD14 / D11)

The founder now requires the ten labelled fixtures on normal staging routes. This supersedes all private/local-only and Preview-password requirements above. Layout/tokens and visible Development data labels remain; staging uses its shared DATABASE_URL, future production uses a separate unseeded database. No M1 is authorised.

## 15. Approved M0.5 visual patterns (PRD15 / D13)

Keep the existing palette, fonts, navigation, sections and Compare. Build BusinessLogo, BusinessAvatar, BusinessCover, BusinessIdentity, BusinessGallery, SocialLinks and PostMediaGallery in /design before screen use. Logos are contained on padded tiles; photographs cover reserved aspect-ratio frames. Profile cover supports overlapping logo tile. Gallery controls are keyboard accessible and do not autoplay; native dialogs keep Escape/focus semantics. Missing media retains a category fallback. Responsive local WebP assets have fixed dimensions, lazy loading and smaller Data Saver variants.

Post indicators always pair Lucide icon and text: service ShoppingBag (3 media), offer Clock (3), arrival Package (3), update Megaphone (2), event CalendarDays (5), portfolio Images (5). Layout: one full image; two balanced; three asymmetric; four/five controlled collage. A shared geometry keeps headers/actions stable; media opens an accessible gallery. Enforce these limits in fixture validation and rendering.

The single quiet footer disclosure explains staging/demo businesses, generated imagery and representative contact/details. Remove repeated card banners and sample/prototype strings from descriptions. No rating, review count, verified badge, overall score or engagement metric may be invented. Fixture address/hours/contacts remain fixture-owned and explicitly distinct from unavailable Google information. External example contacts must not route to a real unrelated business.

## 16. M2.5 approved experience and Slice 3 identity override

17 November 2026: [M25_APPROVED_CONTRACT.md](M25_APPROVED_CONTRACT.md) records the founder-approved scope, policy corrections, slice gates and identity fallback addition. It supersedes conflicting Places-first onboarding, unconditional Place ID, private-draft restrictions and fixture gating rules above. M0.5 is accepted. Preserve its visual design and fixture logos. Implement Slice 1 only now; no M3 or M2.5 staging/main merge is authorised.
