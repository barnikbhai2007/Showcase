import React, { useState, useEffect } from 'react';
import { useGames } from '../hooks/useGames';
import { X, Search, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ["Steam", "Xbox Games", "PS5 games", "Playstore", "Lust Games"] as const;

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameToEdit?: any;
}

export function AddGameModal({ isOpen, onClose, gameToEdit }: AddGameModalProps) {
  const { addGame, updateGame } = useGames();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Steam');
  const [status, setStatus] = useState<string>('Completed');
  const [imageUrl, setImageUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rating, setRating] = useState<string>('');
  const [unknownDate, setUnknownDate] = useState(false);
  const [loading, setLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  useEffect(() => {
    if (gameToEdit && isOpen) {
      setTitle(gameToEdit.title || '');
      let mappedCategory = gameToEdit.category || 'Steam';
      if (mappedCategory === 'PC games') mappedCategory = 'Steam';
      if (mappedCategory === 'Mobiles games') mappedCategory = 'Playstore';
      setCategory(mappedCategory);
      setStatus(gameToEdit.status || 'Completed');
      setImageUrl(gameToEdit.imageUrl || '');
      setStartDate(gameToEdit.startDate || '');
      setEndDate(gameToEdit.endDate || '');
      setRating(gameToEdit.rating ? gameToEdit.rating.toString() : '');
      setUnknownDate(gameToEdit.startDate === null && gameToEdit.endDate === null);
    } else if (isOpen) {
      setTitle('');
      setCategory('Steam');
      setStatus('Completed');
      setImageUrl('');
      setStartDate('');
      setEndDate('');
      setRating('');
      setUnknownDate(false);
    }
  }, [gameToEdit, isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Avoid searching if we are editing an existing item and the title hasn't significantly changed to warrant a search dropdown
      if (title.length > 2 && !gameToEdit) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?term=${encodeURIComponent(title)}&category=${encodeURIComponent(category)}`);
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
  }, [title, gameToEdit, category]);

  const selectGame = (game: any) => {
    setTitle(game.name);
    setImageUrl(game.banner || game.thumbnail || '');
    setShowDropdown(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setImageUrl(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const parsedRating = rating ? parseInt(rating, 10) : null;
    
    if (gameToEdit) {
       await updateGame(gameToEdit.id, {
          title,
          category,
          imageUrl: imageUrl ? imageUrl.trim() : '',
          startDate: unknownDate ? null : startDate || null,
          endDate: unknownDate ? null : endDate || null,
          status,
          rating: parsedRating,
       });
    } else {
       await addGame({
         title,
         category,
         imageUrl: imageUrl ? imageUrl.trim() : '',
         startDate: unknownDate ? null : startDate || null,
         endDate: unknownDate ? null : endDate || null,
         status,
         rating: parsedRating,
       });
    }
    
    setLoading(false);
    onClose();
    // Reset form
    setTitle('');
    setStatus('Completed');
    setImageUrl('');
    setStartDate('');
    setEndDate('');
    setRating('');
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
            className="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
            <div className="flex min-h-full items-start justify-center p-4 py-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10, rotate: -1 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10, rotate: 1 }}
                className="w-full max-w-md bg-[#efe9d8] border-2 border-stone-900 rounded-sm shadow-[8px_8px_0px_#27272a] pointer-events-auto my-auto font-mono"
              >
              <div className="flex justify-between items-center p-6 border-b-2 border-stone-900 border-dashed">
                <h2 className="text-xl font-bold uppercase tracking-widest text-stone-900">Add Record</h2>
                <button onClick={onClose} className="p-2 -mr-2 text-stone-600 hover:text-stone-900 hover:bg-stone-300 rounded-sm transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="relative">
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5 ">Title *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                      className="w-full bg-[#f4ebd8] border-2 border-stone-900 rounded-sm pl-4 pr-10 py-2.5 text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-0 focus:border-stone-900 transition-all shadow-[inset_2px_2px_0px_#00000020] uppercase"
                      placeholder="ENTER TITLE"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-stone-500 border-t-stone-800 rounded-full animate-spin" />
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {showDropdown && searchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 bg-[#f4ebd8] border-2 border-stone-900 rounded-sm shadow-[4px_4px_0px_#27272a] overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {searchResults.map(game => (
                          <div 
                            key={game.id}
                            onClick={() => selectGame(game)}
                            className="flex items-center gap-3 p-3 hover:bg-[#e6ddc5] cursor-pointer transition-colors border-b border-stone-400 last:border-0"
                          >
                            {game.thumbnail ? (
                              <img src={game.thumbnail} alt="" className="w-16 h-8 object-cover rounded-sm border border-stone-900" />
                            ) : (
                              <div className="w-16 h-8 bg-[#e6ddc5] rounded-sm border border-stone-900" />
                            )}
                            <span className="text-sm font-bold text-stone-900 uppercase">{game.name}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5">Division *</label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-[#f4ebd8] border-2 border-stone-900 rounded-sm px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-0 focus:border-stone-900 transition-all appearance-none shadow-[inset_2px_2px_0px_#00000020] uppercase text-sm"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5">Clearance *</label>
                    <select 
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full bg-[#f4ebd8] border-2 border-stone-900 rounded-sm px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-0 focus:border-stone-900 transition-all appearance-none shadow-[inset_2px_2px_0px_#00000020] uppercase text-sm"
                    >
                      <option value="Completed">Completed</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Abandoned">Abandoned</option>
                      <option value="Wishlist">Wishlist</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5 ">Image Reference (Optional)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        className="w-full bg-[#f4ebd8] border-2 border-stone-900 rounded-sm px-4 py-2.5 text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-0 focus:border-stone-900 transition-all shadow-[inset_2px_2px_0px_#00000020] text-sm"
                        placeholder="IMAGE URL..."
                      />
                      <label className="cursor-pointer bg-stone-900 text-[#efe9d8] px-3 rounded-sm border-2 border-stone-900 hover:bg-stone-800 flex items-center justify-center transition-all shadow-[2px_2px_0px_#27272a] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#27272a]">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5 ">Rating (0-1000)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="1000"
                      value={rating}
                      onChange={e => setRating(e.target.value)}
                      className="w-full bg-[#f4ebd8] border-2 border-stone-900 rounded-sm px-4 py-2.5 text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-0 focus:border-stone-900 transition-all shadow-[inset_2px_2px_0px_#00000020] text-sm"
                      placeholder="e.g. 850"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-stone-900 border-dashed">
                  <label className="flex items-center gap-3 cursor-pointer mb-4 text-stone-800 font-bold uppercase tracking-widest text-xs">
                    <input 
                      type="checkbox" 
                      checked={unknownDate}
                      onChange={e => setUnknownDate(e.target.checked)}
                      className="w-5 h-5 rounded-sm border-2 border-stone-900 bg-[#f4ebd8] text-stone-900 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>[DATE REDACTED]</span>
                  </label>

                  <AnimatePresence>
                    {!unknownDate && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5">START DATE</label>
                            <input 
                              type="text" 
                              value={startDate}
                              onChange={e => setStartDate(e.target.value)}
                              placeholder="YYYY-MM-DD or YYYY"
                              className="w-full bg-[#f4ebd8] border-2 border-stone-900 rounded-sm px-4 py-2 text-stone-900 focus:outline-none focus:ring-0 focus:border-stone-900 transition-all shadow-[inset_2px_2px_0px_#00000020] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-800 uppercase tracking-widest mb-1.5">END DATE</label>
                            <input 
                              type="text" 
                              value={endDate}
                              onChange={e => setEndDate(e.target.value)}
                              placeholder="YYYY-MM-DD or YYYY"
                              className="w-full bg-[#f4ebd8] border-2 border-stone-900 rounded-sm px-4 py-2 text-stone-900 focus:outline-none focus:ring-0 focus:border-stone-900 transition-all shadow-[inset_2px_2px_0px_#00000020] text-sm"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={loading || !title || !category}
                    className="w-full bg-stone-900 text-[#efe9d8] hover:bg-stone-800 font-bold uppercase tracking-widest py-3 rounded-sm transition-all shadow-[2px_2px_0px_#27272a] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#27272a] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-sm"
                  >
                    {loading ? 'ARCHIVING...' : 'UPLOAD AND COMMIT CHANGES'}
                  </button>
                </div>
              </form>
            </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
