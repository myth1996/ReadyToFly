/**
 * useFlightStatus — Live flight polling hook
 *
 * Polls AviationStack every 5 minutes.
 * Detects gate changes and landing, fires callbacks.
 * Clears interval automatically on unmount or when flight departs > 2hr ago.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { AERODATABOX_KEY, AERODATABOX_HOST, AERODATABOX_BASE_URL } from '../config/env';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface FlightLiveData {
  gate?: string;
  terminal?: string;
  status: string;
  baggageBelt?: string;
  arrGate?: string;
  arrTerminal?: string;
  departureTime?: string;
  arrivalTime?: string;
}

interface UseFlightStatusOptions {
  onGateChange?: (newGate: string) => void;
  onLanding?: () => void;
}

interface UseFlightStatusResult {
  liveData: FlightLiveData | null;
  isLanded: boolean;
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;
  refresh: () => Promise<void>;
}

async function fetchLiveStatus(flightIata: string): Promise<FlightLiveData | null> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const url = `${AERODATABOX_BASE_URL}/flights/number/${encodeURIComponent(flightIata)}/${today}`;
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key':  AERODATABOX_KEY,
        'x-rapidapi-host': AERODATABOX_HOST,
        'Accept':          'application/json',
      },
    });
    if (!response.ok) { return null; }
    const json = await response.json();
    const flights = Array.isArray(json) ? json : [json];
    const flight = flights[0];
    if (!flight) { return null; }

    const dep = flight.departure ?? {};
    const arr = flight.arrival ?? {};
    return {
      gate:          dep.gate ?? undefined,
      terminal:      dep.terminal ?? undefined,
      status:        flight.status ?? 'scheduled',
      baggageBelt:   arr.baggageClaim ?? undefined,
      arrGate:       arr.gate ?? undefined,
      arrTerminal:   arr.terminal ?? undefined,
      departureTime: dep.revisedTime ?? dep.scheduledTime ?? undefined,
      arrivalTime:   arr.revisedTime ?? arr.scheduledTime ?? undefined,
    };
  } catch {
    return null;
  }
}

export function useFlightStatus(
  flightIata: string | null,
  options: UseFlightStatusOptions = {},
): UseFlightStatusResult {
  const [liveData, setLiveData] = useState<FlightLiveData | null>(null);
  const [isLanded, setIsLanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastGateRef    = useRef<string | undefined>(undefined);
  const landedRef      = useRef(false);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const onGateChange   = useRef(options.onGateChange);
  const onLanding      = useRef(options.onLanding);

  // Keep callbacks current without restarting the interval
  useEffect(() => { onGateChange.current = options.onGateChange; }, [options.onGateChange]);
  useEffect(() => { onLanding.current = options.onLanding; }, [options.onLanding]);

  const poll = useCallback(async () => {
    if (!flightIata || landedRef.current) { return; }
    const data = await fetchLiveStatus(flightIata);
    if (!data) { return; }

    setLiveData(data);
    setLastUpdated(Date.now());
    setError(null);

    // Gate change detection
    if (
      data.gate &&
      lastGateRef.current !== undefined &&
      data.gate !== lastGateRef.current
    ) {
      onGateChange.current?.(data.gate);
    }
    if (data.gate) { lastGateRef.current = data.gate; }

    // Landing detection
    if (
      !landedRef.current &&
      (data.status === 'landed' || data.status === 'arrived')
    ) {
      landedRef.current = true;
      setIsLanded(true);
      onLanding.current?.();
      // Stop polling after landing
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [flightIata]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await poll();
    setIsLoading(false);
  }, [poll]);

  useEffect(() => {
    if (!flightIata) { return; }

    // Initial fetch
    refresh();

    // Start polling
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [flightIata]); // eslint-disable-line react-hooks/exhaustive-deps

  return { liveData, isLanded, isLoading, lastUpdated, error, refresh };
}
