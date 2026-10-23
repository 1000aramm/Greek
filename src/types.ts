export type Pos =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'other';

export const POS_LIST: Pos[] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'other',
];

export const POS_LABEL: Record<Pos, string> = {
  noun: 'Noun',
  verb: 'Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  pronoun: 'Pronoun',
  preposition: 'Preposition',
  conjunction: 'Conjunction',
  other: 'Other',
};

export const POS_COLOR: Record<Pos, string> = {
  noun: '#2F6FB5',
  verb: '#C0533A',
  adjective: '#3E8E5A',
  adverb: '#8A5CB8',
  pronoun: '#B5862F',
  preposition: '#2F9AA0',
  conjunction: '#A0476E',
  other: '#6B6B6B',
};

export interface Word {
  id: string;
  greek: string;
  english: string;
  pos: Pos;
  list: number;
  /** Leitner box: 0 = don't know yet, higher = known better. */
  box: number;
  createdAt: number;
}

export interface Settings {
  geminiApiKey: string;
  geminiModel: string;
}

export const DEFAULT_SETTINGS: Settings = {
  geminiApiKey: '',
  geminiModel: 'gemini-3.6-flash',
};

export interface StudyOptions {
  lists: number[];
  pos: Pos[];
  reverse: boolean;
  shuffle: boolean;
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function isPos(value: unknown): value is Pos {
  return typeof value === 'string' && (POS_LIST as string[]).includes(value);
}
