import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <section className="hero-card">
        <div className="brand-mark">RO</div>
        <p className="eyebrow">CONVENIENCE STORE OPERATIONS</p>
        <h1>RetailOps</h1>
        <p className="lead">
          Learn how a real POS connects daily sales, barcode scanning, inventory
          movements, employee activity and management reporting.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/login">
            Open RetailOps
          </Link>
          <Link className="button secondary" href="/employee/pos">
            Try POS Prototype
          </Link>
        </div>
      </section>
    </main>
  );
}
