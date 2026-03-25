import React from "react";

/**
 * PUBLIC_INTERFACE
 * Required for Next.js static export when using dynamic segments.
 * We return an empty list so export can complete; dynamic pages will be navigated to client-side.
 */
export async function generateStaticParams(): Promise<Array<{ id: string }>> {
  return [];
}

export default function DefectIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
