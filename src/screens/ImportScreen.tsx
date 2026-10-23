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
      if (confirm('A Gemini API key is needed. Open Settings?')) onOpenSettings();
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
        setLoading(files.length > 1 ? `Reading photo ${i + 1}/${files.length}...` : 'Gemini is reading the photo...');
        const base64 = await imageToBase64(files[i]);
        const extracted = await extractWordsFromImage(
          settings.geminiApiKey,
          settings.geminiModel,
          base64,
          'image/jpeg',
        );
        for (const w of extracted) found.push({ key: newId(), ...w, checked: true });
      }
      if (found.length === 0) setError('No words found. Try another photo.');
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
      <Header title="Add from Photo" onBack={onBack} />
      <div className={`page ${rows.length ? 'has-footer' : ''}`}>
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={onFiles} />
        <input ref={albumInput} type="file" accept="image/*" multiple hidden onChange={onFiles} />
        <div className="row gap">
          <button className="btn primary grow" disabled={!!loading} onClick={() => choose(cameraInput.current)}>
            📷 Take Photo
          </button>
          <button className="btn primary grow" disabled={!!loading} onClick={() => choose(albumInput.current)}>
            🖼 From Library
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
            Take or choose a photo of a vocabulary list and Gemini will read the Greek words and English meanings
            into a list below. Check the ones you want, fix any mistakes, and save. You can pick several photos at once.
          </p>
        )}

        {rows.length > 0 && (
          <>
            <h2 className="section">Which list?</h2>
            <div className="chips">
              {allLists.map((l) => (
                <Chip key={l} label={`List ${l}`} selected={list === l} onClick={() => setList(l)} />
              ))}
              <Chip
                label="+ New list"
                selected={false}
                onClick={() => {
                  const next = Math.max(...allLists) + 1;
                  setExtraLists((x) => [...x, next]);
                  setList(next);
                }}
              />
            </div>

            <h2 className="section">Set part of speech for checked words</h2>
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
                {rows.length} found · {checked.length} selected
              </strong>
              <button className="link" onClick={() => setRows((rs) => rs.map((r) => ({ ...r, checked: !allChecked })))}>
                {allChecked ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <p className="muted small">Tap a tag to change one word’s part of speech.</p>

            {rows.map((r) => (
              <div key={r.key} className={`word-row ${r.checked ? '' : 'off'}`}>
                <button
                  className={`checkbox ${r.checked ? 'on' : ''}`}
                  onClick={() => update(r.key, { checked: !r.checked })}
                  aria-label="Select"
                >
                  {r.checked && '✓'}
                </button>
                <div className="grow">
                  <input
                    className="input-greek"
                    value={r.greek}
                    placeholder="Greek"
                    onChange={(e) => update(r.key, { greek: e.target.value })}
                  />
                  <input
                    className="input-english"
                    value={r.english}
                    placeholder="English"
                    onChange={(e) => update(r.key, { english: e.target.value })}
                  />
                  {existingInList.has(normalizeGreek(r.greek)) && (
                    <div className="dup">⚠️ Already in List {list}</div>
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
            Save {checked.length} to List {list}
          </button>
        </div>
      )}
    </div>
  );
}
