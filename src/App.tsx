import React, { useEffect, useState } from 'react';
import { signInAnonymously, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { GameCard } from './components/GameCard';
import { AddGameModal } from './components/AddGameModal';
import { Library, Plus, LogOut, LogIn, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Game } from './hooks/useGames';

const CATEGORIES = ["All", "Steam", "Xbox Games", "PS5 games", "Playstore", "Lust Games"] as const;
const STATUSES = ["All", "Completed", "Ongoing", "Abandoned", "Wishlist"] as const;

export default function App() {
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('playbook_admin') === 'true';
  });
  
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeStatus, setActiveStatus] = useState<string>('All');
  const [showTop10, setShowTop10] = useState(false);

  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState("");

  useEffect(() => {
    setGamesLoading(true);
    const q = query(
      collection(db, 'games')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const g = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Game[];
      
      // Client-side custom sorting
      g.sort((a, b) => {
        const getSortValue = (d?: string | null) => {
          if (!d) return 0;
          d = d.trim();
          let dateStr = d;
          if (/^\d{4}$/.test(d)) dateStr = `${d}-01-01`;
          else if (/^\d{4}-\d{2}$/.test(d)) dateStr = `${d}-01`;
          
          const parsed = new Date(dateStr).getTime();
          if (!isNaN(parsed)) return parsed;
          return 0;
        };

        const dateA = getSortValue(a.endDate || a.startDate);
        const dateB = getSortValue(b.endDate || b.startDate);

        if (dateA !== dateB) {
          if (dateA === 0) return 1; // no date goes to bottom
          if (dateB === 0) return -1;
          return dateB - dateA; // newest first
        }

        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setGames(g);
      setGamesLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
      setGamesLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const handleSignInClick = () => {
    setShowPasskeyPrompt(true);
  };

  const handlePasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput === "brokenaqua@admin") {
      setIsAdmin(true);
      localStorage.setItem('playbook_admin', 'true');
      setShowPasskeyPrompt(false);
      setPasskeyInput("");
    } else {
      alert("Invalid passkey");
    }
  };

  const handleSignOut = () => {
    setIsAdmin(false);
    localStorage.removeItem('playbook_admin');
  };

  const deleteGame = async (gameId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'games', gameId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `games/${gameId}`);
    }
  };

  const filteredGames = React.useMemo(() => {
    if (showTop10) {
      let allowedCategories: string[] = [];
      if (activeCategory === 'All' || ['Steam', 'PC games', 'Xbox Games', 'PS5 games'].includes(activeCategory)) {
          allowedCategories = ['Steam', 'PC games', 'Xbox Games', 'PS5 games'];
      } else if (activeCategory === 'Playstore' || activeCategory === 'Mobiles games') {
          allowedCategories = ['Playstore', 'Mobiles games'];
      } else if (activeCategory === 'Lust Games') {
          allowedCategories = ['Lust Games'];
      }

      return [...games]
        .filter(g => allowedCategories.includes(g.category) && typeof g.rating === 'number' && g.rating !== null)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10);
    }
    
    return games.filter(g => {
      let matchCat = false;
      if (activeCategory === 'All') {
        matchCat = true;
      } else if (activeCategory === 'Steam') {
        matchCat = g.category === 'Steam' || g.category === 'PC games';
      } else if (activeCategory === 'Playstore') {
        matchCat = g.category === 'Playstore' || g.category === 'Mobiles games';
      } else {
        matchCat = g.category === activeCategory;
      }

      const matchStatus = activeStatus === 'All' ? true : (g.status || 'Completed') === activeStatus;
      return matchCat && matchStatus;
    });
  }, [games, activeCategory, activeStatus, showTop10]);

  if (gamesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#efe9d8] text-stone-600 relative overflow-hidden">
        {/* Global Noise */}
        <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-[0.6] mix-blend-multiply pointer-events-none z-[100]" />
        
        <div className="animate-pulse flex flex-col items-center gap-4 relative z-10">
          <Library className="w-8 h-8 opacity-50" />
          <span className="font-mono text-sm tracking-widest uppercase">Dusting off the archives...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#efe9d8] text-stone-900 font-sans selection:bg-stone-800 selection:text-[#efe9d8] pb-24 relative overflow-hidden">
      {/* Global Noise */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-[0.6] mix-blend-multiply pointer-events-none z-[100]" />

      {/* Header */}
      <header className="border-b border-stone-400 bg-[#efe9d8]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-sm bg-stone-900 flex items-center justify-center border border-stone-800 shadow-sm">
                <Library className="w-5 h-5 text-[#efe9d8]" />
              </div>
              <div>
                <h1 className="text-2xl font-serif leading-none tracking-tight">Archives</h1>
                <p className="text-xs text-stone-600 font-medium tracking-widest uppercase mt-1">Classified Records</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              {isAdmin ? (
                <>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 border-[1.5px] border-stone-900 text-stone-900 px-4 py-2 rounded-sm font-medium hover:bg-stone-900 hover:text-[#efe9d8] transition-colors text-sm uppercase tracking-wider font-mono shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Record</span>
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-300/50 rounded-sm transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleSignInClick}
                  className="flex items-center gap-2 border-[1.5px] border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-[#efe9d8] px-5 py-1.5 rounded-sm font-mono uppercase tracking-wider transition-all text-sm shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Admin Auth</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Navigation Filters */}
        <div className="flex flex-col gap-4 mb-10 relative z-10">
          <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-xs font-bold text-stone-900 uppercase tracking-widest mr-2 shrink-0 font-mono">Division</span>
            {CATEGORIES.map(category => (
              <button
                 key={category}
                 onClick={() => setActiveCategory(category)}
                 className={`whitespace-nowrap px-4 py-1.5 rounded-sm text-sm font-mono uppercase tracking-wider transition-all duration-300 shadow-[2px_2px_0px_#27272a]
                   ${activeCategory === category 
                     ? 'bg-stone-900 text-[#efe9d8] translate-y-0.5 shadow-none' 
                     : 'bg-[#e6ddc5] text-stone-800 border-2 border-stone-900 hover:bg-stone-300'
                   }`}
               >
                 {category}
               </button>
            ))}
          </nav>
          
          <nav className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide border-b-[2px] border-stone-900 border-dashed">
            <span className="text-xs font-bold text-stone-900 uppercase tracking-widest mr-2 shrink-0 font-mono">Clearance</span>
            {STATUSES.map(status => (
              <button
                 key={status}
                 onClick={() => setActiveStatus(status)}
                 className={`whitespace-nowrap px-4 py-1.5 rounded-sm text-sm font-mono uppercase tracking-wider transition-all duration-300 shadow-[2px_2px_0px_#27272a]
                   ${activeStatus === status 
                     ? 'bg-stone-900 text-[#efe9d8] translate-y-0.5 shadow-none' 
                     : 'bg-[#e6ddc5] text-stone-800 border-2 border-stone-900 hover:bg-stone-300'
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
              {filteredGames.map((game, index) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onDelete={deleteGame} 
                  onEdit={() => { setGameToEdit(game); setIsAddModalOpen(true); }}
                  isAdmin={isAdmin}
                  index={index}
                  isTop10={showTop10}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center relative z-10 w-full col-span-full">
            <div className="w-20 h-20 rounded-sm bg-[#e6ddc5] border-2 border-stone-400 flex items-center justify-center mb-6 rotate-3">
              <Library className="w-8 h-8 text-stone-600" />
            </div>
            <h3 className="text-2xl font-serif mb-2 text-stone-900">No Records Found</h3>
            <p className="text-stone-600 max-w-sm font-mono text-sm tracking-wide">
              {activeCategory === 'All' 
                ? "THE ARCHIVE IS CURRENTLY EMPTY."
                : `NO DIRECTIVES FOUND UNDER SECTION: ${activeCategory.toUpperCase()}`}
            </p>
          </div>
        )}
      </main>

      <AddGameModal 
        isOpen={isAddModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setGameToEdit(null); }} 
        gameToEdit={gameToEdit}
      />

      <button
        onClick={() => setShowTop10(!showTop10)}
        className={`fixed bottom-8 right-8 p-4 rounded-sm shadow-[4px_4px_0px_#292524] transition-all z-40 border-2 border-stone-900 ${showTop10 ? 'bg-amber-400 text-stone-900 translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_#292524]' : 'bg-[#f4ebd8] text-stone-900 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#292524]'}`}
        title={showTop10 ? "Show All Games" : "Toggle Top 10 View"}
      >
        <Trophy className={`w-6 h-6 ${showTop10 ? 'fill-current' : ''}`} />
      </button>

      <AnimatePresence>
        {showPasskeyPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
            onClick={() => setShowPasskeyPrompt(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.95, opacity: 0, rotate: 2 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#efe9d8] border-2 border-stone-800 rounded-sm w-full max-w-sm overflow-hidden shadow-2xl relative p-6 font-mono"
            >
              <h2 className="text-xl font-bold uppercase tracking-widest text-stone-900 mb-4 border-b-2 border-stone-900 pb-2 border-dashed">Admin Auth</h2>
              <form onSubmit={handlePasskeySubmit}>
                <input 
                  type="password" 
                  autoFocus
                  placeholder="ENTER PASSKEY"
                  className="w-full bg-[#f4ebd8] border-2 border-stone-800 rounded-sm px-4 py-2.5 text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-0 focus:border-stone-900 mb-6 uppercase tracking-widest text-center shadow-[inset_2px_2px_0px_#00000020]"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                />
                <div className="flex gap-3 justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowPasskeyPrompt(false)}
                    className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 tracking-widest uppercase transition-colors"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-stone-900 text-[#efe9d8] rounded-sm hover:bg-stone-800 tracking-widest uppercase transition-colors shadow-[2px_2px_0px_#27272a] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#27272a]"
                  >
                    Unlock
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}