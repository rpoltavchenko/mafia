interface Step {
  label: string;
  /** e.g. "3/9" */
  detail?: string;
}

/** Progress through a phase: done ✓ · current (highlighted) · upcoming. */
export default function PhaseSteps({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <ol className="phase-steps" aria-label="progress">
      {steps.map((s, i) => (
        <li key={s.label} className={i < current ? 'is-done' : i === current ? 'is-current' : ''} aria-current={i === current ? 'step' : undefined}>
          <span className="phase-step-num">{i < current ? '✓' : i + 1}</span>
          <span className="phase-step-label">{s.label}</span>
          {s.detail && <span className="phase-step-detail">{s.detail}</span>}
        </li>
      ))}
    </ol>
  );
}
