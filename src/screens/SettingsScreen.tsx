import { ChangeEvent, useRef, useState } from 'react';
import { Header } from '../components/ui';
import { normalizeGreek, parseWords } from '../storage';
import { DEFAULT_SETTINGS, Settings, Word } from '../types';

export function SettingsScreen({
  settings,
  words,
  onSaveSettings,
  onChangeWords,
  onBack,
}: {
  settings: Settings;
  words: Word[];
  onSaveSettings: (s: Settings) => void;
  onChangeWords: (w: Word[]) => void;
  onBack: () => void;
}) {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [model, setModel] = useState(settings.geminiModel);
  const [saved, setSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const save = () => {
    onSaveSettings({ geminiApiKey: apiKey.trim(), geminiModel: model.trim() || DEFAULT_SETTINGS.geminiModel });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const exportWords = () => {
    const blob = new Blob([JSON.stringify({ version: 1, words }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greek-words-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importWords = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const incoming = parseWords(JSON.parse(await file.text()));
      const seen = new Set(words.map((w) => `${w.list}|${normalizeGreek(w.greek)}`));
      const ids = new Set(words.map((w) => w.id));
      const added = incoming.filter((w) => !seen.has(`${w.list}|${normalizeGreek(w.greek)}`) && !ids.has(w.id));
      onChangeWords([...words, ...added]);
      alert(`${added.length}개 단어를 불러왔어요. (중복 ${incoming.length - added.length}개 제외)`);
    } catch {
      alert('백업 파일을 읽을 수 없어요.');
    }
  };

  return (
    <div className="screen">
      <Header title="설정" onBack={onBack} />
      <div className="page">
        <h2 className="section">Gemini (사진 읽기)</h2>
        <div className="card">
          <label className="label">API 키</label>
          <input
            className="field"
            type="password"
            autoComplete="off"
            placeholder="AIza..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="muted small">
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              Google AI Studio
            </a>
            에서 무료로 만들 수 있어요. 키는 이 폰에만 저장되고 Google 말고는 어디에도 보내지 않아요.
          </p>
          <label className="label">모델</label>
          <input className="field" value={model} onChange={(e) => setModel(e.target.value)} />
          <p className="muted small">기본값: {DEFAULT_SETTINGS.geminiModel}</p>
          <button className="btn primary mt" onClick={save}>
            {saved ? '저장됨 ✓' : '저장'}
          </button>
        </div>

        <h2 className="section">백업</h2>
        <div className="card stack">
          <p className="muted small">
            단어는 이 폰의 브라우저에 저장돼요. 폰을 바꾸거나 데이터를 지우기 전에 백업 파일로 내보내 두세요.
          </p>
          <button className="btn secondary" onClick={exportWords} disabled={words.length === 0}>
            ⬇️ 단어 내보내기 ({words.length}개)
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importWords} />
          <button className="btn secondary" onClick={() => fileInput.current?.click()}>
            ⬆️ 백업 파일 불러오기
          </button>
        </div>

        <h2 className="section">학습 기록</h2>
        <div className="card stack">
          <button
            className="btn secondary"
            disabled={words.length === 0}
            onClick={() => {
              if (confirm('모든 단어의 "알아요/몰라요" 기록을 초기화할까요?'))
                onChangeWords(words.map((w) => ({ ...w, box: 0 })));
            }}
          >
            학습 기록 초기화
          </button>
          <button
            className="btn danger"
            disabled={words.length === 0}
            onClick={() => {
              if (confirm(`단어 ${words.length}개를 전부 삭제할까요? 되돌릴 수 없어요.`)) onChangeWords([]);
            }}
          >
            모든 단어 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
