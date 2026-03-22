import { useState, type FormEvent } from 'react';

interface Props {
  onSearch: (city: string) => void;
  onLocate: () => void;
  loading: boolean;
  locating: boolean;
  labels: {
    placeholder: string;
    search: string;
    loading: string;
    locating: string;
    useLocation: string;
  };
}

export default function SearchBar({ onSearch, onLocate, loading, locating, labels }: Props) {
  const [city, setCity] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = city.trim();
    if (trimmed) onSearch(trimmed);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-wrap">
        <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder={labels.placeholder}
          value={city}
          onChange={e => setCity(e.target.value)}
          disabled={loading}
        />
      </div>
      <button type="submit" disabled={loading || !city.trim()}>
        {loading ? labels.loading : labels.search}
      </button>
      <button type="button" className="btn-secondary" onClick={onLocate} disabled={loading || locating}>
        {locating ? labels.locating : labels.useLocation}
      </button>
    </form>
  );
}
