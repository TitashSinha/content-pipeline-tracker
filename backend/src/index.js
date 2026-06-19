import express from 'express';
import cors from 'cors';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import { load } from './db.js';
import { seedIfEmpty } from './seed.js';
import authRoutes from './routes/auth.routes.js';
import articleRoutes from './routes/articles.routes.js';
import clientRoutes from './routes/clients.routes.js';
import userRoutes from './routes/users.routes.js';
import articleTypeRoutes from './routes/articleTypes.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import quoteRoutes from './routes/quote.routes.js';
import searchRoutes from './routes/search.routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

load();
seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/article-types', articleTypeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quote', quoteRoutes);
app.use('/api/search', searchRoutes);

// In production, serve the built frontend from the same server.
const dist = join(__dirname, '..', '..', 'frontend', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(dist, 'index.html'));
  });
}

// Use BACKEND_PORT (not PORT) so a dev-runner that injects PORT for the
// frontend can't accidentally steer the API onto the same port.
const PORT = process.env.BACKEND_PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
