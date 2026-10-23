import { ReactNode } from 'react';

export function Chip({
  label,
  selected,
  onClick,
  color = 'var(--primary)',
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      className="chip"
      onClick={onClick}
      style={{
        borderColor: color,
        background: selected ? color : 'transparent',
        color: selected ? '#fff' : color,
      }}
    >
      {label}
    </button>
  );
}

export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="header">
      <div className="header-side">
        {onBack && (
          <button type="button" className="link back" onClick={onBack}>
            ‹ 뒤로
          </button>
        )}
      </div>
      <h1 className="header-title">{title}</h1>
      <div className="header-side right">{right}</div>
    </header>
  );
}
