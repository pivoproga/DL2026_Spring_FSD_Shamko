import { useEffect, useState } from 'react';
import SearchBar from './components/SearchBar';
import WeatherCard from './components/WeatherCard';
import MemeCard from './components/MemeCard';
import AddMemeForm from './components/AddMemeForm';
import AuthPanel from './components/AuthPanel';
import { fetchWeather, fetchWeatherByCoords, fetchMeme, fetchMe, login, logout, register } from './api';
import type { WeatherData, MemeData, AuthUser, Lang } from './types';
import { t } from './i18n';

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [meme, setMeme] = useState<MemeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('wm_token'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('wm_lang') === 'en' ? 'en' : 'ru'));
  const labels = t(lang);

  useEffect(() => {
    localStorage.setItem('wm_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (!authToken) {
      setUser(null);
      setAuthChecked(true);
      return;
    }
    fetchMe(authToken)
      .then(foundUser => {
        setUser(foundUser);
        setAuthChecked(true);
      })
      .catch(() => {
        localStorage.removeItem('wm_token');
        setAuthToken(null);
        setUser(null);
        setAuthChecked(true);
      });
  }, [authToken]);

  const handleSearch = async (city: string) => {
    setLoading(true);
    setError(null);
    setShareStatus(null);
    setMeme(null);
    try {
      const w = await fetchWeather(city, lang);
      setWeather(w);
      const m = await fetchMeme(w.category);
      setMeme(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.citySearchError);
      setWeather(null);
      setMeme(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError(labels.geolocationUnsupported);
      return;
    }

    setLocating(true);
    setError(null);
    setShareStatus(null);
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const w = await fetchWeatherByCoords(position.coords.latitude, position.coords.longitude, lang);
          setWeather(w);
          const m = await fetchMeme(w.category);
          setMeme(m);
        } catch (err) {
          setError(err instanceof Error ? err.message : labels.weatherLocationFailed);
          setWeather(null);
          setMeme(null);
        } finally {
          setLocating(false);
        }
      },
      geoError => {
        setLocating(false);
        setError(`${labels.weatherLocationFailed}: ${geoError.message}`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 },
    );
  };

  const handleRefreshMeme = async () => {
    if (!weather) return;
    try {
      const m = await fetchMeme(weather.category);
      setMeme(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.refreshFailed);
    }
  };

  const handleShare = async () => {
    if (!weather || !meme) return;

    const cardText = `WeatherMemes | ${weather.city}, ${weather.country} | ${weather.temp}${labels.celsius} | ${weather.description}`;
    setShareStatus(null);

    try {
      const response = await fetch(meme.url);
      if (!response.ok) throw new Error(labels.shareImageLoadFailed);
      const memeBlob = await response.blob();
      const memeBitmap = await createImageBitmap(memeBlob);

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(labels.canvasUnsupported);

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const availableWidth = 1020;
      const availableHeight = 860;
      const offsetX = 30;
      const offsetY = 30;
      const scale = Math.min(availableWidth / memeBitmap.width, availableHeight / memeBitmap.height);
      const drawW = memeBitmap.width * scale;
      const drawH = memeBitmap.height * scale;
      const x = offsetX + (availableWidth - drawW) / 2;
      const y = offsetY + (availableHeight - drawH) / 2;

      ctx.drawImage(memeBitmap, x, y, drawW, drawH);

      ctx.fillStyle = 'rgba(26,42,74,0.95)';
      ctx.fillRect(0, 900, canvas.width, 180);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 44px Segoe UI, Arial, sans-serif';
      ctx.fillText(`${weather.temp}${labels.celsius}`, 36, 968);
      ctx.font = '600 34px Segoe UI, Arial, sans-serif';
      ctx.fillText(`${weather.city}, ${weather.country}`, 36, 1018);
      ctx.font = '500 30px Segoe UI, Arial, sans-serif';
      ctx.fillText(weather.description, 36, 1060);

      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error(labels.shareRenderFailed));
            return;
          }
          resolve(blob);
        }, 'image/png');
      });

      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': imageBlob })]);
        setShareStatus(labels.sharedImageCopied);
      } else {
        await navigator.clipboard.writeText(cardText);
        setShareStatus(labels.imageCopyNoSupport);
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(cardText);
        setShareStatus(labels.imageCopyFailedText);
      } catch {
        setShareStatus(err instanceof Error ? err.message : labels.shareFailed);
      }
    }
  };

  const handleRegister = async (username: string, password: string) => {
    const data = await register(username, password);
    localStorage.setItem('wm_token', data.token);
    setAuthToken(data.token);
    setUser(data.user);
  };

  const handleLogin = async (username: string, password: string) => {
    const data = await login(username, password);
    localStorage.setItem('wm_token', data.token);
    setAuthToken(data.token);
    setUser(data.user);
  };

  const handleLogout = async () => {
    if (!authToken) return;
    await logout(authToken);
    localStorage.removeItem('wm_token');
    setAuthToken(null);
    setUser(null);
  };

  if (!authChecked) {
    return (
      <div className="auth-gate loading">
        <div className="auth-gate-card">
          <h1>WeatherMemes</h1>
          <div className="lang-switch auth-lang-switch">
            <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>RU</button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
          <p>{labels.checkingSession}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-gate">
        <div className="auth-gate-card">
          <h1>WeatherMemes</h1>
          <div className="lang-switch auth-lang-switch">
            <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>RU</button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
          <p>{labels.authGateText}</p>
          <AuthPanel
            user={null}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onLogout={handleLogout}
            labels={{
              login: labels.authLogin,
              register: labels.authRegister,
              username: labels.username,
              password: labels.password,
              wait: labels.wait,
              loginBtn: labels.loginBtn,
              registerBtn: labels.registerBtn,
              createAccount: labels.createAccount,
              alreadyAccount: labels.alreadyAccount,
              loggedAs: labels.loggedAs,
              logout: labels.logout,
              authFailed: labels.authFailed,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6.34 14.66A8 8 0 1017.66 3.34"/>
              <path d="M3 17a5 5 0 009.9 1H18a3 3 0 100-6h-.5A5.5 5.5 0 003 17z"/>
            </svg>
            <span>WeatherMemes</span>
          </div>
          <div className="header-right">
            <div className="lang-switch">
              <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>RU</button>
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
            </div>
            <nav className="header-nav">
              <a href="#weather">{labels.navWeather}</a>
              <a href="#meme">{labels.navMeme}</a>
              <a href="#add">{labels.navContribute}</a>
            </nav>
            <div className="header-user">
              <span>{user.username}</span>
              <button className="btn-auth btn-auth-header" onClick={() => void handleLogout()}>{labels.logout}</button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="hero">
        <div className="hero-content">
          <h1>{labels.heroTitle}</h1>
          <p>{labels.heroSubtitle}</p>
          <SearchBar
            onSearch={handleSearch}
            onLocate={handleLocate}
            loading={loading}
            locating={locating}
            labels={{
              placeholder: labels.searchCity,
              search: labels.search,
              loading: labels.loading,
              locating: labels.locating,
              useLocation: labels.useLocation,
            }}
          />
        </div>
      </section>

      <main className="main-content">
        {error && <div className="error-msg">{error}</div>}
        {shareStatus && <div className="share-msg">{shareStatus}</div>}

        {weather && (
          <>
            <section id="weather" className="section">
              <WeatherCard weather={weather} />
            </section>

            {meme && (
              <section id="meme" className="section">
                <h2 className="section-title">{labels.moodOfDay}</h2>
                <MemeCard
                  meme={meme}
                  onRefresh={handleRefreshMeme}
                  onShare={handleShare}
                  isAuthorized={Boolean(user)}
                  token={authToken}
                  labels={{
                    title: labels.weatherMeme,
                    share: labels.shareCard,
                    next: labels.nextMeme,
                    imageAlt: labels.memeImageAlt,
                    loadFailed: labels.memeLoadFailed,
                    openDirect: labels.openDirectLink,
                    loginRequiredVote: labels.loginRequiredVote,
                    voteFailed: labels.voteFailed,
                  }}
                />
              </section>
            )}
          </>
        )}

        <section id="add" className="section">
          <h2 className="section-title">{labels.contribute}</h2>
          <AddMemeForm
            token={authToken}
            isAuthorized={Boolean(user)}
            lang={lang}
            labels={{
              title: labels.addMemeTitle,
              imageUrl: labels.imageUrl,
              chooseFile: labels.chooseFile,
              fileNotSelected: labels.fileNotSelected,
              add: labels.add,
              adding: labels.adding,
              memeAdded: labels.memeAdded,
              loginRequiredAdd: labels.loginRequiredAdd,
              provideUrlOrFile: labels.provideUrlOrFile,
              unknownError: labels.unknownError,
            }}
          />
        </section>
      </main>

      <footer className="app-footer">
        <p>{labels.footer}</p>
      </footer>
    </div>
  );
}
