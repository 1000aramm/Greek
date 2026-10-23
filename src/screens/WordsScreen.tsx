import { useState } from 'react';
import { Chip, Header } from '../components/ui';
import { normalizeGreek } from '../storage';
import { newId, Pos, POS_COLOR, POS_LABEL, POS_LIST, Word } from '../types';

type Draft = Omit<Word, 'box' | 'createdAt'> & { isNew: boolean };

export function WordsScreen({
  words,
  onChange,
  onBack,
}: {
  words: Word[];
  onChange: (words: Word[]) => void;
  onBack: () => void;
}) {
  const lists = [...new Set(words.map((w) => w.list))].sort((a, b) => a - b);
  const [listFilter, setListFilter] = useState<number | null>(null);
  const [posFilter, setPosFilter] = useState<Pos | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);

  const q = normalizeGreek(query);
  const shown = words.filter(
    (w) =>
      (listFilter === null || w.list === listFilter) &&
      (posFilter === null || w.pos === posFilter) &&
      (!q || normalizeGreek(w.greek).includes(q) || w.english.toLowerCase().includes(q)),
  );

  const saveDraft = () => {
    if (!draft || !draft.greek.trim() || !draft.english.trim()) return;
    const fields = {
      greek: draft.greek.trim(),
      english: draft.english.trim(),
      pos: draft.pos,
      list: Math.max(1, Math.floor(draft.list) || 1),
    };
    onChange(
      draft.isNew
        ? [...words, { id: draft.id, ...fields, box: 0, createdAt: Date.now() }]
        : words.map((w) => (w.id === draft.id ? { ...w, ...fields } : w)),
    );
    setDraft(null);
  };

  const remove = (id: string) => {
    if (confirm('이 단어를 삭제할까요?')) {
      onChange(words.filter((w) => w.id !== id));
      setDraft(null);
    }
  };

  const removeList = (l: number) => {
    const n = words.filter((w) => w.list === l).length;
    if (confirm(`List ${l}의 단어 ${n}개를 모두 삭제할까요?`)) {
      onChange(words.filter((w) => w.list !== l));
      setListFilter(null);
    }
  };

  return (
    <div className="screen">
      <Header
        title="단어 관리"
        onBack={onBack}
        right={
          <button
            className="link"
            onClick={() =>
              setDraft({ id: newId(), greek: '', english: '', pos: posFilter ?? 'noun', list: listFilter ?? lists[0] ?? 1, isNew: true })
            }
          >
            + 추가
          </button>
        }
      />
      <div className="page">
        <input className="search" placeholder="검색 (그리스어 또는 영어)" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips mt">
          <Chip label="모든 리스트" selected={listFilter === null} onClick={() => setListFilter(null)} />
          {lists.map((l) => (
            <Chip key={l} label={`List ${l}`} selected={listFilter === l} onClick={() => setListFilter(l)} />
          ))}
        </div>
        <div className="chips">
          <Chip label="모든 품사" selected={posFilter === null} onClick={() => setPosFilter(null)} />
          {POS_LIST.filter((p) => words.some((w) => w.pos === p)).map((p) => (
            <Chip key={p} label={POS_LABEL[p]} color={POS_COLOR[p]} selected={posFilter === p} onClick={() => setPosFilter(p)} />
          ))}
        </div>

        <div className="row between">
          <span className="muted small">{shown.length}개</span>
          {listFilter !== null && (
            <button className="link danger-text small" onClick={() => removeList(listFilter)}>
              List {listFilter} 전체 삭제
            </button>
          )}
        </div>

        {shown.length === 0 && <p className="muted help">단어가 없어요.</p>}
        {shown.map((w) => (
          <button key={w.id} className="word-row as-button" onClick={() => setDraft({ ...w, isNew: false })}>
            <div className="grow left">
              <div className="greek word-greek">{w.greek}</div>
              <div className="muted">{w.english}</div>
            </div>
            <div className="right-col">
              <span className="pos-tag" style={{ background: POS_COLOR[w.pos] }}>
                {POS_LABEL[w.pos]}
              </span>
              <span className="muted small">List {w.list}</span>
            </div>
          </button>
        ))}
      </div>

      {draft && (
        <div className="modal-backdrop" onClick={() => setDraft(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{draft.isNew ? '단어 추가' : '단어 수정'}</h2>
            <label className="label">그리스어</label>
            <input className="field greek" value={draft.greek} onChange={(e) => setDraft({ ...draft, greek: e.target.value })} autoFocus />
            <label className="label">영어 뜻</label>
            <input className="field" value={draft.english} onChange={(e) => setDraft({ ...draft, english: e.target.value })} />
            <label className="label">품사</label>
            <div className="chips">
              {POS_LIST.map((p) => (
                <Chip key={p} label={POS_LABEL[p]} color={POS_COLOR[p]} selected={draft.pos === p} onClick={() => setDraft({ ...draft, pos: p })} />
              ))}
            </div>
            <label className="label">리스트 번호</label>
            <input
              className="field"
              type="number"
              inputMode="numeric"
              min={1}
              value={draft.list}
              onChange={(e) => setDraft({ ...draft, list: Number(e.target.value) })}
            />
            <div className="row gap mt">
              {!draft.isNew && (
                <button className="btn danger" onClick={() => remove(draft.id)}>
                  삭제
                </button>
              )}
              <button className="btn secondary grow" onClick={() => setDraft(null)}>
                취소
              </button>
              <button className="btn primary grow" disabled={!draft.greek.trim() || !draft.english.trim()} onClick={saveDraft}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
