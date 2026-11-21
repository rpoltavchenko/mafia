interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: 'sm' | 'lg';
}

export default function Stepper({ value, onChange, min = 0, max = 99, label, size = 'sm' }: Props) {
  return (
    <div className={`stepper stepper-${size}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="−">
        −
      </button>
      <span className="stepper-value" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="+">
        +
      </button>
    </div>
  );
}
