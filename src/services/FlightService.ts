// ─────────────────────────────────────────────────────────────────────────────
// FlightService.ts  —  AviationStack flight lookup
//
// Get your free API key (500 calls/month) at https://aviationstack.com
// Free tier: 500 calls/month. Upgrade for higher limits.
// ─────────────────────────────────────────────────────────────────────────────

import { AVIATION_STACK_KEY } from '../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FlightStatus =
  | 'scheduled'
  | 'active'
  | 'landed'
  | 'cancelled'
  | 'incident'
  | 'diverted';

export interface FlightEndpoint {
  iata: string;
  airport: string;
  scheduledTime: string;  // ISO 8601
  estimatedTime?: string;
  actualTime?: string;
  terminal?: string;
  gate?: string;
  delay?: number;         // minutes
}

export interface FlightData {
  pnr: string;           // user-entered, stored for reference
  flightIata: string;    // e.g. "6E204"
  airline: string;       // e.g. "IndiGo"
  status: FlightStatus;
  dep: FlightEndpoint;
  arr: FlightEndpoint;
  fetchedAt: number;     // timestamp
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format ISO time string → "10:30 AM" */
export function formatISOTime(iso?: string): string {
  if (!iso) { return '--:--'; }
  try {
    const date = new Date(iso);
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${((h % 12) || 12)}:${m} ${ampm}`;
  } catch {
    return '--:--';
  }
}

/** Normalize user input to IATA flight code: "6e 204" → "6E204" */
export function normalizeFlightNumber(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

/** Status display label */
export function statusLabel(status: FlightStatus): string {
  const map: Record<FlightStatus, string> = {
    scheduled: 'Scheduled',
    active: 'In Air',
    landed: 'Landed',
    cancelled: 'Cancelled',
    incident: 'Incident',
    diverted: 'Diverted',
  };
  return map[status] ?? 'Unknown';
}

/** Status badge colour */
export function statusColor(status: FlightStatus): string {
  const map: Record<FlightStatus, string> = {
    scheduled: '#1A56A6',
    active: '#10B981',
    landed: '#6B7280',
    cancelled: '#EF4444',
    incident: '#EF4444',
    diverted: '#F59E0B',
  };
  return map[status] ?? '#6B7280';
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function lookupFlight(
  flightIata: string,
  date: string,         // YYYY-MM-DD
  pnr: string,
): Promise<FlightData> {
  if (AVIATION_STACK_KEY === 'YOUR_AVIATIONSTACK_KEY_HERE') {
    // Return a realistic mock so the animation can be tested
    // before the real API key is configured.
    return mockFlight(flightIata, date, pnr);
  }

  const url =
    `https://api.aviationstack.com/v1/flights` +
    `?access_key=${AVIATION_STACK_KEY}` +
    `&flight_iata=${flightIata}` +
    `&flight_date=${date}`;

  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    throw new Error(`Server error ${res.status}. Check your API key.`);
  }

  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message || 'API error — check your key or plan.');
  }

  if (!json.data || json.data.length === 0) {
    throw new Error(
      `No flight found for ${flightIata} on ${date}.\n` +
      `Check the flight number and date — some flights are only available 24–48 hrs before departure.`,
    );
  }

  const f = json.data[0];

  return {
    pnr: pnr.toUpperCase(),
    flightIata: f.flight?.iata ?? flightIata,
    airline: f.airline?.name ?? 'Unknown Airline',
    status: (f.flight_status as FlightStatus) ?? 'scheduled',
    dep: {
      iata: f.departure?.iata ?? '???',
      airport: f.departure?.airport ?? 'Unknown Airport',
      scheduledTime: f.departure?.scheduled ?? '',
      estimatedTime: f.departure?.estimated,
      actualTime: f.departure?.actual,
      terminal: f.departure?.terminal,
      gate: f.departure?.gate,
      delay: f.departure?.delay,
    },
    arr: {
      iata: f.arrival?.iata ?? '???',
      airport: f.arrival?.airport ?? 'Unknown Airport',
      scheduledTime: f.arrival?.scheduled ?? '',
      estimatedTime: f.arrival?.estimated,
      actualTime: f.arrival?.actual,
      terminal: f.arrival?.terminal,
      gate: f.arrival?.gate,
      delay: f.arrival?.delay,
    },
    fetchedAt: Date.now(),
  };
}

// ─── Mock data (used when API key is not yet configured) ─────────────────────

function mockFlight(flightIata: string, date: string, pnr: string): FlightData {
  const base = new Date(`${date}T06:00:00+05:30`);
  const dep = new Date(base.getTime() + Math.random() * 8 * 3600000);
  const arr = new Date(dep.getTime() + 90 * 60000 + Math.random() * 90 * 60000);

  const airlines: Record<string, string> = {
    '6E': 'IndiGo', 'AI': 'Air India', 'SG': 'SpiceJet',
    'UK': 'Vistara', 'G8': 'GoAir', 'QP': 'Akasa Air',
  };
  const prefix = flightIata.replace(/\d/g, '');
  const airline = airlines[prefix] ?? 'FlyEasy Airlines';

  return {
    pnr: pnr.toUpperCase() || 'DEMO01',
    flightIata: flightIata || '6E204',
    airline,
    status: 'scheduled',
    dep: {
      iata: 'DEL', airport: 'Indira Gandhi International',
      scheduledTime: dep.toISOString(),
      terminal: '2', gate: 'B12',
    },
    arr: {
      iata: 'BLR', airport: 'Kempegowda International',
      scheduledTime: arr.toISOString(),
      terminal: '1', gate: 'A5',
    },
    fetchedAt: Date.now(),
  };
}
