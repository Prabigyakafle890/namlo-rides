import { initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let database;

if (hasFirebaseConfig) {
  const app = initializeApp(firebaseConfig);
  database = getDatabase(app);
}

const channelName = 'namlo-rides-trip-stream';
const storageKey = 'namlo-rides-live-trip';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null;

export const realtimeMode = hasFirebaseConfig ? 'firebase' : 'local-demo';

export function publishTrip(trip) {
  if (hasFirebaseConfig) {
    return set(ref(database, 'activeTrip'), trip);
  }

  localStorage.setItem(storageKey, JSON.stringify(trip));
  channel?.postMessage(trip);
  return Promise.resolve();
}

export function subscribeTrip(callback) {
  if (hasFirebaseConfig) {
    return onValue(ref(database, 'activeTrip'), (snapshot) => callback(snapshot.val()));
  }

  const savedTrip = localStorage.getItem(storageKey);
  if (savedTrip) {
    callback(JSON.parse(savedTrip));
  }

  const handleChannelMessage = (event) => callback(event.data);
  const handleStorageMessage = (event) => {
    if (event.key === storageKey && event.newValue) {
      callback(JSON.parse(event.newValue));
    }
  };

  channel?.addEventListener('message', handleChannelMessage);
  window.addEventListener('storage', handleStorageMessage);

  return () => {
    channel?.removeEventListener('message', handleChannelMessage);
    window.removeEventListener('storage', handleStorageMessage);
  };
}
