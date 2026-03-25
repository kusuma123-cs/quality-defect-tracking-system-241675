"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
};

/**
 * Small helper component to show an active pill for the current route.
 */
export default function NavLink({ href, children }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link href={href} className={`pill ${isActive ? "pillActive" : ""}`}>
      {children}
    </Link>
  );
}
