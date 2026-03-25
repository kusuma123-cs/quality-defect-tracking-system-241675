import Link from "next/link";

export default function NotFound() {
  return (
    <section className="card">
      <h1 className="h1">Page not found</h1>
      <p className="subtle">The page you are looking for does not exist.</p>
      <Link className="btn btnPrimary" href="/">
        Go to dashboard
      </Link>
    </section>
  );
}
