import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
export * from './provider';
export * from './client-provider';
import { useCollection } from './firestore/use-collection';

interface FirebaseInstances {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function initializeFirebase(): FirebaseInstances {
  const apps = getApps();
  const firebaseApp =
    apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  return { firebaseApp, auth, firestore };
}


const useDoc = () => ({ data: null, loading: true });

export { useCollection, useDoc };
