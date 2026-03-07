import React, { createContext, useContext, useState, useCallback } from 'react';
import { FlightData } from '../services/FlightService';

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
  nextFlight: FlightData | null;
};

const FlightsContext = createContext<FlightsContextType>({
  flights: [],
  addFlight: () => {},
  removeFlight: () => {},
  nextFlight: null,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FlightsProvider({ children }: { children: React.ReactNode }) {
  const [flights, setFlights] = useState<FlightData[]>([]);

  const addFlight = useCallback((flight: FlightData) => {
    setFlights(prev => [...prev, flight]);
  }, []);

  const removeFlight = useCallback((index: number) => {
    setFlights(prev => prev.filter((_, i) => i !== index));
  }, []);

  const nextFlight = getNextFlight(flights);

  return (
    <FlightsContext.Provider value={{ flights, addFlight, removeFlight, nextFlight }}>
      {children}
    </FlightsContext.Provider>
  );
}

export const useFlights = () => useContext(FlightsContext);
