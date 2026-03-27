/**
 * GmailImportService — Scan Gmail for Indian airline booking confirmations
 *
 * Uses the Gmail REST API with the Google OAuth access token stored
 * in AuthContext. All parsing is on-device — email bodies are only
 * read locally and never forwarded to any server.
 *
 * Requires: Google Sign-In with gmail.readonly scope (already configured
 * in AuthContext).
 */

import { ParsedBooking } from './SmsImportService';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

// ─── Airline sender domains ───────────────────────────────────────────────────

/** Gmail search query to find booking confirmation emails from Indian airlines */
const BOOKING_QUERY = [
  'from:(noreply@goindigo.in',
  'booking@goindigo.in',
  'info@goindigo.in',
  'noreply@airindia.in',
  'booking@airindia.in',
  'info@spicejet.com',
  'noreply@spicejet.com',
  'noreply@airvistara.com',
  'booking@akasaair.com',
  'noreply@airasia.com',
  'booking@airasia.com)',
  'subject:(booking confirmation OR PNR OR e-ticket OR itinerary)',
].join(' ');

// ─── Regex patterns (same logic as SmsImportService) ─────────────────────────

const EMAIL_PATTERNS = [
  { name: 'IndiGo',      code: '6E', flight: /(6E[\s-]?\d{3,4})/i },
  { name: 'Air India',   code: 'AI', flight: /(AI[\s-]?\d{3,4})/i },
  { name: 'SpiceJet',    code: 'SG', flight: /(SG[\s-]?\d{3,4})/i },
  { name: 'Vistara',     code: 'UK', flight: /(UK[\s-]?\d{3,4})/i },
  { name: 'Akasa Air',   code: 'QP', flight: /(QP[\s-]?\d{3,4})/i },
  { name: 'AirAsia',     code: 'I5', flight: /(I5[\s-]?\d{3,4})/i },
];

const PNR_RE  = /PNR[:\s#]+([A-Z0-9]{5,8})/i;
const DATE_RE = /(\d{1,2})[\s-]?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-]?(\d{2,4})/i;

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04',
  may: '05', jun: '06', jul: '07', aug: '08',
  sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseDateString(raw: string): string {
  const m = raw.match(/(\d{1,2})[\s-]?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-]?(\d{2,4})/i);
  if (!m) { return raw; }
  const day   = m[1].padStart(2, '0');
  const month = MONTHS[m[2].toLowerCase()] ?? '01';
  let year    = m[3];
  if (year.length === 2) { year = '20' + year; }
  return `${year}-${month}-${day}`;
}

function parseEmailBody(body: string): ParsedBooking | null {
  for (const pattern of EMAIL_PATTERNS) {
    const flightMatch = pattern.flight.exec(body);
    if (!flightMatch) { continue; }
    const pnrMatch  = PNR_RE.exec(body);
    if (!pnrMatch) { continue; }
    const dateMatch = DATE_RE.exec(body);
    return {
      pnr:          pnrMatch[1].toUpperCase(),
      flightNumber: flightMatch[1].replace(/\s+/g, '-').toUpperCase(),
      airlineCode:  pattern.code,
      date:         dateMatch ? parseDateString(dateMatch[0]) : '',
      rawMessage:   body.slice(0, 300),   // keep snippet only, never store full email
      confidence:   dateMatch ? 'high' : 'medium',
    };
  }
  return null;
}

// ─── Base64 URL-safe decoder ──────────────────────────────────────────────────

function base64Decode(str: string): string {
  // Gmail API returns base64url-encoded bodies (+ → +, / → /)
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
  } catch {
    return '';
  }
}

// ─── Extract plain-text from message parts ───────────────────────────────────

function extractTextFromParts(payload: any): string {
  if (!payload) { return ''; }
  // Direct body
  if (payload.body?.data) {
    return base64Decode(payload.body.data);
  }
  // Multipart — prefer text/plain
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return base64Decode(part.body.data);
      }
    }
    // Fallback: any part with data
    for (const part of payload.parts) {
      const text = extractTextFromParts(part);
      if (text) { return text; }
    }
  }
  return '';
}

// ─── Gmail API helpers ────────────────────────────────────────────────────────

async function gmailGet(path: string, token: string): Promise<any> {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Gmail API error ${res.status}`);
  }
  return res.json();
}

// ─── Main import function ─────────────────────────────────────────────────────

export async function importBookingsFromGmail(
  accessToken: string,
): Promise<ParsedBooking[]> {
  // 1. Search for relevant emails (limit 30 — enough to catch recent bookings)
  const searchResult = await gmailGet(
    `/messages?q=${encodeURIComponent(BOOKING_QUERY)}&maxResults=30`,
    accessToken,
  );

  if (!searchResult.messages || searchResult.messages.length === 0) {
    return [];
  }

  const bookings: ParsedBooking[] = [];
  const seenPnrs = new Set<string>();

  // 2. Fetch each message body in parallel (max 10 at once)
  const ids: string[] = searchResult.messages.map((m: any) => m.id);

  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const messages = await Promise.all(
      batch.map(id =>
        gmailGet(
          `/messages/${id}?format=full&fields=payload,snippet`,
          accessToken,
        ).catch(() => null),
      ),
    );

    for (const msg of messages) {
      if (!msg) { continue; }
      // Use snippet first (fast), fall back to full body
      const snippet  = msg.snippet ?? '';
      const fullText = extractTextFromParts(msg.payload);
      const text     = fullText || snippet;

      const parsed = parseEmailBody(text);
      if (parsed && !seenPnrs.has(parsed.pnr)) {
        seenPnrs.add(parsed.pnr);
        bookings.push(parsed);
      }
    }
  }

  return bookings;
}

export const gmailImportService = { importBookingsFromGmail };
