import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Sparkles, Check, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { krathongStyles } from '../data/initialKrathongs';
import { compressImageToMax500KB } from '../utils/imageCompressor';

export function CreateKrathongModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [wish, setWish] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(krathongStyles[0].id);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoSizeKB, setPhotoSizeKB] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Process image and enforce < 500 KB limit
  const processAndCompressImage = async (imageSource) => {
    setIsCompressing(true);
    setErrorMsg('');
    try {
      // Compress to max 800x800 and max 480KB (strictly under 500KB)
      const compressedDataUrl = await compressImageToMax500KB(imageSource, 800, 480);
      const sizeBytes = Math.round((compressedDataUrl.length * 3) / 4);
      const sizeKB = Math.round(sizeBytes / 1024);

      setPhotoUrl(compressedDataUrl);
      setPhotoSizeKB(sizeKB);
    } catch (err) {
      console.error('Image compression error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCompressing(false);
    }
  };

  // Start live webcam for selfie
  const startCamera = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setErrorMsg('ไม่สามารถเปิดกล้องได้ คุณสามารถเลือกอัปโหลดไฟล์รูปภาพแทนได้ครับ');
      setIsCameraActive(false);
    }
  };

  // Capture snapshot from webcam
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 640, 640);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();

    // Compress under 500 KB
    processAndCompressImage(rawDataUrl);
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Handle local file upload
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      processAndCompressImage(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('กรุณาป้อนชื่อผู้เข้าประกวด');
      return;
    }
    if (!wish.trim()) {
      setErrorMsg('กรุณาป้อนคำอธิษฐาน');
      return;
    }

    const currentStyleObj = krathongStyles.find((s) => s.id === selectedStyle);

    const newKrathong = {
      id: `k-user-${Date.now()}`,
      name: name.trim(),
      wish: wish.trim(),
      votes: 1, // First self-vote
      color: currentStyleObj ? currentStyleObj.color : '#FF69B4',
      petalStyle: selectedStyle,
      photo: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      photoSizeKB: photoSizeKB || 0,
      x: (Math.random() - 0.5) * 16,
      z: 5 + Math.random() * 6, // Spawn close to the viewing pier
      speed: 0.007,
    };

    stopCamera();
    onSubmit(newKrathong);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-lg my-6 rounded-2xl glass-panel shadow-2xl border border-yellow-500/40 text-white overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-900 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪷</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">ร่วมลอยกระทง & ส่งเข้าประกวด</h3>
              <p className="text-xs text-amber-200">บันทึกข้อมูลลง Firestore เชื่อมต่อออนไลน์เรียลไทม์</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/60 text-gray-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          {/* 1. Photo Capture / Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-amber-300">
                1. รูปถ่ายผู้เข้าประกวด (ถ่ายสด หรือแนบรูป)
              </label>
              {photoSizeKB !== null && (
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                  <CheckCircle2 size={12} />
                  ขนาด: {photoSizeKB} KB (&le; 500 KB)
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl glass-card border border-white/10">
              {/* Photo Preview / Live Video */}
              <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-slate-800 border-2 border-yellow-500/50 flex items-center justify-center flex-shrink-0 shadow-inner">
                {isCompressing ? (
                  <div className="text-center p-2 text-amber-300">
                    <Loader2 size={24} className="animate-spin mx-auto mb-1" />
                    <span className="text-[10px] block">กำลังบีบอัดรูป...</span>
                  </div>
                ) : isCameraActive ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2 text-gray-400">
                    <Camera size={28} className="mx-auto mb-1 text-gray-500" />
                    <span className="text-[10px] leading-tight block">ยังไม่มีรูปภาพ</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex-1 w-full space-y-2">
                {isCameraActive ? (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <Camera size={16} />
                    <span>กดถ่ายภาพช็อตนี้</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="py-2 px-3 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <Camera size={15} />
                      <span>เปิดกล้องถ่าย</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-200 font-medium text-xs flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <Upload size={15} />
                      <span>เลือกไฟล์รูป</span>
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="user"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <p className="text-[11px] text-gray-400">
                  ระบบมีฟังก์ชันลดขนาดอัตโนมัติให้ <span className="text-amber-300 font-bold">&le; 500 KB</span> เพื่อเก็บลงใน Firestore ได้อย่างปลอดภัยและรวดเร็ว
                </p>
              </div>
            </div>
          </div>

          {/* 2. Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-amber-300">
              2. ชื่อผู้เข้าประกวด / นามแฝง *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น น้องมะลิ ใจงาม, ครอบครัวสุขสันต์"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm text-white placeholder-gray-500 outline-none transition"
            />
          </div>

          {/* 3. Wish Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-amber-300">
              3. คำอธิษฐานลอยกระทง *
            </label>
            <textarea
              required
              rows={3}
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              placeholder="ขอขมาพระแม่คงคา และขอพรสิ่งศักดิ์สิทธิ์ให้ชีวิตมีความสุข..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm text-white placeholder-gray-500 outline-none transition resize-none"
            />
          </div>

          {/* 4. Krathong Style Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-amber-300">
              4. เลือกรูปแบบกระทง
            </label>
            <div className="grid grid-cols-2 gap-2">
              {krathongStyles.map((style) => (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                    selectedStyle === style.id
                      ? 'border-amber-400 bg-amber-500/20 shadow-md ring-1 ring-amber-400/50'
                      : 'border-white/10 bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  <span
                    className="w-4 h-4 mt-0.5 rounded-full flex-shrink-0 border border-white/40"
                    style={{ backgroundColor: style.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span className="truncate">{style.name}</span>
                      {selectedStyle === style.id && <Check size={14} className="text-amber-400" />}
                    </div>
                    <div className="text-[10px] text-gray-300 truncate mt-0.5">{style.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isCompressing}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:opacity-95 text-white shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transition active:scale-[0.98] glow-gold disabled:opacity-50"
            >
              <Sparkles size={18} />
              <span>{isCompressing ? 'กำลังประมวลผลรูปภาพ...' : 'บันทึกลง Firestore & ลอยกระทง 3D'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
