"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { pageView } from "@/lib/analytics";

/**
 * Mounted once at the root layout. Fires a `page_view` event whenever the
 * pathname changes (including the initial mount). The full URL with query
 * string is captured server-side via `window.location` inside `track()`,
 * so we don't need `useSearchParams` here — which keeps the whole app from
 * being forced into client-side rendering at build time.
 */
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    pageView();
  }, [pathname]);

  return null;
}
