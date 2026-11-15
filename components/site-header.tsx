import Link from "next/link";
import { ArrowIcon } from "./arrow-icon";
export function SiteHeader() {
  return (
    <header className="site-header wrap">
      <Link className="brand" href="/" aria-label="Jado home">
        <span aria-hidden="true" className="brand-mark">
          j
        </span>
        jado<span className="brand-dot">.</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/account">My account</Link>
        <Link className="button small secondary" href="/sign-in">
          Sign in <ArrowIcon />
        </Link>
      </nav>
    </header>
  );
}
