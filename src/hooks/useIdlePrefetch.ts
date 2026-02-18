import { useEffect } from "react";

type UseIdlePrefetchOptions = {
  idleTimeoutMs?: number;
  fallbackDelayMs?: number;
  enabled?: boolean;
};

export const useIdlePrefetch = (
  prefetch: () => void | Promise<unknown>,
  options?: UseIdlePrefetchOptions
) => {
  const idleTimeoutMs = options?.idleTimeoutMs ?? 1500;
  const fallbackDelayMs = options?.fallbackDelayMs ?? 1200;
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const runPrefetch = () => {
      void prefetch();
    };

    if (typeof window !== "undefined") {
      const browserWindow = window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      };

      if (browserWindow.requestIdleCallback) {
        idleId = browserWindow.requestIdleCallback(() => {
          runPrefetch();
        }, { timeout: idleTimeoutMs });
      } else {
        timeoutId = setTimeout(() => {
          runPrefetch();
        }, fallbackDelayMs);
      }
    }

    return () => {
      if (idleId !== null && typeof window !== "undefined") {
        const browserWindow = window as Window & {
          cancelIdleCallback?: (id: number) => void;
        };
        browserWindow.cancelIdleCallback?.(idleId);
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [enabled, fallbackDelayMs, idleTimeoutMs, prefetch]);
};
