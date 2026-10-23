export function FlipCard({
  front,
  back,
  flipped,
  onClick,
  badge,
  reverse,
}: {
  front: string;
  back: string;
  flipped: boolean;
  onClick: () => void;
  badge?: { label: string; color: string };
  /** True when the back (not the front) shows Greek. */
  reverse?: boolean;
}) {
  return (
    // Keyed by the caller per card so a new card starts unflipped without animating back.
    <div className={`flip ${flipped ? 'flipped' : ''}`} onClick={onClick}>
      <div className="flip-inner">
        <div className="face front">
          {badge && (
            <span className="badge" style={{ background: badge.color }}>
              {badge.label}
            </span>
          )}
          <div className={`face-text ${reverse ? '' : 'greek'}`}>{front}</div>
          <div className="hint">Tap to flip</div>
        </div>
        <div className="face back">
          <div className={`face-text ${reverse ? 'greek' : ''}`}>{back}</div>
        </div>
      </div>
    </div>
  );
}
