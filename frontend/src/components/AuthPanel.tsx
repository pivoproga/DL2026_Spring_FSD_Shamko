import { useState, type FormEvent } from 'react';
import type { AuthUser } from '../types';

interface Props {
  user: AuthUser | null;
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string) => Promise<void>;
  onLogout: () => Promise<void>;
  labels: {
    login: string;
    register: string;
    username: string;
    password: string;
    wait: string;
    loginBtn: string;
    registerBtn: string;
    createAccount: string;
    alreadyAccount: string;
    loggedAs: string;
    logout: string;
    authFailed: string;
  };
}

export default function AuthPanel({ user, onLogin, onRegister, onLogout, labels }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      if (mode === 'login') {
        await onLogin(username.trim(), password);
      } else {
        await onRegister(username.trim(), password);
      }
      setUsername('');
      setPassword('');
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : labels.authFailed);
    }
  };

  if (user) {
    return (
      <div className="auth-panel auth-panel-logged">
        <div>
          <p className="auth-label">{labels.loggedAs}</p>
          <p className="auth-username">{user.username}</p>
        </div>
        <button className="btn-auth" onClick={() => void onLogout()}>{labels.logout}</button>
      </div>
    );
  }

  return (
    <form className="auth-panel" onSubmit={submit}>
      <h3>{mode === 'login' ? labels.login : labels.register}</h3>
      <div className="form-row">
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder={labels.username}
          required
          minLength={3}
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={labels.password}
          required
          minLength={6}
        />
        <button type="submit" className="btn-auth" disabled={status === 'loading'}>
          {status === 'loading' ? labels.wait : mode === 'login' ? labels.loginBtn : labels.registerBtn}
        </button>
      </div>
      <button
        type="button"
        className="btn-auth-switch"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? labels.createAccount : labels.alreadyAccount}
      </button>
      {status === 'error' && <p className="msg-error">{error}</p>}
    </form>
  );
}
