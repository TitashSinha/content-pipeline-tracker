import { STATUSES, STATUS_LABELS } from '../lib/constants.js';
import { IconCheck } from '../lib/icons.jsx';

export default function Stepper({ status }) {
  const currentIndex = STATUSES.indexOf(status);
  return (
    <ol className="stepper">
      {STATUSES.map((s, i) => {
        const done = i < currentIndex || status === 'COMPLETED';
        const state = done ? 'done' : i === currentIndex ? 'current' : 'todo';
        return (
          <li key={s} className={`step step--${state}`}>
            <span className="step-dot">{state === 'done' ? <IconCheck /> : i + 1}</span>
            <span className="step-label">{STATUS_LABELS[s]}</span>
          </li>
        );
      })}
    </ol>
  );
}
