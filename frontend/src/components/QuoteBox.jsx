import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Shown if the request itself fails (the API already has its own fallback).
const FALLBACK = { content: 'Hard writing makes easy reading.', author: 'Wallace Stegner' };

export default function QuoteBox() {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .quoteOfDay()
      .then((q) => alive && setQuote(q?.content ? q : FALLBACK))
      .catch(() => alive && setQuote(FALLBACK));
    return () => { alive = false; };
  }, []);

  return (
    <div className="quote-box">
      <span className="quote-glyph" aria-hidden="true">“</span>
      <span className="quote-label">Thought of the day</span>
      {quote ? (
        <>
          <p className="quote-text">{quote.content}</p>
          <p className="quote-author">— {quote.author || 'Unknown'}</p>
        </>
      ) : (
        <p className="quote-text quote-text--muted">Fetching a little inspiration…</p>
      )}
      <span className="quote-glyph quote-glyph--close" aria-hidden="true">{'”'}</span>
    </div>
  );
}
