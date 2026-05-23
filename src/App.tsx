import React, { useEffect, useState } from 'react';
import { signInAnonymously, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { GameCard } from './components/GameCard';
import { AddGameModal } from './components/AddGameModal';
import { Library, Plus, LogOut, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Game } from './hooks/useGames';

const CATEGORIES = ["All", "PC games", "Xbox Games", "PS5 games", "Mobiles games", "Lust Games"] as const;
const STATUSES = ["All", "Completed", "Ongoing", "Abandoned", "Wishlist"] as const;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeStatus, setActiveStatus] = useState<string>('All');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    setGamesLoading(true);
    const q = query(
      collection(db, 'games'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const g = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Game[];
      setGames(g);
      setGamesLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
      setGamesLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    const key = prompt("Enter admin passkey");
    if (key === "brokenaqua@admin") {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Sign in failed", err);
      }
    } else if (key !== null) {
      alert("Invalid passkey");
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

  const filteredGames = games.filter(g => {
    const matchCat = activeCategory === 'All' ? true : g.category === activeCategory;
    const matchStatus = activeStatus === 'All' ? true : (g.status || 'Completed') === activeStatus;
    return matchCat && matchStatus;
  });

  if (authLoading || gamesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-300">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Library className="w-8 h-8 opacity-50" />
          <span className="font-serif italic tracking-wider">Dusting off the shelves...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-stone-700 pb-24">
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center border border-stone-700">
                <Library className="w-5 h-5 text-stone-300" />
              </div>
              <div>
                <h1 className="text-2xl font-serif leading-none tracking-tight">Playbook</h1>
                <p className="text-xs text-stone-500 font-medium tracking-widest uppercase mt-1">My Collection</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-stone-100 text-stone-900 px-4 py-2 rounded-full font-medium hover:bg-white transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Game</span>
                  </button>
                  <button 
                    onClick={() => signOut(auth)}
                    className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-full transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleSignIn}
                  className="flex items-center gap-2 bg-stone-800 border border-stone-700 hover:bg-stone-700 text-stone-200 px-5 py-2 rounded-full font-medium transition-all text-sm shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Admin Access</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Navigation Filters */}
        <div className="flex flex-col gap-4 mb-10">
          <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider mr-2 shrink-0">Platform</span>
            {CATEGORIES.map(category => (
              <button
                 key={category}
                 onClick={() => setActiveCategory(category)}
                 className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                   ${activeCategory === category 
                     ? 'bg-stone-200 text-stone-900 shadow-sm' 
                     : 'bg-stone-800/50 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-transparent hover:border-stone-700/50'
                   }`}
               >
                 {category}
               </button>
            ))}
          </nav>
          
          <nav className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-stone-800/60">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider mr-2 shrink-0">Status</span>
            {STATUSES.map(status => (
              <button
                 key={status}
                 onClick={() => setActiveStatus(status)}
                 className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                   ${activeStatus === status 
                     ? 'bg-stone-700 text-stone-100 shadow-sm border border-stone-600' 
                     : 'bg-transparent text-stone-500 hover:text-stone-300'
                   }`}
               >
                 {status}
               </button>
            ))}
          </nav>
        </div>

        {/* Gallery */}
        {filteredGames.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode='popLayout'>
              {filteredGames.map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onDelete={deleteGame} 
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-full bg-stone-800 border-2 border-stone-700/50 flex items-center justify-center mb-6">
              <Library className="w-8 h-8 text-stone-500" />
            </div>
            <h3 className="text-2xl font-serif mb-2 text-stone-300">No games found</h3>
            <p className="text-stone-500 max-w-sm">
              {activeCategory === 'All' 
                ? "The library is currently empty."
                : `No ${activeCategory} in the collection yet.`}
            </p>
          </div>
        )}
      </main>

      <AddGameModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}