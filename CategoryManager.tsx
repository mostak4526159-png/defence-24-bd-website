import React, { useState } from 'react';
import {
  CustomCategory,
  JobCircular,
  Language,
  NewsArticle,
} from '../../types/news';
import { NumberStepControl } from '../common/NumberStepControl';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../data/customizationDefaults';
import {
  AlertTriangle,
  Check,
  FolderPlus,
  Plus,
  RotateCcw,
  Save,
  Tag,
  Trash2,
} from 'lucide-react';

interface CategoryManagerProps {
  lang: Language;
  categories: CustomCategory[];
  articles: NewsArticle[];
  circulars?: JobCircular[];
  onSaveCategories: (categories: CustomCategory[]) => void;
  onDeleteCategory: (categoryId: string, reassignToCategory?: string) => Promise<void>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  lang,
  categories,
  articles,
  circulars = [],
  onSaveCategories,
  onDeleteCategory,
}) => {
  const isEn = lang === 'en';
  const [localCategories, setLocalCategories] = useState<CustomCategory[]>(
    categories.length > 0 ? categories : DEFAULT_CUSTOM_CATEGORIES
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  // New Category State
  const [isAdding, setIsAdding] = useState(false);
  const [newNameBn, setNewNameBn] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDescBn, setNewDescBn] = useState('');
  const [newDescEn, setNewDescEn] = useState('');
  const [newIcon, setNewIcon] = useState('Shield');

  // Deletion modal state for safe deletion confirmation & reassignment
  const [pendingDeleteCat, setPendingDeleteCat] = useState<CustomCategory | null>(null);
  const [reassignCategorySlug, setReassignCategorySlug] = useState<string>('army');
  const [isDeleting, setIsDeleting] = useState(false);

  const getArticleCountForCategory = (catIdOrSlug: string): number => {
    return articles.filter(
      (a) => a.category === catIdOrSlug || (a.category as any) === catIdOrSlug
    ).length;
  };

  const getCircularCountForCategory = (catIdOrSlug: string): number => {
    return circulars.filter(
      (c) => c.category === catIdOrSlug || (c.category as any) === catIdOrSlug
    ).length;
  };

  const handleSave = () => {
    onSaveCategories(localCategories);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        isEn
          ? 'Reset categories to default 15 defense categories?'
          : 'ক্যাটাগরি তালিকা ডিফল্ট ১৫টি সামরিক ক্যাটাগরিতে রিসেট করবেন?'
      )
    ) {
      setLocalCategories(DEFAULT_CUSTOM_CATEGORIES);
    }
  };

  const handleAddCategory = () => {
    if (!newNameBn.trim() && !newNameEn.trim()) return;
    const generatedSlug =
      newSlug.trim() ||
      (newNameEn.trim()
        ? newNameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
        : `cat_${Date.now()}`);

    const newCat: CustomCategory = {
      id: generatedSlug,
      nameBn: newNameBn.trim() || newNameEn.trim(),
      nameEn: newNameEn.trim() || newNameBn.trim(),
      slug: generatedSlug,
      descriptionBn: newDescBn.trim(),
      descriptionEn: newDescEn.trim(),
      icon: newIcon,
      iconKey: newIcon,
      order: localCategories.length + 1,
      isEnabled: true,
      isActive: true,
    };

    setLocalCategories((prev) => [...prev, newCat]);
    setIsAdding(false);
    setNewNameBn('');
    setNewNameEn('');
    setNewSlug('');
    setNewDescBn('');
    setNewDescEn('');
  };

  const handleUpdateCategory = (id: string, updates: Partial<CustomCategory>) => {
    setLocalCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleToggleActive = (id: string) => {
    setLocalCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const current = c.isEnabled ?? c.isActive ?? true;
        return { ...c, isEnabled: !current, isActive: !current };
      })
    );
  };

  const initiateDelete = (cat: CustomCategory) => {
    const otherCat = localCategories.find((c) => c.id !== cat.id);
    setReassignCategorySlug(otherCat?.slug || otherCat?.id || 'army');
    setPendingDeleteCat(cat);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteCat) return;
    setIsDeleting(true);
    try {
      await onDeleteCategory(pendingDeleteCat.id, reassignCategorySlug);
      setLocalCategories((prev) => prev.filter((c) => c.id !== pendingDeleteCat.id));
      setPendingDeleteCat(null);
    } catch (err) {
      console.error('Delete category error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            {isEn ? 'Defense News Categories Manager' : 'ডিফেন্স সংবাদ ক্যাটাগরি ব্যবস্থাপনা'}
          </h3>
          <p className="text-xs text-slate-500">
            {isEn
              ? 'Create unlimited news categories, edit slugs, descriptions, order, and manage article allocations safely.'
              : 'সীমাহীন সংবাদ ক্যাটাগরি তৈরি করুন, স্লাগ ও বর্ণনা পরিবর্তন করুন এবং সুরক্ষিতভাবে সংরক্ষণ করুন।'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isEn ? 'Reset to 15 Categories' : '১৫টি ডিফল্ট ক্যাটাগরি'}
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            {isEn ? 'Add New Category' : 'নতুন ক্যাটাগরি তৈরি করুন'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Save className="w-4 h-4" />
            {isEn ? 'Save Categories' : 'ক্যাটাগরি সংরক্ষণ করুন'}
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          {isEn
            ? 'Categories updated and saved permanently to Cloud Firestore.'
            : 'ক্যাটাগরি তালিকা ফায়ারবেস ক্লাউড ফায়ারস্টোরে স্থায়ীভাবে সংরক্ষিত হয়েছে।'}
        </div>
      )}

      {/* Add new category form */}
      {isAdding && (
        <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4" />
              {isEn ? 'Create New Category' : 'নতুন সংবাদ ক্যাটাগরি যোগ করুন'}
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
                {isEn ? 'Category Name (Bangla)' : 'ক্যাটাগরির নাম (বাংলা)'} *
              </label>
              <input
                type="text"
                value={newNameBn}
                onChange={(e) => setNewNameBn(e.target.value)}
                placeholder="যেমন: সাইবার নিরাপত্তা"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Category Name (English)' : 'ক্যাটাগরির নাম (ইংরেজি)'} *
              </label>
              <input
                type="text"
                value={newNameEn}
                onChange={(e) => setNewNameEn(e.target.value)}
                placeholder="e.g. Cyber Security"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'URL Slug (unique identifier)' : 'ইউআরএল স্লাগ (ইংরেজি আইডি)'}
              </label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="cyber_security"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Description (Bangla)' : 'সংক্ষিপ্ত বিবরণ (বাংলা)'}
              </label>
              <input
                type="text"
                value={newDescBn}
                onChange={(e) => setNewDescBn(e.target.value)}
                placeholder="ডিফেন্স সাইবার কমান্ড ও ডেটা নিরাপত্তা আপডেট..."
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Description (English)' : 'সংক্ষিপ্ত বিবরণ (ইংরেজি)'}
              </label>
              <input
                type="text"
                value={newDescEn}
                onChange={(e) => setNewDescEn(e.target.value)}
                placeholder="Defense cyber command & digital warfare updates..."
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
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
              onClick={handleAddCategory}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
            >
              {isEn ? 'Add Category' : 'ক্যাটাগরি যুক্ত করুন'}
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">{isEn ? 'Name (Bangla)' : 'বাংলা নাম'}</th>
              <th className="py-2.5 px-3">{isEn ? 'Name (English)' : 'ইংরেজি নাম'}</th>
              <th className="py-2.5 px-3">{isEn ? 'Slug (ID)' : 'স্লাগ আইডি'}</th>
              <th className="py-2.5 px-3 text-center">{isEn ? 'Articles Count' : 'সংবাদ সংখ্যা'}</th>
              <th className="py-2.5 px-3 text-center">{isEn ? 'Status' : 'অবস্থা'}</th>
              <th className="py-2.5 px-3 text-center">{isEn ? 'Order' : 'ক্রম'}</th>
              <th className="py-2.5 px-3 text-right">{isEn ? 'Actions' : 'অ্যাকশন'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {localCategories.map((cat, idx) => {
              const artCount = getArticleCountForCategory(cat.slug || cat.id);
              const isEdit = editingId === cat.id;

              return (
                <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3">
                    {isEdit ? (
                      <input
                        type="text"
                        value={cat.nameBn}
                        onChange={(e) => handleUpdateCategory(cat.id, { nameBn: e.target.value })}
                        className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    ) : (
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {cat.nameBn}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {isEdit ? (
                      <input
                        type="text"
                        value={cat.nameEn}
                        onChange={(e) => handleUpdateCategory(cat.id, { nameEn: e.target.value })}
                        className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300">{cat.nameEn}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                    {cat.slug || cat.id}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        artCount > 0
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {artCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(cat.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (cat.isEnabled ?? cat.isActive ?? true)
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {(cat.isEnabled ?? cat.isActive ?? true)
                        ? isEn
                          ? 'Active'
                          : 'সক্রিয়'
                        : isEn
                        ? 'Disabled'
                        : 'বন্ধ'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {isEdit ? (
                      <input
                        type="number"
                        value={cat.order || idx + 1}
                        onChange={(e) =>
                          handleUpdateCategory(cat.id, { order: parseInt(e.target.value) || 1 })
                        }
                        className="w-14 text-center px-1 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    ) : (
                      <span className="text-slate-500 font-mono">{cat.order || idx + 1}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(isEdit ? null : cat.id)}
                        className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded"
                      >
                        {isEdit ? (isEn ? 'Done' : 'সম্পন্ন') : (isEn ? 'Edit' : 'সম্পাদনা')}
                      </button>
                      <button
                        type="button"
                        onClick={() => initiateDelete(cat)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                        title={isEn ? 'Delete Category' : 'ক্যাটাগরি মুছুন'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Zero Silent Deletion - Safe Confirmation Modal */}
      {pendingDeleteCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/60 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEn ? 'Safe Category Deletion' : 'ক্যাটাগরি মুছে ফেলার সুরক্ষা বার্তা'}
              </h3>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p>
                {isEn
                  ? `You are about to delete category: `
                  : `আপনি নিচের ক্যাটাগরি মুছে ফেলতে যাচ্ছেন: `}
                <strong>{isEn ? pendingDeleteCat.nameEn : pendingDeleteCat.nameBn}</strong> (
                <code>{pendingDeleteCat.slug || pendingDeleteCat.id}</code>)
              </p>

              {(() => {
                const targetKey = pendingDeleteCat.slug || pendingDeleteCat.id;
                const artCount = getArticleCountForCategory(targetKey);
                const circCount = getCircularCountForCategory(targetKey);
                const hasLinkedContent = artCount > 0 || circCount > 0;
                const otherCategories = localCategories.filter((c) => c.id !== pendingDeleteCat.id);

                return (
                  <>
                    {hasLinkedContent ? (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 space-y-2">
                        <p className="font-bold">
                          ⚠️{' '}
                          {isEn
                            ? `Warning: ${artCount} published article(s) and ${circCount} recruitment circular(s) are linked to this category!`
                            : `সতর্কতা: এই ক্যাটাগরিতে ${artCount} টি প্রকাশিত সংবাদ এবং ${circCount} টি নিয়োগ বিজ্ঞপ্তি যুক্ত রয়েছে!`}
                        </p>
                        <p className="text-[11px] leading-relaxed">
                          {isEn
                            ? 'To prevent orphaned or broken records, select a target category to safely reassign all associated news and recruitment circulars:'
                            : 'কোনো সংবাদ বা নিয়োগ বিজ্ঞপ্তি যাতে হারিয়ে না যায়, সেজন্য সংশ্লিষ্ট সকল কন্টেন্ট নিচের ক্যাটাগরিতে স্থানান্তর (Reassign) করুন:'}
                        </p>

                        <div>
                          <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-100 mb-1">
                            {isEn ? 'Reassign All Content To:' : 'কন্টেন্ট স্থানান্তরের লক্ষ্য ক্যাটাগরি:'}
                          </label>
                          <select
                            value={reassignCategorySlug}
                            onChange={(e) => setReassignCategorySlug(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-700 rounded font-medium text-slate-900 dark:text-white"
                          >
                            {otherCategories.map((c) => (
                              <option key={c.id} value={c.slug || c.id}>
                                {isEn ? c.nameEn : c.nameBn} ({c.slug || c.id})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500">
                        {isEn
                          ? 'No articles or circulars are currently linked to this category.'
                          : 'এই ক্যাটাগরিতে বর্তমানে কোনো সংবাদ বা সার্কুলার যুক্ত নেই।'}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPendingDeleteCat(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {isEn ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                {isDeleting
                  ? isEn
                    ? 'Deleting...'
                    : 'মুছে ফেলা হচ্ছে...'
                  : isEn
                  ? 'Confirm Safe Deletion'
                  : 'নিশ্চিত মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
