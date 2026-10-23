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
      alert(`Imported ${added.length} words (${incoming.length - added.length} duplicates skipped).`);
    } catch {
      alert("Couldn't read the backup file.");
    }
  };

  return (
    <div className="screen">
      <Header title="Settings" onBack={onBack} />
      <div className="page">
        <h2 className="section">Gemini (photo reading)</h2>
        <div className="card">
          <label className="label">API key</label>
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
             — create one for free. The key is stored only on this device and is sent only to Google.
          </p>
          <label className="label">Model</label>
          <input className="field" value={model} onChange={(e) => setModel(e.target.value)} />
          <p className="muted small">Default: {DEFAULT_SETTINGS.geminiModel}</p>
          <button className="btn primary mt" onClick={save}>
            {saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>

        <h2 className="section">Backup</h2>
        <div className="card stack">
          <p className="muted small">
            Words are stored in this device's browser. Export a backup before switching phones or clearing browser data.
          </p>
          <button className="btn secondary" onClick={exportWords} disabled={words.length === 0}>
            ⬇️ Export words ({words.length})
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importWords} />
          <button className="btn secondary" onClick={() => fileInput.current?.click()}>
            ⬆️ Import backup file
          </button>
        </div>

        <h2 className="section">Progress</h2>
        <div className="card stack">
          <button
            className="btn secondary"
            disabled={words.length === 0}
            onClick={() => {
              if (confirm('Reset "Know it / Don\'t know" progress for all words?'))
                onChangeWords(words.map((w) => ({ ...w, box: 0 })));
            }}
          >
            Reset progress
          </button>
          <button
            className="btn danger"
            disabled={words.length === 0}
            onClick={() => {
              if (confirm(`Delete all ${words.length} words? This can't be undone.`)) onChangeWords([]);
            }}
          >
            Delete all words
          </button>
        </div>
      </div>
    </div>
  );
}
