import React from 'react';
import { Trophy, HelpCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';

export function Navbar({ onOpenCreate, onOpenLeaderboard, onOpenHelp, krathongCount, isMuted, onToggleMute }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="pointer-events-auto flex items-center gap-2.5 glass-panel px-4 py-2 rounded-2xl shadow-lg border border-yellow-500/30">
          <span className="text-2xl animate-bounce">🪷</span>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-wide bg-gradient-to-r from-yellow-300 via-amber-200 to-pink-300 bg-clip-text text-transparent">
              ลอยกระทงออนไลน์ 3D
            </h1>
            <p className="text-[10px] text-gray-300 hidden sm:block">
              ประกวดกระทง & โหวตขวัญใจมหาชน
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Sound BGM Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl glass-panel hover:bg-slate-800/90 text-yellow-300 border border-yellow-500/30 transition shadow"
            title={isMuted ? 'เปิดเสียงดนตรีไทย' : 'ปิดเสียง'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="animate-pulse" />}
          </button>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className="p-2.5 rounded-xl glass-panel hover:bg-slate-800/90 text-yellow-300 border border-yellow-500/30 transition shadow"
            title="วิธีควบคุมมุมกล้อง"
          >
            <HelpCircle size={18} />
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="px-3.5 py-2 rounded-xl glass-panel hover:bg-slate-800/90 text-yellow-300 border border-yellow-500/30 transition shadow flex items-center gap-1.5 font-bold text-xs"
          >
            <Trophy size={16} className="text-amber-400" />
            <span className="hidden sm:inline">อันดับโหวต</span>
          </button>

          {/* Create Krathong CTA Button on Desktop */}
          <button
            onClick={onOpenCreate}
            className="hidden md:flex px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-bold text-xs items-center gap-1.5 shadow-lg shadow-rose-950/40 hover:opacity-95 transition glow-gold"
          >
            <Sparkles size={16} />
            <span>ร่วมส่งกระทงประกวด</span>
          </button>
        </div>
      </div>
    </header>
  );
}
