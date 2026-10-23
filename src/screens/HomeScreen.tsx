import { Chip } from '../components/ui';
import { Pos, POS_COLOR, POS_LABEL, POS_LIST, StudyOptions, Word } from '../types';

export function filterWords(words: Word[], lists: number[], pos: Pos[]): Word[] {
  return words.filter(
    (w) => (lists.length === 0 || lists.includes(w.list)) && (pos.length === 0 || pos.includes(w.pos)),
  );
}

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function HomeScreen({
  words,
  loading,
  syncError,
  canEdit,
  options,
  onChangeOptions,
  onStart,
  onImport,
  onManage,
  onSettings,
}: {
  words: Word[];
  loading: boolean;
  syncError: string | null;
  canEdit: boolean;
  options: StudyOptions;
  onChangeOptions: (o: StudyOptions) => void;
  onStart: () => void;
  onImport: () => void;
  onManage: () => void;
  onSettings: () => void;
}) {
  const lists = [...new Set(words.map((w) => w.list))].sort((a, b) => a - b);
  const posInUse = POS_LIST.filter((p) => words.some((w) => w.pos === p));
  // Ignore selections for lists/parts of speech that no longer have words.
  const activeLists = options.lists.filter((l) => lists.includes(l));
  const activePos = options.pos.filter((p) => posInUse.includes(p));
  const matching = filterWords(words, activeLists, activePos);
  const set = (patch: Partial<StudyOptions>) =>
    onChangeOptions({ ...options, lists: activeLists, pos: activePos, ...patch });

  return (
    <div className="page">
      <div className="brand">Ἑλληνικά</div>
      <p className="muted">Greek Flashcards · {words.length} {words.length === 1 ? 'word' : 'words'}</p>

      {syncError && <div className="error">Couldn't load words: {syncError}</div>}

      {loading ? (
        <div className="loading">
          <span className="spinner" /> Loading words...
        </div>
      ) : words.length === 0 ? (
        <div className="card empty">
          No words yet.
          <br />
          {canEdit ? 'Add a photo of a vocabulary list to get started!' : 'Check back soon!'}
        </div>
      ) : (
        <>
          <h2 className="section">Lists</h2>
          <div className="chips">
            <Chip label="All" selected={activeLists.length === 0} onClick={() => set({ lists: [] })} />
            {lists.map((l) => (
              <Chip
                key={l}
                label={`List ${l} (${words.filter((w) => w.list === l).length})`}
                selected={activeLists.includes(l)}
                onClick={() => set({ lists: toggle(activeLists, l) })}
              />
            ))}
          </div>

          <h2 className="section">Part of speech</h2>
          <div className="chips">
            <Chip label="All" selected={activePos.length === 0} onClick={() => set({ pos: [] })} />
            {posInUse.map((p) => (
              <Chip
                key={p}
                label={POS_LABEL[p]}
                color={POS_COLOR[p]}
                selected={activePos.includes(p)}
                onClick={() => set({ pos: toggle(activePos, p) })}
              />
            ))}
          </div>

          <h2 className="section">Options</h2>
          <div className="chips">
            <Chip label="Greek → English" selected={!options.reverse} onClick={() => set({ reverse: false })} />
            <Chip label="English → Greek" selected={options.reverse} onClick={() => set({ reverse: true })} />
          </div>
          <div className="chips">
            <Chip
              label="🔀 Shuffle (weak words first)"
              selected={options.shuffle}
              onClick={() => set({ shuffle: !options.shuffle })}
            />
          </div>

          <button className="btn primary mt" disabled={matching.length === 0} onClick={onStart}>
            {matching.length > 0 ? `Start (${matching.length} ${matching.length === 1 ? 'card' : 'cards'})` : 'No matching words'}
          </button>
        </>
      )}

      <div className="stack mt-lg">
        {canEdit && (
          <>
            <button className={`btn ${words.length ? 'secondary' : 'primary'}`} onClick={onImport}>
              📷 Add Words from Photo
            </button>
            <button className="btn secondary" onClick={onManage}>
              📚 Manage Words
            </button>
          </>
        )}
        <button className="btn secondary" onClick={onSettings}>
          ⚙️ Settings
        </button>
      </div>
    </div>
  );
}
