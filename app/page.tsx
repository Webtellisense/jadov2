import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" aria-hidden="true" /> A local beginning
            · Uyo, Nigeria
          </p>
          <h1>
            Good businesses.
            <br />
            Closer connections.
          </h1>
          <p className="intro">
            A place to discover local businesses, understand what they offer,
            and start a conversation.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/sign-in">
              Sign in <ArrowIcon />
            </Link>
            <a className="text-link" href="#our-approach">
              Our approach <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="fine muted">
            Jado is in development. Business discovery is not available yet.
          </p>
        </div>
        <aside className="welcome-card" aria-label="Jado development status">
          <div className="card-orbit" aria-hidden="true">
            <span>j.</span>
          </div>
          <p className="eyebrow">Built for the neighbourhood</p>
          <h2>
            Starting small.
            <br />
            Building with care.
          </h2>
          <p>
            We’re preparing Jado for local businesses and the people who need
            them.
          </p>
          <div className="card-note">
            <span className="status-dot" aria-hidden="true" /> Development
            preview
          </div>
        </aside>
      </section>
      <section id="our-approach" className="approach">
        <div className="section-heading">
          <p className="eyebrow">Our approach</p>
          <h2>
            A useful connection starts
            <br />
            with a little more clarity.
          </h2>
        </div>
        <div className="principles">
          <article>
            <span className="principle-number">01</span>
            <h3>Real business control</h3>
            <p>
              A Jado verification badge will require authorized Google Business
              Profile management access. It will not guarantee service quality.
            </p>
          </article>
          <article>
            <span className="principle-number">02</span>
            <h3>Useful information</h3>
            <p>
              Business details, products and offers will help you decide what
              fits. Missing information will stay clearly marked.
            </p>
          </article>
          <article>
            <span className="principle-number">03</span>
            <h3>Room for conversation</h3>
            <p>
              Find out more by speaking with a business. Jado messaging is
              planned for a later release.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
