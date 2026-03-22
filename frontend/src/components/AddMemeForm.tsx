import { useState, type FormEvent } from 'react';
import { addMeme, addMemeFile } from '../api';
import type { WeatherCategory, Lang } from '../types';

const CATEGORIES_RU: Array<{ value: WeatherCategory; label: string }> = [
  { value: 'hot', label: 'Жарко' },
  { value: 'cold', label: 'Холодно' },
  { value: 'rain', label: 'Дождь' },
  { value: 'snow', label: 'Снег' },
  { value: 'wind', label: 'Ветрено' },
  { value: 'cloudy', label: 'Облачно' },
  { value: 'clear', label: 'Ясно' },
];

const CATEGORIES_EN: Array<{ value: WeatherCategory; label: string }> = [
  { value: 'hot', label: 'Hot' },
  { value: 'cold', label: 'Cold' },
  { value: 'rain', label: 'Rain' },
  { value: 'snow', label: 'Snow' },
  { value: 'wind', label: 'Wind' },
  { value: 'cloudy', label: 'Cloudy' },
  { value: 'clear', label: 'Clear' },
];

interface Props {
  token: string | null;
  isAuthorized: boolean;
  lang: Lang;
  labels: {
    title: string;
    imageUrl: string;
    chooseFile: string;
    fileNotSelected: string;
    add: string;
    adding: string;
    memeAdded: string;
    loginRequiredAdd: string;
    provideUrlOrFile: string;
    unknownError: string;
  };
}

export default function AddMemeForm({ token, isAuthorized, lang, labels }: Props) {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [category, setCategory] = useState<WeatherCategory>('clear');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const categories = lang === 'ru' ? CATEGORIES_RU : CATEGORIES_EN;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      setStatus('error');
      setErrorMsg(labels.loginRequiredAdd);
      return;
    }

    const trimmed = url.trim();
    if (!trimmed && !file) {
      setStatus('error');
      setErrorMsg(labels.provideUrlOrFile);
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    try {
      if (file) {
        await addMemeFile(file, category, token);
      } else {
        await addMeme(trimmed, category, token);
      }
      setStatus('success');
      setUrl('');
      setFile(null);
      setCategory('clear');
      setFileInputKey(v => v + 1);
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : labels.unknownError);
    }
  };

  return (
    <form className="add-meme-form" onSubmit={handleSubmit}>
      <h3>{labels.title}</h3>
      <div className="form-row">
        <input
          type="url"
          placeholder={labels.imageUrl}
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={!isAuthorized}
        />
        <div className="file-picker-wrap">
          <label htmlFor={`meme-file-${fileInputKey}`} className={`file-picker-btn ${!isAuthorized ? 'disabled' : ''}`}>
            {labels.chooseFile}
          </label>
          <span className="file-picker-name">{file?.name ?? labels.fileNotSelected}</span>
          <input
            key={fileInputKey}
            id={`meme-file-${fileInputKey}`}
            className="file-input-hidden"
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            disabled={!isAuthorized}
          />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value as WeatherCategory)}>
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button type="submit" disabled={status === 'loading' || !isAuthorized}>
          {status === 'loading' ? labels.adding : labels.add}
        </button>
      </div>
      {!isAuthorized && <p className="msg-error">{labels.loginRequiredAdd}</p>}
      {status === 'success' && <p className="msg-success">{labels.memeAdded}</p>}
      {status === 'error' && <p className="msg-error">{errorMsg}</p>}
    </form>
  );
}
