import { AreaLink as Link } from "@/components/area-link";
import { SelectedIdsInput } from "@/components/comparison-context";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CircleAlert,
  MapPin,
  Search,
  ShieldCheck,
  Sun,
  Utensils,
  Sparkles,
  Wrench,
  Shirt,
  GraduationCap,
  Car,
  HeartPulse,
  Store,
} from "lucide-react";
import type { ReactNode } from "react";
export { Button } from "./button";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  ...props
}: {
  href: string;
  children: ReactNode;
  variant?: string;
  "aria-label"?: string;
}) {
  return (
    <Link href={href} className={`button ${variant}`} {...props}>
      {children}
    </Link>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function VerifiedBadge() {
  return (
    <Link href="/verification" className="badge verified">
      <ShieldCheck size={16} aria-hidden="true" />
      Verified
    </Link>
  );
}
export function DevelopmentNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "dev-label" : "development-notice"}>
      <span className="dev-dot" aria-hidden="true" />
      <strong>Development data</strong>
      {!compact && (
        <span>
          Fictional businesses · private prototype · no Google verification
        </span>
      )}
    </div>
  );
}
const icons = {
  solar: Sun,
  food: Utensils,
  beauty: Sparkles,
  home: Wrench,
  fashion: Shirt,
  education: GraduationCap,
  auto: Car,
  health: HeartPulse,
  other: Store,
};
export function CategoryIcon({
  category,
  large = false,
}: {
  category: string;
  large?: boolean;
}) {
  const Icon = icons[category as keyof typeof icons] ?? Store;
  return (
    <Icon
      className={large ? "category-icon large" : "category-icon"}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
}
export function CategoryArt({
  category,
  name,
}: {
  category: string;
  name: string;
}) {
  return (
    <div
      className={`category-art tint-${category}`}
      role="img"
      aria-label={`${name}, category illustration`}
    >
      <CategoryIcon category={category} large />
      <span className="art-caption">Illustration</span>
    </div>
  );
}
export function LocationChip({ area, href }: { area: string; href: string }) {
  return (
    <Link className="location-chip" href={href}>
      <MapPin aria-hidden="true" />
      <span>{area || "Choose area"}</span>
      <ChevronDown aria-hidden="true" />
    </Link>
  );
}
export function BackLink({
  href = "/",
  label = "Back to Explore",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link className="back-link" href={href}>
      <ArrowLeft aria-hidden="true" />
      {label}
    </Link>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {children}
    </div>
  );
}
export function StateCard({
  title,
  children,
  kind = "empty",
  href = "/",
  action = "Back to Explore",
}: {
  title: string;
  children: ReactNode;
  kind?: string;
  href?: string;
  action?: string;
}) {
  return (
    <section className={`state-card ${kind}`} aria-label={title}>
      <div className="state-icon">
        <CircleAlert aria-hidden="true" />
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      <ButtonLink href={href} variant="secondary">
        {action}
      </ButtonLink>
    </section>
  );
}
export function CardSkeleton() {
  return (
    <div
      className="card-skeleton"
      role="status"
      aria-label="Loading businesses"
    >
      <div className="skeleton skeleton-image" />
      <div className="skeleton-lines">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <span className="sr-only">Loading businesses…</span>
    </div>
  );
}
export function SearchBar({
  area = "",
  q = "",
  prefix = "",
  category = "",
}: {
  area?: string;
  q?: string;
  prefix?: string;
  category?: string;
}) {
  return (
    <form className="search-bar" action={`${prefix}/search`} role="search">
      <label className="sr-only" htmlFor="discovery-search">
        Search businesses or services
      </label>
      <Search aria-hidden="true" />
      <input
        id="discovery-search"
        name="q"
        type="search"
        placeholder="Search businesses or services"
        defaultValue={q}
        maxLength={120}
      />
      <input type="hidden" name="area" value={area} />
      <SelectedIdsInput />
      {category && <input type="hidden" name="category" value={category} />}
      <button type="submit" className="icon-button" aria-label="Search">
        <ArrowRight aria-hidden="true" />
      </button>
    </form>
  );
}
export function StatTile({ label }: { label: string }) {
  return (
    <div className="stat-tile">
      <h3>{label}</h3>
      <p>Not enough data yet</p>
      <p>No live measurement connected</p>
    </div>
  );
}
export function StepIndicator({ steps }: { steps: string[] }) {
  return (
    <ol className="step-list">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

export function LogoTile({
  category,
  name,
}: {
  category: string;
  name: string;
}) {
  return (
    <div
      className="logo-tile"
      role="img"
      aria-label={`${name}: category placeholder, no owner logo provided`}
    >
      <CategoryIcon category={category} />
    </div>
  );
}
