import { Game } from '../hooks/useGames';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface GameCardProps {
  game: Game;
  onDelete: (id: string) => void;
}

export function GameCard({ game, onDelete }: GameCardProps) {
  const { user } = useAuth();
  const isOwner = user?.uid === game.userId;
  const isLust = game.category === 'Lust Games';
  const [unlocked, setUnlocked] = useState(false);

  const displayImage = game.imageUrl || `https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&h=400&fit=crop`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl bg-stone-800/50 border border-stone-700/50 hover:border-stone-600/50 transition-colors"
    >
      <div 
        className={`relative aspect-[4/3] overflow-hidden ${isLust && !unlocked ? 'cursor-pointer' : ''}`}
        onClick={() => isLust && !unlocked && setUnlocked(true)}
      >
        <img 
          src={displayImage} 
          alt={game.title}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isLust && !unlocked ? 'blur-xl scale-110 brightness-50' : ''}`}
        />
        {isLust && !unlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-serif italic text-stone-300 drop-shadow-md pb-2">Top Secret</span>
            <span className="text-sm px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-stone-300">Click to reveal</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-stone-900/80 backdrop-blur text-stone-200 border border-stone-700/50 shadow-sm">
            {game.category}
          </span>
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-stone-900/80 backdrop-blur text-stone-200 border border-stone-700/50 shadow-sm">
            {game.status || 'Completed'}
          </span>
        </div>
        {isOwner && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(game.id); }}
              className="p-1.5 bg-black/60 backdrop-blur rounded-full text-red-400 hover:text-red-300 hover:bg-black/80 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-xl font-serif mb-3 leading-tight">{game.title}</h3>
        
        <div className="flex items-center text-sm text-stone-400 gap-2 mb-1">
          <Calendar className="w-4 h-4 opacity-70" />
          {game.startDate && game.endDate ? (
            <span>{format(new Date(game.startDate), 'MMM d, yyyy')} - {format(new Date(game.endDate), 'MMM d, yyyy')}</span>
          ) : game.startDate ? (
             <span>Started {format(new Date(game.startDate), 'MMM d, yyyy')}</span>
          ) : (
            <span className="italic opacity-60">Dates unknown</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
