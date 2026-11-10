import React, { useState } from 'react';
import {
  HomepageSection,
  HomepageSectionType,
  CustomCategory,
  Language,
} from '../../types/news';
import { NumberStepControl } from '../common/NumberStepControl';
import { DEFAULT_HOMEPAGE_SECTIONS } from '../../data/customizationDefaults';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Sliders,
  Trash2,
} from 'lucide-react';

interface HomepageBuilderProps {
  lang: Language;
  sections: HomepageSection[];
  categories: CustomCategory[];
  onSaveSections: (sections: HomepageSection[]) => void;
}

export const HomepageBuilder: React.FC<HomepageBuilderProps> = ({
  lang,
  sections,
  categories,
  onSaveSections,
}) => {
  const isEn = lang === 'en';
  const [localSections, setLocalSections] = useState<HomepageSection[]>(
    sections.length > 0 ? sections : DEFAULT_HOMEPAGE_SECTIONS
  );
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  // New section modal / form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitleBn, setNewTitleBn] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newType, setNewType] = useState<HomepageSectionType>('category_spotlight');
  const [newCategory, setNewCategory] = useState<string>(categories[0]?.id || 'army');
  const [newLayout, setNewLayout] = useState<'grid_4' | 'grid_3' | 'lead_with_sidebar' | 'carousel' | 'list_compact' | 'ticker'>('grid_4');

  const handleSave = () => {
    onSaveSections(localSections);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm(isEn ? 'Reset Homepage sections to system defaults?' : 'হোমপেজ সেকশনসমূহ ডিফল্ট মানে রিসেট করবেন?')) {
      setLocalSections(DEFAULT_HOMEPAGE_SECTIONS);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const list = [...localSections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setLocalSections(list.map((sec, idx) => ({ ...sec, order: idx + 1 })));
  };

  const handleToggle = (id: string) => {
    setLocalSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, isEnabled: !sec.isEnabled } : sec))
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm(isEn ? 'Delete this homepage section?' : 'এই সেকশনটি মুছে ফেলতে চান?')) {
      setLocalSections((prev) => prev.filter((sec) => sec.id !== id));
      if (editingSectionId === id) setEditingSectionId(null);
    }
  };

  const handleDuplicate = (section: HomepageSection) => {
    const duplicate: HomepageSection = {
      ...section,
      id: `sec-${Date.now()}`,
      titleBn: `${section.titleBn} (কপি)`,
      titleEn: `${section.titleEn} (Copy)`,
      order: localSections.length + 1,
    };
    setLocalSections((prev) => [...prev, duplicate]);
  };

  const handleAddNewSection = () => {
    if (!newTitleBn.trim() && !newTitleEn.trim()) return;
    const newSec: HomepageSection = {
      id: `sec-${Date.now()}`,
      titleBn: newTitleBn.trim() || newTitleEn.trim(),
      titleEn: newTitleEn.trim() || newTitleBn.trim(),
      type: newType,
      categorySlug: newCategory,
      layout: newLayout,
      itemCount: 4,
      isEnabled: true,
      order: localSections.length + 1,
    };
    setLocalSections((prev) => [...prev, newSec]);
    setIsAddingNew(false);
    setNewTitleBn('');
    setNewTitleEn('');
  };

  const handleUpdateSection = (id: string, updates: Partial<HomepageSection>) => {
    setLocalSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec))
    );
  };

  const editingSection = localSections.find((s) => s.id === editingSectionId);

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            {isEn ? 'Homepage Visual Section Builder' : 'হোমপেজ ভিজ্যুয়াল সেকশন বিল্ডার'}
          </h3>
          <p className="text-xs text-slate-500">
            {isEn
              ? 'Control homepage layout, order of news blocks, category spotlights, and notices.'
              : 'হোমপেজের ব্লকসমূহের ক্রম, লেআউট, ক্যাটাগরি স্পটলাইট ও ভিজ্যুয়াল স্টাইল নিয়ন্ত্রণ করুন।'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isEn ? 'Reset Sections' : 'ডিফল্ট সেকশন'}
          </button>
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            {isEn ? 'Add Section' : 'নতুন সেকশন যোগ করুন'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Save className="w-4 h-4" />
            {isEn ? 'Save Sections' : 'সেকশন সংরক্ষণ করুন'}
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          {isEn
            ? 'Homepage sections updated and saved permanently to Firebase Firestore.'
            : 'হোমপেজ সেকশনসমূহ ফায়ারবেস ক্লাউড ফায়ারস্টোরে স্থায়ীভাবে সংরক্ষিত হয়েছে।'}
        </div>
      )}

      {/* Add new section modal / inline box */}
      {isAddingNew && (
        <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">
              {isEn ? 'Configure New Homepage Section' : 'নতুন হোমপেজ সেকশন কনফিগার করুন'}
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Section Title (Bangla)' : 'সেকশন শিরোনাম (বাংলা)'} *
              </label>
              <input
                type="text"
                value={newTitleBn}
                onChange={(e) => setNewTitleBn(e.target.value)}
                placeholder="যেমন: বাংলাদেশ নৌবাহিনী সংবাদ"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Section Title (English)' : 'সেকশন শিরোনাম (ইংরেজি)'} *
              </label>
              <input
                type="text"
                value={newTitleEn}
                onChange={(e) => setNewTitleEn(e.target.value)}
                placeholder="e.g. Bangladesh Navy Reports"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Section Block Type' : 'সেকশনের ধরণ'}
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as HomepageSectionType)}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium"
              >
                <option value="category_spotlight">{isEn ? 'Category Spotlight' : 'ক্যাটাগরি স্পটলাইট'}</option>
                <option value="lead_featured">{isEn ? 'Lead Story & Featured Grid' : 'প্রধান সংবাদ ও ফিচারড গ্রিড'}</option>
                <option value="breaking_ticker">{isEn ? 'Breaking News Ticker' : 'ব্রেকিং নিউজ টিকার'}</option>
                <option value="latest_grid">{isEn ? 'Latest News Grid' : 'সর্বশেষ সংবাদ গ্রিড'}</option>
                <option value="circulars_board">{isEn ? 'Recruitment Circulars Board' : 'নিয়োগ বিজ্ঞপ্তি বোর্ড'}</option>
                <option value="popular_opinion">{isEn ? 'Popular & Analysis' : 'জনপ্রিয় ও সামরিক বিশ্লেষণ'}</option>
                <option value="notices_alert">{isEn ? 'Emergency Notice Bar' : 'জরুরি নোটিশ বার'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Select Category Filter' : 'ক্যাটাগরি নির্বাচন করুন'}
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="all">{isEn ? 'All Categories (Mixed)' : 'সব ক্যাটাগরি'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug || c.id}>
                    {isEn ? c.nameEn : c.nameBn} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Layout Grid Template' : 'লেআউট গ্রিড টেমপ্লেট'}
              </label>
              <select
                value={newLayout}
                onChange={(e) => setNewLayout(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium"
              >
                <option value="grid_4">{isEn ? '4 Columns Grid' : '৪ কলাম গ্রিড'}</option>
                <option value="grid_3">{isEn ? '3 Columns Grid' : '৩ কলাম গ্রিড'}</option>
                <option value="lead_with_sidebar">{isEn ? 'Lead Story + Sidebar' : 'বড় লিড স্টোরি + সাইডবার'}</option>
                <option value="list_compact">{isEn ? 'Compact List Layout' : 'কম্প্যাক্ট তালিকা'}</option>
                <option value="ticker">{isEn ? 'Horizontal Marquee / Ticker' : 'অনুভূমিক টিকার'}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              {isEn ? 'Cancel' : 'বাতিল'}
            </button>
            <button
              type="button"
              onClick={handleAddNewSection}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
            >
              {isEn ? 'Create Section' : 'সেকশন তৈরি করুন'}
            </button>
          </div>
        </div>
      )}

      {/* Sections list */}
      <div className="space-y-3">
        {localSections.map((sec, idx) => (
          <div
            key={sec.id}
            className={`p-4 rounded-xl border transition ${
              sec.isEnabled
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isEn ? sec.titleEn : sec.titleBn}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {sec.type}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {sec.layout}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {isEn ? `Category: ${sec.categorySlug || 'All'} · Showing ${sec.itemCount || 4} items` : `ক্যাটাগরি: ${sec.categorySlug || 'সব'} · প্রদর্শিত হবে ${sec.itemCount || 4} টি সংবাদ`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Enabled Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(sec.id)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                    sec.isEnabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {sec.isEnabled ? (isEn ? 'Active' : 'সক্রিয়') : (isEn ? 'Disabled' : 'বন্ধ')}
                </button>

                {/* Move Up/Down */}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  type="button"
                  disabled={idx === localSections.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>

                {/* Edit inline toggle */}
                <button
                  type="button"
                  onClick={() => setEditingSectionId(editingSectionId === sec.id ? null : sec.id)}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  title="Edit Settings"
                >
                  <Sliders className="w-4 h-4" />
                </button>

                {/* Duplicate */}
                <button
                  type="button"
                  onClick={() => handleDuplicate(sec)}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  title="Duplicate Section"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(sec.id)}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600"
                  title="Delete Section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inline Editor Drawer if active */}
            {editingSectionId === sec.id && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Title (Bangla)' : 'শিরোনাম (বাংলা)'}
                  </label>
                  <input
                    type="text"
                    value={sec.titleBn}
                    onChange={(e) => handleUpdateSection(sec.id, { titleBn: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Title (English)' : 'শিরোনাম (ইংরেজি)'}
                  </label>
                  <input
                    type="text"
                    value={sec.titleEn}
                    onChange={(e) => handleUpdateSection(sec.id, { titleEn: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Layout Grid' : 'লেআউট'}
                  </label>
                  <select
                    value={sec.layout}
                    onChange={(e) => handleUpdateSection(sec.id, { layout: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    <option value="grid_4">{isEn ? '4 Columns Grid' : '৪ কলাম গ্রিড'}</option>
                    <option value="grid_3">{isEn ? '3 Columns Grid' : '৩ কলাম গ্রিড'}</option>
                    <option value="lead_with_sidebar">{isEn ? 'Lead Story + Sidebar' : 'বড় লিড স্টোরি + সাইডবার'}</option>
                    <option value="list_compact">{isEn ? 'Compact List Layout' : 'কম্প্যাক্ট তালিকা'}</option>
                    <option value="ticker">{isEn ? 'Horizontal Marquee / Ticker' : 'টিকার'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Category Filter' : 'ক্যাটাগরি ফিল্টার'}
                  </label>
                  <select
                    value={sec.categorySlug || 'all'}
                    onChange={(e) => handleUpdateSection(sec.id, { categorySlug: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    <option value="all">{isEn ? 'All Categories (Mixed)' : 'সব ক্যাটাগরি'}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug || c.id}>
                        {isEn ? c.nameEn : c.nameBn} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <NumberStepControl
                    label={isEn ? 'Number of Items to Show' : 'প্রদর্শিত সংবাদের সংখ্যা'}
                    value={sec.itemCount || 4}
                    onChange={(val) => handleUpdateSection(sec.id, { itemCount: val })}
                    min={1}
                    max={20}
                    step={1}
                    unit=""
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setEditingSectionId(null)}
                    className="w-full px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold"
                  >
                    {isEn ? 'Close Settings' : 'সম্পন্ন'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
