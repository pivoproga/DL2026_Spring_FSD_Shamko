import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// .env has priority; fall back to .env.example if .env doesn't exist
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');
dotenv.config({ path: fs.existsSync(envPath) ? envPath : envExamplePath });

import express from 'express';
import cors from 'cors';
import weatherRouter from './routes/weather';
import memesRouter from './routes/memes';
import authRouter from './routes/auth';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api/weather', weatherRouter);
app.use('/api/memes', memesRouter);
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
