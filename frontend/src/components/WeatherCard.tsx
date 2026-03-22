import type { WeatherData } from '../types';

interface Props {
  weather: WeatherData;
}

export default function WeatherCard({ weather }: Props) {
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;

  return (
    <div className="weather-card">
      <div className="weather-header">
        <div className="weather-main-simple weather-main-expanded">
          <span className="weather-city">{weather.city}, {weather.country}</span>
          <img src={iconUrl} alt={weather.description} className="weather-main-icon" />
          <span className="weather-desc">{weather.description}</span>
          <div className="weather-metrics-grid">
            <div className="metric-item">
              <svg viewBox="0 0 24 24" className="metric-icon" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z" />
                <line x1="12" y1="11" x2="12" y2="19" />
              </svg>
              <span>{weather.temp}&deg;C</span>
            </div>
            <div className="metric-item">
              <svg viewBox="0 0 24 24" className="metric-icon" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h14" />
                <path d="M14 8l4 4-4 4" />
                <path d="M5 6h10" />
                <path d="M15 3l3 3-3 3" />
              </svg>
              <span>{weather.wind_speed} m/s</span>
            </div>
            <div className="metric-item">
              <svg viewBox="0 0 24 24" className="metric-icon" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2s6 6 6 10a6 6 0 1 1-12 0c0-4 6-10 6-10z" />
              </svg>
              <span>{weather.humidity}%</span>
            </div>
            <div className="metric-item">
              <svg viewBox="0 0 24 24" className="metric-icon" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 12l4-3" />
                <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
              </svg>
              <span>{weather.pressure} hPa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
