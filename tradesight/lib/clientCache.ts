const inFlightPromises = new Map<string, Promise<any>>();
const DEFAULT_TTL = 1000 * 60 * 60; // 60 minutes

export function getCachedOrFetchClient<T>(url: string, fetcher: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> {
  if (typeof window === 'undefined') {
    return fetcher();
  }

  try {
    const cachedItem = window.sessionStorage.getItem(url);
    if (cachedItem) {
      const parsed = JSON.parse(cachedItem);
      if (Date.now() - parsed.timestamp < ttl) {
        return Promise.resolve(parsed.data as T);
      }
      window.sessionStorage.removeItem(url);
    }
  } catch (e) {
    console.warn('Session storage access error', e);
  }

  if (inFlightPromises.has(url)) {
    return inFlightPromises.get(url)!;
  }

  const promise = fetcher().then((data) => {
    try {
      window.sessionStorage.setItem(url, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      console.warn('Session storage write error (possible quota exceeded)', e);
    }
    inFlightPromises.delete(url);
    return data;
  }).catch((err) => {
    inFlightPromises.delete(url);
    throw err;
  });

  inFlightPromises.set(url, promise);
  return promise;
}
