import React from 'react';
import {
  CustomCategory,
  ForceCategory,
  Language,
} from '../types/news';
import { CATEGORY_LABELS } from '../data/initialData';

interface CategoryBoxSectionProps {
  lang: Language;
  categories?: CustomCategory[];
  selectedCategory: string;
  onSelectCategory: (categorySlug: ForceCategory | string) => void;
}

// 6 Core Categories required for top navigation bar
const CORE_6_CATEGORIES: { slug: ForceCategory | string; en: string; bn: string }[] = [
  { slug: 'army', en: 'Bangladesh Army', bn: 'বাংলাদেশ সেনাবাহিনী' },
  { slug: 'navy', en: 'Bangladesh Navy', bn: 'বাংলাদেশ নৌবাহিনী' },
  { slug: 'airforce', en: 'Bangladesh Air Force', bn: 'বাংলাদেশ বিমান বাহিনী' },
  { slug: 'police', en: 'Bangladesh Police', bn: 'বাংলাদেশ পুলিশ' },
  { slug: 'ansar', en: 'Bangladesh Ansar', bn: 'বাংলাদেশ আনসার' },
  { slug: 'other_forces', en: 'Other Forces', bn: 'অন্যান্য বাহিনী' },
];

export const CategoryBoxSection: React.FC<CategoryBoxSectionProps> = ({
  lang,
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const isEn = lang === 'en';

  // Build the display list: prioritize the 6 core forces, or match custom category configurations
  const displayCategories = CORE_6_CATEGORIES.map((core) => {
    const customMatch = categories?.find(
      (c) => c.slug === core.slug || c.id === core.slug
    );
    if (customMatch) {
      return {
        slug: core.slug,
        name: isEn ? customMatch.nameEn : customMatch.nameBn,
      };
    }
    const labelMatch = CATEGORY_LABELS[core.slug as ForceCategory]?.[lang];
    return {
      slug: core.slug,
      name: labelMatch || (isEn ? core.en : core.bn),
    };
  });

  return (
    <nav
      aria-label={isEn ? 'Force Categories' : 'বাহিনী বিভাগসমূহ'}
      className="w-full bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-md p-1.5 sm:p-2 shadow-2xs"
    >
      {/* Compact Responsive Grid: 2 or 3 per row on Mobile, single row of 6 on Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 sm:gap-2">
        {displayCategories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;

          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              aria-pressed={isSelected}
              className={`h-9 sm:h-10 px-2 sm:px-2.5 rounded-md border text-xs sm:text-[13px] font-semibold flex items-center justify-center text-center leading-tight transition-colors duration-150 cursor-pointer select-none truncate ${
                isSelected
                  ? 'bg-[#0B1F3A] dark:bg-blue-600 text-white border-[#0B1F3A] dark:border-blue-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100/90 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-blue-700 dark:hover:text-blue-300'
              }`}
            >
              <span className="truncate">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
