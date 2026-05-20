import { STATUSES, STATUS_LABELS } from '../lib/constants'

export default function Stepper({ currentStatus }) {
  const currentStep = STATUSES.indexOf(currentStatus)
  return (
    <div className="stepper">
      {STATUSES.map((s, i) => (
        <div
          key={s}
          className={[
            'stepper-step',
            i < currentStep   ? 'step--done'    : '',
            i === currentStep ? 'step--current' : '',
          ].join(' ')}
        >
          <div className="stepper-dot-row">
            <div className="stepper-dot">
              {i < currentStep && <span>✓</span>}
            </div>
            {i < STATUSES.length - 1 && (
              <div className={`stepper-connector ${i < currentStep ? 'stepper-connector--done' : ''}`} />
            )}
          </div>
          <span className="stepper-label">{STATUS_LABELS[s]}</span>
        </div>
      ))}
    </div>
  )
}
