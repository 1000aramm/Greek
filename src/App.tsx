import { useEffect, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { ImportScreen } from './screens/ImportScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { StudyScreen } from './screens/StudyScreen';
import { WordsScreen } from './screens/WordsScreen';
import { loadOptions, loadSettings, loadWords, saveOptions, saveSettings, saveWords } from './storage';
import { Settings, StudyOptions, Word } from './types';

type Screen = 'home' | 'study' | 'import' | 'words' | 'settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [words, setWordsState] = useState<Word[]>(loadWords);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [options, setOptionsState] = useState<StudyOptions>(loadOptions);

  const setWords = (next: Word[]) => {
    setWordsState(next);
    saveWords(next);
  };
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

  switch (screen) {
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
          onGrade={(id, box) => setWords(words.map((w) => (w.id === id ? { ...w, box } : w)))}
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
            setWords([...words, ...added]);
            setOptions({ ...options, lists: [added[0].list], pos: [] });
            goHome();
          }}
          onBack={goHome}
          onOpenSettings={() => go('settings')}
        />
      );
    case 'words':
      return <WordsScreen words={words} onChange={setWords} onBack={goHome} />;
    case 'settings':
      return (
        <SettingsScreen
          settings={settings}
          words={words}
          onSaveSettings={setSettings}
          onChangeWords={setWords}
          onBack={goHome}
        />
      );
    default:
      return (
        <HomeScreen
          words={words}
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
