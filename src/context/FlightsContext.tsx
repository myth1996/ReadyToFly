import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { FlightData } from '../services/FlightService';
import { FEATURES } from '../config/env';
import { notificationService } from '../services/NotificationService';
import { updateWidget, clearWidget } from '../services/WidgetService';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'flyeasy_flights';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the best available departure time for a flight endpoint:
 * actual → estimated → scheduled (in that priority order).
 * This ensures delays are always reflected in countdowns and displays.
 */
export function effectiveDepTime(dep: FlightData['dep']): string {
  return dep.actualTime || dep.estimatedTime || dep.scheduledTime;
}

/** Returns the soonest upcoming flight (up to 2 hrs after departure) */
export function getNextFlight(flights: FlightData[]): FlightData | null {
  const now = Date.now();
  const upcoming = flights
    .filter(f => new Date(effectiveDepTime(f.dep)).getTime() > now - 2 * 3600_000)
    .sort(
      (a, b) =>
        new Date(effectiveDepTime(a.dep)).getTime() -
        new Date(effectiveDepTime(b.dep)).getTime(),
    );
  return upcoming[0] ?? null;
}

/** Returns a human-readable countdown string */
export function getCountdown(depISO: string): { text: string; urgent: boolean; departed: boolean } {
  const diff = new Date(depISO).getTime() - Date.now();

  if (diff < -2 * 3600_000) {
    return { text: 'Departed', urgent: false, departed: true };
  }
  if (diff < 0) {
    return { text: 'Boarding now', urgent: true, departed: false };
  }

  const totalMin = Math.floor(diff / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return { text: `${d}d ${rh}h`, urgent: false, departed: false };
  }
  if (h >= 1) {
    return { text: `${h}h ${m}m`, urgent: h < 2, departed: false };
  }
  return { text: `${m} min`, urgent: true, departed: false };
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

function flightsRef(uid: string) {
  return firestore().collection('users').doc(uid).collection('flights');
}

/** Strip firestoreId and undefined fields before writing to Firestore.
 *  Firestore rejects `undefined` values — JSON round-trip removes them safely. */
function toFirestoreDoc(flight: FlightData): Record<string, any> {
  const { firestoreId: _id, ...rest } = flight;
  return JSON.parse(JSON.stringify(rest));
}

// ─── Context type ─────────────────────────────────────────────────────────────

type FlightsContextType = {
  flights: FlightData[];
  addFlight: (flight: FlightData) => void;
  removeFlight: (index: number) => void;
  updateFlight: (index: number, updated: FlightData) => void;
  refreshAllFlights: () => Promise<void>;
  nextFlight: FlightData | null;
  isRefreshing: boolean;
  lastRefreshAt: number | null;
};

const FlightsContext = createContext<FlightsContextType>({
  flights: [],
  addFlight: () => {},
  removeFlight: () => {},
  updateFlight: () => {},
  refreshAllFlights: async () => {},
  nextFlight: null,
  isRefreshing: false,
  lastRefreshAt: null,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FlightsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [flights, setFlights] = useState<FlightData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);
  const initialised = useRef(false);

  // ── Load flights when uid changes (login / logout) ─────────────────────────
  useEffect(() => {
    initialised.current = false;

    if (!uid) {
      // Logged out — clear everything
      setFlights([]);
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      initialised.current = true;
      return;
    }

    // 1. Load from AsyncStorage first (instant, offline-safe)
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw: string | null) => {
        if (raw) {
          try {
            const parsed: FlightData[] = JSON.parse(raw);
            if (parsed.length > 0) {
              setFlights(parsed);
            }
          } catch (_) {}
        }
      })
      .catch(() => {});

    // 2. Load from Firestore (authoritative, syncs across devices)
    flightsRef(uid).get()
      .then(snapshot => {
        if (!snapshot.empty) {
          const cloudFlights: FlightData[] = snapshot.docs.map(doc => ({
            ...(doc.data() as FlightData),
            firestoreId: doc.id,
          }));
          setFlights(cloudFlights);
          // Update local cache with cloud data
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cloudFlights)).catch(() => {});
        }
      })
      .catch(() => {
        // Firestore unreachable — AsyncStorage data already loaded above
      })
      .finally(() => {
        initialised.current = true;
      });
  }, [uid]);

  // ── Persist to AsyncStorage whenever flights change ────────────────────────
  useEffect(() => {
    if (!initialised.current) { return; }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(flights)).catch(() => {});
  }, [flights]);

  // ── CRUD operations ────────────────────────────────────────────────────────

  const addFlight = useCallback((flight: FlightData) => {
    // Save to Firestore first (get back docId), then update state
    if (uid) {
      flightsRef(uid).add(toFirestoreDoc(flight))
        .then(docRef => {
          const flightWithId: FlightData = { ...flight, firestoreId: docRef.id };
          setFlights(prev => [...prev, flightWithId]);
        })
        .catch(() => {
          // Firestore failed — still add locally
          setFlights(prev => [...prev, flight]);
        });
    } else {
      setFlights(prev => [...prev, flight]);
    }

    // Schedule notifications (fire-and-forget)
    const depTime = effectiveDepTime(flight.dep);
    if (depTime) {
      notificationService.scheduleDepartureReminders({
        flightIata: flight.flightIata,
        departureTime: depTime,
        depIata: flight.dep.iata,
        terminal: flight.dep.terminal,
        gate: flight.arr.gate,
      }).catch(() => {});
      notificationService.scheduleCheckInReminders({
        flightIata: flight.flightIata,
        airline: flight.airline,
        departureTime: flight.dep.scheduledTime,
        depIata: flight.dep.iata,
      }).catch(() => {});
      notificationService.schedulePostFlightReEngagement({
        flightIata: flight.flightIata,
        departureTime: depTime,
        arrIata: flight.arr.iata,
      }).catch(() => {});
    }
  }, [uid]);

  const removeFlight = useCallback((index: number) => {
    setFlights(prev => {
      const removed = prev[index];
      if (removed) {
        notificationService.cancelFlightNotifications(removed.flightIata).catch(() => {});
        // Delete from Firestore
        if (uid && removed.firestoreId) {
          flightsRef(uid).doc(removed.firestoreId).delete().catch(() => {});
        }
      }
      return prev.filter((_, i) => i !== index);
    });
  }, [uid]);

  const updateFlight = useCallback((index: number, updated: FlightData) => {
    setFlights(prev => {
      const newFlights = prev.map((f, i) => (i === index ? updated : f));
      // Sync updated flight to Firestore
      if (uid && updated.firestoreId) {
        flightsRef(uid).doc(updated.firestoreId).set(toFirestoreDoc(updated)).catch(() => {});
      }
      return newFlights;
    });
  }, [uid]);

  const refreshAllFlights = useCallback(async () => {
    if (lastRefreshAt && Date.now() - lastRefreshAt < FEATURES.REFRESH_COOLDOWN_SEC * 1000) {
      return;
    }
    setIsRefreshing(true);
    try {
      const { lookupFlight } = require('../services/FlightService');
      const updated = await Promise.all(
        flights.map(async (f) => {
          try {
            const depDate = f.dep.scheduledTime
              ? new Date(f.dep.scheduledTime).toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10);
            const refreshed = await lookupFlight(f.flightIata, depDate, f.pnr);
            if (!refreshed) { return f; }
            // Preserve firestoreId from original
            const merged: FlightData = { ...refreshed, firestoreId: f.firestoreId };
            // Sync to Firestore
            if (uid && f.firestoreId) {
              flightsRef(uid).doc(f.firestoreId).set(toFirestoreDoc(merged)).catch(() => {});
            }
            return merged;
          } catch (_) {
            return f;
          }
        }),
      );
      setFlights(updated);
      setLastRefreshAt(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  }, [flights, lastRefreshAt, uid]);

  const nextFlight = getNextFlight(flights);

  // ── Homescreen widget sync ────────────────────────────────────────────────
  useEffect(() => {
    if (!nextFlight) {
      clearWidget();
      return;
    }
    const effDep = effectiveDepTime(nextFlight.dep);
    const countdown = getCountdown(effDep);
    updateWidget({
      flightIata: nextFlight.flightIata,
      depIata:    nextFlight.dep.iata,
      arrIata:    nextFlight.arr.iata,
      departureTime: effDep,
      countdown:  countdown.text,
      status:     nextFlight.status ?? 'scheduled',
    });
  }, [nextFlight?.flightIata, nextFlight?.dep?.scheduledTime, nextFlight?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FlightsContext.Provider
      value={{ flights, addFlight, removeFlight, updateFlight, refreshAllFlights, nextFlight, isRefreshing, lastRefreshAt }}>
      {children}
    </FlightsContext.Provider>
  );
}

export const useFlights = () => useContext(FlightsContext);
