import React from 'react';
import { X, Trophy, Heart, Sparkles, Medal } from 'lucide-react';

export function LeaderboardModal({ krathongs, onClose, onSelectKrathong }) {
  // Sort by highest votes
  const sorted = [...krathongs].sort((a, b) => b.votes - a.votes);

  const getRankBadge = (rank) => {
    if (rank === 0) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 text-slate-900 font-black text-xs flex items-center justify-center shadow-lg">
          1
        </span>
      );
    }
    if (rank === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-900 font-black text-xs flex items-center justify-center shadow">
          2
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow">
          3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-slate-800 text-gray-400 font-semibold text-xs flex items-center justify-center">
        {rank + 1}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl glass-panel shadow-2xl border border-yellow-500/30 text-white overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-900 flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-300" size={24} />
            <div>
              <h3 className="font-bold text-lg leading-tight">อันดับผลโหวตกระทงยอดนิยม</h3>
              <p className="text-xs text-amber-200">เรียงตามคะแนนโหวตสูงสุดในงานเทศกาล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/60 text-gray-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* List of contestants */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {sorted.map((item, index) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectKrathong(item);
                onClose();
              }}
              className="p-3 rounded-xl glass-card border border-white/10 hover:border-yellow-400/50 hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              {/* Rank & Photo */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0">{getRankBadge(index)}</div>
                <img
                  src={item.photo}
                  alt={item.name}
                  className="w-11 h-11 rounded-lg object-cover border border-white/20 flex-shrink-0 bg-slate-800"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <div className="min-w-0">
                  <div className="font-bold text-sm text-gray-100 group-hover:text-yellow-300 transition truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate italic max-w-[200px] sm:max-w-xs">
                    "{item.wish}"
                  </div>
                </div>
              </div>

              {/* Vote count */}
              <div className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-sm">
                <Heart size={15} className="fill-amber-400 text-amber-400" />
                <span>{item.votes.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
