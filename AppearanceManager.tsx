import React, { useState } from 'react';
import {
  ColorPaletteSettings,
  TypographySettings,
  Language,
} from '../../types/news';
import { NumberStepControl } from '../common/NumberStepControl';
import {
  DEFAULT_COLOR_SETTINGS,
  DEFAULT_TYPOGRAPHY_SETTINGS,
  COLOR_PRESETS,
} from '../../data/customizationDefaults';
import { applyDynamicTheme } from '../../lib/themeApplier';
import {
  Check,
  Eye,
  Paintbrush,
  Palette,
  RotateCcw,
  Save,
  Type,
} from 'lucide-react';

interface AppearanceManagerProps {
  lang: Language;
  colors: ColorPaletteSettings;
  typography: TypographySettings;
  onSaveAppearance: (
    colors: ColorPaletteSettings,
    typography: TypographySettings
  ) => void;
}

export const AppearanceManager: React.FC<AppearanceManagerProps> = ({
  lang,
  colors,
  typography,
  onSaveAppearance,
}) => {
  const isEn = lang === 'en';
  const [localColors, setLocalColors] = useState<ColorPaletteSettings>({
    ...DEFAULT_COLOR_SETTINGS,
    ...colors,
  });

  const [localTypography, setLocalTypography] = useState<TypographySettings>({
    ...DEFAULT_TYPOGRAPHY_SETTINGS,
    ...typography,
  });

  const [activeTab, setActiveTab] = useState<'colors' | 'typography'>('colors');
  const [savedNotice, setSavedNotice] = useState(false);

  const updateColor = (key: keyof ColorPaletteSettings, val: string) => {
    const updated = { ...localColors, [key]: val };
    setLocalColors(updated);
    applyDynamicTheme(updated, localTypography);
  };

  const updateTypo = <K extends keyof TypographySettings>(
    key: K,
    val: TypographySettings[K]
  ) => {
    const updated = { ...localTypography, [key]: val };
    setLocalTypography(updated);
    applyDynamicTheme(localColors, updated);
  };

  const applyPreset = (presetColors: Partial<ColorPaletteSettings>) => {
    const merged = { ...localColors, ...presetColors };
    setLocalColors(merged);
    applyDynamicTheme(merged, localTypography);
  };

  const handleResetColors = () => {
    if (window.confirm(isEn ? 'Reset all colors to default?' : 'সব রঙ ডিফল্ট মানে রিসেট করবেন?')) {
      setLocalColors(DEFAULT_COLOR_SETTINGS);
      applyDynamicTheme(DEFAULT_COLOR_SETTINGS, localTypography);
    }
  };

  const handleResetTypography = () => {
    if (window.confirm(isEn ? 'Reset typography settings to default?' : 'টাইপোগ্রাফি ডিফল্ট মানে রিসেট করবেন?')) {
      setLocalTypography(DEFAULT_TYPOGRAPHY_SETTINGS);
      applyDynamicTheme(localColors, DEFAULT_TYPOGRAPHY_SETTINGS);
    }
  };

  const handleSave = () => {
    onSaveAppearance(localColors, localTypography);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const colorItems: {
    key: keyof ColorPaletteSettings;
    labelEn: string;
    labelBn: string;
    descEn: string;
    descBn: string;
  }[] = [
    { key: 'primary', labelEn: 'Primary Brand Color', labelBn: 'প্রধান ব্র্যান্ড কালার', descEn: 'Main accent (military navy)', descBn: 'মূল ব্র্যান্ড রঙ (সামরিক নেভি)' },
    { key: 'secondary', labelEn: 'Secondary Accent', labelBn: 'সেকেন্ডারি অ্যাকসেন্ট', descEn: 'Highlight blue / badges', descBn: 'হাইলাইট নীল ও ব্যাজ রঙ' },
    { key: 'headerBg', labelEn: 'Header Background', labelBn: 'হেডার ব্যাকগ্রাউন্ড', descEn: 'Top navigation background', descBn: 'শীর্ষ নেভিগেশনের ব্যাকগ্রাউন্ড' },
    { key: 'headerText', labelEn: 'Header Text Color', labelBn: 'হেডার টেক্সট কালার', descEn: 'Text in top navigation', descBn: 'শীর্ষ নেভিগেশনের লেখার রঙ' },
    { key: 'footerBg', labelEn: 'Footer Background', labelBn: 'ফুটার ব্যাকগ্রাউন্ড', descEn: 'Bottom footer background', descBn: 'ফুটারের ব্যাকগ্রাউন্ড রঙ' },
    { key: 'footerText', labelEn: 'Footer Text Color', labelBn: 'ফুটার টেক্সট কালার', descEn: 'Bottom footer text', descBn: 'ফুটারের লেখার রঙ' },
    { key: 'navBg', labelEn: 'Navigation Bar Bg', labelBn: 'মেনু বার ব্যাকগ্রাউন্ড', descEn: 'Main category nav bar', descBn: 'মূল বিভাগ মেনু বারের রঙ' },
    { key: 'navText', labelEn: 'Navigation Bar Text', labelBn: 'মেনু বার টেক্সট কালার', descEn: 'Category links color', descBn: 'বিভাগ লিংকের লেখার রঙ' },
    { key: 'buttonBg', labelEn: 'Button Background', labelBn: 'বাটন ব্যাকগ্রাউন্ড', descEn: 'Action & submit buttons', descBn: 'অ্যাকশন ও সাবমিট বাটনের রঙ' },
    { key: 'buttonHover', labelEn: 'Button Hover Color', labelBn: 'বাটন হোভার কালার', descEn: 'Mouse hover state', descBn: 'মাউস হোভার করার রঙ' },
    { key: 'cardBgLight', labelEn: 'Card Background (Light)', labelBn: 'কার্ড ব্যাকগ্রাউন্ড (লাইট)', descEn: 'News card in light mode', descBn: 'লাইট মোডে সংবাদ কার্ডের রঙ' },
    { key: 'cardBgDark', labelEn: 'Card Background (Dark)', labelBn: 'কার্ড ব্যাকগ্রাউন্ড (ডার্ক)', descEn: 'News card in dark mode', descBn: 'ডার্ক মোডে সংবাদ কার্ডের রঙ' },
    { key: 'headingColorLight', labelEn: 'Heading Text (Light)', labelBn: 'শিরোনাম টেক্সট (লাইট)', descEn: 'Headlines in light mode', descBn: 'লাইট মোডে শিরোনামের রঙ' },
    { key: 'headingColorDark', labelEn: 'Heading Text (Dark)', labelBn: 'শিরোনাম টেক্সট (ডার্ক)', descEn: 'Headlines in dark mode', descBn: 'ডার্ক মোডে শিরোনামের রঙ' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'colors'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            {isEn ? 'Colors & Theme Palette' : 'রঙ ও থিম প্যালেট'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'typography'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Type className="w-4 h-4" />
            {isEn ? 'Typography & Fonts' : 'টাইপোগ্রাফি ও ফন্ট'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {savedNotice && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-md border border-emerald-300">
              <Check className="w-4 h-4" />
              {isEn ? 'Appearance Saved' : 'সংরক্ষিত হয়েছে'}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow transition"
          >
            <Save className="w-4 h-4" />
            {isEn ? 'Save Appearance Settings' : 'রঙ ও ফন্ট সংরক্ষণ করুন'}
          </button>
        </div>
      </div>

      {/* 1. Color Customization Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Paintbrush className="w-4 h-4 text-blue-600" />
                {isEn ? 'One-Click Color Presets' : 'এক ক্লিকে প্রিসেট কালার প্যালেট'}
              </h4>
              <button
                type="button"
                onClick={handleResetColors}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {isEn ? 'Reset to Default Colors' : 'ডিফল্ট রঙে রিসেট'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset.colors)}
                  className="p-3 text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-blue-500 hover:shadow-sm transition group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: preset.colors.primaryColor || preset.colors.primary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: preset.colors.secondaryColor || preset.colors.secondary }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: preset.colors.headerColor || preset.colors.headerBg }}
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                    {isEn ? preset.name : preset.nameBn}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 14 Individual Color Pickers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {colorItems.map((item) => {
              const currentColor = (localColors[item.key] as string) || '#0a192f';
              return (
                <div
                  key={item.key}
                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isEn ? item.labelEn : item.labelBn}
                    </label>
                    <span
                      className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 shadow-sm"
                      style={{ backgroundColor: currentColor }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {isEn ? item.descEn : item.descBn}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => updateColor(item.key, e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={currentColor}
                      onChange={(e) => updateColor(item.key, e.target.value)}
                      placeholder="#000000"
                      className="w-full px-2 py-1 font-mono text-xs uppercase rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Preview Sample Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              {isEn ? 'Live Element Visual Preview' : 'উপাদানসমূহের সরাসরি ভিজ্যুয়াল প্রিভিউ'}
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                style={{
                  backgroundColor: localColors.buttonColor || localColors.buttonBg,
                  color: localColors.buttonText || '#ffffff',
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold shadow transition"
              >
                {isEn ? 'Sample Primary Button' : 'নমুনা প্রধান বাটন'}
              </button>
              <span
                style={{
                  backgroundColor: localColors.secondaryColor || localColors.secondary,
                  color: '#ffffff',
                }}
                className="px-3 py-1 rounded-full text-xs font-bold"
              >
                {isEn ? 'Badge Highlight' : 'হাইলাইট ব্যাজ'}
              </span>
              <div
                style={{
                  backgroundColor: localColors.cardBgColor || localColors.cardBgLight,
                  color: localColors.headingColor || localColors.headingColorLight,
                }}
                className="p-3 rounded-lg border border-slate-200 shadow-sm text-xs font-bold"
              >
                {isEn ? 'Card Title (Light Mode)' : 'কার্ড শিরোনাম (লাইট মোড)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Typography Customization Tab */}
      {activeTab === 'typography' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEn ? 'Typography, Unicode Fonts & Scaling (+/- Controls)' : 'টাইপোগ্রাফি, ইউনিকোড ফন্ট ও স্কেলিং (+/- নিয়ন্ত্রণ)'}
            </h3>
            <button
              type="button"
              onClick={handleResetTypography}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isEn ? 'Reset Typography' : 'ডিফল্ট টাইপোগ্রাফি রিসেট'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Font Family Selection */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isEn ? 'Font Family Selection (Unicode Compliant)' : 'ইউনিকোড ফন্ট নির্বাচন'}
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Primary Bangla Font' : 'প্রধান বাংলা ফন্ট'}
                </label>
                <select
                  value={localTypography.banglaFont}
                  onChange={(e) => updateTypo('banglaFont', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold"
                >
                  <option value="Hind Siliguri">Hind Siliguri (আধুনিক ও পরিষ্কার - ডিফল্ট)</option>
                  <option value="Kalpurush">Kalpurush (কালপুরুষ - ক্লাসিক বাংলা)</option>
                  <option value="SolaimanLipi">SolaimanLipi (সোলাইমান লিপি - সংবাদপত্র মানদণ্ড)</option>
                  <option value="Noto Sans Bengali">Noto Sans Bengali (গুগল নোতো সান্স)</option>
                  <option value="Tiro Bangla">Tiro Bangla (তিরো বাংলা - ফরমাল)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Primary English Font' : 'প্রধান ইংরেজি ফন্ট'}
                </label>
                <select
                  value={localTypography.englishFont}
                  onChange={(e) => updateTypo('englishFont', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold"
                >
                  <option value="Inter">Inter (Modern & Highly Legible - Default)</option>
                  <option value="Roboto">Roboto (Google Standard Clean)</option>
                  <option value="Merriweather">Merriweather (Editorial Serif)</option>
                  <option value="Cinzel">Cinzel (Military / Classical Wordmark)</option>
                  <option value="Oswald">Oswald (Bold Headline Condensed)</option>
                </select>
              </div>

              <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {isEn ? 'Bangla Font Live Sample' : 'বাংলা ফন্ট সরাসরি প্রিভিউ'}
                </span>
                <p
                  className="text-sm text-slate-800 dark:text-slate-100 font-medium"
                  style={{ fontFamily: `"${localTypography.banglaFont}", sans-serif` }}
                >
                  ডিফেন্স ২৪ বিডি — বাংলাদেশ ও আন্তর্জাতিক সামরিক সংবাদ এবং নিরাপত্তা বিশ্লেষণ।
                </p>
              </div>
            </div>

            {/* Stepper Numerical Controls */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isEn ? 'Scale & Spacing (+/- Numerical Steppers)' : 'ফন্ট সাইজ ও দূরত্ব (+/- নিয়ন্ত্রণ)'}
              </h4>

              <NumberStepControl
                label={isEn ? 'Base Body Font Size' : 'মূল বডি ফন্ট সাইজ'}
                value={localTypography.baseFontSizePx || 15}
                onChange={(val) => updateTypo('baseFontSizePx', val)}
                min={12}
                max={22}
                step={1}
                unit="px"
                helpText={isEn ? 'Standard text readability scale' : 'সাধারণ লেখার আকার'}
              />

              <NumberStepControl
                label={isEn ? 'Heading Size Scale Factor' : 'শিরোনাম স্কেল অনুপাত'}
                value={localTypography.headingScaleFactor || localTypography.headingScale || 1.0}
                onChange={(val) => {
                  updateTypo('headingScaleFactor', val);
                  updateTypo('headingScale', val);
                }}
                min={0.8}
                max={1.6}
                step={0.05}
                unit="x"
                helpText={isEn ? 'Multiplies headline sizes proportionally' : 'শিরোনামের আকার আনুপাতিক হারে পরিবর্তন করে'}
              />

              <NumberStepControl
                label={isEn ? 'Line Height (Leading)' : 'লাইন হাইট (প্যারাগ্রাফ দূরত্ব)'}
                value={localTypography.lineHeight || 1.6}
                onChange={(val) => updateTypo('lineHeight', val)}
                min={1.2}
                max={2.4}
                step={0.05}
                unit=""
                helpText={isEn ? 'Comfortable reading spacing' : 'প্যারাগ্রাফের লাইনের মধ্যকার ফাঁক'}
              />

              <NumberStepControl
                label={isEn ? 'Letter Spacing' : 'অক্ষরের মধ্যবর্তী দূরত্ব'}
                value={localTypography.letterSpacingPx ?? 0}
                onChange={(val) => updateTypo('letterSpacingPx', val)}
                min={-1}
                max={4}
                step={0.5}
                unit="px"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
