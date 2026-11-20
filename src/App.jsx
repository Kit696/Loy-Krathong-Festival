import React, { useState, useEffect, useRef } from 'react';
import { LoyKrathongScene } from './three/ThreeScene';
import { Navbar } from './components/Navbar';
import { KrathongModal } from './components/KrathongModal';
import { CreateKrathongModal } from './components/CreateKrathongModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { HelpModal } from './components/HelpModal';
import { 
  subscribeToKrathongs, 
  addKrathongToFirestore, 
  voteKrathongInFirestore, 
  purgeMockKrathongsFromFirestore 
} from './firebase';
import { Sparkles, Trophy, Heart, PlusCircle } from 'lucide-react';

export default function App() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  // Initialize with empty array or existing genuine user items
  const [krathongs, setKrathongs] = useState(() => {
    const saved = localStorage.getItem('loy_krathongs_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out any mock k-1 to k-20 items
        return Array.isArray(parsed) ? parsed.filter((k) => !/^k-\d+$/.test(k.id)) : [];
      } catch (e) {
        console.error('Failed to parse saved krathongs:', e);
      }
    }
    return [];
  });

  const [selectedKrathong, setSelectedKrathong] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);

  // Audio Context for soothing Thai festival ambient chime
  const audioCtxRef = useRef(null);
  const audioIntervalRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // 1. Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new LoyKrathongScene(containerRef.current, (krathongData) => {
      setKrathongs((current) => {
        const found = current.find((k) => k.id === krathongData.id) || krathongData;
        setSelectedKrathong(found);
        return current;
      });
    });

    sceneRef.current = scene;
    scene.updateKrathongs(krathongs);

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  // 2. Real-time Firebase Firestore Synchronization (Only genuine user entries)
  useEffect(() => {
    // Purge mock items k-1 to k-20 from Firestore to prevent confusion
    purgeMockKrathongsFromFirestore();

    const unsubscribe = subscribeToKrathongs(
      (firestoreItems) => {
        setIsFirestoreConnected(true);
        // Only keep genuine user-created krathongs
        const realItems = firestoreItems.filter((k) => !/^k-\d+$/.test(k.id));
        setKrathongs(realItems);
        if (sceneRef.current) {
          sceneRef.current.updateKrathongs(realItems);
        }
        localStorage.setItem('loy_krathongs_data', JSON.stringify(realItems));
      },
      (error) => {
        console.warn('Using offline/local mode:', error.message);
        setIsFirestoreConnected(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Synchronize 3D scene when state changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateKrathongs(krathongs);
    }
  }, [krathongs]);

  // 3. Ambient Thai Traditional Pentatonic Chimes (Web Audio API)
  const toggleSound = () => {
    if (isMuted) {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
        const playChime = () => {
          if (!audioCtxRef.current) return;
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          const freq = notes[Math.floor(Math.random() * notes.length)];
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);

          gain.gain.setValueAtTime(0.08, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 2.5);

          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);

          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 2.5);
        };

        playChime();
        audioIntervalRef.current = setInterval(playChime, 3000);
        setIsMuted(false);
        showToast('🎵 เปิดเสียงบรรยากาศดนตรีไทยกล่อมราตรี');
      } catch (e) {
        console.warn('Audio not allowed:', e);
      }
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setIsMuted(true);
      showToast('🔇 ปิดเสียง');
    }
  };

  // 4. Handle voting (writes to Firestore)
  const handleVote = async (krathongId) => {
    setKrathongs((prev) =>
      prev.map((k) => {
        if (k.id === krathongId) {
          const updated = { ...k, votes: (k.votes || 0) + 1 };
          if (selectedKrathong && selectedKrathong.id === krathongId) {
            setSelectedKrathong(updated);
          }
          return updated;
        }
        return k;
      })
    );

    try {
      await voteKrathongInFirestore(krathongId);
      showToast('❤️ บันทึกคะแนนโหวตลง Firestore สำเร็จ!');
    } catch (err) {
      console.warn('Firestore vote sync warning, saved locally:', err);
      showToast('❤️ บันทึกคะแนนโหวตเรียบร้อยแล้ว!');
    }
  };

  // 5. Handle creating new Krathong (writes to Firestore with compressed photo <= 500KB)
  const handleCreateKrathong = async (newKrathong) => {
    setKrathongs((prev) => [newKrathong, ...prev]);
    setIsCreateOpen(false);
    showToast(`🪷 กำลังบันทึกกระทงของ "${newKrathong.name}" ลง Firestore...`);

    try {
      await addKrathongToFirestore(newKrathong);
      showToast(`✨ บันทึกลง Firestore และปล่อยกระทงของคุณลงสู่แม่น้ำแล้ว!`);
    } catch (err) {
      console.warn('Firestore write warning, saved locally:', err);
      showToast(`🪷 ปล่อยกระทงของ "${newKrathong.name}" ลงสู่แม่น้ำแล้ว!`);
    }

    setTimeout(() => {
      setSelectedKrathong(newKrathong);
    }, 700);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-festival-night select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Navbar */}
      <Navbar
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        krathongCount={krathongs.length}
        isMuted={isMuted}
        onToggleMute={toggleSound}
      />

      {/* Empty State Banner (เมื่อยังไม่มีกระทงของจริง ให้เชิญชวนส่งประกวด) */}
      {krathongs.length === 0 && (
        <div className="absolute top-28 left-1/2 transform -translate-x-1/2 z-30 w-11/12 max-w-md pointer-events-auto">
          <div className="p-5 rounded-2xl glass-panel border border-yellow-500/40 text-center shadow-2xl space-y-3 animate-fadeIn">
            <span className="text-3xl block animate-bounce">🪷</span>
            <div>
              <h3 className="font-bold text-base text-yellow-300">แม่น้ำพร้อมแล้วสำหรับงานเทศกาล</h3>
              <p className="text-xs text-gray-200 mt-1">
                ยังไม่มีกระทงในแม่น้ำ ร่วมเป็นคนแรกที่ถ่ายรูปและปล่อยกระทงเข้าสู่การประกวด!
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-lg glow-gold transition active:scale-95"
            >
              <PlusCircle size={16} />
              <span>ปล่อยกระทงใบแรกเข้าประกวด</span>
            </button>
          </div>
        </div>
      )}

      {/* Camera Guidance & Status Badge */}
      <div className="absolute bottom-20 sm:bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center gap-1.5">
        <div className="px-3 py-1.5 rounded-full glass-panel border border-yellow-500/20 text-gray-200 text-[11px] sm:text-xs flex items-center gap-2 shadow-lg backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>แตะที่กระทงเพื่อโหวต • หมุน 360° • ซูมเข้า-ออก</span>
          <span className="text-gray-400">|</span>
          <span className="text-amber-300 font-medium">
            กระทงในแม่น้ำ: {krathongs.length} ใบ
          </span>
        </div>
      </div>

      {/* Mobile Floating Action Button (สร้างกระทง) */}
      <div className="md:hidden absolute bottom-5 left-4 right-4 z-30 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-950/60 active:scale-95 transition glow-gold"
        >
          <Sparkles size={18} />
          <span>ร่วมลอยกระทง & ส่งประกวด</span>
        </button>

        <button
          onClick={() => setIsLeaderboardOpen(true)}
          className="p-3 rounded-2xl glass-panel text-yellow-300 border border-yellow-500/30 shadow-lg active:scale-95 transition"
          title="อันดับคะแนน"
        >
          <Trophy size={20} />
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-slate-900/95 border border-yellow-400/50 text-yellow-300 text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md animate-bounce flex items-center gap-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      {selectedKrathong && (
        <KrathongModal
          krathong={selectedKrathong}
          onClose={() => setSelectedKrathong(null)}
          onVote={handleVote}
        />
      )}

      {isCreateOpen && (
        <CreateKrathongModal
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateKrathong}
        />
      )}

      {isLeaderboardOpen && (
        <LeaderboardModal
          krathongs={krathongs}
          onClose={() => setIsLeaderboardOpen(false)}
          onSelectKrathong={(k) => setSelectedKrathong(k)}
        />
      )}

      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
    </div>
  );
}
