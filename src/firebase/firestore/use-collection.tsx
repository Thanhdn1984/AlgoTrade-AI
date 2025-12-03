'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  type DocumentData,
  type Query,
  type CollectionReference,
  type Unsubscribe,
  type QueryConstraint,
  type WithFieldValue,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

type UseCollectionOptions = {
  constraints?: QueryConstraint[];
};

export function useCollection<T>(
  ref: CollectionReference<DocumentData> | Query<DocumentData> | null,
  options?: UseCollectionOptions,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setData([]);
      setLoading(false);
      return;
    }

    let unsubscribe: Unsubscribe = () => {};

    try {
      const q = options?.constraints ? query(ref, ...options.constraints) : ref;
      
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const result: T[] = [];
          snapshot.forEach((doc) => {
            result.push({ ...doc.data(), id: doc.id } as T);
          });
          setData(result);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Error in onSnapshot:", err);
          setError(err);
          setLoading(false);
        }
      );
    } catch (err: any) {
        console.error("Error setting up snapshot listener:", err);
        setError(err);
        setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [ref, ...(options?.constraints || [])]);

  return { data, loading, error };
}
