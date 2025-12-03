'use client';

import { ReactNode, useMemo } from 'react';
import { FirebaseProvider, type FirebaseContextValue } from './provider';
import { initializeFirebase } from '.';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseContextValue = useMemo<FirebaseContextValue | null>(() => {
    if (typeof window !== 'undefined') {
      return initializeFirebase();
    }
    return null;
  }, []);

  if (!firebaseContextValue) {
    // During server-side rendering, we don't initialize Firebase.
    // You can return a loading state or null.
    return null;
  }

  return (
    <FirebaseProvider value={firebaseContextValue}>
      {children}
    </FirebaseProvider>
  );
}
