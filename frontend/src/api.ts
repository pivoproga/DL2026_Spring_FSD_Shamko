import type { WeatherData, MemeData, WeatherCategory, AuthUser, Lang } from './types';

const BASE = '/api';

function authHeaders(token: string | null): HeadersInit {
  if (!token) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchWeather(city: string, lang: Lang): Promise<WeatherData> {
  const res = await fetch(`${BASE}/weather?city=${encodeURIComponent(city)}&lang=${lang}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function fetchWeatherByCoords(lat: number, lon: number, lang: Lang): Promise<WeatherData> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), lang });
  const res = await fetch(`${BASE}/weather?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function fetchMeme(category: WeatherCategory): Promise<MemeData> {
  const res = await fetch(`${BASE}/memes?category=${encodeURIComponent(category)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function addMeme(url: string, category: WeatherCategory, token: string | null): Promise<MemeData> {
  const res = await fetch(`${BASE}/memes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ url, category }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function addMemeFile(file: File, category: WeatherCategory, token: string | null): Promise<MemeData> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  return addMeme(dataUrl, category, token);
}

export async function voteMeme(id: number, vote: 'like' | 'dislike', token: string | null): Promise<{ likes: number; dislikes: number }> {
  const res = await fetch(`${BASE}/memes/${id}/vote`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ vote }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function register(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  const data = await res.json();
  return data.user as AuthUser;
}

export async function logout(token: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
}

