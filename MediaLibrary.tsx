import React, { useState } from 'react';
import { MediaItem, Language } from '../../types/news';
import { INITIAL_MEDIA_ITEMS } from '../../data/customizationDefaults';
import {
  Check,
  Copy,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';

interface MediaLibraryProps {
  lang: Language;
  mediaItems: MediaItem[];
  onUploadMedia: (file: File, category: MediaItem['category'], altBn: string, altEn: string) => Promise<MediaItem>;
  onDeleteMedia: (id: string) => Promise<void>;
  onSelectMedia?: (media: MediaItem) => void;
  isPickerMode?: boolean;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  lang,
  mediaItems,
  onUploadMedia,
  onDeleteMedia,
  onSelectMedia,
  isPickerMode = false,
}) => {
  const isEn = lang === 'en';
  const [selectedCategory, setSelectedCategory] = useState<MediaItem['category'] | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<MediaItem['category']>('news');
  const [uploadAltBn, setUploadAltBn] = useState('');
  const [uploadAltEn, setUploadAltEn] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const items = mediaItems.length > 0 ? mediaItems : INITIAL_MEDIA_ITEMS;

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      await onUploadMedia(selectedFile, uploadCategory, uploadAltBn, uploadAltEn);
      setShowUploadForm(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadAltBn('');
      setUploadAltEn('');
    } catch (err: any) {
      console.error('Media upload failed:', err);
      setUploadError(err?.message || (isEn ? 'Failed to upload image to Cloudinary.' : 'ক্লাউডিনারিতে ছবি আপলোড ব্যর্থ হয়েছে।'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            {isEn ? 'Media Assets & Image Library' : 'মিডিয়া লাইব্রেরি ও ইমেজ ম্যানেজার'}
          </h3>
          <p className="text-xs text-slate-500">
            {isEn
              ? 'Upload, manage, and reuse editorial photos, military emblems, badges, and banners via Cloudinary CDN.'
              : 'ক্লাউডিনারি ফ্রি ইমেজ হোস্টিংয়ে সামরিক সংবাদ ফটো, ব্যাজ, ব্যানার ও অফিশিয়াল ছবি আপলোড ও পুনঃব্যবহার করুন।'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Upload className="w-3.5 h-3.5" />
            {isEn ? 'Upload Image' : 'নতুন ছবি আপলোড'}
          </button>
        </div>
      </div>

      {/* Upload Form Box */}
      {showUploadForm && (
        <form
          onSubmit={handleUploadSubmit}
          className="p-5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">
              {isEn ? 'Upload Media File to Cloudinary (Free CDN)' : 'ক্লাউডিনারি ইমেজ হোস্টিংয়ে মিডিয়া আপলোড'}
            </h4>
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ✕
            </button>
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300">
              {uploadError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Select Image File (JPG, JPEG, PNG, WEBP — Max 10MB)' : 'ছবি নির্বাচন করুন (JPG, PNG, WEBP)'} *
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                required
                onChange={handleFileChange}
                className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white"
              />
              {previewUrl && (
                <div className="mt-2 w-28 h-20 rounded-lg overflow-hidden border border-slate-300">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Media Category' : 'মিডিয়া ক্যাটাগরি'}
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="news">{isEn ? 'News & Editorial' : 'সংবাদ ও ফটো'}</option>
                <option value="logos">{isEn ? 'Logos & Wordmarks' : 'লোগো ও ওয়ার্ডমার্ক'}</option>
                <option value="banners">{isEn ? 'Hero Banners & Ads' : 'ব্যানার ও বিজ্ঞাপন'}</option>
                <option value="icons">{isEn ? 'Icons & Badges' : 'আইকন ও ব্যাজ'}</option>
                <option value="backgrounds">{isEn ? 'Backgrounds' : 'ব্যাকগ্রাউন্ড'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Alt Text (Bangla)' : 'অল্ট টেক্সট (বাংলা - এসইও)'}
              </label>
              <input
                type="text"
                value={uploadAltBn}
                onChange={(e) => setUploadAltBn(e.target.value)}
                placeholder="যেমন: বাংলাদেশ সেনাবাহিনীর আধুনিক ট্যাংক"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              {isEn ? 'Cancel' : 'বাতিল'}
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold disabled:opacity-50"
            >
              {isUploading
                ? isEn
                  ? 'Uploading...'
                  : 'আপলোড হচ্ছে...'
                : isEn
                ? 'Start Upload'
                : 'আপলোড করুন'}
            </button>
          </div>
        </form>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: 'all', labelEn: 'All Media', labelBn: 'সব মিডিয়া' },
            { key: 'news', labelEn: 'News', labelBn: 'সংবাদ' },
            { key: 'logo', labelEn: 'Logo', labelBn: 'লোগো' },
            { key: 'banner', labelEn: 'Banner', labelBn: 'ব্যানার' },
            { key: 'background', labelEn: 'Background', labelBn: 'ব্যাকগ্রাউন্ড' },
            { key: 'other', labelEn: 'Other', labelBn: 'অন্যান্য' },
          ] as const
        ).map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              selectedCategory === cat.key
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {isEn ? cat.labelEn : cat.labelBn}
          </button>
        ))}
      </div>

      {/* Grid of Media Assets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredItems.map((item) => {
          const catBadgeMap: Record<string, { en: string; bn: string }> = {
            news: { en: 'News', bn: 'সংবাদ' },
            logo: { en: 'Logo', bn: 'লোগো' },
            banner: { en: 'Banner', bn: 'ব্যানার' },
            background: { en: 'Background', bn: 'ব্যাকগ্রাউন্ড' },
            other: { en: 'Other', bn: 'অন্যান্য' },
          };
          const catBadgeLabel = catBadgeMap[item.category]?.[lang] || item.category;
          return (
            <div
              key={item.id}
              className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src={item.url}
                  alt={item.altTextBn || item.altTextEn || item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs uppercase">
                  {catBadgeLabel}
                </span>
              </div>

              <div className="p-2.5 space-y-1">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                  {item.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{item.dimensions || (isEn ? 'Image' : 'ছবি')}</span>
                  <span>{item.fileSizeKb ? `${item.fileSizeKb} KB` : item.sizeBytes ? `${Math.round(item.sizeBytes / 1024)} KB` : ''}</span>
                </div>
              </div>

              <div className="p-2 pt-0 flex items-center justify-between gap-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(item.url, item.id)}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] flex items-center gap-1 font-semibold"
                  title={isEn ? 'Copy Image URL' : 'ছবির লিংক কপি করুন'}
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{isEn ? 'Copied' : 'কপি হয়েছে'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{isEn ? 'Copy Link' : 'লিংক কপি'}</span>
                    </>
                  )}
                </button>

                {isPickerMode && onSelectMedia && (
                  <button
                    type="button"
                    onClick={() => onSelectMedia(item)}
                    className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold"
                  >
                    {isEn ? 'Select' : 'বাছাই'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteMedia(item.id)}
                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                  title={isEn ? 'Delete Media Asset' : 'মিডিয়া ফাইল মুছুন'}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
