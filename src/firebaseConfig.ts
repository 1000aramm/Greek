// Paste the web app config from Firebase console → Project settings → Your apps.
// These values are public by design; access is controlled by firestore.rules.
// Leave projectId empty to run in local-only mode (words saved on this device only).
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

// UID of the admin account (Firebase console → Authentication → Users → User UID).
// Must match the UID in firestore.rules.
export const ADMIN_UID = '';
