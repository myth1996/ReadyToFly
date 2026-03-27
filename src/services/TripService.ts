/**
 * TripService — Multi-leg / connecting flight trip management
 *
 * A "Trip" groups multiple flight legs under one name.
 * e.g. DEL→SIN (SQ517) + SIN→SYD (SQ211) = one trip "Holiday 2026"
 *
 * Data model:
 *  Firestore: users/{uid}/trips/{tripId} { name, createdAt }
 *  Each FlightData now carries an optional `tripId` field.
 */
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_TRIPS_KEY = 'flyeasy_trips';

export interface Trip {
  id: string;
  name: string;
  createdAt: number;
}

// ─── Local storage ────────────────────────────────────────────────────────────

export async function getLocalTrips(): Promise<Trip[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_TRIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveLocalTrips(trips: Trip[]): Promise<void> {
  await AsyncStorage.setItem(LOCAL_TRIPS_KEY, JSON.stringify(trips));
}

// ─── Firestore ────────────────────────────────────────────────────────────────

function tripsRef(uid: string) {
  return firestore().collection('users').doc(uid).collection('trips');
}

export async function createTrip(uid: string | null, name: string): Promise<Trip> {
  const trip: Trip = {
    id: Date.now().toString(),
    name: name.trim(),
    createdAt: Date.now(),
  };

  // Save locally
  const existing = await getLocalTrips();
  await saveLocalTrips([...existing, trip]);

  // Save to Firestore if logged in
  if (uid) {
    try {
      await tripsRef(uid).doc(trip.id).set({ name: trip.name, createdAt: firestore.FieldValue.serverTimestamp() });
    } catch {}
  }

  return trip;
}

export async function getTrips(uid: string | null): Promise<Trip[]> {
  const local = await getLocalTrips();

  if (!uid) { return local; }

  try {
    const snap = await tripsRef(uid).orderBy('createdAt', 'desc').get();
    const cloud: Trip[] = snap.docs.map(d => ({
      id: d.id,
      name: d.data().name as string,
      createdAt: d.data().createdAt?.toMillis?.() ?? Date.now(),
    }));
    // Merge — cloud wins
    const cloudIds = new Set(cloud.map(t => t.id));
    const localOnly = local.filter(t => !cloudIds.has(t.id));
    const merged = [...cloud, ...localOnly];
    await saveLocalTrips(merged);
    return merged;
  } catch {
    return local;
  }
}

export async function deleteTrip(uid: string | null, tripId: string): Promise<void> {
  const local = await getLocalTrips();
  await saveLocalTrips(local.filter(t => t.id !== tripId));
  if (uid) {
    try { await tripsRef(uid).doc(tripId).delete(); } catch {}
  }
}
