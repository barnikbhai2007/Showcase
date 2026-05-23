import { useState, useEffect } from 'react';
import { useGames } from '../hooks/useGames';
import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ["PC games", "Xbox Games", "PS5 games", "Mobiles games", "Lust Games"] as const;

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddGameModal({ isOpen, onClose }: AddGameModalProps) {
  const { addGame } = useGames();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('PC games');
  const [status, setStatus] = useState<string>('Completed');
  const [imageUrl, setImageUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [unknownDate, setUnknownDate] = useState(false);
  const [loading, setLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (title.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?term=${encodeURIComponent(title)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.items || []);
            setShowDropdown(true);
          }
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [title]);

  const selectGame = (game: any) => {
    setTitle(game.name);
    setImageUrl(game.banner || game.thumbnail || '');
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addGame({
      title,
      category,
      imageUrl: imageUrl || undefined,
      startDate: unknownDate ? null : startDate || null,
      endDate: unknownDate ? null : endDate || null,
      status,
    });
    setLoading(false);
    onClose();
    // Reset form
    setTitle('');
    setStatus('Completed');
    setImageUrl('');
    setStartDate('');
    setEndDate('');
    setUnknownDate(false);
    setSearchResults([]);
    setShowDropdown(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-stone-900/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-16 overflow-y-auto pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-stone-800 border border-stone-700 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto mt-auto mb-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-stone-700/50">
                <h2 className="text-2xl font-serif">Add to Library</h2>
                <button onClick={onClose} className="p-2 -mr-2 text-stone-400 hover:text-stone-200 hover:bg-stone-700/50 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="relative">
                  <label className="block text-sm font-medium text-stone-400 mb-1.5 ">Game Title *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                      className="w-full bg-stone-900/50 border border-stone-700 rounded-xl pl-4 pr-10 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all"
                      placeholder="e.g. Elden Ring"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-stone-500 border-t-stone-300 rounded-full animate-spin" />
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {showDropdown && searchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 bg-stone-800 border border-stone-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {searchResults.map(game => (
                          <div 
                            key={game.id}
                            onClick={() => selectGame(game)}
                            className="flex items-center gap-3 p-3 hover:bg-stone-700 cursor-pointer transition-colors border-b border-stone-700/50 last:border-0"
                          >
                            {game.thumbnail ? (
                              <img src={game.thumbnail} alt="" className="w-16 h-8 object-cover rounded" />
                            ) : (
                              <div className="w-16 h-8 bg-stone-900 rounded" />
                            )}
                            <span className="text-sm font-medium text-stone-200">{game.name}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1.5">Category *</label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-stone-900/50 border border-stone-700 rounded-xl px-4 py-2.5 text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all appearance-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1.5">Status *</label>
                    <select 
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full bg-stone-900/50 border border-stone-700 rounded-xl px-4 py-2.5 text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all appearance-none"
                    >
                      <option value="Completed">Completed</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Abandoned">Abandoned</option>
                      <option value="Wishlist">Wishlist</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1.5 ">Cover Image URL (Optional)</label>
                  <input 
                    type="url" 
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="w-full bg-stone-900/50 border border-stone-700 rounded-xl px-4 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all"
                    placeholder="https://..."
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer mb-4 text-stone-300">
                    <input 
                      type="checkbox" 
                      checked={unknownDate}
                      onChange={e => setUnknownDate(e.target.checked)}
                      className="w-5 h-5 rounded border-stone-600 bg-stone-900 text-stone-500 focus:ring-stone-500 focus:ring-offset-stone-800"
                    />
                    <span>I don't remember when I played this</span>
                  </label>

                  <AnimatePresence>
                    {!unknownDate && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-4 overflow-hidden"
                      >
                        <div>
                          <label className="block text-sm font-medium text-stone-400 mb-1.5">Start Date</label>
                          <input 
                            type="date" 
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full bg-stone-900/50 border border-stone-700 rounded-xl px-4 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all color-scheme-dark"
                            style={{ colorScheme: 'dark' }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-400 mb-1.5">End Date</label>
                          <input 
                            type="date" 
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full bg-stone-900/50 border border-stone-700 rounded-xl px-4 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all"
                            style={{ colorScheme: 'dark' }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={loading || !title || !category}
                    className="w-full bg-stone-100 text-stone-900 hover:bg-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding...' : 'Add to Collection'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
