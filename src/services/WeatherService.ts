/**
 * WeatherService — fetches current weather at a destination using Open-Meteo.
 * Free, no API key required.
 *
 * Flow:
 *  1. geocode(city) → { lat, lon }
 *  2. fetchWeather(lat, lon) → WeatherResult
 */

export type WeatherResult = {
  tempC: number;
  feelsLikeC: number;
  weatherCode: number;
  description: string;
  emoji: string;
  humidity: number;
  windKph: number;
};

/** Open-Meteo WMO weather interpretation codes → human label + emoji */
function interpretCode(code: number): { description: string; emoji: string } {
  if (code === 0)            { return { description: 'Clear sky',              emoji: '☀️'  }; }
  if (code <= 2)             { return { description: 'Partly cloudy',          emoji: '⛅'  }; }
  if (code === 3)            { return { description: 'Overcast',               emoji: '☁️'  }; }
  if (code <= 49)            { return { description: 'Fog / haze',             emoji: '🌫️' }; }
  if (code <= 59)            { return { description: 'Drizzle',                emoji: '🌦️' }; }
  if (code <= 69)            { return { description: 'Rain',                   emoji: '🌧️' }; }
  if (code <= 79)            { return { description: 'Snow',                   emoji: '❄️'  }; }
  if (code <= 82)            { return { description: 'Rain showers',           emoji: '🌦️' }; }
  if (code <= 86)            { return { description: 'Snow showers',           emoji: '🌨️' }; }
  if (code >= 95)            { return { description: 'Thunderstorm',           emoji: '⛈️'  }; }
  return { description: 'Unknown', emoji: '🌡️' };
}

/** Cached results to avoid re-fetching within 30 min */
const _cache: Map<string, { data: WeatherResult; ts: number }> = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

async function geocode(city: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) { return null; }
  const json = await res.json();
  const first = json?.results?.[0];
  if (!first) { return null; }
  return { lat: first.latitude as number, lon: first.longitude as number };
}

export async function fetchWeatherForCity(city: string): Promise<WeatherResult | null> {
  const cacheKey = city.toLowerCase();
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const coords = await geocode(city);
    if (!coords) { return null; }

    const url = [
      'https://api.open-meteo.com/v1/forecast',
      `?latitude=${coords.lat}`,
      `&longitude=${coords.lon}`,
      '&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m',
      '&wind_speed_unit=kmh',
      '&timezone=auto',
    ].join('');

    const res = await fetch(url);
    if (!res.ok) { return null; }
    const json = await res.json();
    const cur = json?.current;
    if (!cur) { return null; }

    const code = cur.weather_code as number;
    const { description, emoji } = interpretCode(code);

    const result: WeatherResult = {
      tempC:       Math.round(cur.temperature_2m as number),
      feelsLikeC:  Math.round(cur.apparent_temperature as number),
      weatherCode: code,
      description,
      emoji,
      humidity:    Math.round(cur.relative_humidity_2m as number),
      windKph:     Math.round(cur.wind_speed_10m as number),
    };

    _cache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch {
    return null;
  }
}

/** Convenience: fetch weather for a city from AIRPORTS.ts via IATA */
export async function fetchWeatherForAirport(
  iata: string,
  cityName: string,
): Promise<WeatherResult | null> {
  return fetchWeatherForCity(cityName);
}
