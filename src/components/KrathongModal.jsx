import React, { useState } from 'react';
import { X, Heart, Sparkles, MessageCircle, Share2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export function KrathongModal({ krathong, onClose, onVote }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  if (!krathong) return null;

  const handleVoteClick = () => {
    setIsVoting(true);
    // Trigger celebratory confetti effect
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#FFD700', '#FF69B4', '#FFA500', '#00CED1']
    });

    onVote(krathong.id);
    setHasVoted(true);
    setTimeout(() => {
      setIsVoting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl glass-panel shadow-2xl border border-yellow-500/30 text-white animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Banner */}
        <div className="h-32 bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-800 relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-gray-200 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="relative text-center z-10 px-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 backdrop-blur-md mb-1">
              ✨ ผู้เข้าประกวดกระทงออนไลน์
            </span>
            <h3 className="text-xl font-bold tracking-wide drop-shadow-md">{krathong.name}</h3>
          </div>
        </div>

        {/* User Photo Avatar */}
        <div className="relative px-6 pt-0 -mt-14 flex items-end justify-between">
          <div className="relative">
            <img
              src={krathong.photo}
              alt={krathong.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-900 shadow-xl bg-slate-800"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
              }}
            />
            <span 
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs"
              style={{ backgroundColor: krathong.color }}
              title="สีกระทง"
            >
              🪷
            </span>
          </div>

          {/* Current Vote Count Badge */}
          <div className="glass-card px-4 py-2 rounded-xl text-center shadow-lg border border-yellow-500/30">
            <div className="text-xs text-yellow-300/80 font-medium">คะแนนโหวต</div>
            <div className="text-2xl font-extrabold text-amber-400 drop-shadow flex items-center justify-center gap-1">
              <Heart size={20} className="fill-amber-400 text-amber-400" />
              <span>{krathong.votes.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Details & Wish */}
        <div className="p-6 space-y-4">
          <div className="glass-card p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <MessageCircle size={15} />
              <span>คำอธิษฐานลอยกระทง</span>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed italic">
              "{krathong.wish}"
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>รหัสกระทง: <span className="font-mono text-gray-300">{krathong.id}</span></span>
            <span className="flex items-center gap-1">
              <Sparkles size={13} className="text-yellow-400" />
              ลอยอยู่ในแม่น้ำ 3D
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={handleVoteClick}
              disabled={isVoting}
              className={`flex-1 py-3 px-5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg ${
                hasVoted 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-900/50' 
                  : 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white shadow-rose-900/40 hover:opacity-95 glow-gold'
              }`}
            >
              <Heart size={20} className={hasVoted ? 'fill-white text-white' : 'fill-white text-white animate-pulse'} />
              <span>{hasVoted ? 'โหวตเพิ่มสำเร็จ!' : 'กดโหวตกระทงใบนี้'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
