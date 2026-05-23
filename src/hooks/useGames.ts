import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, documentId, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export interface Game {
  id: string;
  userId: string;
  title: string;
  category: string;
  imageUrl?: string;
  startDate?: string | null;
  endDate?: string | null;
  visibility: 'public';
  createdAt?: any;
  updatedAt?: any;
}

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
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
      // Optionally sort by created At client side, or just use what we get
      g.sort((a, b) => {
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
    if (!user) return;
    try {
      const newGameRef = doc(collection(db, 'games'));
      const newGame = {
        ...gameData,
        userId: user.uid,
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
    if (!user) return;
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
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'games', gameId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `games/${gameId}`);
    }
  };

  return { games, loading, addGame, updateGame, deleteGame };
}
