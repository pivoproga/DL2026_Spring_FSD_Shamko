import { Router, Request, Response } from 'express';
import db, { createSession, deleteSession, getUserByToken, hashPassword } from '../models/database';

const router = Router();

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
}

function getToken(req: Request): string | null {
  const auth = req.header('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice('Bearer '.length).trim();
}

router.post('/register', (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }
  if (username.length < 3 || password.length < 6) {
    res.status(400).json({ error: 'username >= 3 and password >= 6 characters required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number } | undefined;
  if (existing) {
    res.status(409).json({ error: 'Username already exists' });
    return;
  }

  const passwordHash = hashPassword(password);
  const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);
  const token = createSession(Number(result.lastInsertRowid));
  res.status(201).json({ token, user: { id: Number(result.lastInsertRowid), username } });
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }

  const user = db
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
    .get(username) as UserRow | undefined;
  if (!user || user.password_hash !== hashPassword(password)) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const token = createSession(user.id);
  res.json({ token, user: { id: user.id, username: user.username } });
});

router.get('/me', (req: Request, res: Response) => {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const user = getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  res.json({ user });
});

router.post('/logout', (req: Request, res: Response) => {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  deleteSession(token);
  res.status(204).send();
});

export default router;
