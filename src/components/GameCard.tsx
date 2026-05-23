import { Game } from '../hooks/useGames';
import { useState, useMemo } from 'react';
import { Calendar, Trash2, Edit } from 'lucide-react';
import { motion } from 'motion/react';

interface GameCardProps {
  key?: string | number;
  game: Game;
  onEdit?: () => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
  index?: number;
  isTop10?: boolean;
}

export function GameCard({ game, onEdit, onDelete, isAdmin, index = 0, isTop10 }: GameCardProps) {
  const isOwner = isAdmin;
  const isLust = game.category === 'Lust Games';
  const [unlocked, setUnlocked] = useState(false);

  const rawImage = game.imageUrl || '';
  const displayImage = rawImage 
    ? (rawImage.startsWith('http://') || rawImage.startsWith('https://') || rawImage.startsWith('data:') ? rawImage : `https://${rawImage}`)
    : `https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&h=400&fit=crop`;

  // Consistent subtle rotation for polaroid effect
  const rotateDeg = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < game.id.length; i++) {
      hash = game.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (hash % 4) - 2; // -2 to +2 degrees
  }, [game.id]);

  const getStampVariant = (status: string) => {
    switch (status) {
      case 'Completed': return { color: 'text-red-700 border-red-700/80', rotate: '-rotate-[6deg]' };
      case 'Ongoing': return { color: 'text-blue-700 border-blue-700/80', rotate: 'rotate-[4deg]' };
      case 'Abandoned': return { color: 'text-stone-800 border-stone-800/80', rotate: '-rotate-[3deg]' };
      case 'Wishlist': return { color: 'text-emerald-700 border-emerald-700/80', rotate: 'rotate-[6deg]' };
      default: return { color: 'text-red-700 border-red-700/80', rotate: '-rotate-[4deg]' };
    }
  };

  const getPlatformStamp = (category: string) => {
    switch(category) {
      case 'Steam':
      case 'PC games': return { text: 'STEAM', color: 'text-stone-800 border-stone-800/80', rotate: 'rotate-[3deg]' };
      case 'PS5 games': return { text: 'PS5', color: 'text-blue-800 border-blue-800/80', rotate: '-rotate-[5deg]' };
      case 'Xbox Games': return { text: 'XBOX', color: 'text-green-800 border-green-800/80', rotate: 'rotate-[4deg]' };
      case 'Playstore':
      case 'Mobiles games': return { text: 'PLAYSTORE', color: 'text-teal-800 border-teal-800/80', rotate: '-rotate-[3deg]' };
      case 'Lust Games': return { text: 'LUST', color: 'text-pink-800 border-pink-800/80', rotate: 'rotate-[6deg]' };
      default: return { text: category.toUpperCase(), color: 'text-stone-700 border-stone-700/80', rotate: '-rotate-[2deg]' };
    }
  }
  
  const stamp = getStampVariant(game.status || 'Completed');
  const platformStamp = getPlatformStamp(game.category);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        delay: (index % 12) * 0.1, 
        duration: 0.6, 
        ease: [0.23, 1, 0.32, 1] 
      }}
      className="group relative bg-[#f4ebd8] p-3 pb-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:z-10"
      style={{
        transform: `rotate(${rotateDeg}deg)`,
        boxShadow: '0 8px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(100,80,50,0.05)',
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")'
      }}
    >
      {/* Tape on top */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-white/40 shadow-sm rotate-[2deg] backdrop-blur-sm pointer-events-none border border-black/5 z-30" />

      {isTop10 && (
        <div className="absolute -top-4 -left-4 w-12 h-12 z-40 transform -rotate-12 shadow-[2px_2px_0px_#292524] rounded-full border-[1.5px] border-stone-900 bg-emerald-700 flex items-center justify-center">
          <div className="absolute inset-[3px] border border-emerald-900/50 rounded-full border-dashed" />
          <span className="text-xl font-serif font-black italic text-[#efe9d8] drop-shadow-md pb-0.5 pr-0.5">#{index + 1}</span>
        </div>
      )}

      <div 
        className={`relative aspect-video overflow-hidden border border-stone-900/10 shadow-inner ${isLust && !unlocked ? 'cursor-pointer' : ''}`}
        onClick={() => isLust && !unlocked && setUnlocked(true)}
      >
        <img 
          src={displayImage} 
          alt={game.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            console.error("Image failed to load:", displayImage);
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&h=400&fit=crop';
          }}
          className={`w-full h-full object-contain bg-[#111] transition-transform duration-700 group-hover:scale-105 sepia-[0.3] contrast-[1.1] saturate-[0.8] ${isLust && !unlocked ? 'blur-2xl scale-110 brightness-50' : ''}`}
        />
        
        {/* Vintage grain overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-40 mix-blend-multiply pointer-events-none" />

        {isLust && !unlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <span className="text-xl font-serif italic text-[#f4ebd8] drop-shadow-md pb-2 tracking-widest">CONFIDENTIAL</span>
            <span className="text-xs px-4 py-1.5 rounded bg-stone-900/80 text-[#f4ebd8] font-mono uppercase tracking-widest border border-stone-700">Reveal</span>
          </div>
        )}

        {isOwner && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-2 bg-stone-900/80 backdrop-blur rounded text-[#f4ebd8] hover:bg-stone-800 transition-colors shadow-sm"
                title="Edit Record"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(game.id); }}
              className="p-2 bg-red-900/80 backdrop-blur rounded text-red-100 hover:bg-red-800 transition-colors shadow-sm"
              title="Destroy Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Platform Stamp */}
      <div className="absolute top-5 left-5 z-20 pointer-events-none group-hover:scale-105 transition-transform">
        <div 
          className={`border-[3px] border-solid ${platformStamp.color} px-2 py-0.5 rounded-sm
          font-mono font-bold tracking-widest uppercase text-xs sm:text-sm bg-[#f4ebd8]/95 shadow-md
          ${platformStamp.rotate}`}
        >
          {platformStamp.text}
        </div>
      </div>

      <div className="pt-5 px-2 relative z-10">
        {/* Status Stamp */}
        <div 
          className={`absolute right-1 -top-4 sm:right-2 sm:-top-5 z-20 
          border-[3px] sm:border-[4px] border-double ${stamp.color} px-2 sm:px-3 py-0.5 sm:py-1 rounded-sm
          font-mono font-bold tracking-widest uppercase text-lg sm:text-2xl bg-[#f4ebd8]/90 backdrop-blur-sm shadow-md pointer-events-none
          ${stamp.rotate} transition-transform group-hover:scale-110`}
        >
          {game.status || 'Completed'}
        </div>

        <h3 className="text-xl font-serif mb-2 leading-tight text-stone-900 line-clamp-2">{game.title}</h3>
        
        <div className="flex items-center text-xs font-mono text-stone-600 gap-2 mb-1 uppercase tracking-wider pl-0.5 mt-2">
          <Calendar className="w-3.5 h-3.5 opacity-60" />
          {game.startDate && game.endDate ? (
            <span>LOG: {game.startDate} - {game.endDate}</span>
          ) : game.startDate ? (
             <span>LOG: {game.startDate}</span>
          ) : game.endDate ? (
             <span>LOG: END {game.endDate}</span>
          ) : (
            <span className="opacity-60">[DATE REDACTED]</span>
          )}
        </div>
        
        {(isOwner || isTop10) && game.rating != null && (
          <div className="flex items-center text-xs font-mono font-bold text-stone-800 uppercase tracking-wider pl-0.5 mt-1">
             RATING: {game.rating}/1000
          </div>
        )}
      </div>
    </motion.div>
  );
}
