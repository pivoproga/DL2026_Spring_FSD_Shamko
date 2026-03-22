import { Router, Request, Response } from 'express';

const router = Router();

const OWM_BASE = 'https://api.openweathermap.org/data/2.5/weather';

export type WeatherCategory = 'hot' | 'cold' | 'rain' | 'snow' | 'wind' | 'cloudy' | 'clear';
const VALID_LANGS = new Set(['ru', 'en']);

interface OWMResponse {
  name: string;
  coord: { lat: number; lon: number };
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{ main: string; description: string; icon: string }>;
  wind: { speed: number; deg: number; gust?: number };
  clouds: { all: number };
  visibility: number;
  sys: { country: string; sunrise: number; sunset: number };
  dt: number;
  timezone: number;
}

/** Determines meme category from weather data */
export function categorize(data: OWMResponse): WeatherCategory {
  const weatherMain = data.weather[0]?.main ?? '';
  const temp = data.main.temp;
  const windSpeed = data.wind.speed;

  if (weatherMain === 'Snow') return 'snow';
  if (weatherMain === 'Rain' || weatherMain === 'Drizzle' || weatherMain === 'Thunderstorm') return 'rain';
  if (temp >= 30) return 'hot';
  if (temp <= -5) return 'cold';
  if (windSpeed >= 10) return 'wind';
  if (weatherMain === 'Clouds') return 'cloudy';
  return 'clear';
}

router.get('/', async (req: Request, res: Response) => {
  const city = req.query.city as string | undefined;
  const lat = req.query.lat as string | undefined;
  const lon = req.query.lon as string | undefined;
  const langParam = (req.query.lang as string | undefined) ?? 'ru';
  const lang = VALID_LANGS.has(langParam) ? langParam : 'ru';

  const hasCoords = lat !== undefined || lon !== undefined;
  if (!city && !hasCoords) {
    res.status(400).json({ error: 'Parameter city or coordinates lat/lon are required' });
    return;
  }

  if (hasCoords && (!lat || !lon)) {
    res.status(400).json({ error: 'Both lat and lon must be provided' });
    return;
  }

  let parsedLat: number | null = null;
  let parsedLon: number | null = null;
  if (lat && lon) {
    parsedLat = Number(lat);
    parsedLon = Number(lon);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLon)) {
      res.status(400).json({ error: 'lat and lon must be valid numbers' });
      return;
    }
    if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      res.status(400).json({ error: 'Coordinates are out of valid range' });
      return;
    }
  }

  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OpenWeatherMap API key is not configured' });
    return;
  }

  try {
    const query = parsedLat !== null && parsedLon !== null
      ? `lat=${parsedLat}&lon=${parsedLon}`
      : `q=${encodeURIComponent(city ?? '')}`;
    const url = `${OWM_BASE}?${query}&appid=${apiKey}&units=metric&lang=${encodeURIComponent(lang)}`;
    const response = await fetch(url);

    if (response.status === 404) {
      res.status(404).json({ error: 'City not found' });
      return;
    }
    if (!response.ok) {
      res.status(502).json({ error: 'Weather service error' });
      return;
    }

    const data = (await response.json()) as OWMResponse;
    const category = categorize(data);

    res.json({
      city: data.name,
      country: data.sys.country,
      coord: data.coord,
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      temp_min: Math.round(data.main.temp_min),
      temp_max: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      visibility: data.visibility,
      wind_speed: data.wind.speed,
      wind_deg: data.wind.deg,
      wind_gust: data.wind.gust ?? null,
      clouds: data.clouds.all,
      description: data.weather[0]?.description ?? '',
      icon: data.weather[0]?.icon ?? '',
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      dt: data.dt,
      timezone: data.timezone,
      category,
    });
  } catch {
    res.status(502).json({ error: 'Failed to fetch weather data' });
  }
});

export default router;
