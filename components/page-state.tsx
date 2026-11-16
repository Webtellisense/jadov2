import { AreaLink as Link } from "./area-link";
export function PageState({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <span className="eyebrow">Jado</span>
      <h1>{title}</h1>
      <p>{children}</p>
      <Link className="button secondary" href="/">
        Back to home
      </Link>
    </section>
  );
}
