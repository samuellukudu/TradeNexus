// UN Comtrade API proxy — browser CORS workaround for production
import type { Request, Response } from "express";

const COMRADE_BASE = "https://comtradeapi.un.org";

// Rate-limited fetch queue (ported from un-comtrade-viewer/server.ts)
let apiQueue: Promise<unknown> = Promise.resolve();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(
  url: string,
  retries = 5,
  backoff = 2000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const p = apiQueue.then(async () => {
      await delay(1100);
      return fetch(url);
    });
    apiQueue = p.catch(() => null);

    const response = await p;

    if (response.ok) return response;

    if (response.status === 429) {
      const retryAfterStr = response.headers.get("retry-after");
      const retryAfterSecs = retryAfterStr ? parseInt(retryAfterStr, 10) : 0;
      let waitTime =
        retryAfterSecs > 0 ? retryAfterSecs * 1000 : backoff * Math.pow(2, i);

      try {
        const errorText = await response.clone().text();
        const match = errorText.match(/Try again in (\d+) seconds/i);
        if (match && match[1]) {
          waitTime = parseInt(match[1], 10) * 1000;
        }
      } catch {
        // ignore parse errors
      }

      console.warn(
        `[tradesightProxy] Rate limit hit (429). Retrying in ${waitTime}ms... (${i + 1}/${retries})`
      );
      apiQueue = apiQueue
        .then(() => delay(waitTime + 500))
        .catch(() => null);
      continue;
    }

    return response;
  }

  // Final attempt
  const finalP = apiQueue.then(async () => {
    await delay(1100);
    return fetch(url);
  });
  apiQueue = finalP.catch(() => null);
  return finalP;
}

// In-memory cache
const cache = new Map<string, { promise: Promise<unknown>; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 min for trade data, ref data overridden below

function getCachedOrFetch(url: string, ttl: number = CACHE_TTL) {
  const now = Date.now();
  if (cache.has(url)) {
    const cached = cache.get(url)!;
    if (now - cached.timestamp < ttl) return cached.promise;
  }

  const fetchPromise = (async () => {
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      let errorText = await response.text().catch(() => "");
      try {
        const json = JSON.parse(errorText);
        if (json.message) errorText = json.message;
      } catch {
        // not JSON
      }
      throw new Error(`Status ${response.status}: ${errorText}`);
    }
    return response.json();
  })();

  fetchPromise.catch(() => cache.delete(url));
  cache.set(url, { promise: fetchPromise, timestamp: now });
  return fetchPromise;
}

export function registerTradesightProxy(app: ReturnType<typeof import("express").default>) {
  // Generic proxy: /api/comtrade/* → https://comtradeapi.un.org/*
  app.get("/api/comtrade/{*path}", async (req: Request, res: Response) => {
    try {
      const targetPath = req.path.replace(/^\/api\/comtrade/, "");
      const queryString = new URLSearchParams(
        req.query as Record<string, string>
      ).toString();
      const targetUrl = `${COMRADE_BASE}${targetPath}${queryString ? `?${queryString}` : ""}`;

      // Use longer TTL for reference data (24h), shorter for trade data (10m)
      const isReference = targetPath.includes("/reference/");
      const ttl = isReference
        ? 1000 * 60 * 60 * 24
        : 1000 * 60 * 10;

      const data = await getCachedOrFetch(targetUrl, ttl);
      res.json(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch from Comtrade API";
      console.error("[tradesightProxy] Error:", message);
      res.status(502).json({ error: message });
    }
  });
}
