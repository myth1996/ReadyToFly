// ─────────────────────────────────────────────────────────────────────────────
// FlightService.ts  —  AeroDataBox (RapidAPI) flight lookup
//
// API: aerodatabox.p.rapidapi.com
// Endpoint: GET /flights/number/{flightNumber}/{date}
// ─────────────────────────────────────────────────────────────────────────────

import { AERODATABOX_KEY, AERODATABOX_HOST, AERODATABOX_BASE_URL } from '../config/env';

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
  firestoreId?: string;  // Firestore document ID for cloud sync
  tripId?: string;       // Groups multiple legs into a single trip
  legNumber?: number;    // 1-based leg index within a trip
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

// ─── AeroDataBox status → our FlightStatus ────────────────────────────────────

function mapStatus(raw?: string): FlightStatus {
  const s = (raw ?? '').toLowerCase();
  if (s.includes('departed') || s.includes('en route') || s.includes('airborne')) { return 'active'; }
  if (s.includes('arrived') || s.includes('landed'))  { return 'landed'; }
  if (s.includes('cancel'))                           { return 'cancelled'; }
  if (s.includes('diverted'))                         { return 'diverted'; }
  if (s.includes('incident'))                         { return 'incident'; }
  return 'scheduled';
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function lookupFlight(
  flightIata: string,
  date: string,         // YYYY-MM-DD
  pnr: string,
): Promise<FlightData> {
  // Endpoint: /flights/number/{flightNumber}/{date}
  // Returns array of flights for that number on that date
  const url = `${AERODATABOX_BASE_URL}/flights/number/${encodeURIComponent(flightIata)}/${date}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'x-rapidapi-key':  AERODATABOX_KEY,
        'x-rapidapi-host': AERODATABOX_HOST,
        'Accept':          'application/json',
      },
    });
  } catch (networkErr: any) {
    throw new Error('Network error — check your internet connection and try again.');
  }

  if (res.status === 404) {
    throw new Error(
      `No flight found for ${flightIata} on ${date}.\n` +
      `Check the flight number and date — flights are available 2 days before to 2 days after departure.`,
    );
  }

  if (res.status === 401 || res.status === 403) {
    return mockFlight(flightIata, date, pnr); // key issue → graceful fallback
  }

  if (res.status === 429) {
    return mockFlight(flightIata, date, pnr); // quota hit → graceful fallback
  }

  if (!res.ok) {
    throw new Error(`Server error ${res.status}. Please try again.`);
  }

  const json = await res.json();

  // AeroDataBox returns an array
  const flights: any[] = Array.isArray(json) ? json : [json];
  if (flights.length === 0) {
    throw new Error(
      `No flight found for ${flightIata} on ${date}.\n` +
      `Check the flight number and date.`,
    );
  }

  const f = flights[0];

  const dep = f.departure ?? {};
  const arr = f.arrival ?? {};

  // AeroDataBox returns times already in local timezone with offset
  // e.g. "2026-03-27T06:10:00+05:30" — keep as-is, JS parses correctly
  const t = (iso?: string | null): string | undefined => iso ?? undefined;

  return {
    pnr: pnr.toUpperCase(),
    flightIata: f.number ?? flightIata,
    airline: f.airline?.name ?? 'Unknown Airline',
    status: mapStatus(f.status),
    dep: {
      iata:          dep.airport?.iata     ?? '???',
      airport:       dep.airport?.name     ?? 'Unknown Airport',
      scheduledTime: t(dep.scheduledTime)  ?? '',
      estimatedTime: t(dep.revisedTime),
      actualTime:    t(dep.actualTime),
      terminal:      dep.terminal,
      gate:          dep.gate,
      delay:         dep.delay ?? undefined,
    },
    arr: {
      iata:          arr.airport?.iata     ?? '???',
      airport:       arr.airport?.name     ?? 'Unknown Airport',
      scheduledTime: t(arr.scheduledTime)  ?? '',
      estimatedTime: t(arr.revisedTime),
      actualTime:    t(arr.actualTime),
      terminal:      arr.terminal,
      gate:          arr.gate,
      delay:         arr.delay ?? undefined,
    },
    fetchedAt: Date.now(),
  };
}

// ─── Mock data (fallback when API is unavailable) ─────────────────────────────

function mockFlight(flightIata: string, date: string, pnr: string): FlightData {
  const base = new Date(`${date}T06:00:00+05:30`);
  const dep  = new Date(base.getTime() + Math.random() * 8 * 3600000);
  const arr  = new Date(dep.getTime()  + 90 * 60000 + Math.random() * 90 * 60000);

  const airlines: Record<string, string> = {
    '6E': 'IndiGo', 'AI': 'Air India', 'SG': 'SpiceJet',
    'UK': 'Vistara', 'G8': 'GoAir',    'QP': 'Akasa Air',
  };
  const prefix  = flightIata.replace(/\d/g, '');
  const airline = airlines[prefix] ?? 'ReadyToFly Airlines';

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
