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
  options,
  onChangeOptions,
  onStart,
  onImport,
  onManage,
  onSettings,
}: {
  words: Word[];
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
      <p className="muted">그리스어 플래시카드 · 단어 {words.length}개</p>

      {words.length === 0 ? (
        <div className="card empty">
          아직 단어가 없어요.
          <br />
          단어장 사진을 올려서 시작해 보세요!
        </div>
      ) : (
        <>
          <h2 className="section">단어장 리스트</h2>
          <div className="chips">
            <Chip label="전체" selected={activeLists.length === 0} onClick={() => set({ lists: [] })} />
            {lists.map((l) => (
              <Chip
                key={l}
                label={`List ${l} (${words.filter((w) => w.list === l).length})`}
                selected={activeLists.includes(l)}
                onClick={() => set({ lists: toggle(activeLists, l) })}
              />
            ))}
          </div>

          <h2 className="section">품사</h2>
          <div className="chips">
            <Chip label="전체" selected={activePos.length === 0} onClick={() => set({ pos: [] })} />
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

          <h2 className="section">옵션</h2>
          <div className="chips">
            <Chip label="그리스어 → 영어" selected={!options.reverse} onClick={() => set({ reverse: false })} />
            <Chip label="영어 → 그리스어" selected={options.reverse} onClick={() => set({ reverse: true })} />
          </div>
          <div className="chips">
            <Chip
              label="🔀 섞기 (모르는 단어 먼저)"
              selected={options.shuffle}
              onClick={() => set({ shuffle: !options.shuffle })}
            />
          </div>

          <button className="btn primary mt" disabled={matching.length === 0} onClick={onStart}>
            {matching.length > 0 ? `공부 시작 (${matching.length}장)` : '해당하는 단어가 없어요'}
          </button>
        </>
      )}

      <div className="stack mt-lg">
        <button className={`btn ${words.length ? 'secondary' : 'primary'}`} onClick={onImport}>
          📷 사진으로 단어 추가
        </button>
        <button className="btn secondary" onClick={onManage}>
          📚 단어 관리
        </button>
        <button className="btn secondary" onClick={onSettings}>
          ⚙️ 설정
        </button>
      </div>
    </div>
  );
}
