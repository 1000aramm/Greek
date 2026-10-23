import { DEFAULT_SETTINGS, isPos, newId, Settings, StudyOptions, Word } from './types';

const WORDS_KEY = 'greek.words.v1';
const SETTINGS_KEY = 'greek.settings.v1';
const OPTIONS_KEY = 'greek.options.v1';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    alert('저장 공간이 부족해서 저장하지 못했어요.');
  }
}

export function loadWords(): Word[] {
  return parseWords(read(WORDS_KEY));
}

export function saveWords(words: Word[]): void {
  write(WORDS_KEY, words);
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(SETTINGS_KEY) };
}

export function saveSettings(settings: Settings): void {
  write(SETTINGS_KEY, settings);
}

export function loadOptions(): StudyOptions {
  return { lists: [], pos: [], reverse: false, shuffle: true, ...read<Partial<StudyOptions>>(OPTIONS_KEY) };
}

export function saveOptions(options: StudyOptions): void {
  write(OPTIONS_KEY, options);
}

/** Validates words coming from storage or a backup file. */
export function parseWords(data: unknown): Word[] {
  const items = Array.isArray(data)
    ? data
    : Array.isArray((data as { words?: unknown })?.words)
      ? (data as { words: unknown[] }).words
      : [];
  const words: Word[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const w = item as Record<string, unknown>;
    if (typeof w.greek !== 'string' || typeof w.english !== 'string') continue;
    words.push({
      id: typeof w.id === 'string' ? w.id : newId(),
      greek: w.greek,
      english: w.english,
      pos: isPos(w.pos) ? w.pos : 'other',
      list: typeof w.list === 'number' && w.list > 0 ? Math.floor(w.list) : 1,
      box: typeof w.box === 'number' ? w.box : 0,
      createdAt: typeof w.createdAt === 'number' ? w.createdAt : Date.now(),
    });
  }
  return words;
}

/** Lowercased Greek without accents/breathings, for duplicate checks. */
export function normalizeGreek(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Shrinks a photo to a JPEG (max 2000px side) and returns its base64 data. */
export async function imageToBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}
