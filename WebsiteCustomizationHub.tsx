import React, { useState } from 'react';
import {
  CustomPage,
  FooterSettings,
  HeaderSettings,
  HomepageSection,
  Language,
  NavItem,
  PortalSettings,
} from '../../types/news';
import {
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOMEPAGE_SECTIONS,
} from '../../data/customizationDefaults';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  FileText,
  Globe,
  Home,
  Layout,
  Mail,
  Navigation,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Sliders,
  Trash2,
  Upload,
} from 'lucide-react';
import { NumberStepControl } from '../common/NumberStepControl';

interface WebsiteCustomizationHubProps {
  lang: Language;
  settings: PortalSettings;
  homepageSections: HomepageSection[];
  customPages: CustomPage[];
  onSave: (
    updatedSettings: Partial<PortalSettings>,
    updatedSections?: HomepageSection[],
    updatedPages?: CustomPage[]
  ) => Promise<void>;
  onUploadLogo?: (file: File) => Promise<string>;
}

export const WebsiteCustomizationHub: React.FC<WebsiteCustomizationHubProps> = ({
  lang,
  settings,
  homepageSections,
  customPages,
  onSave,
  onUploadLogo,
}) => {
  const isEn = lang === 'en';

  const [activeSubTab, setActiveSubTab] = useState<
    'header' | 'homepage' | 'body' | 'contact' | 'about' | 'footer' | 'general'
  >('header');

  const [savedNotice, setSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for header
  const initialNav = settings.headerSettings?.navigationItems?.length
    ? settings.headerSettings.navigationItems
    : DEFAULT_HEADER_SETTINGS.navigationItems || [];

  const [header, setHeader] = useState<HeaderSettings>({
    ...DEFAULT_HEADER_SETTINGS,
    ...(settings.headerSettings || {}),
    navigationItems: initialNav,
    navItems: initialNav,
  });

  // Local state for footer
  const [footer, setFooter] = useState<FooterSettings>({
    ...DEFAULT_FOOTER_SETTINGS,
    ...(settings.footerSettings || settings.footer || {}),
  });

  // Local state for general settings
  const [general, setGeneral] = useState({
    siteNameEn: settings.siteNameEn || 'Defence 24 BD',
    siteNameBn: settings.siteNameBn || 'ডিফেন্স ২৪ বিডি',
    taglineEn: settings.taglineEn || '',
    taglineBn: settings.taglineBn || '',
    canonicalDomain: settings.canonicalDomain || 'https://defence24.netlify.app',
    adsensePublisherId: settings.adsensePublisherId || '',
    emergencyBannerEnabled: settings.emergencyBannerEnabled ?? true,
    enableTopBannerAd: settings.enableTopBannerAd ?? false,
    enableInArticleAd: settings.enableInArticleAd ?? false,
    enableSidebarAd: settings.enableSidebarAd ?? false,
  });

  // Local state for homepage sections
  const [sections, setSections] = useState<HomepageSection[]>(
    homepageSections.length > 0 ? homepageSections : DEFAULT_HOMEPAGE_SECTIONS
  );

  // Local state for About Us page
  const aboutPage = customPages.find((p) => p.slug === 'about');
  const [aboutTitleEn, setAboutTitleEn] = useState(aboutPage?.titleEn || 'About Defence 24 BD');
  const [aboutTitleBn, setAboutTitleBn] = useState(aboutPage?.titleBn || 'আমাদের সম্পর্কে');
  const [aboutLeadEn, setAboutLeadEn] = useState(aboutPage?.leadEn || '');
  const [aboutLeadBn, setAboutLeadBn] = useState(aboutPage?.leadBn || '');
  const [aboutContentEn, setAboutContentEn] = useState(
    Array.isArray(aboutPage?.contentEn)
      ? aboutPage?.contentEn.join('\n\n')
      : aboutPage?.contentEn || ''
  );
  const [aboutContentBn, setAboutContentBn] = useState(
    Array.isArray(aboutPage?.contentBn)
      ? aboutPage?.contentBn.join('\n\n')
      : aboutPage?.contentBn || ''
  );

  // Navigation Items Manager
  const [newNavLabelBn, setNewNavLabelBn] = useState('');
  const [newNavLabelEn, setNewNavLabelEn] = useState('');
  const [newNavHref, setNewNavHref] = useState('');

  const navList: NavItem[] = header.navigationItems || [];

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
    const updated = [...navList, newItem];
    setHeader((prev) => ({
      ...prev,
      navigationItems: updated,
      navItems: updated,
    }));
    setNewNavLabelBn('');
    setNewNavLabelEn('');
    setNewNavHref('');
  };

  const handleRemoveNavItem = (id: string) => {
    const updated = navList.filter((i) => i.id !== id);
    setHeader((prev) => ({
      ...prev,
      navigationItems: updated,
      navItems: updated,
    }));
  };

  const handleMoveNavItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= navList.length) return;
    const reordered = [...navList];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    const withOrder = reordered.map((item, idx) => ({ ...item, order: idx + 1 }));
    setHeader((prev) => ({
      ...prev,
      navigationItems: withOrder,
      navItems: withOrder,
    }));
  };

  const handleToggleNavItem = (id: string) => {
    const updated = navList.map((i) =>
      i.id === id ? { ...i, isVisible: !i.isVisible, isEnabled: !i.isVisible } : i
    );
    setHeader((prev) => ({
      ...prev,
      navigationItems: updated,
      navItems: updated,
    }));
  };

  // Section Reorder / Toggle
  const handleToggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s))
    );
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    setSections(reordered.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updatedSettingsPayload: Partial<PortalSettings> = {
        ...general,
        headerSettings: header,
        header,
        footerSettings: footer,
        footer,
      };

      let updatedPagesPayload: CustomPage[] | undefined;
      if (aboutPage) {
        updatedPagesPayload = customPages.map((p) =>
          p.slug === 'about'
            ? {
                ...p,
                titleEn: aboutTitleEn,
                titleBn: aboutTitleBn,
                leadEn: aboutLeadEn,
                leadBn: aboutLeadBn,
                contentEn: aboutContentEn,
                contentBn: aboutContentBn,
                updatedAtIso: new Date().toISOString(),
              }
            : p
        );
      }

      await onSave(updatedSettingsPayload, sections, updatedPagesPayload);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            {isEn ? 'Complete Website Customization Dashboard' : 'ওয়েবসাইট কাস্টমাইজেশন ড্যাশবোর্ড'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEn
              ? 'Control header, homepage, body content, contact details, About Us, footer, and general settings permanently.'
              : 'হেডার, হোমপেজ, মূল কন্টেন্ট, যোগাযোগ তথ্য, আমাদের সম্পর্কে, ফুটার ও সাধারণ সেটিংস কোড না ছুঁয়েই পরিবর্তন করুন।'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving
              ? isEn
                ? 'Saving Changes...'
                : 'সংরক্ষণ করা হচ্ছে...'
              : isEn
              ? 'Save All Customizations'
              : 'সকল পরিবর্তন সংরক্ষণ করুন'}
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {isEn
              ? 'Website customizations saved permanently to Cloud Firestore.'
              : 'সকল কাস্টমাইজেশন ফায়ারবেস ক্লাউড ফায়ারস্টোরে স্থায়ীভাবে সংরক্ষিত হয়েছে।'}
          </span>
        </div>
      )}

      {/* Subtab Navigation (A to G) */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { key: 'header', labelEn: 'A. Header Management', labelBn: 'ক. হেডার ব্যবস্থাপনা', icon: Navigation },
          { key: 'homepage', labelEn: 'B. Homepage Management', labelBn: 'খ. হোমপেজ ব্যবস্থাপনা', icon: Home },
          { key: 'body', labelEn: 'C. Body Content Management', labelBn: 'গ. মূল কন্টেন্ট', icon: Layout },
          { key: 'contact', labelEn: 'D. Contact Management', labelBn: 'ঘ. যোগাযোগ তথ্য', icon: Phone },
          { key: 'about', labelEn: 'E. About Us Management', labelBn: 'ঙ. আমাদের সম্পর্কে', icon: FileText },
          { key: 'footer', labelEn: 'F. Footer Management', labelBn: 'চ. ফুটার ব্যবস্থাপনা', icon: Globe },
          { key: 'general', labelEn: 'G. General Settings', labelBn: 'ছ. সাধারণ সেটিংস', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isEn ? tab.labelEn : tab.labelBn}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB A: HEADER MANAGEMENT */}
      {activeSubTab === 'header' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Configuration */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                {isEn ? 'Logo & Branding' : 'লোগো ও ব্র্যান্ডিং'}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Logo Mode' : 'লোগোর ধরন'}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="logoMode"
                      checked={header.logoMode === 'text'}
                      onChange={() => setHeader((p) => ({ ...p, logoMode: 'text' }))}
                      className="accent-blue-600"
                    />
                    <span>{isEn ? 'Wordmark Text' : 'টেক্সট ওয়ার্ডমার্ক'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="logoMode"
                      checked={header.logoMode === 'image'}
                      onChange={() => setHeader((p) => ({ ...p, logoMode: 'image' }))}
                      className="accent-blue-600"
                    />
                    <span>{isEn ? 'Image Logo' : 'ছবি লোগো'}</span>
                  </label>
                </div>
              </div>

              {header.logoMode === 'text' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isEn ? 'Logo Text (Bangla)' : 'লোগো টেক্সট (বাংলা)'}
                    </label>
                    <input
                      type="text"
                      value={header.logoTextBn}
                      onChange={(e) => setHeader((p) => ({ ...p, logoTextBn: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-editorial"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isEn ? 'Logo Text (English)' : 'লোগো টেক্সট (ইংরেজি)'}
                    </label>
                    <input
                      type="text"
                      value={header.logoTextEn}
                      onChange={(e) => setHeader((p) => ({ ...p, logoTextEn: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-editorial"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isEn ? 'Logo Image URL' : 'লোগো ছবির ইউআরএল'}
                    </label>
                    <input
                      type="url"
                      value={header.logoUrl || header.logoImageUrl || ''}
                      onChange={(e) =>
                        setHeader((p) => ({
                          ...p,
                          logoUrl: e.target.value,
                          logoImageUrl: e.target.value,
                        }))
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                    />
                  </div>
                  <NumberStepControl
                    label={isEn ? 'Logo Height' : 'লোগোর উচ্চতা'}
                    value={header.logoHeightPx || 38}
                    onChange={(val) => setHeader((p) => ({ ...p, logoHeightPx: val }))}
                    min={24}
                    max={64}
                    step={2}
                    unit="px"
                  />
                </div>
              )}
            </div>

            {/* Header Feature Toggles */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isEn ? 'Header Feature Toggles' : 'হেডার ফিচার ও বাটন নিয়ন্ত্রণ'}
              </h3>

              <div className="space-y-2 pt-1 text-xs">
                {[
                  { key: 'showEmergencyNotice', labelEn: 'Show Emergency Notice Banner', labelBn: 'জরুরি নোটিশ ব্যানার প্রদর্শন' },
                  { key: 'showDateClock', labelEn: 'Show BST Clock & Date Indicator', labelBn: 'তারিখ ও ঘড়ি প্রদর্শন' },
                  { key: 'showLanguageSwitcher', labelEn: 'Show Language Switcher (Bangla / English)', labelBn: 'ভাষা পরিবর্তন বাটন প্রদর্শন' },
                  { key: 'showThemeSwitcher', labelEn: 'Show Theme Switcher (Light / Dark)', labelBn: 'থিম পরিবর্তন বাটন প্রদর্শন' },
                  { key: 'showSubmitNewsBtn', labelEn: 'Show "Submit News" Button', labelBn: '"সংবাদ পাঠান" বাটন প্রদর্শন' },
                  { key: 'showAdminBtn', labelEn: 'Show Admin Access Link', labelBn: 'অ্যাডমিন প্যানেল লিংক প্রদর্শন' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(header as any)[item.key] ?? true}
                      onChange={(e) => setHeader((p) => ({ ...p, [item.key]: e.target.checked }))}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      {isEn ? item.labelEn : item.labelBn}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Menu Builder */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isEn ? 'Navigation Menu Management' : 'নেভিগেশন মেনু ব্যবস্থাপনা'}
            </h3>

            {/* Add menu item */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <input
                type="text"
                placeholder={isEn ? 'Bangla Label (e.g. সেনাবাহিনী)' : 'বাংলা নাম (যেমন: সেনাবাহিনী)'}
                value={newNavLabelBn}
                onChange={(e) => setNewNavLabelBn(e.target.value)}
                className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <input
                type="text"
                placeholder={isEn ? 'English Label (e.g. Army)' : 'ইংরেজি নাম (যেমন: Army)'}
                value={newNavLabelEn}
                onChange={(e) => setNewNavLabelEn(e.target.value)}
                className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <input
                type="text"
                placeholder={isEn ? 'Target Link (e.g. /?category=army)' : 'টার্গেট লিংক (যেমন: /?category=army)'}
                value={newNavHref}
                onChange={(e) => setNewNavHref(e.target.value)}
                className="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
              />
              <button
                type="button"
                onClick={handleAddNavItem}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                {isEn ? 'Add Menu Item' : 'মেনু আইটেম যোগ করুন'}
              </button>
            </div>

            {/* Current Navigation Items */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center">#</th>
                    <th className="py-2 px-3">{isEn ? 'Bangla' : 'বাংলা'}</th>
                    <th className="py-2 px-3">{isEn ? 'English' : 'ইংরেজি'}</th>
                    <th className="py-2 px-3">{isEn ? 'Link' : 'লিংক'}</th>
                    <th className="py-2 px-3 text-center">{isEn ? 'Visibility' : 'অবস্থা'}</th>
                    <th className="py-2 px-3 text-center">{isEn ? 'Order' : 'ক্রম'}</th>
                    <th className="py-2 px-3 text-right">{isEn ? 'Action' : 'অ্যাকশন'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {navList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{item.labelBn}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{item.labelEn}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-blue-600 dark:text-blue-400">{item.href || item.target}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleNavItem(item.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.isVisible
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.isVisible ? (isEn ? 'Visible' : 'দৃশ্যমান') : (isEn ? 'Hidden' : 'লুকানো')}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveNavItem(idx, 'up')}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === navList.length - 1}
                            onClick={() => handleMoveNavItem(idx, 'down')}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveNavItem(item.id)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
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
        </div>
      )}

      {/* SUBTAB B: HOMEPAGE MANAGEMENT */}
      {activeSubTab === 'homepage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isEn ? 'Homepage Section Ordering & Visibility' : 'হোমপেজ সেকশনসমূহ পুনর্বিন্যাস ও দৃশ্যমানতা'}
            </h3>
            <span className="text-xs text-slate-500">
              {sections.filter((s) => s.isEnabled).length} {isEn ? 'active sections' : 'সক্রিয় সেকশন'}
            </span>
          </div>

          <div className="space-y-2.5">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {isEn ? sec.titleEn : sec.titleBn}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                      {sec.type}
                    </span>
                  </div>
                  {sec.subtitleEn && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-8">
                      {isEn ? sec.subtitleEn : sec.subtitleBn}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleToggleSection(sec.id)}
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      sec.isEnabled
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {sec.isEnabled ? (isEn ? 'Enabled' : 'সচল') : (isEn ? 'Hidden' : 'লুকানো')}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, 'up')}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMoveSection(idx, 'down')}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB C: BODY CONTENT MANAGEMENT */}
      {activeSubTab === 'body' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isEn ? 'Body & Homepage Text Blocks' : 'মূল পাতা ও বডি টেক্সট কনফিগারেশন'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Site Tagline (Bangla)' : 'ওয়েবসাইট ট্যাগলাইন (বাংলা)'}
                </label>
                <input
                  type="text"
                  value={general.taglineBn}
                  onChange={(e) => setGeneral((p) => ({ ...p, taglineBn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Site Tagline (English)' : 'ওয়েবসাইট ট্যাগলাইন (ইংরেজি)'}
                </label>
                <input
                  type="text"
                  value={general.taglineEn}
                  onChange={(e) => setGeneral((p) => ({ ...p, taglineEn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB D: CONTACT MANAGEMENT */}
      {activeSubTab === 'contact' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              {isEn ? 'Official Newsroom & Contact Information' : 'দাপ্তরিক বার্তা কক্ষ ও যোগাযোগ তথ্য'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Office Physical Address (Bangla)' : 'কার্যালয়ের ঠিকানা (বাংলা)'}
                </label>
                <textarea
                  rows={2}
                  value={footer.contactAddressBn || ''}
                  onChange={(e) => setFooter((p) => ({ ...p, contactAddressBn: e.target.value, addressBn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Office Physical Address (English)' : 'কার্যালয়ের ঠিকানা (ইংরেজি)'}
                </label>
                <textarea
                  rows={2}
                  value={footer.contactAddressEn || ''}
                  onChange={(e) => setFooter((p) => ({ ...p, contactAddressEn: e.target.value, addressEn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Official Editorial Email' : 'দাপ্তরিক সম্পাদকীয় ইমেইল'}
                </label>
                <input
                  type="email"
                  value={footer.contactEmail || footer.emailEn || ''}
                  onChange={(e) => setFooter((p) => ({ ...p, contactEmail: e.target.value, emailEn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Emergency Phone / Hotline' : 'জরুরি হটলাইন নম্বর'}
                </label>
                <input
                  type="text"
                  value={footer.contactPhone || footer.phoneEn || ''}
                  onChange={(e) => setFooter((p) => ({ ...p, contactPhone: e.target.value, phoneEn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-tabular"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Newsroom Hours (Bangla)' : 'অফিস সময় (বাংলা)'}
                </label>
                <input
                  type="text"
                  value={footer.hoursBn || ''}
                  onChange={(e) => setFooter((p) => ({ ...p, hoursBn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Newsroom Hours (English)' : 'অফিস সময় (ইংরেজি)'}
                </label>
                <input
                  type="text"
                  value={footer.hoursEn || ''}
                  onChange={(e) => setFooter((p) => ({ ...p, hoursEn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB E: ABOUT US MANAGEMENT */}
      {activeSubTab === 'about' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              {isEn ? 'About Us Content Management' : 'আমাদের সম্পর্কে পাতা ব্যবস্থাপনা'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'About Us Title (Bangla)' : 'শিরোনাম (বাংলা)'}
                </label>
                <input
                  type="text"
                  value={aboutTitleBn}
                  onChange={(e) => setAboutTitleBn(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'About Us Title (English)' : 'শিরোনাম (ইংরেজি)'}
                </label>
                <input
                  type="text"
                  value={aboutTitleEn}
                  onChange={(e) => setAboutTitleEn(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Editorial Lead Statement (Bangla)' : 'মূল বিবৃতি (বাংলা)'}
                </label>
                <textarea
                  rows={2}
                  value={aboutLeadBn}
                  onChange={(e) => setAboutLeadBn(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Editorial Lead Statement (English)' : 'মূল বিবৃতি (ইংরেজি)'}
                </label>
                <textarea
                  rows={2}
                  value={aboutLeadEn}
                  onChange={(e) => setAboutLeadEn(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Full Body Content (Bangla)' : 'বিস্তারিত তথ্য (বাংলা)'}
                </label>
                <textarea
                  rows={6}
                  value={aboutContentBn}
                  onChange={(e) => setAboutContentBn(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Full Body Content (English)' : 'বিস্তারিত তথ্য (ইংরেজি)'}
                </label>
                <textarea
                  rows={6}
                  value={aboutContentEn}
                  onChange={(e) => setAboutContentEn(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB F: FOOTER MANAGEMENT */}
      {activeSubTab === 'footer' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isEn ? 'Footer Copyright & Texts' : 'কপিরাইট ও প্রাতিষ্ঠানিক বিবরণ'}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Copyright Text (Bangla)' : 'কপিরাইট (বাংলা)'}
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
                  {isEn ? 'Copyright Text (English)' : 'কপিরাইট (ইংরেজি)'}
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
                  {isEn ? 'Footer About Summary (Bangla)' : 'সংক্ষিপ্ত প্রাতিষ্ঠানিক বিবরণ (বাংলা)'}
                </label>
                <textarea
                  rows={2}
                  value={footer.aboutTextBn}
                  onChange={(e) => setFooter((p) => ({ ...p, aboutTextBn: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                {isEn ? 'Social Media Profile Links' : 'সোশ্যাল মিডিয়া প্রোফাইল লিংক'}
              </h3>

              {['facebook', 'twitter', 'youtube', 'telegram', 'whatsapp', 'linkedin'].map((platform) => (
                <div key={platform}>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5 capitalize">
                    {platform}
                  </label>
                  <input
                    type="text"
                    value={(footer.socialLinks as any)?.[platform] || ''}
                    onChange={(e) =>
                      setFooter((p) => ({
                        ...p,
                        socialLinks: { ...p.socialLinks, [platform]: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB G: GENERAL SETTINGS */}
      {activeSubTab === 'general' && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {isEn ? 'General Identity & Netlify Domain' : 'ওয়েবসাইট পরিচিতি ও নেটলিফাই ডোমেইন'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Site Name (Bangla)' : 'সাইটের নাম (বাংলা)'}
              </label>
              <input
                type="text"
                value={general.siteNameBn}
                onChange={(e) => setGeneral((p) => ({ ...p, siteNameBn: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Site Name (English)' : 'সাইটের নাম (ইংরেজি)'}
              </label>
              <input
                type="text"
                value={general.siteNameEn}
                onChange={(e) => setGeneral((p) => ({ ...p, siteNameEn: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Canonical Website Domain (Netlify)' : 'ক্যানোনিকাল নেটলিফাই ডোমেইন'}
              </label>
              <input
                type="url"
                value={general.canonicalDomain}
                onChange={(e) => setGeneral((p) => ({ ...p, canonicalDomain: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Google AdSense Publisher ID' : 'গুগল অ্যাডসেন্স পাবলিশার আইডি'}
              </label>
              <input
                type="text"
                value={general.adsensePublisherId}
                onChange={(e) => setGeneral((p) => ({ ...p, adsensePublisherId: e.target.value }))}
                placeholder="pub-0000000000000000"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
