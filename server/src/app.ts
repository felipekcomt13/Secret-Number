import express from 'express';
import cors from 'cors';

export const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});
