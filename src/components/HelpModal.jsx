import React from 'react';
import { X, RotateCcw, ZoomIn, Eye, Sparkles } from 'lucide-react';

export function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md rounded-2xl glass-panel shadow-2xl border border-yellow-500/30 text-white overflow-hidden p-6 space-y-5 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💡</span>
            <h3 className="font-bold text-lg text-yellow-300">วิธีใช้งานและเพลิดเพลินกับบรรยากาศ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-gray-300 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-sm text-gray-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-yellow-400 mt-0.5">
              <RotateCcw size={18} />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-sm">การหมุนมุมกล้อง 360 องศา</div>
              <p className="text-xs text-gray-300 mt-0.5">
                • <strong>PC:</strong> คลิกเมาส์ซ้ายค้างแล้วลากเพื่อหมุนฉาก<br/>
                • <strong>มือถือ / แท็บเล็ต:</strong> ใช้นิ้วเดียวแตะแล้วลากเพื่อหมุนชมงาน
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-yellow-400 mt-0.5">
              <ZoomIn size={18} />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-sm">การซูมเข้า - ออก</div>
              <p className="text-xs text-gray-300 mt-0.5">
                • <strong>PC:</strong> หมุนลูกกลิ้งเมาส์ (Scroll Wheel)<br/>
                • <strong>มือถือ / แท็บเล็ต:</strong> ใช้ 2 นิ้วหนีบเข้า-กางออก (Pinch-to-zoom)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-yellow-400 mt-0.5">
              <Eye size={18} />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-sm">แตะดูกระทงและกดโหวต</div>
              <p className="text-xs text-gray-300 mt-0.5">
                แตะหรือคลิกที่กระทงใบใดก็ได้ในแม่น้ำ เพื่อเปิดดูข้อมูลเจ้าของกระทงและกดส่งคะแนนโหวตได้ทันที
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-yellow-400 mt-0.5">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-sm">สร้างกระทงของคุณเอง</div>
              <p className="text-xs text-gray-300 mt-0.5">
                กดปุ่ม <strong>"ร่วมลอยกระทง & ประกวด"</strong> ด้านล่าง ถ่ายรูปตัวเอง ป้อนชื่อ คำอธิษฐาน แล้วปล่อยลงแม่น้ำได้เลย!
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow hover:opacity-95 transition"
        >
          เข้าใจแล้ว เข้าชมงานเทศกาล
        </button>
      </div>
    </div>
  );
}
