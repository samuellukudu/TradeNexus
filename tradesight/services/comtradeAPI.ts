import type { TradeRecord, ReferenceItem } from '../types';
import { getCachedOrFetchClient } from '../lib/clientCache';

const COMRADE_PREVIEW_BASE = 'https://comtradeapi.un.org/public/v1/preview/C/A/HS';
const COMRADE_REF_BASE = 'https://comtradeapi.un.org/files/v1/app/reference';

let requestPromise: Promise<void> = Promise.resolve();

const fetchTradeDataDirect = async (url: string): Promise<TradeRecord[]> => {
  return getCachedOrFetchClient(url, async () => {
    await new Promise<void>(resolveSelf => {
      requestPromise = requestPromise.then(async () => {
        resolveSelf();
        await new Promise(res => setTimeout(res, 1200));
      });
    });

    const response = await fetch(url);
    if (!response.ok) {
      let errorMsg = 'Failed to fetch trade data';
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (_e) { /* ignore */ }
      throw new Error(errorMsg);
    }
    const data = await response.json();
    return (data.data as TradeRecord[]).filter((record) => record.partner2Code === 0);
  });
};

export const fetchTradeData = async (
  reporterCode: string,
  partnerCode: string,
  flowCode: string,
  cmdCode: string = 'TOTAL',
  period?: string
): Promise<TradeRecord[]> => {
  const buildUrl = (p: string) =>
    `${COMRADE_PREVIEW_BASE}?reporterCode=${reporterCode}&partnerCode=${partnerCode}&cmdCode=${cmdCode}&flowCode=${flowCode}${p ? `&period=${p}` : ''}`;

  if (!period) {
    return fetchTradeDataDirect(buildUrl(''));
  }

  const periods = period.split(',').map(p => p.trim()).filter(Boolean);
  const CHUNK_SIZE = 5;
  const allRecords: TradeRecord[] = [];
  for (let i = 0; i < periods.length; i += CHUNK_SIZE) {
    const chunk = periods.slice(i, i + CHUNK_SIZE).join(',');
    try {
      const data = await fetchTradeDataDirect(buildUrl(chunk));
      allRecords.push(...data);
    } catch (err) {
      console.warn('Failed fetching chunk:', chunk);
    }
  }
  return allRecords;
};

export const fetchReporters = async (): Promise<ReferenceItem[]> => {
  const url = `${COMRADE_REF_BASE}/Reporters.json`;
  return getCachedOrFetchClient(url, async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return getDefaultCountries();
      const data = await response.json();
      return (data.results as ReferenceItem[]).filter(r => r.id !== 'all');
    } catch (_err) {
      return getDefaultCountries();
    }
  }, 1000 * 60 * 60 * 24);
};

export const fetchPartners = async (): Promise<ReferenceItem[]> => {
  const url = `${COMRADE_REF_BASE}/partnerAreas.json`;
  return getCachedOrFetchClient(url, async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return getDefaultCountries();
      const data = await response.json();
      return (data.results as ReferenceItem[]);
    } catch (_err) {
      return getDefaultCountries();
    }
  }, 1000 * 60 * 60 * 24);
};

export const fetchHsCodes = async (): Promise<ReferenceItem[]> => {
  const url = `${COMRADE_REF_BASE}/HS.json`;
  return getCachedOrFetchClient(url, async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.results as ReferenceItem[]);
    } catch (_err) {
      return [];
    }
  }, 1000 * 60 * 60 * 24);
};

const getDefaultCountries = (): ReferenceItem[] => [
  { id: '842', text: 'USA' },
  { id: '156', text: 'China' },
  { id: '276', text: 'Germany' },
  { id: '392', text: 'Japan' },
  { id: '826', text: 'United Kingdom' },
  { id: '356', text: 'India' },
];
