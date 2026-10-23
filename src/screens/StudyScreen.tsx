import { useMemo, useState } from 'react';
import { FlipCard } from '../components/FlipCard';
import { Header } from '../components/ui';
import { POS_COLOR, POS_LABEL, StudyOptions, Word } from '../types';
import { filterWords } from './HomeScreen';

const MAX_BOX = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(words: Word[], options: StudyOptions): string[] {
  let deck = filterWords(words, options.lists, options.pos);
  if (options.shuffle) {
    // Shuffle, then put weaker words first (sort is stable).
    deck = shuffle(deck).sort((a, b) => a.box - b.box);
  }
  return deck.map((w) => w.id);
}

export function StudyScreen({
  words,
  options,
  onGrade,
  onExit,
}: {
  words: Word[];
  options: StudyOptions;
  onGrade: (id: string, box: number) => void;
  onExit: () => void;
}) {
  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words]);
  const [queue, setQueue] = useState(() => buildDeck(words, options));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [missed, setMissed] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(queue.length);

  const restart = (ids: string[]) => {
    const deck = options.shuffle ? shuffle(ids) : ids;
    setQueue(deck);
    setTotal(deck.length);
    setIndex(0);
    setFlipped(false);
    setMissed(new Set());
  };

  const word = queue[index] ? byId.get(queue[index]) : undefined;

  if (!word) {
    const missedIds = [...missed].filter((id) => byId.has(id));
    return (
      <div className="screen">
        <Header title="결과" onBack={onExit} />
        <div className="page center">
          <div className="done-emoji">🎉</div>
          <h2 className="done-title">다 끝났어요!</h2>
          <p className="muted">
            {total}개 중 한 번에 맞힌 단어: {total - missedIds.length}개
          </p>
          <div className="stack mt-lg">
            {missedIds.length > 0 && (
              <button className="btn primary" onClick={() => restart(missedIds)}>
                틀린 단어만 다시 ({missedIds.length})
              </button>
            )}
            <button className="btn secondary" onClick={() => restart(buildDeck(words, options))}>
              처음부터 다시
            </button>
            <button className="btn secondary" onClick={onExit}>
              홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  const grade = (known: boolean) => {
    onGrade(word.id, known ? Math.min(word.box + 1, MAX_BOX) : 0);
    if (!known) {
      setMissed((m) => new Set(m).add(word.id));
      // Show it again at the end of this session.
      setQueue((q) => [...q, word.id]);
    }
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  return (
    <div className="screen">
      <Header
        title={`${index + 1} / ${queue.length}`}
        onBack={onExit}
        right={<span className="muted">List {word.list}</span>}
      />
      <div className="progress">
        <div style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>
      <div className="study">
        <FlipCard
          key={index}
          front={options.reverse ? word.english : word.greek}
          back={options.reverse ? word.greek : word.english}
          reverse={options.reverse}
          flipped={flipped}
          onClick={() => setFlipped((f) => !f)}
          badge={{ label: POS_LABEL[word.pos], color: POS_COLOR[word.pos] }}
        />
        <div className="row gap">
          {flipped ? (
            <>
              <button className="btn danger grow" onClick={() => grade(false)}>
                😕 몰라요
              </button>
              <button className="btn success grow" onClick={() => grade(true)}>
                😊 알아요
              </button>
            </>
          ) : (
            <button className="btn secondary grow" onClick={() => setFlipped(true)}>
              뒤집기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
