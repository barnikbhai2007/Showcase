import { useState } from 'react';
import { useGames } from '../hooks/useGames';
import { X } from 'lucide-react';
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
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1.5 ">Game Title *</label>
                  <input 
                    type="text" 
                    required 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-stone-900/50 border border-stone-700 rounded-xl px-4 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all"
                    placeholder="e.g. Elden Ring"
                  />
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
