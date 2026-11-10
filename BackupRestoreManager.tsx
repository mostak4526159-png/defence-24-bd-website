import React, { useRef, useState } from 'react';
import {
  PortalSettings,
  CustomCategory,
  CustomPage,
  HomepageSection,
  Language,
} from '../../types/news';
import {
  AlertTriangle,
  Check,
  Download,
  RotateCcw,
  Save,
  ShieldCheck,
  Upload,
} from 'lucide-react';

interface BackupRestoreManagerProps {
  lang: Language;
  settings: PortalSettings;
  categories: CustomCategory[];
  pages: CustomPage[];
  sections: HomepageSection[];
  onRestoreSnapshot: (snapshot: {
    settings?: PortalSettings;
    categories?: CustomCategory[];
    pages?: CustomPage[];
    sections?: HomepageSection[];
  }) => void;
  onResetFactoryDefaults: () => void;
}

export const BackupRestoreManager: React.FC<BackupRestoreManagerProps> = ({
  lang,
  settings,
  categories,
  pages,
  sections,
  onRestoreSnapshot,
  onResetFactoryDefaults,
}) => {
  const isEn = lang === 'en';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const backupData = {
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      portalName: 'DEFENCE 24 BD',
      settings,
      categories,
      pages,
      sections,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `defence24bd-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMessage(
      isEn
        ? 'Backup JSON file downloaded successfully.'
        : 'সম্পূর্ণ সেটিংস ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে।'
    );
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings || parsed.categories || parsed.pages || parsed.sections) {
          onRestoreSnapshot({
            settings: parsed.settings,
            categories: parsed.categories,
            pages: parsed.pages,
            sections: parsed.sections,
          });
          setStatusMessage(
            isEn
              ? 'Backup settings restored and applied successfully!'
              : 'ব্যাকআপ সেটিংস সফলভাবে রিস্টোর ও প্রয়োগ করা হয়েছে!'
          );
        } else {
          setStatusMessage(
            isEn ? 'Invalid configuration JSON format.' : 'ত্রুটিপূর্ণ কনফিগারেশন ফাইল।'
          );
        }
      } catch (err) {
        setStatusMessage(
          isEn ? 'Failed to parse JSON file.' : 'JSON ফাইলটি পড়া সম্ভব হয়নি।'
        );
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          {isEn ? 'Configuration Backup & Restore System' : 'কনফিগারেশন ব্যাকআপ ও রিস্টোর সিস্টেম'}
        </h3>
        <p className="text-xs text-slate-500">
          {isEn
            ? 'Export and import website customization data, typography, color palettes, categories, and page structures.'
            : 'ওয়েবসাইট কাস্টমাইজেশন, রঙ, ফন্ট, ক্যাটাগরি ও পেজ কনফিগারেশনের সম্পূর্ণ স্ন্যাপশট ব্যাকআপ ও রিস্টোর করুন।'}
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Backup Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isEn ? 'Download Backup JSON' : 'ব্যাকআপ JSON ডাউনলোড'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isEn
                ? 'Save your header, footer, homepage sections, colors, fonts, and categories into a portable JSON snapshot.'
                : 'হেডার, ফুটার, হোমপেজ সেকশন, রঙ, ফন্ট ও ক্যাটাগরির সম্পূর্ণ ডাটা একটি সুরক্ষিত JSON ফাইলে ডাউনলোড করুন।'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Download className="w-4 h-4" />
            {isEn ? 'Export Full Backup' : 'সম্পূর্ণ ব্যাকআপ এক্সপোর্ট'}
          </button>
        </div>

        {/* Restore Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isEn ? 'Restore from Backup JSON' : 'ব্যাকআপ JSON থেকে রিস্টোর'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isEn
                ? 'Upload a previously exported backup file to restore website appearance and layouts.'
                : 'পূর্বে ডাউনলোডকৃত ব্যাকআপ ফাইল আপলোড করে সমস্ত সেটিংস আগের অবস্থায় ফিরিয়ে আনুন।'}
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Upload className="w-4 h-4" />
            {isEn ? 'Upload & Restore JSON' : 'JSON ফাইল আপলোড ও রিস্টোর'}
          </button>
        </div>

        {/* Factory Reset Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isEn ? 'Reset to Factory Defaults' : 'ফ্যাক্টরি ডিফল্টে রিসেট'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isEn
                ? 'Reverts all colors, typography, header, footer, and sections to initial system defaults.'
                : 'সমস্ত রঙ, ফন্ট, হেডার, ফুটার এবং হোমপেজ সেকশন মূল প্রাথমিক সিস্টেম মানে ফিরিয়ে নেয়।'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  isEn
                    ? 'Are you sure you want to reset all portal customization settings to initial system defaults?'
                    : 'আপনি কি নিশ্চিত যে সমস্ত কাস্টমাইজেশন সেটিংস ডিফল্ট মানে রিসেট করতে চান?'
                )
              ) {
                onResetFactoryDefaults();
                setStatusMessage(
                  isEn
                    ? 'All portal settings reset to factory defaults.'
                    : 'সমস্ত সেটিংস ফ্যাক্টরি ডিফল্টে রিসেট করা হয়েছে।'
                );
                setTimeout(() => setStatusMessage(null), 4000);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <RotateCcw className="w-4 h-4" />
            {isEn ? 'Reset All Customization' : 'সব কাস্টমাইজেশন রিসেট'}
          </button>
        </div>
      </div>
    </div>
  );
};
