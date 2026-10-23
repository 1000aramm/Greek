import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { Chip, Header } from '../components/ui';
import { extractWordsFromImage } from '../gemini';
import { imageToBase64, normalizeGreek } from '../storage';
import { newId, Pos, POS_COLOR, POS_LABEL, POS_LIST, Settings, Word } from '../types';

interface Row {
  key: string;
  greek: string;
  english: string;
  pos: Pos;
  checked: boolean;
}

export function ImportScreen({
  words,
  settings,
  onSave,
  onBack,
  onOpenSettings,
}: {
  words: Word[];
  settings: Settings;
  onSave: (newWords: Word[]) => void;
  onBack: () => void;
  onOpenSettings: () => void;
}) {
  const existingLists = [...new Set(words.map((w) => w.list))].sort((a, b) => a - b);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<number>(existingLists.length ? existingLists[existingLists.length - 1] + 1 : 1);
  const [extraLists, setExtraLists] = useState<number[]>([]);
  const cameraInput = useRef<HTMLInputElement>(null);
  const albumInput = useRef<HTMLInputElement>(null);

  const allLists = [...new Set([1, 2, 3, 4, ...existingLists, ...extraLists, list])].sort((a, b) => a - b);

  const existingInList = useMemo(
    () => new Set(words.filter((w) => w.list === list).map((w) => normalizeGreek(w.greek))),
    [words, list],
  );

  const choose = (input: HTMLInputElement | null) => {
    if (!settings.geminiApiKey) {
      if (confirm('Gemini API 키가 필요해요. 설정으로 갈까요?')) onOpenSettings();
      return;
    }
    input?.click();
  };

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (files.length === 0) return;
    setError(null);

    const found: Row[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setLoading(files.length > 1 ? `사진 ${i + 1}/${files.length} 읽는 중...` : 'Gemini가 사진을 읽는 중...');
        const base64 = await imageToBase64(files[i]);
        const extracted = await extractWordsFromImage(
          settings.geminiApiKey,
          settings.geminiModel,
          base64,
          'image/jpeg',
        );
        for (const w of extracted) found.push({ key: newId(), ...w, checked: true });
      }
      if (found.length === 0) setError('단어를 찾지 못했어요. 다른 사진으로 시도해 보세요.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
      setRows((prev) => [...prev, ...found]);
    }
  };

  const update = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const checked = rows.filter((r) => r.checked && r.greek.trim() && r.english.trim());
  const allChecked = rows.length > 0 && rows.every((r) => r.checked);
  const cyclePos = (pos: Pos): Pos => POS_LIST[(POS_LIST.indexOf(pos) + 1) % POS_LIST.length];

  const save = () => {
    const now = Date.now();
    onSave(
      checked.map((r, i) => ({
        id: newId(),
        greek: r.greek.trim(),
        english: r.english.trim(),
        pos: r.pos,
        list,
        box: 0,
        createdAt: now + i,
      })),
    );
  };

  return (
    <div className="screen">
      <Header title="사진으로 단어 추가" onBack={onBack} />
      <div className={`page ${rows.length ? 'has-footer' : ''}`}>
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={onFiles} />
        <input ref={albumInput} type="file" accept="image/*" multiple hidden onChange={onFiles} />
        <div className="row gap">
          <button className="btn primary grow" disabled={!!loading} onClick={() => choose(cameraInput.current)}>
            📷 사진 찍기
          </button>
          <button className="btn primary grow" disabled={!!loading} onClick={() => choose(albumInput.current)}>
            🖼 앨범에서
          </button>
        </div>

        {loading && (
          <div className="loading">
            <span className="spinner" /> {loading}
          </div>
        )}
        {error && <div className="error">{error}</div>}

        {rows.length === 0 && !loading && (
          <p className="muted help">
            단어장 사진을 찍거나 앨범에서 고르면 Gemini가 그리스어와 영어 뜻을 읽어서 아래에 쭉 보여줘요. 체크하고,
            틀린 건 고치고, 저장하면 끝! 사진은 여러 장 한꺼번에 골라도 돼요.
          </p>
        )}

        {rows.length > 0 && (
          <>
            <h2 className="section">어느 리스트에 넣을까요?</h2>
            <div className="chips">
              {allLists.map((l) => (
                <Chip key={l} label={`List ${l}`} selected={list === l} onClick={() => setList(l)} />
              ))}
              <Chip
                label="+ 새 리스트"
                selected={false}
                onClick={() => {
                  const next = Math.max(...allLists) + 1;
                  setExtraLists((x) => [...x, next]);
                  setList(next);
                }}
              />
            </div>

            <h2 className="section">체크한 단어 품사 한꺼번에 정하기</h2>
            <div className="chips">
              {POS_LIST.map((p) => (
                <Chip
                  key={p}
                  label={POS_LABEL[p]}
                  color={POS_COLOR[p]}
                  selected={checked.length > 0 && checked.every((r) => r.pos === p)}
                  onClick={() => setRows((rs) => rs.map((r) => (r.checked ? { ...r, pos: p } : r)))}
                />
              ))}
            </div>

            <div className="row between mt">
              <strong>
                {rows.length}개 찾음 · {checked.length}개 선택
              </strong>
              <button className="link" onClick={() => setRows((rs) => rs.map((r) => ({ ...r, checked: !allChecked })))}>
                {allChecked ? '모두 해제' : '모두 선택'}
              </button>
            </div>
            <p className="muted small">품사 태그를 누르면 하나씩 바꿀 수 있어요.</p>

            {rows.map((r) => (
              <div key={r.key} className={`word-row ${r.checked ? '' : 'off'}`}>
                <button
                  className={`checkbox ${r.checked ? 'on' : ''}`}
                  onClick={() => update(r.key, { checked: !r.checked })}
                  aria-label="선택"
                >
                  {r.checked && '✓'}
                </button>
                <div className="grow">
                  <input
                    className="input-greek"
                    value={r.greek}
                    placeholder="그리스어"
                    onChange={(e) => update(r.key, { greek: e.target.value })}
                  />
                  <input
                    className="input-english"
                    value={r.english}
                    placeholder="English"
                    onChange={(e) => update(r.key, { english: e.target.value })}
                  />
                  {existingInList.has(normalizeGreek(r.greek)) && (
                    <div className="dup">⚠️ List {list}에 이미 있는 단어예요</div>
                  )}
                </div>
                <button
                  className="pos-tag"
                  style={{ background: POS_COLOR[r.pos] }}
                  onClick={() => update(r.key, { pos: cyclePos(r.pos) })}
                >
                  {POS_LABEL[r.pos]}
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {rows.length > 0 && (
        <div className="footer">
          <button className="btn primary" disabled={checked.length === 0} onClick={save}>
            List {list}에 {checked.length}개 저장
          </button>
        </div>
      )}
    </div>
  );
}
