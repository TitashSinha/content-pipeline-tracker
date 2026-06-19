import { Router } from 'express';
import { authRequired } from '../auth.js';

const router = Router();

// Curated fallback so the box always has something, even with no internet.
const LOCAL = [
  { content: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman' },
  { content: 'Either write something worth reading or do something worth writing.', author: 'Benjamin Franklin' },
  { content: 'You can make anything by writing.', author: 'C. S. Lewis' },
  { content: 'The first draft is just you telling yourself the story.', author: 'Terry Pratchett' },
  { content: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { content: 'Hard writing makes easy reading.', author: 'Wallace Stegner' },
  { content: 'Creativity is intelligence having fun.', author: 'Albert Einstein' },
  { content: 'The scariest moment is always just before you start.', author: 'Stephen King' },
  { content: 'Make it simple, but significant.', author: 'Don Draper' },
  { content: 'Quality means doing it right when no one is looking.', author: 'Henry Ford' },
  { content: 'Start writing, no matter what. The water does not flow until the faucet is turned on.', author: "Louis L'Amour" },
  { content: 'Almost everything will work again if you unplug it for a few minutes — including you.', author: 'Anne Lamott' },
];

const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86_400_000);

// Cache one quote per calendar day so it stays stable as a "thought of the day".
let cache = { date: null, quote: null };

async function fetchRemoteQuote() {
  // 1) ZenQuotes "today" — one quote that holds for the whole day.
  try {
    const res = await fetch('https://zenquotes.io/api/today', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.q) {
        return { content: data[0].q.trim(), author: (data[0].a || 'Unknown').trim() };
      }
    }
  } catch { /* fall through */ }

  // 2) Quotable random (kept short) as a secondary source.
  try {
    const res = await fetch('https://api.quotable.io/random?maxLength=130', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.content) return { content: data.content, author: data.author || 'Unknown' };
    }
  } catch { /* fall through */ }

  return null;
}

router.get('/today', authRequired, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  if (cache.date === today && cache.quote) return res.json(cache.quote);

  const remote = await fetchRemoteQuote();
  const quote = remote || LOCAL[dayOfYear(new Date()) % LOCAL.length];

  cache = { date: today, quote };
  res.json(quote);
});

export default router;
