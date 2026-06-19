import { IconPlus, IconClose } from '../lib/icons.jsx';

// Controlled list of URL inputs with inline add/remove. Always renders at least
// one row; empties are filtered by the caller before saving.
export default function LinkInputs({ value, onChange, placeholder }) {
  const links = value.length ? value : [''];
  const update = (i, v) => onChange(links.map((l, idx) => (idx === i ? v : l)));
  const remove = (i) => {
    const next = links.filter((_, idx) => idx !== i);
    onChange(next.length ? next : ['']);
  };

  return (
    <div className="link-inputs">
      {links.map((link, i) => (
        <div className="link-input-row" key={i}>
          <input value={link} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} />
          {links.length > 1 && (
            <button type="button" className="icon-btn" onClick={() => remove(i)} aria-label="Remove link">
              <IconClose />
            </button>
          )}
        </div>
      ))}
      <button type="button" className="link-btn" onClick={() => onChange([...links, ''])}>
        <IconPlus /> Add another link
      </button>
    </div>
  );
}
