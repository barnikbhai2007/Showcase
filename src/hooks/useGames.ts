import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, documentId, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export interface Game {
  id: string;
  userId: string;
  title: string;
  category: string;
  imageUrl?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
  rating?: number | null;
  visibility: 'public';
  createdAt?: any;
  updatedAt?: any;
}

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Anyone can list games that are public
    const q = query(
      collection(db, 'games'),
      where('visibility', '==', 'public')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const g: Game[] = [];
      snapshot.forEach(doc => {
        g.push({ id: doc.id, ...doc.data() } as Game);
      });
      g.sort((a, b) => {
        const getSortValue = (d?: string | null) => {
          if (!d) return 0;
          const parsed = new Date(stringToDateString(d)).getTime();
          if (!isNaN(parsed)) return parsed;
          return 0;
        };

        const stringToDateString = (d: string) => {
           if (/^\d{4}$/.test(d)) return `${d}-01-01`;
           return d;
        }
        
        const dateA = getSortValue(a.endDate || a.startDate);
        const dateB = getSortValue(b.endDate || b.startDate);

        if (dateA !== dateB) {
          return dateB - dateA;
        }

        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setGames(g);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addGame = async (gameData: Omit<Game, 'id' | 'userId' | 'visibility' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newGameRef = doc(collection(db, 'games'));
      const newGame = {
        ...gameData,
        userId: 'admin',
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(newGameRef, newGame);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'games');
    }
  };

  const updateGame = async (gameId: string, gameData: Partial<Game>) => {
    try {
      const gameRef = doc(db, 'games', gameId);
      await setDoc(gameRef, {
        ...gameData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `games/${gameId}`);
    }
  };

  const deleteGame = async (gameId: string) => {
    try {
      await deleteDoc(doc(db, 'games', gameId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `games/${gameId}`);
    }
  };

  return { games, loading, addGame, updateGame, deleteGame };
}
