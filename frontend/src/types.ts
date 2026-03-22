export type WeatherCategory = 'hot' | 'cold' | 'rain' | 'snow' | 'wind' | 'cloudy' | 'clear';
export type Lang = 'ru' | 'en';

export interface WeatherData {
  city: string;
  country: string;
  coord: { lat: number; lon: number };
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  pressure: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust: number | null;
  clouds: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  dt: number;
  timezone: number;
  category: WeatherCategory;
}

export interface MemeData {
  id: number;
  url: string;
  category: WeatherCategory;
  likes: number;
  dislikes: number;
}

export interface AuthUser {
  id: number;
  username: string;
}
