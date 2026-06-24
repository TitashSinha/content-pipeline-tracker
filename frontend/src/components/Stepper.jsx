import { PIPELINE, STATUS_LABELS } from '../lib/workflow.js';
import { IconCheck } from '../lib/icons.jsx';

export default function Stepper({ status }) {
  // Reopened pieces are back in the active loop — show them at Writing.
  const effective = status === 'REOPENED' ? 'WRITING' : status;
  const currentIndex = PIPELINE.indexOf(effective);
  return (
    <ol className="stepper">
      {PIPELINE.map((s, i) => {
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
