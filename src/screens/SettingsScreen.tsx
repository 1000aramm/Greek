import { User } from 'firebase/auth';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { cloudEnabled, isAdmin, signInAdmin, signOutAdmin } from '../cloud';
import { Header } from '../components/ui';
import { normalizeGreek, parseWords } from '../storage';
import { DEFAULT_SETTINGS, Settings, Word } from '../types';

export function SettingsScreen({
  settings,
  words,
  user,
  canEdit,
  pendingLocal,
  onUploadLocal,
  onSaveSettings,
  onImportWords,
  onDeleteAll,
  onResetProgress,
  onBack,
}: {
  settings: Settings;
  words: Word[];
  user: User | null;
  canEdit: boolean;
  pendingLocal: number;
  onUploadLocal: () => Promise<void>;
  onSaveSettings: (s: Settings) => void;
  onImportWords: (w: Word[]) => void;
  onDeleteAll: () => void;
  onResetProgress: () => void;
  onBack: () => void;
}) {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [model, setModel] = useState(settings.geminiModel);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const save = () => {
    onSaveSettings({ geminiApiKey: apiKey.trim(), geminiModel: model.trim() || DEFAULT_SETTINGS.geminiModel });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setAuthError(null);
    try {
      await signInAdmin(email.trim(), password);
      setPassword('');
    } catch {
      setAuthError('Wrong email or password.');
    } finally {
      setBusy(false);
    }
  };

  const upload = async () => {
    setBusy(true);
    try {
      await onUploadLocal();
      alert('Uploaded! Everyone can see these words now.');
    } catch (e) {
      alert(`Upload failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  };

  const exportWords = () => {
    const data = words.map(({ box: _box, ...w }) => w);
    const blob = new Blob([JSON.stringify({ version: 1, words: data }, null, 2)], { type: 'application/json' });
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
      onImportWords(added);
      alert(`Imported ${added.length} words (${incoming.length - added.length} duplicates skipped).`);
    } catch {
      alert("Couldn't read the backup file.");
    }
  };

  return (
    <div className="screen">
      <Header title="Settings" onBack={onBack} />
      <div className="page">
        {cloudEnabled && (
          <>
            <h2 className="section">Admin</h2>
            <div className="card">
              {user ? (
                <div className="stack">
                  <p className="small">
                    Signed in as <strong>{user.email}</strong>
                    {!isAdmin(user) && (
                      <span className="danger-text"> — this account isn't the admin, so it can't edit words.</span>
                    )}
                  </p>
                  {pendingLocal > 0 && (
                    <button className="btn primary" disabled={busy} onClick={upload}>
                      ☁️ Upload {pendingLocal} words saved on this device
                    </button>
                  )}
                  <button className="btn secondary" onClick={() => signOutAdmin()}>
                    Sign out
                  </button>
                </div>
              ) : (
                <form className="stack" onSubmit={signIn}>
                  <p className="muted small">Only the admin can add or edit words. Everyone else can just study.</p>
                  <input
                    className="field"
                    type="email"
                    autoComplete="username"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    className="field"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {authError && <p className="danger-text small">{authError}</p>}
                  <button className="btn primary" type="submit" disabled={busy || !email || !password}>
                    Sign in
                  </button>
                </form>
              )}
            </div>
          </>
        )}

        {canEdit && (
          <>
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
                </a>{' '}
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
                {cloudEnabled
                  ? 'Words are saved in the cloud. You can also keep a backup file.'
                  : "Words are stored in this device's browser. Export a backup before switching phones or clearing browser data."}
              </p>
              <button className="btn secondary" onClick={exportWords} disabled={words.length === 0}>
                ⬇️ Export words ({words.length})
              </button>
              <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importWords} />
              <button className="btn secondary" onClick={() => fileInput.current?.click()}>
                ⬆️ Import backup file
              </button>
            </div>
          </>
        )}

        <h2 className="section">Progress</h2>
        <div className="card stack">
          <button
            className="btn secondary"
            disabled={words.length === 0}
            onClick={() => {
              if (confirm('Reset "Know it / Don\'t know" progress for all words?')) onResetProgress();
            }}
          >
            Reset my progress
          </button>
          {canEdit && (
            <button
              className="btn danger"
              disabled={words.length === 0}
              onClick={() => {
                const who = cloudEnabled ? ' for everyone' : '';
                if (confirm(`Delete all ${words.length} words${who}? This can't be undone.`)) onDeleteAll();
              }}
            >
              Delete all words
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
