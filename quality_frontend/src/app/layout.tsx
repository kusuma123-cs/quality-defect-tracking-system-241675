import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import NavLink from "@/components/NavLink";
import { IconClipboardList, IconPlus, IconChart } from "@/components/Icons";

/**
 * App metadata for the frontend-only quality defect tracking system.
 */
export const metadata: Metadata = {
  title: "Quality Defect Tracking",
  description: "Frontend-only quality defect tracking with localStorage persistence."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Quality Defect Tracking";

  return (
    <html lang="en">
      <body>
        <div className="nav" role="navigation" aria-label="Top navigation">
          <div className="navInner">
            <Link href="/" className="brand" aria-label="Go to dashboard">
              <span className="logoDot" aria-hidden="true" />
              <span className="brandTitle">{appName}</span>
            </Link>

            <div className="navLinks">
              <NavLink href="/">
                <span aria-hidden="true">
                  <IconClipboardList size={16} />
                </span>
                Dashboard
              </NavLink>
              <NavLink href="/defects/new">
                <span aria-hidden="true">
                  <IconPlus size={16} />
                </span>
                Log Defect
              </NavLink>
              <NavLink href="/analytics">
                <span aria-hidden="true">
                  <IconChart size={16} />
                </span>
                Analytics
              </NavLink>
              <span className="pill subtle">
                Offline-first <span className="kbd">localStorage</span>
              </span>
            </div>
          </div>
        </div>

        <main className="container">{children}</main>
      </body>
    </html>
  );
}
