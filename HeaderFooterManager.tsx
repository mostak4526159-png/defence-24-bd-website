import React, { useState } from 'react';
import {
  HeaderSettings,
  FooterSettings,
  NavItem,
  Language,
  SocialLinks,
} from '../../types/news';
import { NumberStepControl } from '../common/NumberStepControl';
import {
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_FOOTER_SETTINGS,
} from '../../data/customizationDefaults';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  Globe,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';

interface HeaderFooterManagerProps {
  lang: Language;
  headerSettings: HeaderSettings;
  footerSettings: FooterSettings;
  onSave: (header: HeaderSettings, footer: FooterSettings) => void;
  onUploadLogo?: (file: File) => Promise<string>;
}

export const HeaderFooterManager: React.FC<HeaderFooterManagerProps> = ({
  lang,
  headerSettings,
  footerSettings,
  onSave,
  onUploadLogo,
}) => {
  const isEn = lang === 'en';
  const initialNav = headerSettings?.navigationItems?.length
    ? headerSettings.navigationItems
    : headerSettings?.navItems?.length
    ? headerSettings.navItems
    : DEFAULT_HEADER_SETTINGS.navigationItems || DEFAULT_HEADER_SETTINGS.navItems || [];

  const [header, setHeader] = useState<HeaderSettings>({
    ...DEFAULT_HEADER_SETTINGS,
    ...headerSettings,
    navigationItems: initialNav,
    navItems: initialNav,
  });

  const [footer, setFooter] = useState<FooterSettings>({
    ...DEFAULT_FOOTER_SETTINGS,
    ...footerSettings,
  });

  const [activeSubTab, setActiveSubTab] = useState<'header' | 'navigation' | 'footer'>('header');
  const [savedNotice, setSavedNotice] = useState(false);

  // New Navigation Item State
  const [newNavLabelBn, setNewNavLabelBn] = useState('');
  const [newNavLabelEn, setNewNavLabelEn] = useState('');
  const [newNavHref, setNewNavHref] = useState('');

  const handleSave = () => {
    onSave(header, footer);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleResetHeader = () => {
    if (window.confirm(isEn ? 'Reset Header to default settings?' : 'হেডার সেটিংস ডিফল্ট মানে রিসেট করবেন?')) {
      setHeader(DEFAULT_HEADER_SETTINGS);
    }
  };

  const handleResetFooter = () => {
    if (window.confirm(isEn ? 'Reset Footer to default settings?' : 'ফুটার সেটিংস ডিফল্ট মানে রিসেট করবেন?')) {
      setFooter(DEFAULT_FOOTER_SETTINGS);
    }
  };

  // Nav Item Actions
  const navList: NavItem[] = header.navigationItems || header.navItems || [];

  const handleAddNavItem = () => {
    if (!newNavLabelBn.trim() && !newNavLabelEn.trim()) return;
    const targetUrl = newNavHref.trim() || '#';
    const newItem: NavItem = {
      id: `nav-${Date.now()}`,
      labelBn: newNavLabelBn.trim() || newNavLabelEn.trim(),
      labelEn: newNavLabelEn.trim() || newNavLabelBn.trim(),
      href: targetUrl,
      target: targetUrl,
      type: 'custom_url',
      isEnabled: true,
      isVisible: true,
      order: navList.length + 1,
    };
    setHeader((prev) => {
      const current = prev.navigationItems || prev.navItems || [];
      const updated = [...current, newItem];
      return {
        ...prev,
        navigationItems: updated,
        navItems: updated,
      };
    });
    setNewNavLabelBn('');
    setNewNavLabelEn('');
    setNewNavHref('');
  };

  const handleRemoveNavItem = (id: string) => {
    setHeader((prev) => {
      const current = prev.navigationItems || prev.navItems || [];
      const updated = current.filter((i: NavItem) => i.id !== id);
      return {
        ...prev,
        navigationItems: updated,
        navItems: updated,
      };
    });
  };

  const handleMoveNavItem = (index: number, direction: 'up' | 'down') => {
    const items = [...navList];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    const updated = items.map((item, idx) => ({ ...item, order: idx + 1 }));
    setHeader((prev) => ({
      ...prev,
      navigationItems: updated,
      navItems: updated,
    }));
  };

  const handleToggleNavItem = (id: string) => {
    setHeader((prev) => {
      const current = prev.navigationItems || prev.navItems || [];
      const updated = current.map((item: NavItem) => {
        if (item.id !== id) return item;
        const currentActive = item.isVisible ?? item.isEnabled ?? true;
        return { ...item, isVisible: !currentActive, isEnabled: !currentActive };
      });
      return {
        ...prev,
        navigationItems: updated,
        navItems: updated,
      };
    });
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onUploadLogo) {
      try {
        const url = await onUploadLogo(file);
        setHeader((prev) => ({ ...prev, logoUrl: url }));
      } catch (err) {
        console.error('Logo upload error:', err);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setHeader((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('header')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeSubTab === 'header'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {isEn ? 'Header Controls' : 'হেডার নিয়ন্ত্রণ'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('navigation')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeSubTab === 'navigation'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {isEn ? 'Navigation Menu Builder' : 'ন্যাভিগেশন মেনু বিল্ডার'} ({navList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('footer')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeSubTab === 'footer'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {isEn ? 'Footer Controls & Columns' : 'ফুটার ও কলাম নিয়ন্ত্রণ'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {savedNotice && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-md border border-emerald-300">
              <Check className="w-4 h-4" />
              {isEn ? 'Saved Permanently' : 'সংরক্ষিত হয়েছে'}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition"
          >
            <Save className="w-4 h-4" />
            {isEn ? 'Save Header & Footer' : 'হেডার ও ফুটার সংরক্ষণ করুন'}
          </button>
        </div>
      </div>

      {/* 1. Header Controls */}
      {activeSubTab === 'header' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEn ? 'Header Appearance & Dimensional Sizing' : 'হেডার চেহারা ও পরিমাপ নিয়ন্ত্রণ'}
            </h3>
            <button
              type="button"
              onClick={handleResetHeader}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isEn ? 'Reset Header' : 'ডিফল্ট হেডার রিসেট'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Logo Settings Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                {isEn ? 'Logo / Brand Identity' : 'লোগো ও ব্র্যান্ড পরিচয়'}
              </h4>

              {header.logoUrl ? (
                <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[70px]">
                  <img
                    src={header.logoUrl}
                    alt="Portal Logo Preview"
                    style={{ height: `${header.logoHeightPx}px` }}
                    className="max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                  {isEn ? 'Using Text Wordmark (DEFENCE 24 BD)' : 'টেক্সট ওয়ার্ডমার্ক ব্যবহৃত হচ্ছে'}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Upload Logo Image (PNG, SVG, WEBP)' : 'লোগো ইমেজ আপলোড করুন'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Logo Direct Image URL' : 'লোগোর সরাসরি লিঙ্ক (URL)'}
                </label>
                <input
                  type="text"
                  value={header.logoUrl || ''}
                  onChange={(e) => setHeader((p) => ({ ...p, logoUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Logo Height Step Control */}
              <NumberStepControl
                label={isEn ? 'Logo Height' : 'লোগোর উচ্চতা'}
                value={header.logoHeightPx}
                onChange={(val) => setHeader((p) => ({ ...p, logoHeightPx: val }))}
                min={24}
                max={120}
                step={2}
                unit="px"
                helpText={isEn ? 'Adjust logo vertical size in pixels' : 'লোগোর পিক্সেল সাইজ কমান বা বাড়ান'}
              />
            </div>

            {/* Header Dimensions & Spacing Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isEn ? 'Dimensions & Spacing (+/- Controls)' : 'হেডারের উচ্চতা ও প্যাডিং (+/- নিয়ন্ত্রণ)'}
              </h4>

              <NumberStepControl
                label={isEn ? 'Header Total Height' : 'হেডারের মোট উচ্চতা'}
                value={header.headerHeightPx}
                onChange={(val) => setHeader((p) => ({ ...p, headerHeightPx: val }))}
                min={50}
                max={180}
                step={4}
                unit="px"
                helpText={isEn ? 'Minimum total height of main header' : 'প্রধান হেডারের ন্যূনতম উচ্চতা'}
              />

              <NumberStepControl
                label={isEn ? 'Header Vertical Padding' : 'ভার্টিক্যাল প্যাডিং (Y)'}
                value={header.paddingYPx ?? header.headerPaddingYPx ?? 14}
                onChange={(val) => setHeader((p) => ({ ...p, paddingYPx: val, headerPaddingYPx: val }))}
                min={4}
                max={36}
                step={2}
                unit="px"
                helpText={isEn ? 'Top and bottom spacing inside header' : 'হেডারের ভেতরে ওপর-নিচ ফাঁকা জায়গা'}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Header Layout Alignment' : 'হেডার লেআউট অ্যালাইনমেন্ট'}
                </label>
                <select
                  value={header.alignment}
                  onChange={(e) =>
                    setHeader((p) => ({ ...p, alignment: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium"
                >
                  <option value="split">{isEn ? 'Split (Logo Left, Items Right)' : 'স্প্লিট (লোগো বামে, মেনু ডানে)'}</option>
                  <option value="center">{isEn ? 'Centered (Logo Center)' : 'সেন্টারড (লোগো মাঝে)'}</option>
                  <option value="left">{isEn ? 'Left Aligned' : 'বামে সজ্জিত'}</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={header.isSticky}
                    onChange={(e) => setHeader((p) => ({ ...p, isSticky: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? 'Sticky Header on Page Scroll' : 'পেজ স্ক্রলে হেডার আটকে থাকবে (Sticky)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Elements Visibility Toggles Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isEn ? 'Feature Element Toggles' : 'ফিচার উপাদান প্রদর্শন/লুকান'}
              </h4>

              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isEn ? 'Breaking News Ticker Bar' : 'ব্রেকিং নিউজ টিকার বার'}
                  </span>
                  <input
                    type="checkbox"
                    checked={header.showBreakingTicker}
                    onChange={(e) => setHeader((p) => ({ ...p, showBreakingTicker: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isEn ? 'Search Input & Icon' : 'অনুসন্ধান বাটন ও সার্চ বক্স'}
                  </span>
                  <input
                    type="checkbox"
                    checked={header.showSearchBar}
                    onChange={(e) => setHeader((p) => ({ ...p, showSearchBar: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isEn ? 'Language Selector (বাংলা / English)' : 'ভাষা পরিবর্তন বাটন (বাংলা / English)'}
                  </span>
                  <input
                    type="checkbox"
                    checked={header.showLanguageSelector}
                    onChange={(e) => setHeader((p) => ({ ...p, showLanguageSelector: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isEn ? 'Dark / Light Mode Switcher' : 'ডার্ক ও লাইট মোড সুইচ বাটন'}
                  </span>
                  <input
                    type="checkbox"
                    checked={header.showThemeToggle}
                    onChange={(e) => setHeader((p) => ({ ...p, showThemeToggle: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isEn ? 'Live BST Clock & Date Bar' : 'লাইভ ঘড়ি ও বাংলা/ইংরেজি তারিখ'}
                  </span>
                  <input
                    type="checkbox"
                    checked={header.showDateBar}
                    onChange={(e) => setHeader((p) => ({ ...p, showDateBar: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isEn ? 'Header Social Media Icons' : 'হেডারে সোশ্যাল মিডিয়া আইকন'}
                  </span>
                  <input
                    type="checkbox"
                    checked={header.showSocialIcons}
                    onChange={(e) => setHeader((p) => ({ ...p, showSocialIcons: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Navigation Menu Builder */}
      {activeSubTab === 'navigation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEn ? 'Header Navigation Bar Menu Items' : 'হেডার প্রধান মেনু আইটেমসমূহ'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEn
                  ? 'Add, reorder, edit, or toggle items shown in the main navigation bar.'
                  : 'প্রধান ন্যাভিগেশন বারে প্রদর্শিত মেনু আইটেম যুক্ত করুন, পরিবর্তন করুন বা ক্রম পরিবর্তন করুন।'}
              </p>
            </div>
          </div>

          {/* Add New Nav Item Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              {isEn ? 'Add New Navigation Link' : 'নতুন ন্যাভিগেশন লিংক যোগ করুন'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isEn ? 'Label (Bangla)' : 'লেবেল (বাংলা)'} *
                </label>
                <input
                  type="text"
                  value={newNavLabelBn}
                  onChange={(e) => setNewNavLabelBn(e.target.value)}
                  placeholder="যেমন: বাংলাদেশ সেনাবাহিনী"
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isEn ? 'Label (English)' : 'লেবেল (ইংরেজি)'} *
                </label>
                <input
                  type="text"
                  value={newNavLabelEn}
                  onChange={(e) => setNewNavLabelEn(e.target.value)}
                  placeholder="e.g. Bangladesh Army"
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {isEn ? 'Link / URL' : 'লিংক / ইউআরএল'}
                </label>
                <input
                  type="text"
                  value={newNavHref}
                  onChange={(e) => setNewNavHref(e.target.value)}
                  placeholder="/?category=army বা #"
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddNavItem}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isEn ? 'Add Link' : 'লিংক যোগ করুন'}
                </button>
              </div>
            </div>
          </div>

          {/* List of Current Nav Items */}
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">{isEn ? 'Bangla Label' : 'বাংলা নাম'}</th>
                  <th className="py-2.5 px-3">{isEn ? 'English Label' : 'ইংরেজি নাম'}</th>
                  <th className="py-2.5 px-3">{isEn ? 'Target Link' : 'লিংক'}</th>
                  <th className="py-2.5 px-3 text-center">{isEn ? 'Status' : 'অবস্থা'}</th>
                  <th className="py-2.5 px-3 text-center">{isEn ? 'Order' : 'ক্রম'}</th>
                  <th className="py-2.5 px-3 text-right">{isEn ? 'Action' : 'অ্যাকশন'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {navList.map((item: NavItem, index: number) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.labelBn}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {item.labelEn}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                      {item.href}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleNavItem(item.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isVisible
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {item.isVisible ? (isEn ? 'Visible' : 'সক্রিয়') : (isEn ? 'Hidden' : 'লুকানো')}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveNavItem(index, 'up')}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === navList.length - 1}
                          onClick={() => handleMoveNavItem(index, 'down')}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveNavItem(item.id)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                        title="Delete Nav Link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Footer Controls & Columns */}
      {activeSubTab === 'footer' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEn ? 'Footer Configuration & Information Columns' : 'ফুটার ও তথ্য কলাম নিয়ন্ত্রণ'}
            </h3>
            <button
              type="button"
              onClick={handleResetFooter}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isEn ? 'Reset Footer' : 'ডিফল্ট ফুটার রিসেট'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Footer Dimensions & Content Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isEn ? 'Footer Padding & Copyright' : 'ফুটার প্যাডিং ও কপিরাইট'}
              </h4>

              <NumberStepControl
                label={isEn ? 'Footer Vertical Padding' : 'ফুটারের উচ্চতা / প্যাডিং (Y)'}
                value={footer.paddingYPx ?? 36}
                onChange={(val) => setFooter((p) => ({ ...p, paddingYPx: val }))}
                min={16}
                max={80}
                step={4}
                unit="px"
                helpText={isEn ? 'Padding inside footer top and bottom' : 'ফুটারের ভেতরের উল্লম্ব দূরত্ব'}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Copyright Text (Bangla)' : 'কপিরাইট টেক্সট (বাংলা)'}
                </label>
                <input
                  type="text"
                  value={footer.copyrightTextBn}
                  onChange={(e) => setFooter((p) => ({ ...p, copyrightTextBn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Copyright Text (English)' : 'কপিরাইট টেক্সট (ইংরেজি)'}
                </label>
                <input
                  type="text"
                  value={footer.copyrightTextEn}
                  onChange={(e) => setFooter((p) => ({ ...p, copyrightTextEn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'About Description (Bangla)' : 'সংক্ষিপ্ত বিবরণ (বাংলা)'}
                </label>
                <textarea
                  rows={3}
                  value={footer.aboutTextBn}
                  onChange={(e) => setFooter((p) => ({ ...p, aboutTextBn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'About Description (English)' : 'সংক্ষিপ্ত বিবরণ (ইংরেজি)'}
                </label>
                <textarea
                  rows={3}
                  value={footer.aboutTextEn}
                  onChange={(e) => setFooter((p) => ({ ...p, aboutTextEn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            {/* Social Media Links Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                {isEn ? 'Social Media Profile Links' : 'সোশ্যাল মিডিয়া প্রোফাইল লিংকসমূহ'}
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Facebook Page
                </label>
                <input
                  type="text"
                  value={footer.socialLinks?.facebook || ''}
                  onChange={(e) =>
                    setFooter((p) => ({
                      ...p,
                      socialLinks: { ...p.socialLinks, facebook: e.target.value },
                    }))
                  }
                  placeholder="https://facebook.com/..."
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Twitter / X Profile
                </label>
                <input
                  type="text"
                  value={footer.socialLinks?.twitter || ''}
                  onChange={(e) =>
                    setFooter((p) => ({
                      ...p,
                      socialLinks: { ...p.socialLinks, twitter: e.target.value },
                    }))
                  }
                  placeholder="https://twitter.com/..."
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  YouTube Channel
                </label>
                <input
                  type="text"
                  value={footer.socialLinks?.youtube || ''}
                  onChange={(e) =>
                    setFooter((p) => ({
                      ...p,
                      socialLinks: { ...p.socialLinks, youtube: e.target.value },
                    }))
                  }
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Channel / Group
                </label>
                <input
                  type="text"
                  value={footer.socialLinks?.telegram || ''}
                  onChange={(e) =>
                    setFooter((p) => ({
                      ...p,
                      socialLinks: { ...p.socialLinks, telegram: e.target.value },
                    }))
                  }
                  placeholder="https://t.me/..."
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Contact
                </label>
                <input
                  type="text"
                  value={footer.socialLinks?.whatsapp || ''}
                  onChange={(e) =>
                    setFooter((p) => ({
                      ...p,
                      socialLinks: { ...p.socialLinks, whatsapp: e.target.value },
                    }))
                  }
                  placeholder="https://wa.me/..."
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={footer.showSocialLinks}
                    onChange={(e) => setFooter((p) => ({ ...p, showSocialLinks: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? 'Show Social Links in Footer' : 'ফুটারে সোশ্যাল মিডিয়া আইকন প্রদর্শন'}
                  </span>
                </label>
              </div>
            </div>

            {/* Contact & Editorial Hotline Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isEn ? 'Contact & Editorial Office' : 'যোগাযোগ ও সম্পাদকীয় কার্যালয়'}
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Office Address (Bangla)' : 'কার্যালয় ঠিকানা (বাংলা)'}
                </label>
                <input
                  type="text"
                  value={footer.contactAddressBn || ''}
                  onChange={(e) => setFooter((p) => ({ ...p, contactAddressBn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Office Address (English)' : 'কার্যালয় ঠিকানা (ইংরেজি)'}
                </label>
                <input
                  type="text"
                  value={footer.contactAddressEn || ''}
                  onChange={(e) => setFooter((p) => ({ ...p, contactAddressEn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Emergency Phone / Hotline' : 'জরুরি যোগাযোগ নম্বর / হটলাইন'}
                </label>
                <input
                  type="text"
                  value={footer.contactPhone || ''}
                  onChange={(e) => setFooter((p) => ({ ...p, contactPhone: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Editorial Email' : 'সম্পাদকীয় ইমেইল'}
                </label>
                <input
                  type="email"
                  value={footer.contactEmail || ''}
                  onChange={(e) => setFooter((p) => ({ ...p, contactEmail: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
