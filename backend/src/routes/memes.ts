import { Router, Request, Response } from 'express';
import db, { getUserByToken } from '../models/database';
import type { WeatherCategory } from './weather';

const router = Router();

interface MemeRow {
  id: number;
  url: string;
  category: string;
  likes: number;
  dislikes: number;
  created_at: string;
}

interface MemeListQuery {
  category?: WeatherCategory;
}

const VALID_CATEGORIES: WeatherCategory[] = ['hot', 'cold', 'rain', 'snow', 'wind', 'cloudy', 'clear'];

function getToken(req: Request): string | null {
  const auth = req.header('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice('Bearer '.length).trim();
}

/** Возвращает случайный мем из категории, взвешенный по рейтингу */
router.get('/', (req: Request<{}, {}, {}, MemeListQuery>, res: Response) => {
  const category = req.query.category;

  if (category && !VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    return;
  }

  let rows: MemeRow[];
  if (category) {
    rows = db.prepare('SELECT * FROM memes WHERE category = ?').all(category) as MemeRow[];
  } else {
    rows = db.prepare('SELECT * FROM memes').all() as MemeRow[];
  }

  if (rows.length === 0) {
    res.status(404).json({ error: 'Мемов для данной категории не найдено' });
    return;
  }

  // Взвешенный случайный выбор: вес = likes - dislikes + 1 (минимум 1)
  const weighted = rows.map(m => ({
    ...m,
    weight: Math.max(1, m.likes - m.dislikes + 1),
  }));
  const totalWeight = weighted.reduce((sum, m) => sum + m.weight, 0);
  let rand = Math.random() * totalWeight;
  let selected = weighted[0];
  for (const m of weighted) {
    rand -= m.weight;
    if (rand <= 0) { selected = m; break; }
  }

  res.json({
    id: selected.id,
    url: selected.url,
    category: selected.category,
    likes: selected.likes,
    dislikes: selected.dislikes,
  });
});

/** Добавление нового мема */
router.post('/', (req: Request, res: Response) => {
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

  const { url, category } = req.body as { url?: string; category?: WeatherCategory };

  if (!url || !category) {
    res.status(400).json({ error: 'Поля url и category обязательны' });
    return;
  }

  if (!VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: `Категория должна быть одной из: ${VALID_CATEGORIES.join(', ')}` });
    return;
  }

  try {
    const result = db.prepare('INSERT INTO memes (url, category) VALUES (?, ?)').run(url, category);
    const meme = db.prepare('SELECT * FROM memes WHERE id = ?').get(result.lastInsertRowid) as MemeRow;
    res.status(201).json(meme);
  } catch {
    res.status(500).json({ error: 'Не удалось добавить мем' });
  }
});

/** Голосование за мем */
router.post('/:id/vote', (req: Request<{ id: string }>, res: Response) => {
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

  const id = parseInt(req.params.id, 10);
  const { vote } = req.body;

  if (vote !== 'like' && vote !== 'dislike') {
    res.status(400).json({ error: 'Поле vote должно быть "like" или "dislike"' });
    return;
  }

  const memeExists = db.prepare('SELECT id FROM memes WHERE id = ?').get(id);
  if (!memeExists) {
    res.status(404).json({ error: 'Мем не найден' });
    return;
  }

  const alreadyVoted = db
    .prepare('SELECT vote FROM meme_votes WHERE meme_id = ? AND user_id = ?')
    .get(id, user.id) as { vote: 'like' | 'dislike' } | undefined;
  if (alreadyVoted) {
    res.status(409).json({ error: 'Вы уже голосовали за этот мем' });
    return;
  }

  db.prepare('INSERT INTO meme_votes (meme_id, user_id, vote) VALUES (?, ?, ?)').run(id, user.id, vote);

  const column = vote === 'like' ? 'likes' : 'dislikes';
  db.prepare(`UPDATE memes SET ${column} = ${column} + 1 WHERE id = ?`).run(id);

  const meme = db.prepare('SELECT likes, dislikes FROM memes WHERE id = ?').get(id) as Pick<MemeRow, 'likes' | 'dislikes'>;
  res.json(meme);
});

export default router;
