/**
 * CabService — Fare comparison engine ported from Comparify/FirstPaisa
 *
 * Uses haversine distance + linear per-km fare model for each platform.
 * Supports Uber, Ola, Rapido, Namma Yatri with multiple ride types each.
 * Deep links pre-fill pickup/drop coordinates in each app.
 */
import { Linking, Platform, PermissionsAndroid } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Geolocation from 'react-native-geolocation-service';
import { AIRPORTS } from '../data/airports';

// ─── Airport coordinates ──────────────────────────────────────────────────────
export const AIRPORT_COORDS: Record<string, { lat: number; lng: number }> = {
  DEL: { lat: 28.5562, lng: 77.1000 },
  BOM: { lat: 19.0896, lng: 72.8656 },
  BLR: { lat: 13.1986, lng: 77.7066 },
  MAA: { lat: 12.9941, lng: 80.1709 },
  HYD: { lat: 17.2403, lng: 78.4294 },
  CCU: { lat: 22.6520, lng: 88.4463 },
  COK: { lat: 10.1520, lng: 76.3918 },
  AMD: { lat: 23.0772, lng: 72.6347 },
  GOI: { lat: 15.3808, lng: 73.8314 },
  PNQ: { lat: 18.5822, lng: 73.9197 },
  JAI: { lat: 26.8242, lng: 75.8122 },
  LKO: { lat: 26.7606, lng: 80.8893 },
  PAT: { lat: 25.5913, lng: 85.0878 },
  IXC: { lat: 30.6735, lng: 76.7885 },
  SXR: { lat: 33.9871, lng: 74.7742 },
  BBI: { lat: 20.2444, lng: 85.8177 },
  NAG: { lat: 21.0922, lng: 79.0472 },
  TRV: { lat: 8.4821,  lng: 76.9201 },
  VTZ: { lat: 17.7212, lng: 83.2245 },
  IXE: { lat: 12.9613, lng: 74.8900 },
  GAU: { lat: 26.1061, lng: 91.5859 },
  RPR: { lat: 21.1804, lng: 81.7388 },
  // International fallbacks
  SIN: { lat: 1.3644,  lng: 103.9915 },
  DXB: { lat: 25.2532, lng: 55.3657 },
  LHR: { lat: 51.4700, lng: -0.4543 },
  BKK: { lat: 13.6811, lng: 100.7472 },
  KUL: { lat: 2.7456,  lng: 101.7072 },
  DOH: { lat: 25.2609, lng: 51.6138 },
  AUH: { lat: 24.4330, lng: 54.6511 },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type CabProvider = 'uber' | 'ola' | 'rapido' | 'namma_yatri';
export type CabDirection = 'to_airport' | 'from_airport';

export interface CabOption {
  provider: CabProvider;
  label: string;
  rideType: string;
  emoji: string;
  fareMin: number;
  fareMax: number;
  etaMin: number;
  etaMax: number;
  color: string;
  deepLink: string;
  webFallback: string;
}

// ─── Haversine distance (km) — ported from Comparify/FirstPaisa ───────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Road distance is ~1.3× straight-line for Indian cities
const ROAD_FACTOR = 1.3;

// ─── Per-platform fare models (from Comparify) ────────────────────────────────
// Fare = baseFare + distanceKm * perKm, then ±variance for min/max

const UBER_MODELS = [
  { rideType: 'UberGo',    baseFare: 50,  perKm: 12, etaFactor: 2.5, fareVariance: [0.90, 1.15], etaOffset: 0 },
  { rideType: 'Uber Auto', baseFare: 30,  perKm: 9,  etaFactor: 2.5, fareVariance: [0.90, 1.10], etaOffset: 2 },
];

const OLA_MODELS = [
  { rideType: 'Mini',      baseFare: 45,  perKm: 11, etaFactor: 2.5, fareVariance: [0.90, 1.15], etaOffset: 0 },
  { rideType: 'Auto',      baseFare: 30,  perKm: 8,  etaFactor: 2.5, fareVariance: [0.90, 1.10], etaOffset: 3 },
  { rideType: 'Prime',     baseFare: 80,  perKm: 16, etaFactor: 2.2, fareVariance: [0.90, 1.10], etaOffset: -1 },
];

const RAPIDO_MODELS = [
  { rideType: 'Bike',      baseFare: 25,  perKm: 8,  etaFactor: 2.0, fareVariance: [0.90, 1.10], etaOffset: 0 },
  { rideType: 'Auto',      baseFare: 32,  perKm: 10, etaFactor: 2.2, fareVariance: [0.90, 1.10], etaOffset: 2 },
];

const NAMMA_MODELS = [
  { rideType: 'Auto',      baseFare: 30,  perKm: 9,  etaFactor: 2.2, fareVariance: [0.90, 1.10], etaOffset: 0 },
];

// ─── Deep link builders ───────────────────────────────────────────────────────
function uberDeepLink(pLat: number, pLng: number, dLat: number, dLng: number): string {
  return `uber://?action=setPickup&pickup[latitude]=${pLat}&pickup[longitude]=${pLng}&dropoff[latitude]=${dLat}&dropoff[longitude]=${dLng}`;
}
function olaDeepLink(pLat: number, pLng: number, dLat: number, dLng: number): string {
  return `olacabs://app/launch?lat=${pLat}&lng=${pLng}&drop_lat=${dLat}&drop_lng=${dLng}`;
}
function rapidoDeepLink(pLat: number, pLng: number, dLat: number, dLng: number): string {
  return `in.rapido.app://booking?slat=${pLat}&slng=${pLng}&dlat=${dLat}&dlng=${dLng}`;
}
function nammaDeepLink(pLat: number, pLng: number, dLat: number, dLng: number): string {
  return `yatri://open?src_lat=${pLat}&src_lng=${pLng}&dst_lat=${dLat}&dst_lng=${dLng}`;
}

// ─── Fare calculation ─────────────────────────────────────────────────────────
export function getCabOptions(
  userCoords: { lat: number; lng: number } | null,
  airportIata: string,
  direction: CabDirection,
): CabOption[] {
  const airport = AIRPORT_COORDS[airportIata] ?? { lat: 0, lng: 0 };
  const user = userCoords ?? { lat: 0, lng: 0 };

  const pLat = direction === 'to_airport' ? user.lat : airport.lat;
  const pLng = direction === 'to_airport' ? user.lng : airport.lng;
  const dLat = direction === 'to_airport' ? airport.lat : user.lat;
  const dLng = direction === 'to_airport' ? airport.lng : user.lng;

  // Straight-line km × road factor
  const distKm = userCoords
    ? haversineKm(pLat, pLng, dLat, dLng) * ROAD_FACTOR
    : 20; // default fallback if no GPS

  const build = (
    provider: CabProvider,
    emoji: string,
    color: string,
    models: typeof UBER_MODELS,
    deepLinkFn: (pLat: number, pLng: number, dLat: number, dLng: number) => string,
    webFallback: string,
  ): CabOption[] =>
    models.map(m => {
      const fare = m.baseFare + distKm * m.perKm;
      const eta = Math.max(2, Math.round(distKm * m.etaFactor) + m.etaOffset);
      return {
        provider,
        label: provider.charAt(0).toUpperCase() + provider.slice(1).replace('_', ' '),
        rideType: m.rideType,
        emoji,
        fareMin: Math.round(fare * m.fareVariance[0]),
        fareMax: Math.round(fare * m.fareVariance[1]),
        etaMin: Math.max(2, eta - 2),
        etaMax: eta + 3,
        color,
        deepLink: deepLinkFn(pLat, pLng, dLat, dLng),
        webFallback,
      };
    });

  const options: CabOption[] = [
    ...build('uber',        '⚫', '#000000', UBER_MODELS,   uberDeepLink,   'https://m.uber.com/ul/'),
    ...build('ola',         '🟢', '#3CBA58', OLA_MODELS,    olaDeepLink,    'https://book.olacabs.com/'),
    ...build('rapido',      '🟡', '#FFD600', RAPIDO_MODELS, rapidoDeepLink, 'https://rapido.bike/'),
    ...build('namma_yatri', '🔵', '#1B6FE8', NAMMA_MODELS,  nammaDeepLink,  'https://nammayatri.in/'),
  ];

  // Sort cheapest first
  return options.sort((a, b) => a.fareMin - b.fareMin);
}

// ─── Location helpers ─────────────────────────────────────────────────────────
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') { return true; }
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'ReadyToFly needs your location to calculate accurate cab fares.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not Now',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  });
}

// ─── Book a cab (deep link → web fallback) ────────────────────────────────────
export async function openCab(option: CabOption): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(option.deepLink);
    await Linking.openURL(canOpen ? option.deepLink : option.webFallback);
  } catch {
    await Linking.openURL(option.webFallback);
  }
}

// ─── Firestore click logging ──────────────────────────────────────────────────
export async function logCabClick(
  uid: string | null,
  provider: CabProvider,
  rideType: string,
  direction: CabDirection,
  airportIata: string,
  fareMin: number,
): Promise<void> {
  try {
    await firestore().collection('cab_clicks').add({
      uid: uid ?? 'anonymous',
      provider,
      rideType,
      direction,
      airportIata,
      fareMin,
      clickedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch {
    // Non-fatal
  }
}
