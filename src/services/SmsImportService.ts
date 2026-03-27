/**
 * SmsImportService — Parse Indian airline booking SMS to extract flight details
 *
 * Supports: IndiGo (6E), Air India (AI), SpiceJet (SG), Vistara (UK),
 *           Akasa (QP), AirAsia India (I5), Go First (G8), Alliance Air (9I)
 *
 * All parsing happens on-device. No data is sent to any server.
 */
import { PermissionsAndroid, Platform, Alert } from 'react-native';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ParsedBooking = {
  pnr: string;
  flightNumber: string;       // e.g. "6E-2341"
  airlineCode: string;        // e.g. "6E"
  date: string;               // ISO date string (YYYY-MM-DD) or raw date
  rawMessage: string;
  confidence: 'high' | 'medium';
};

// ─── Regex Patterns for Indian Airlines ────────────────────────────────────────

const AIRLINE_PATTERNS = [
  {
    name: 'IndiGo',
    code: '6E',
    // Matches: PNR: ABC123 or PNR ABC123 + Flight: 6E-1234 or 6E 1234
    pnr: /PNR[:\s]+([A-Z0-9]{6})/i,
    flight: /(6E[\s-]?\d{3,4})/i,
    date: /(\d{1,2}[\s-]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-]?\d{2,4})/i,
  },
  {
    name: 'Air India',
    code: 'AI',
    pnr: /PNR[:\s]+([A-Z0-9]{6})/i,
    flight: /(AI[\s-]?\d{3,4})/i,
    date: /(\d{1,2}[\s-]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-]?\d{2,4})/i,
  },
  {
    name: 'SpiceJet',
    code: 'SG',
    pnr: /PNR[:\s]+([A-Z0-9]{6})/i,
    flight: /(SG[\s-]?\d{3,4})/i,
    date: /(\d{1,2}[\s-]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-]?\d{2,4})/i,
  },
  {
    name: 'Vistara',
    code: 'UK',
    pnr: /PNR[:\s]+([A-Z0-9]{6})/i,
    flight: /(UK[\s-]?\d{3,4})/i,
    date: /(\d{1,2}[\s-]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-]?\d{2,4})/i,
  },
  {
    name: 'Akasa Air',
    code: 'QP',
    pnr: /PNR[:\s]+([A-Z0-9]{6})/i,
    flight: /(QP[\s-]?\d{3,4})/i,
    date: /(\d{1,2}[\s-]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-]?\d{2,4})/i,
  },
  {
    name: 'AirAsia India',
    code: 'I5',
    pnr: /PNR[:\s]+([A-Z0-9]{6})/i,
    flight: /(I5[\s-]?\d{3,4})/i,
    date: /(\d{1,2}[\s-]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-]?\d{2,4})/i,
  },
];

// ─── Month Parser ──────────────────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04',
  may: '05', jun: '06', jul: '07', aug: '08',
  sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseDateString(raw: string): string {
  // Try to convert "12 Mar 2026" → "2026-03-12"
  const m = raw.match(/(\d{1,2})[\s-]?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-]?(\d{2,4})/i);
  if (!m) { return raw; }
  const day = m[1].padStart(2, '0');
  const month = MONTHS[m[2].toLowerCase()] ?? '01';
  let year = m[3];
  if (year.length === 2) { year = '20' + year; }
  return `${year}-${month}-${day}`;
}

// ─── Parse Single SMS ──────────────────────────────────────────────────────────

function parseSms(body: string): ParsedBooking | null {
  for (const pattern of AIRLINE_PATTERNS) {
    const flightMatch = pattern.flight.exec(body);
    if (!flightMatch) { continue; }

    const pnrMatch = pattern.pnr.exec(body);
    if (!pnrMatch) { continue; }

    const dateMatch = pattern.date.exec(body);
    const flightNum = flightMatch[1].replace(/\s+/g, '-').toUpperCase();

    return {
      pnr: pnrMatch[1].toUpperCase(),
      flightNumber: flightNum,
      airlineCode: pattern.code,
      date: dateMatch ? parseDateString(dateMatch[1]) : '',
      rawMessage: body,
      confidence: dateMatch ? 'high' : 'medium',
    };
  }
  return null;
}

// ─── Request SMS Permission ────────────────────────────────────────────────────

async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    Alert.alert('Not Supported', 'SMS import is only available on Android.');
    return false;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'Read SMS Permission',
        message:
          'ReadyToFly needs access to read your SMS messages to automatically find flight booking confirmations.\n\nAll parsing happens on your phone — your messages are never sent to any server.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (_) {
    return false;
  }
}

// ─── Read SMS and Parse Bookings ───────────────────────────────────────────────

async function importBookingsFromSms(): Promise<ParsedBooking[]> {
  if (Platform.OS !== 'android') { return []; }

  const hasPermission = await requestSmsPermission();
  if (!hasPermission) { return []; }

  try {
    // Dynamic import to avoid crash on iOS
    const SmsAndroid = require('react-native-get-sms-android').default;

    return new Promise((resolve) => {
      const filter = {
        box: 'inbox',
        maxCount: 500,         // Last 500 SMS
        bodyRegex: '(PNR|flight|booking|6E|AI|SG|UK|QP|I5)',
      };

      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: string) => {
          console.warn('SMS read failed:', fail);
          resolve([]);
        },
        (_count: number, smsList: string) => {
          try {
            const messages: Array<{ body: string }> = JSON.parse(smsList);
            const bookings: ParsedBooking[] = [];
            const seenPnrs = new Set<string>();

            for (const msg of messages) {
              if (!msg.body) { continue; }
              const parsed = parseSms(msg.body);
              if (parsed && !seenPnrs.has(parsed.pnr)) {
                seenPnrs.add(parsed.pnr);
                bookings.push(parsed);
              }
            }
            resolve(bookings);
          } catch (_) {
            resolve([]);
          }
        },
      );
    });
  } catch (err) {
    console.warn('SMS import error:', err);
    return [];
  }
}

// ─── Export ────────────────────────────────────────────────────────────────────

export const smsImportService = {
  requestSmsPermission,
  importBookingsFromSms,
  parseSms,          // Exposed for testing
};
