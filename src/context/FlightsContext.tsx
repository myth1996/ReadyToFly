import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlightData } from '../services/FlightService';
import { FEATURES } from '../config/env';
import { notificationService } from '../services/NotificationService';

const STORAGE_KEY = 'flyeasy_flights';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the soonest upcoming flight (up to 2 hrs after departure) */
export function getNextFlight(flights: FlightData[]): FlightData | null {
  const now = Date.now();
  const upcoming = flights
    .filter(f => new Date(f.dep.scheduledTime).getTime() > now - 2 * 3600_000)
    .sort(
      (a, b) =>
        new Date(a.dep.scheduledTime).getTime() -
        new Date(b.dep.scheduledTime).getTime(),
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
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);
  const initialised = useRef(false);

  // Load flights from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw: string | null) => {
        if (raw) {
          try {
            const parsed: FlightData[] = JSON.parse(raw);
            setFlights(parsed);
          } catch (_) {}
        }
      })
      .finally(() => {
        initialised.current = true;
      });
  }, []);

  // Persist to AsyncStorage whenever flights change (but only after initial load)
  useEffect(() => {
    if (!initialised.current) { return; }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(flights)).catch(() => {});
  }, [flights]);

  const addFlight = useCallback((flight: FlightData) => {
    setFlights(prev => [...prev, flight]);
    // Schedule departure reminders (2h + 30min before)
    if (flight.dep.scheduledTime) {
      notificationService.scheduleDepartureReminders({
        flightIata: flight.flightIata,
        departureTime: flight.dep.scheduledTime,
        depIata: flight.dep.iata,
        terminal: flight.dep.terminal,
        gate: flight.arr.gate,
      }).catch(() => {});
    }
  }, []);

  const removeFlight = useCallback((index: number) => {
    setFlights(prev => {
      const removed = prev[index];
      if (removed) {
        // Cancel any scheduled notifications for this flight
        notificationService.cancelFlightNotifications(removed.flightIata).catch(() => {});
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateFlight = useCallback((index: number, updated: FlightData) => {
    setFlights(prev => prev.map((f, i) => (i === index ? updated : f)));
  }, []);

  const refreshAllFlights = useCallback(async () => {
    // Rate-limit: don't refresh more than once per REFRESH_COOLDOWN_SEC
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
            return refreshed ?? f;
          } catch (_) {
            return f; // keep old data on error
          }
        }),
      );
      setFlights(updated);
      setLastRefreshAt(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  }, [flights, lastRefreshAt]);

  const nextFlight = getNextFlight(flights);

  return (
    <FlightsContext.Provider
      value={{ flights, addFlight, removeFlight, updateFlight, refreshAllFlights, nextFlight, isRefreshing, lastRefreshAt }}>
      {children}
    </FlightsContext.Provider>
  );
}

export const useFlights = () => useContext(FlightsContext);
