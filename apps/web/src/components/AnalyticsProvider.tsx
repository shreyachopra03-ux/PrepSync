"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { authClient } from "../lib/auth-client";
import { identify, track } from "../lib/analytics";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  useEffect(() => {
    if (userId) identify(userId);
  }, [userId]);

  useEffect(() => {
    const path = pathname.replace(/^\/kits\/[^/]+/, "/kits/[id]");
    track("page_viewed", { path });
  }, [pathname]);

  return null;
}
