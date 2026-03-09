/**
 * GmailService — Fetches flight booking emails using Gmail REST API.
 *
 * Uses the OAuth access token from Google Sign-In
 * (scope: https://www.googleapis.com/auth/gmail.readonly).
 *
 * All parsing is done on-device. No data is sent to FlyEasy servers.
 */

export interface GmailFlight {
  flightIata: string;   // e.g. "6E2345"
  pnr?: string;         // e.g. "ABC123"
  date?: string;        // e.g. "2024-03-15"
  airline?: string;     // e.g. "IndiGo"
  subject?: string;     // email subject for display
  snippet?: string;     // short preview
}

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

// Flight number pattern: 2-letter code + 1–4 digits (e.g. 6E2345, AI101, UK888)
const FLIGHT_RE  = /\b([A-Z0-9]{2})\s*(\d{1,4})\b/g;
// PNR pattern: 5–6 uppercase alphanumeric
const PNR_RE     = /\bPNR[:\s#]*([A-Z0-9]{5,7})\b/gi;
// Booking ref / confirmation
const BOOKING_RE = /\b(booking(?:\s+ref(?:erence)?)?|confirmation(?:\s+no)?|ref(?:erence)?|record\s+locator)[:\s#]+([A-Z0-9]{5,8})\b/gi;
// Date: e.g. "15 Mar 2024", "2024-03-15", "15/03/2024"
const DATE_RE    = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\b/gi;

// Airline name → IATA prefix mapping
const AIRLINE_MAP: Record<string, string> = {
  'indigo': '6E',
  'air india': 'AI',
  'spicejet': 'SG',
  'vistara': 'UK',
  'go first': 'G8',
  'go air': 'G8',
  'akasa': 'QP',
  'star air': 'S5',
  'alliance air': '9I',
};

function extractFlights(text: string, subject: string, snippet: string): GmailFlight[] {
  const results: GmailFlight[] = [];
  const seen = new Set<string>();

  // Try to find airline name for context
  const lc = text.toLowerCase();
  let inferredPrefix: string | undefined;
  for (const [name, code] of Object.entries(AIRLINE_MAP)) {
    if (lc.includes(name)) { inferredPrefix = code; break; }
  }

  // Extract PNR
  let pnr: string | undefined;
  let m = PNR_RE.exec(text);
  if (m) { pnr = m[1]; } else {
    PNR_RE.lastIndex = 0;
    m = BOOKING_RE.exec(text);
    if (m) { pnr = m[2]; }
  }
  BOOKING_RE.lastIndex = 0;

  // Extract date
  let date: string | undefined;
  DATE_RE.lastIndex = 0;
  const dm = DATE_RE.exec(text);
  if (dm) { date = dm[1]; }
  DATE_RE.lastIndex = 0;

  // Extract flight numbers
  FLIGHT_RE.lastIndex = 0;
  let fm: RegExpExecArray | null;
  while ((fm = FLIGHT_RE.exec(text)) !== null) {
    const prefix = fm[1];
    const num    = fm[2];
    // Skip if prefix looks like a year or random number
    if (/^\d{2}$/.test(prefix)) { continue; }
    const flightIata = prefix + num;
    if (seen.has(flightIata)) { continue; }
    seen.add(flightIata);

    results.push({
      flightIata,
      pnr,
      date,
      airline: inferredPrefix === prefix
        ? Object.keys(AIRLINE_MAP).find(k => AIRLINE_MAP[k] === prefix)
        : undefined,
      subject: subject.slice(0, 80),
      snippet: snippet.slice(0, 120),
    });
  }

  return results;
}

async function gmailGet(path: string, token: string): Promise<any> {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Gmail API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch flight booking emails from Gmail.
 * Returns parsed flight candidates for the user to review.
 */
export async function fetchFlightEmails(accessToken: string): Promise<GmailFlight[]> {
  // Search query: booking confirmation emails from last 180 days
  const q = encodeURIComponent(
    '(subject:flight OR subject:booking OR subject:"itinerary" OR subject:"e-ticket" OR subject:"boarding pass") newer_than:180d',
  );

  const listData = await gmailGet(`/messages?q=${q}&maxResults=25`, accessToken);
  const messages: Array<{ id: string }> = listData.messages ?? [];

  if (messages.length === 0) { return []; }

  const allFlights: GmailFlight[] = [];

  // Fetch each message snippet (lightweight — no full body needed)
  await Promise.all(
    messages.map(async (msg) => {
      try {
        const detail = await gmailGet(
          `/messages/${msg.id}?format=metadata&metadataHeaders=Subject`,
          accessToken,
        );

        const headers: Array<{ name: string; value: string }> = detail.payload?.headers ?? [];
        const subject = headers.find(h => h.name === 'Subject')?.value ?? '';
        const snippet: string = detail.snippet ?? '';

        const combined = `${subject} ${snippet}`;
        const found = extractFlights(combined, subject, snippet);
        allFlights.push(...found);
      } catch (_) {
        // Skip malformed messages silently
      }
    }),
  );

  // Deduplicate by flightIata
  const seen = new Set<string>();
  return allFlights.filter(f => {
    if (seen.has(f.flightIata)) { return false; }
    seen.add(f.flightIata);
    return true;
  });
}
