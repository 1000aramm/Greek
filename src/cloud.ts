import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  Firestore,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { ADMIN_UID, firebaseConfig } from './firebaseConfig';
import { parseWords } from './storage';
import { Word } from './types';

/** True when a Firebase project is configured; otherwise the app runs local-only. */
export const cloudEnabled = Boolean(firebaseConfig.projectId);

export type WordFields = Pick<Word, 'greek' | 'english' | 'pos' | 'list'>;

const WORDS = 'words';
// Firestore allows 500 writes per batch.
const BATCH_SIZE = 400;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function init() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    // Cache words on the device so studying works offline.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    auth = getAuth(app);
  }
  return { db: db!, auth: auth! };
}

export function isAdmin(user: User | null): boolean {
  return !!user && !!ADMIN_UID && user.uid === ADMIN_UID;
}

/** Streams the shared word list. Progress (box) is per-device and not stored here. */
export function subscribeWords(onWords: (words: Word[]) => void, onError: (e: Error) => void) {
  const { db } = init();
  return onSnapshot(
    collection(db, WORDS),
    (snap) => {
      const words = parseWords(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      onWords(words.sort((a, b) => a.createdAt - b.createdAt));
    },
    onError,
  );
}

export function subscribeAuth(onUser: (user: User | null) => void) {
  return onAuthStateChanged(init().auth, onUser);
}

export async function signInAdmin(email: string, password: string) {
  await signInWithEmailAndPassword(init().auth, email, password);
}

export async function signOutAdmin() {
  await signOut(init().auth);
}

export async function addWords(words: Word[]) {
  const { db } = init();
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const w of words.slice(i, i + BATCH_SIZE)) {
      const fields: WordFields & { createdAt: number } = {
        greek: w.greek,
        english: w.english,
        pos: w.pos,
        list: w.list,
        createdAt: w.createdAt,
      };
      batch.set(doc(db, WORDS, w.id), fields);
    }
    await batch.commit();
  }
}

export async function updateWord(id: string, fields: WordFields) {
  await updateDoc(doc(init().db, WORDS, id), { ...fields });
}

export async function deleteWords(ids: string[]) {
  const { db } = init();
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + BATCH_SIZE)) batch.delete(doc(db, WORDS, id));
    await batch.commit();
  }
}
