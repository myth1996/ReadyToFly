/**
 * CurrencyService — Live INR exchange rates
 * Uses frankfurter.app — free, no API key, ECB rates updated daily
 */

const BASE_URL = 'https://api.frankfurter.app';
const _cache: Map<string, { rate: number; ts: number }> = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Major currencies for Indian destinations
export const DESTINATION_CURRENCIES: Record<string, { code: string; symbol: string; name: string }> = {
  // International
  SIN: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  DXB: { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  AUH: { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  DOH: { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal' },
  KUL: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  BKK: { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  LHR: { code: 'GBP', symbol: '£', name: 'British Pound' },
  CDG: { code: 'EUR', symbol: '€', name: 'Euro' },
  FRA: { code: 'EUR', symbol: '€', name: 'Euro' },
  AMS: { code: 'EUR', symbol: '€', name: 'Euro' },
  JFK: { code: 'USD', symbol: '$', name: 'US Dollar' },
  ORD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  LAX: { code: 'USD', symbol: '$', name: 'US Dollar' },
  SYD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  MEL: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  NRT: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ICN: { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  HKG: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  CAN: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  CMB: { code: 'LKR', symbol: 'Rs', name: 'Sri Lanka Rupee' },
  DAC: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  KTM: { code: 'NPR', symbol: 'Rs', name: 'Nepali Rupee' },
};

export async function getINRRate(toCurrency: string): Promise<number | null> {
  const key = `INR_${toCurrency}`;
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) { return cached.rate; }

  try {
    const res = await fetch(`${BASE_URL}/latest?from=INR&to=${toCurrency}`);
    if (!res.ok) { return null; }
    const json = await res.json();
    const rate = json?.rates?.[toCurrency] as number | undefined;
    if (!rate) { return null; }
    _cache.set(key, { rate, ts: Date.now() });
    return rate;
  } catch {
    return null;
  }
}

export async function getDestinationCurrency(arrIata: string): Promise<{
  currencyCode: string;
  symbol: string;
  name: string;
  rate: number;
} | null> {
  const dest = DESTINATION_CURRENCIES[arrIata];
  if (!dest) { return null; }
  const rate = await getINRRate(dest.code);
  if (!rate) { return null; }
  return { currencyCode: dest.code, symbol: dest.symbol, name: dest.name, rate };
}

export function formatConversion(inr: number, rate: number, symbol: string): string {
  const converted = inr * rate;
  if (converted >= 100) { return `${symbol}${Math.round(converted).toLocaleString()}`; }
  return `${symbol}${converted.toFixed(2)}`;
}
