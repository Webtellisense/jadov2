"use client";
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <section className="panel">
      <p className="eyebrow">Jado</p>
      <h1>Something is unavailable.</h1>
      <p role="alert">Please try again in a moment.</p>
      <button className="button" onClick={retry}>
        Try again
      </button>
    </section>
  );
}
