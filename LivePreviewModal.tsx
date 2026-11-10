import React, { useState } from 'react';
import { Language } from '../../types/news';
import {
  Laptop,
  Maximize2,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react';

interface LivePreviewModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({
  lang,
  isOpen,
  onClose,
}) => {
  const isEn = lang === 'en';
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-md">
      {/* Top Controller Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 text-white">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold tracking-wide">
            {isEn ? 'DEFENCE 24 BD — Live Responsive Viewport Preview' : 'ডিফেন্স ২৪ বিডি — লাইভ রেসপন্সিভ প্রিভিউ'}
          </h3>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
              device === 'desktop'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>{isEn ? 'Desktop' : 'ডেস্কটপ'}</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
              device === 'tablet'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>{isEn ? 'Tablet (768px)' : 'ট্যাবলেট (৭৬৮px)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
              device === 'mobile'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isEn ? 'Mobile (375px)' : 'মোবাইল (৩৭৫px)'}</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          title={isEn ? 'Close Preview' : 'প্রিভিউ বন্ধ করুন'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/40">
        <div
          className={`h-full transition-all duration-300 bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700 ${
            device === 'desktop'
              ? 'w-full max-w-7xl'
              : device === 'tablet'
              ? 'w-[768px]'
              : 'w-[375px]'
          }`}
        >
          <iframe
            src="/"
            title="Website Live Preview"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
