"use client";
import Image, { type ImageLoaderProps } from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Globe,
  Mail,
  Camera,
  Phone,
} from "lucide-react";
import type { BusinessRecord, PostRecord } from "@/lib/discovery";
import type { BusinessPhoto } from "@/lib/business-media";
import { postMediaLimits, smallPhoto } from "@/lib/media-policy";
import { useDataSaver } from "./media-preferences";
import { CategoryArt } from "./ui/core";
const assetLoader = ({ src, width }: ImageLoaderProps) =>
  `${width <= 512 ? smallPhoto(src) : src}?w=${width <= 512 ? 320 : 512}`;
function Photo({
  photo,
  eager = false,
  sizes = "(max-width: 767px) 92vw, 420px",
}: {
  photo: BusinessPhoto;
  eager?: boolean;
  sizes?: string;
}) {
  const saver = useDataSaver();
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="media-error">Image unavailable</span>;
  return (
    <Image
      src={photo.src}
      loader={saver ? ({ src }) => `${smallPhoto(src)}?w=320` : assetLoader}
      alt={photo.alt}
      fill
      sizes={saver ? "320px" : sizes}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      onError={() => setFailed(true)}
    />
  );
}
export function BusinessLogo({
  business,
  large = false,
}: {
  business: BusinessRecord;
  large?: boolean;
}) {
  return (
    <span className={`business-logo ${large ? "business-logo-large" : ""}`}>
      {business.presentation?.logo ? (
        <Image
          src={business.presentation.logo}
          alt={`${business.name} logo`}
          width={96}
          height={96}
          unoptimized
        />
      ) : (
        <CategoryArt category={business.icon} name={business.name} />
      )}
    </span>
  );
}
export function BusinessAvatar({ business }: { business: BusinessRecord }) {
  return <BusinessLogo business={business} />;
}
export function BusinessCover({
  business,
  eager = false,
  sizes = "(max-width: 767px) 92vw, 800px",
}: {
  business: BusinessRecord;
  eager?: boolean;
  sizes?: string;
}) {
  return (
    <div className="business-cover">
      {business.presentation?.cover ? (
        <Photo
          photo={business.presentation.cover}
          eager={eager}
          sizes={sizes}
        />
      ) : (
        <CategoryArt category={business.icon} name={business.name} />
      )}
    </div>
  );
}
export function BusinessIdentity({
  business,
  href,
  heading = false,
}: {
  business: BusinessRecord;
  href?: string;
  heading?: boolean;
}) {
  const name = heading ? (
    <h3>{business.name}</h3>
  ) : (
    <strong>{business.name}</strong>
  );
  return (
    <div className="business-identity">
      <BusinessLogo business={business} />
      <div>
        {href ? <Link href={href}>{name}</Link> : name}
        <p className="caption muted">
          {business.categoryName} · {business.neighbourhood}
        </p>
      </div>
    </div>
  );
}
function MediaGallery({
  media,
  label,
  collage = false,
  eager = false,
}: {
  media: BusinessPhoto[];
  label: string;
  collage?: boolean;
  eager?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const saver = useDataSaver();
  if (!media.length) return <p className="muted">Photos not listed.</p>;
  function move(delta: number) {
    setSelected((value) => (value + delta + media.length) % media.length);
  }
  return (
    <>
      <div
        className={
          collage
            ? `post-media media-count-${media.length} ${saver ? "media-reduced" : ""}`
            : "business-gallery"
        }
        aria-label={label}
      >
        {(saver ? media.slice(0, 1) : media).map((photo, i) => (
          <a
            className="gallery-item"
            key={photo.src}
            href={photo.src}
            aria-label={`Open image ${i + 1} of ${media.length}: ${photo.alt}`}
            onClick={(e) => {
              e.preventDefault();
              setSelected(i);
              setOpen(true);
              dialog.current?.showModal();
            }}
          >
            <Photo
              photo={photo}
              eager={eager && i === 0}
              sizes={
                collage
                  ? "(max-width: 767px) 92vw, 640px"
                  : "(max-width: 767px) 45vw, 280px"
              }
            />
            {i === 0 && saver && media.length > 1 && (
              <span className="media-more">View {media.length} photos</span>
            )}
          </a>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="media-dialog"
        aria-label={label}
        onClose={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
          }
        }}
      >
        <div className="media-dialog-top">
          <span>
            {selected + 1} of {media.length}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Close gallery"
            onClick={() => dialog.current?.close()}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        {open && (
          <figure>
            <div className="media-dialog-photo">
              <Photo
                key={media[selected].src}
                photo={media[selected]}
                eager
                sizes="(max-width: 767px) 90vw, 768px"
              />
            </div>
            <figcaption>{media[selected].alt}</figcaption>
          </figure>
        )}
        {media.length > 1 && (
          <div className="media-dialog-controls">
            <button
              type="button"
              className="button secondary"
              onClick={() => move(-1)}
            >
              <ChevronLeft aria-hidden="true" />
              Previous image
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => move(1)}
            >
              Next image
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
export function BusinessGallery({ business }: { business: BusinessRecord }) {
  return (
    <MediaGallery
      media={business.presentation?.gallery ?? []}
      label={`${business.name} gallery`}
    />
  );
}
export function PostMediaGallery({
  post,
  eager = false,
}: {
  post: PostRecord;
  eager?: boolean;
}) {
  return (
    <MediaGallery
      media={(post.presentation?.media ?? []).slice(
        0,
        postMediaLimits[post.type],
      )}
      label={`${post.title} photos`}
      eager={eager}
      collage
    />
  );
}
export function SocialLinks({ business }: { business: BusinessRecord }) {
  const p = business.presentation;
  if (!p) return null;
  const safe = (v: string) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" && u.hostname.endsWith(".example");
    } catch {
      return false;
    }
  };
  return (
    <div className="social-links" aria-label={`${business.name} contact links`}>
      {safe(p.website) && (
        <a
          href={p.website}
          className="chip"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Globe aria-hidden="true" />
          Website
        </a>
      )}
      {p.email.endsWith(".example") && (
        <a href={`mailto:${p.email}`} className="chip">
          <Mail aria-hidden="true" />
          Email
        </a>
      )}
      {p.socials
        .filter((s) => safe(s.url))
        .map((s) => (
          <a
            className="chip"
            key={s.label}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Camera aria-hidden="true" />
            {s.label}
          </a>
        ))}
      {p.phone && (
        <span className="contact-phone">
          <Phone aria-hidden="true" />
          {p.phone}
        </span>
      )}
    </div>
  );
}
export function ProductImage({ photo }: { photo: BusinessPhoto }) {
  return (
    <div className="product-photo">
      <Photo photo={photo} />
    </div>
  );
}
