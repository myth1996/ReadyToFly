/**
 * CabService — Cab deep-link builder + affiliate click logging
 *
 * Supports Uber, Ola, Rapido with GPS pickup.
 * All clicks logged to Firestore for future affiliate integration.
 * Airport coordinates are looked up from the AIRPORTS data.
 */
import { Linking, Platform, PermissionsAndroid } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Geolocation from 'react-native-geolocation-service';
import { AIRPORTS } from '../data/airports';

// Airport lat/lng for deep-link drop points
const AIRPORT_COORDS: Record<string, { lat: number; lng: number }> = {
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
  SIN: { lat: 1.3644, lng: 103.9915 },
  DXB: { lat: 25.2532, lng: 55.3657 },
  LHR: { lat: 51.4700, lng: -0.4543 },
  BKK: { lat: 13.6811, lng: 100.7472 },
  KUL: { lat: 2.7456, lng: 101.7072 },
  DOH: { lat: 25.2609, lng: 51.6138 },
  AUH: { lat: 24.4330, lng: 54.6511 },
};

export type CabProvider = 'uber' | 'ola' | 'rapido';
export type CabDirection = 'to_airport' | 'from_airport';

export interface CabOption {
  provider: CabProvider;
  label: string;
  emoji: string;
  fareMin: number;
  fareMax: number;
  etaMin: number;
  etaMax: number;
  color: string;
}

// Static fare ranges per 15km (adjust as needed)
const FARE_RANGES: Record<CabProvider, { min: number; max: number; etaMin: number; etaMax: number }> = {
  uber:   { min: 260, max: 360, etaMin: 3, etaMax: 8 },
  ola:    { min: 220, max: 320, etaMin: 4, etaMax: 10 },
  rapido: { min: 180, max: 260, etaMin: 2, etaMax: 6 },
};

export function getCabOptions(): CabOption[] {
  return [
    { provider: 'uber',   label: 'Uber',   emoji: '⚫', fareMin: FARE_RANGES.uber.min,   fareMax: FARE_RANGES.uber.max,   etaMin: FARE_RANGES.uber.etaMin,   etaMax: FARE_RANGES.uber.etaMax,   color: '#000000' },
    { provider: 'ola',    label: 'Ola',    emoji: '🟢', fareMin: FARE_RANGES.ola.min,    fareMax: FARE_RANGES.ola.max,    etaMin: FARE_RANGES.ola.etaMin,    etaMax: FARE_RANGES.ola.etaMax,    color: '#3CBA58' },
    { provider: 'rapido', label: 'Rapido', emoji: '🟡', fareMin: FARE_RANGES.rapido.min, fareMax: FARE_RANGES.rapido.max, etaMin: FARE_RANGES.rapido.etaMin, etaMax: FARE_RANGES.rapido.etaMax, color: '#FFD600' },
  ];
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') { return true; }
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      { title: 'Location Permission', message: 'ReadyToFly needs your location to pre-fill cab pickup.', buttonPositive: 'Allow', buttonNegative: 'Not Now' },
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

export async function openCab(
  provider: CabProvider,
  airportIata: string,
  direction: CabDirection,
  userCoords: { lat: number; lng: number } | null,
): Promise<void> {
  const airport = AIRPORT_COORDS[airportIata];
  const airportName = AIRPORTS[airportIata]?.name ?? 'Airport';

  const pickupLat  = direction === 'to_airport' ? (userCoords?.lat ?? 0) : (airport?.lat ?? 0);
  const pickupLng  = direction === 'to_airport' ? (userCoords?.lng ?? 0) : (airport?.lng ?? 0);
  const dropLat    = direction === 'to_airport' ? (airport?.lat ?? 0)   : (userCoords?.lat ?? 0);
  const dropLng    = direction === 'to_airport' ? (airport?.lng ?? 0)   : (userCoords?.lng ?? 0);
  const dropName   = direction === 'to_airport' ? airportName : 'Home';
  const pickupName = direction === 'to_airport' ? 'Current Location' : airportName;

  let deepLink: string;
  let webFallback: string;

  switch (provider) {
    case 'uber':
      deepLink    = `uber://?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&pickup[nickname]=${encodeURIComponent(pickupName)}&dropoff[latitude]=${dropLat}&dropoff[longitude]=${dropLng}&dropoff[nickname]=${encodeURIComponent(dropName)}`;
      webFallback = `https://m.uber.com/looking?drop[0][latitude]=${dropLat}&drop[0][longitude]=${dropLng}`;
      break;
    case 'ola':
      deepLink    = `olacabs://app/launch?pick_lat=${pickupLat}&pick_lng=${pickupLng}&drop_lat=${dropLat}&drop_lng=${dropLng}&coupon_code=`;
      webFallback = `https://book.olacabs.com/?serviceType=p2p&pickup_lat=${pickupLat}&pickup_lng=${pickupLng}&drop_lat=${dropLat}&drop_lng=${dropLng}`;
      break;
    case 'rapido':
      deepLink    = `rapido://book?pickup_lat=${pickupLat}&pickup_lng=${pickupLng}&drop_lat=${dropLat}&drop_lng=${dropLng}`;
      webFallback = 'https://rapido.bike/';
      break;
  }

  try {
    const canOpen = await Linking.canOpenURL(deepLink);
    await Linking.openURL(canOpen ? deepLink : webFallback);
  } catch {
    await Linking.openURL(webFallback);
  }
}

export async function logCabClick(
  uid: string | null,
  provider: CabProvider,
  direction: CabDirection,
  airportIata: string,
): Promise<void> {
  try {
    await firestore().collection('cab_clicks').add({
      uid: uid ?? 'anonymous',
      provider,
      direction,
      airportIata,
      clickedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch {
    // Non-fatal — click tracking should never break the booking flow
  }
}
