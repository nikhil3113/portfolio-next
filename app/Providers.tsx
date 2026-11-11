"use client";

import { useEffect } from "react";

/**
 * Loads PostHog after the page is idle. The SDK is imported dynamically so it
 * stays out of the initial bundle, and initialisation waits for idle time so it
 * does not compete with hydration for the main thread.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const init = async () => {
      const { default: posthog } = await import("posthog-js");
      if (cancelled) return;
      posthog.init(key, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
        person_profiles: "always",
        defaults: "2025-11-30",
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(() => void init(), {
        timeout: 3000,
      });
    } else {
      timeoutHandle = setTimeout(() => void init(), 2000);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    };
  }, []);

  return <>{children}</>;
}
