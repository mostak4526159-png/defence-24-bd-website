import React, { useState } from 'react';
import { CustomPage, Language } from '../../types/news';
import { DEFAULT_CUSTOM_PAGES } from '../../data/customizationDefaults';
import {
  Check,
  FileCode,
  FilePlus,
  FileText,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';

interface PageManagerProps {
  lang: Language;
  pages: CustomPage[];
  onSavePages: (pages: CustomPage[]) => void;
  onDeletePage?: (pageId: string) => Promise<void>;
}

export const PageManager: React.FC<PageManagerProps> = ({
  lang,
  pages,
  onSavePages,
  onDeletePage,
}) => {
  const isEn = lang === 'en';
  const [localPages, setLocalPages] = useState<CustomPage[]>(() => {
    const base = pages.length > 0 ? [...pages] : [...DEFAULT_CUSTOM_PAGES];
    const hasCorrections = base.some(
      (p) => p.slug === 'corrections_policy' || p.slug === 'corrections-policy'
    );
    const defaultCorrections = DEFAULT_CUSTOM_PAGES.find(
      (p) => p.slug === 'corrections_policy'
    );
    if (!hasCorrections && defaultCorrections) {
      base.push(defaultCorrections);
    }
    return base;
  });
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  // New Page State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitleBn, setNewTitleBn] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newContentBn, setNewContentBn] = useState('');
  const [newContentEn, setNewContentEn] = useState('');

  const handleSave = () => {
    onSavePages(localPages);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleResetDefaults = () => {
    setLocalPages(DEFAULT_CUSTOM_PAGES);
  };

  const handleAddNewPage = () => {
    if (!newTitleBn.trim() && !newTitleEn.trim()) return;
    const slug =
      newSlug.trim() ||
      (newTitleEn.trim()
        ? newTitleEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : `page-${Date.now()}`);

    const newPage: CustomPage = {
      id: `page-${slug}`,
      slug,
      titleBn: newTitleBn.trim() || newTitleEn.trim(),
      titleEn: newTitleEn.trim() || newTitleBn.trim(),
      contentBn: newContentBn.trim(),
      contentEn: newContentEn.trim(),
      isPublished: true,
      updatedAtIso: new Date().toISOString(),
    };

    setLocalPages((prev) => [...prev, newPage]);
    setIsAdding(false);
    setNewTitleBn('');
    setNewTitleEn('');
    setNewSlug('');
    setNewContentBn('');
    setNewContentEn('');
  };

  const handleUpdatePage = (id: string, updates: Partial<CustomPage>) => {
    setLocalPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAtIso: new Date().toISOString() } : p))
    );
  };

  const handleTogglePublish = (id: string) => {
    setLocalPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPublished: !p.isPublished } : p))
    );
  };

  const handleDeletePage = async (id: string) => {
    setLocalPages((prev) => prev.filter((p) => p.id !== id));
    if (editingPageId === id) setEditingPageId(null);
    if (onDeletePage) {
      await onDeletePage(id);
    }
  };

  const editingPage = localPages.find((p) => p.id === editingPageId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {isEn ? 'Pages & Policy Documents Builder (All 7 Official Pages)' : 'পাতা ও নীতিমালা নির্মাতা (সকল ৭টি দাপ্তরিক পাতা)'}
          </h3>
          <p className="text-xs text-slate-500">
            {isEn
              ? 'Create and edit custom static pages, Google AdSense compliance policies, and editorial guidelines in Bengali and English.'
              : 'বাংলা ও ইংরেজি উভয় ভাষায় কাস্টম পাতা তৈরি ও সম্পাদনা করুন এবং Google AdSense কমপ্লায়েন্স ও সম্পাদকীয় নীতিমালা পরিচালনা করুন।'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isEn ? 'Reset to 7 Defaults' : 'ডিফল্ট ৭টি পাতা'}
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {isEn ? 'Add New Page' : 'নতুন পাতা তৈরি করুন'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isEn ? 'Save Pages' : 'পাতা সংরক্ষণ করুন'}
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          {isEn
            ? 'Pages updated and saved permanently to Cloud Firestore.'
            : 'পাতাসমূহ Cloud Firestore-এ স্থায়ীভাবে সংরক্ষিত হয়েছে।'}
        </div>
      )}

      {/* Add New Page Form */}
      {isAdding && (
        <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <FilePlus className="w-4 h-4" />
              {isEn ? 'Create New Web Page' : 'নতুন ওয়েব পেজ তৈরি করুন'}
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Page Title (Bangla)' : 'পেজের শিরোনাম (বাংলা)'} *
              </label>
              <input
                type="text"
                value={newTitleBn}
                onChange={(e) => setNewTitleBn(e.target.value)}
                placeholder="যেমন: আর্কাইভ নির্দেশিকা"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Page Title (English)' : 'পেজের শিরোনাম (ইংরেজি)'} *
              </label>
              <input
                type="text"
                value={newTitleEn}
                onChange={(e) => setNewTitleEn(e.target.value)}
                placeholder="e.g. Archive Guidelines"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'URL Slug (e.g. /?page=slug)' : 'ইউআরএল স্লাগ'}
              </label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="archive-guidelines"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Content Paragraphs (Bangla - double enter for new paragraph)' : 'মূল বিষয়বস্তু (বাংলা)'}
              </label>
              <textarea
                rows={5}
                value={newContentBn}
                onChange={(e) => setNewContentBn(e.target.value)}
                placeholder="পেজের বিস্তারিত বিবরণ..."
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Content Paragraphs (English - double enter for new paragraph)' : 'মূল বিষয়বস্তু (ইংরেজি)'}
              </label>
              <textarea
                rows={5}
                value={newContentEn}
                onChange={(e) => setNewContentEn(e.target.value)}
                placeholder="Detailed page content..."
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              {isEn ? 'Cancel' : 'বাতিল'}
            </button>
            <button
              type="button"
              onClick={handleAddNewPage}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
            >
              {isEn ? 'Create Page' : 'পেজ তৈরি করুন'}
            </button>
          </div>
        </div>
      )}

      {/* Pages Table */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">{isEn ? 'Title (Bangla)' : 'শিরোনাম (বাংলা)'}</th>
              <th className="py-2.5 px-3">{isEn ? 'Title (English)' : 'শিরোনাম (ইংরেজি)'}</th>
              <th className="py-2.5 px-3">{isEn ? 'Slug Route' : 'রুট স্লাগ'}</th>
              <th className="py-2.5 px-3 text-center">{isEn ? 'Status' : 'অবস্থা'}</th>
              <th className="py-2.5 px-3 text-right">{isEn ? 'Actions' : 'অ্যাকশন'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {localPages.map((page, idx) => (
              <tr key={page.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                  {idx + 1}
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                  {page.titleBn}
                </td>
                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                  {page.titleEn}
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                  /?page={page.slug}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(page.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      page.isPublished
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {page.isPublished ? (isEn ? 'Published' : 'প্রকাশিত') : (isEn ? 'Draft' : 'খসড়া')}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingPageId(editingPageId === page.id ? null : page.id)}
                      className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded"
                    >
                      {editingPageId === page.id ? (isEn ? 'Done' : 'সম্পন্ন') : (isEn ? 'Edit' : 'সম্পাদনা')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePage(page.id)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                      title={isEn ? 'Delete Page' : 'পেজ মুছুন'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editing drawer if active */}
      {editingPage && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isEn ? `Editing: ${editingPage.titleEn}` : `সম্পাদনা: ${editingPage.titleBn}`}
            </h4>
            <button
              type="button"
              onClick={() => setEditingPageId(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Page Title (Bangla)' : 'পেজের শিরোনাম (বাংলা)'}
              </label>
              <input
                type="text"
                value={editingPage.titleBn}
                onChange={(e) => handleUpdatePage(editingPage.id, { titleBn: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Page Title (English)' : 'পেজের শিরোনাম (ইংরেজি)'}
              </label>
              <input
                type="text"
                value={editingPage.titleEn}
                onChange={(e) => handleUpdatePage(editingPage.id, { titleEn: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Paragraphs (Bangla - double enter separates paragraphs)' : 'বিষয়বস্তু (বাংলা)'}
              </label>
              <textarea
                rows={8}
                value={
                  Array.isArray(editingPage.contentBn)
                    ? editingPage.contentBn.join('\n\n')
                    : editingPage.contentBn || ''
                }
                onChange={(e) =>
                  handleUpdatePage(editingPage.id, {
                    contentBn: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Paragraphs (English - double enter separates paragraphs)' : 'বিষয়বস্তু (ইংরেজি)'}
              </label>
              <textarea
                rows={8}
                value={
                  Array.isArray(editingPage.contentEn)
                    ? editingPage.contentEn.join('\n\n')
                    : editingPage.contentEn || ''
                }
                onChange={(e) =>
                  handleUpdatePage(editingPage.id, {
                    contentEn: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEditingPageId(null)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
            >
              {isEn ? 'Close & Apply' : 'সম্পন্ন ও প্রয়োগ করুন'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
