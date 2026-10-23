import { User } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import * as cloud from './cloud';
import { HomeScreen } from './screens/HomeScreen';
import { ImportScreen } from './screens/ImportScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { StudyScreen } from './screens/StudyScreen';
import { WordsScreen } from './screens/WordsScreen';
import {
  clearLocalWords,
  loadOptions,
  loadProgress,
  loadSettings,
  loadWords,
  saveOptions,
  saveProgress,
  saveSettings,
  saveWords,
} from './storage';
import { Settings, StudyOptions, Word } from './types';

type Screen = 'home' | 'study' | 'import' | 'words' | 'settings';

function initialProgress(): Record<string, number> {
  // Carry over progress saved on words before it moved to its own key.
  const progress = loadProgress();
  for (const w of loadWords()) if (w.box && progress[w.id] === undefined) progress[w.id] = w.box;
  return progress;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [localWords, setLocalWordsState] = useState<Word[]>(loadWords);
  const [cloudWords, setCloudWords] = useState<Word[] | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>(initialProgress);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [options, setOptionsState] = useState<StudyOptions>(loadOptions);

  useEffect(() => {
    if (!cloud.cloudEnabled) return;
    const stopWords = cloud.subscribeWords(
      (w) => {
        setCloudWords(w);
        setSyncError(null);
      },
      (e) => setSyncError(e.message),
    );
    const stopAuth = cloud.subscribeAuth(setUser);
    return () => {
      stopWords();
      stopAuth();
    };
  }, []);

  useEffect(() => saveProgress(progress), [progress]);

  const base = cloud.cloudEnabled ? (cloudWords ?? []) : localWords;
  const words = useMemo(() => base.map((w) => ({ ...w, box: progress[w.id] ?? 0 })), [base, progress]);
  const loading = cloud.cloudEnabled && cloudWords === null && !syncError;
  const canEdit = !cloud.cloudEnabled || cloud.isAdmin(user);

  // Words saved on this device before cloud sync was set up, waiting to be uploaded.
  const cloudIds = new Set(cloudWords?.map((w) => w.id));
  const pendingLocal = cloud.cloudEnabled && canEdit && cloudWords ? localWords.filter((w) => !cloudIds.has(w.id)) : [];

  const setLocalWords = (next: Word[]) => {
    setLocalWordsState(next);
    saveWords(next);
  };
  const run = (p: Promise<unknown>) =>
    p.catch((e: Error) => alert(`Couldn't save to the cloud: ${e.message}`));

  const addWords = (added: Word[]) => {
    if (cloud.cloudEnabled) run(cloud.addWords(added));
    else setLocalWords([...localWords, ...added]);
  };
  const updateWord = (id: string, fields: cloud.WordFields) => {
    if (cloud.cloudEnabled) run(cloud.updateWord(id, fields));
    else setLocalWords(localWords.map((w) => (w.id === id ? { ...w, ...fields } : w)));
  };
  const deleteWords = (ids: string[]) => {
    if (cloud.cloudEnabled) run(cloud.deleteWords(ids));
    else setLocalWords(localWords.filter((w) => !ids.includes(w.id)));
  };
  const uploadLocal = () =>
    cloud.addWords(pendingLocal).then(() => {
      clearLocalWords();
      setLocalWordsState([]);
    });

  const setSettings = (next: Settings) => {
    setSettingsState(next);
    saveSettings(next);
  };
  const setOptions = (next: StudyOptions) => {
    setOptionsState(next);
    saveOptions(next);
  };

  // Let the phone's back gesture/button return to the home screen.
  const go = (next: Screen) => {
    if (next !== 'home' && screen === 'home') history.pushState({ screen: next }, '');
    else if (next !== 'home') history.replaceState({ screen: next }, '');
    setScreen(next);
    window.scrollTo(0, 0);
  };
  const goHome = () => {
    if (history.state?.screen) history.back();
    else setScreen('home');
  };
  useEffect(() => {
    const onPop = () => setScreen('home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Admin-only screens fall back to home if the admin signs out.
  const current = !canEdit && (screen === 'import' || screen === 'words') ? 'home' : screen;

  switch (current) {
    case 'study': {
      const lists = new Set(words.map((w) => w.list));
      const pos = new Set(words.map((w) => w.pos));
      const active = {
        ...options,
        lists: options.lists.filter((l) => lists.has(l)),
        pos: options.pos.filter((p) => pos.has(p)),
      };
      return (
        <StudyScreen
          words={words}
          options={active}
          onGrade={(id, box) => setProgress((p) => ({ ...p, [id]: box }))}
          onExit={goHome}
        />
      );
    }
    case 'import':
      return (
        <ImportScreen
          words={words}
          settings={settings}
          onSave={(added) => {
            addWords(added);
            setOptions({ ...options, lists: [added[0].list], pos: [] });
            goHome();
          }}
          onBack={goHome}
          onOpenSettings={() => go('settings')}
        />
      );
    case 'words':
      return (
        <WordsScreen
          words={words}
          onAdd={(w) => addWords([w])}
          onUpdate={updateWord}
          onDelete={deleteWords}
          onBack={goHome}
        />
      );
    case 'settings':
      return (
        <SettingsScreen
          settings={settings}
          words={words}
          user={user}
          canEdit={canEdit}
          pendingLocal={pendingLocal.length}
          onUploadLocal={uploadLocal}
          onSaveSettings={setSettings}
          onImportWords={addWords}
          onDeleteAll={() => deleteWords(words.map((w) => w.id))}
          onResetProgress={() => setProgress({})}
          onBack={goHome}
        />
      );
    default:
      return (
        <HomeScreen
          words={words}
          loading={loading}
          syncError={syncError}
          canEdit={canEdit}
          options={options}
          onChangeOptions={setOptions}
          onStart={() => go('study')}
          onImport={() => go('import')}
          onManage={() => go('words')}
          onSettings={() => go('settings')}
        />
      );
  }
}
