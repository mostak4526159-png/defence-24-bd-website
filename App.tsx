/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivePage,
  CustomCategory,
  CustomPage,
  ForceCategory,
  HomepageSection,
  JobCircular,
  Language,
  MediaItem,
  NewsArticle,
  PortalNotice,
  PortalSettings,
  ThemeMode,
} from './types/news.ts';
import {
  ALL_15_CATEGORIES,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  DEFAULT_PORTAL_SETTINGS,
  getLocalizedOrganization,
  INITIAL_ARTICLES,
  INITIAL_CIRCULARS,
  INITIAL_NOTICES,
} from './data/initialData.ts';
import {
  DEFAULT_COLOR_SETTINGS,
  DEFAULT_CUSTOM_CATEGORIES,
  DEFAULT_CUSTOM_PAGES,
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_TYPOGRAPHY_SETTINGS,
  INITIAL_MEDIA_ITEMS,
} from './data/customizationDefaults.ts';
import { applyDynamicTheme } from './lib/themeApplier.ts';
import { LEGAL_PAGES, UI_STRINGS } from './data/legalPagesData.ts';
import { EditorialMedia } from './components/EditorialMedia.tsx';
const AdminSection = React.lazy(() =>
  import('./components/AdminSection.tsx').then((m) => ({ default: m.AdminSection }))
);
import { PublicSubmitNews } from './components/PublicSubmitNews.tsx';
import { CategoryBoxSection } from './components/CategoryBoxSection.tsx';
import {
  fetchPaginatedPublishedArticlesFromFirestore,
  subscribeToPublishedFirestorePortal,
} from './lib/firebase.ts';
import {
  getArticlePath,
  getCategoryPath,
  getHreflangUrls,
  getPagePath,
  parseRouteFromLocation,
} from './lib/routing.ts';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Briefcase,
  Check,
  Clock,
  FileText,
  Lock,
  Menu,
  Moon,
  Search,
  Send,
  Sun,
  X,
} from 'lucide-react';

const NEWS_PAGE_SIZE = 10;

const STORAGE_KEYS = {
  LANG: 'defence24bd_lang_v3',
  THEME: 'defence24bd_theme_v2',
  ARTICLES: 'defence24bd_articles_v2',
  CIRCULARS: 'defence24bd_circulars_v2',
  NOTICES: 'defence24bd_notices_v2',
  SETTINGS: 'defence24bd_settings_v3',
};

const SEARCH_SUGGESTIONS: Record<Language, string[]> = {
  en: ['BMA Long Course', 'Peacekeeping', 'Hydrographic Survey', 'Flight Simulator', 'BGB Radar', 'ISSB Guide'],
  bn: ['বিএমএ দীর্ঘমেয়াদী কোর্স', 'শান্তিরক্ষা মিশন', 'নৌবাহিনী জরিপ', 'ফ্লাইট সিমুলেটর', 'বিজিবি টাওয়ার', 'আইএসএসবি প্রস্তুতি'],
};

export default function App() {
  // Phase 1: Default Bangla Language ('bn') with URL query/prefix & localStorage persistence
  const [lang, setLang] = useState<Language>(() => {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const urlLang = params.get('lang')?.trim().toLowerCase();
      if (urlLang === 'en' || urlLang === 'bn') return urlLang;
      const firstSeg = (window.location.pathname || '/').split('/').filter(Boolean)[0]?.toLowerCase();
      if (firstSeg === 'en' || firstSeg === 'bn') return firstSeg;
      const saved = localStorage.getItem(STORAGE_KEYS.LANG);
      if (saved === 'en' || saved === 'bn') return saved;
      return 'bn';
    } catch {
      return 'bn';
    }
  });

  // Phase 2: Dark Mode & Light Mode with localStorage persistence
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [articles, setArticles] = useState<NewsArticle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARTICLES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_ARTICLES;
  });

  const [circulars, setCirculars] = useState<JobCircular[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CIRCULARS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_CIRCULARS;
  });

  const [notices, setNotices] = useState<PortalNotice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_NOTICES;
  });

  const [settings, setSettings] = useState<PortalSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...DEFAULT_PORTAL_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_PORTAL_SETTINGS;
  });

  // Complete Customization State (Categories, Pages, Homepage Sections, Media)
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(() => {
    try {
      const saved = localStorage.getItem('defence24bd_categories_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CUSTOM_CATEGORIES;
  });

  const [customPages, setCustomPages] = useState<CustomPage[]>(() => {
    try {
      const saved = localStorage.getItem('defence24bd_pages_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CUSTOM_PAGES;
  });

  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(() => {
    try {
      const saved = localStorage.getItem('defence24bd_sections_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_HOMEPAGE_SECTIONS;
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('defence24bd_media_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_MEDIA_ITEMS;
  });

  // Apply dynamic theme CSS variables on settings or theme mode change
  useEffect(() => {
    applyDynamicTheme(
      settings.customColors,
      settings.typography,
      settings.headerSettings,
      settings.footerSettings,
      theme === 'dark'
    );
  }, [settings, theme]);

  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedCategory, setSelectedCategory] = useState<ForceCategory | 'all'>('all');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedCircular, setSelectedCircular] = useState<JobCircular | null>(null);

  // Phase 14: Advanced Search Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactDept, setContactDept] = useState('editorial');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const t = UI_STRINGS[lang];
  const isEn = lang === 'en';

  // Live Dhaka Standard Time (BST) Clock in English & Bangla
  const [liveClock, setLiveClock] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      try {
        if (lang === 'bn') {
          const formatted = new Intl.DateTimeFormat('bn-BD', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Dhaka',
          }).format(now);
          setLiveClock(`${formatted} · বাংলাদেশ প্রমাণ সময়`);
        } else {
          const formatted = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Dhaka',
          }).format(now);
          setLiveClock(`${formatted} · Dhaka Standard Time (BST)`);
        }
      } catch {
        setLiveClock(
          lang === 'bn'
            ? 'রবিবার, ৮ নভেম্বর ২০২৬ · বাংলাদেশ প্রমাণ সময়'
            : 'Sunday, November 8, 2026 · Dhaka Standard Time (BST)'
        );
      }
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  // Fetch live PostgreSQL & Cloud Firestore portal data on mount
  useEffect(() => {
    let mounted = true;
    fetch('/api/public/portal')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        if (Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles(data.articles);
        }
        if (Array.isArray(data.circulars) && data.circulars.length > 0) {
          setCirculars(data.circulars);
        }
        if (Array.isArray(data.notices) && data.notices.length > 0) {
          setNotices(data.notices);
        }
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {
        // Fallback to local / Firestore state seamlessly
      });

    const unsubFirestore = subscribeToPublishedFirestorePortal({
      onArticles: (fbArticles) => {
        if (!mounted || fbArticles.length === 0) return;
        setArticles((prev) => {
          const map = new Map(prev.map((a) => [a.id, a]));
          fbArticles.forEach((a) => map.set(a.id, a));
          return Array.from(map.values());
        });
      },
      onCirculars: (fbCirculars) => {
        if (!mounted || fbCirculars.length === 0) return;
        setCirculars(fbCirculars);
      },
      onNotices: (fbNotices) => {
        if (!mounted || fbNotices.length === 0) return;
        setNotices(fbNotices);
      },
      onSettings: (fbSettings) => {
        if (!mounted || !fbSettings) return;
        setSettings((prev) => ({ ...prev, ...fbSettings }));
      },
      onCategories: (fbCategories) => {
        if (!mounted || fbCategories.length === 0) return;
        setCustomCategories(fbCategories);
      },
      onPages: (fbPages) => {
        if (!mounted || fbPages.length === 0) return;
        setCustomPages(fbPages);
      },
      onHomepageSections: (fbSections) => {
        if (!mounted || fbSections.length === 0) return;
        setHomepageSections(fbSections);
      },
      onMediaItems: (fbMedia) => {
        if (!mounted || fbMedia.length === 0) return;
        setMediaItems(fbMedia);
      },
    });

    return () => {
      mounted = false;
      unsubFirestore();
    };
  }, []);

  // Sync Language attribute & localStorage
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  // Sync Dark / Light Theme on <html> and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Persist local cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
    } catch {
      // ignore
    }
  }, [articles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CIRCULARS, JSON.stringify(circulars));
    } catch {
      // ignore
    }
  }, [circulars]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    } catch {
      // ignore
    }
  }, [notices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Only published articles are shown to public visitors, sorted strictly newest first by publication date (createdAtIso)
  const publishedArticles = useMemo(
    () =>
      articles
        .filter((a) => (a.status || 'published') === 'published')
        .slice()
        .sort((a, b) => {
          const timeCmp = (b.createdAtIso || '').localeCompare(a.createdAtIso || '');
          if (timeCmp !== 0) return timeCmp;
          return a.id.localeCompare(b.id);
        }),
    [articles]
  );

  const activeArticle = useMemo(
    () =>
      publishedArticles.find((a) => a.id === selectedArticleId) || null,
    [publishedArticles, selectedArticleId]
  );

  // Synchronize clean URL routing (/category/army, /army/post-title, /circulars, etc.) and legacy query params
  useEffect(() => {
    const syncRoute = () => {
      try {
        const parsed = parseRouteFromLocation(
          window.location.pathname,
          window.location.search,
          publishedArticles,
          customCategories,
          customPages
        );
        setActivePage(parsed.activePage);
        setSelectedCategory(parsed.selectedCategory);
        setSelectedArticleId(parsed.selectedArticleId);
        if (parsed.detectedLang) {
          setLang(parsed.detectedLang);
        }

        if (parsed.shouldReplaceUrl && parsed.canonicalPath) {
          const langSuffix = parsed.detectedLang ? `?lang=${parsed.detectedLang}` : '';
          window.history.replaceState({}, '', `${parsed.canonicalPath}${langSuffix}`);
        }
      } catch {
        // ignore
      }
    };

    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [publishedArticles, customCategories, customPages]);

  // Phase 12: Dynamic SEO Meta Title, Description, Canonical URL, OpenGraph & JSON-LD for EVERY page
  useEffect(() => {
    const siteName = isEn ? settings.siteNameEn : settings.siteNameBn;
    const baseDomain = 'https://defence24.netlify.app';
    let pageTitle = isEn ? settings.seoTitleEn : settings.seoTitleBn;
    let pageDesc = isEn ? settings.seoDescEn : settings.seoDescBn;
    let canonicalHref = `${baseDomain}/`;
    let ogType = 'website';
    let ogImage = '';

    if (activePage === 'article' && activeArticle) {
      const customSeoTitle = isEn ? activeArticle.seoMetaTitleEn : activeArticle.seoMetaTitleBn;
      const customSeoDesc = isEn ? activeArticle.seoMetaDescEn : activeArticle.seoMetaDescBn;
      pageTitle = `${customSeoTitle || activeArticle[lang].title} | ${siteName}`;
      pageDesc = customSeoDesc || activeArticle[lang].subtitle;
      canonicalHref = `${baseDomain}${getArticlePath(activeArticle)}`;
      ogType = 'article';
      if (activeArticle.customImageUrl && !activeArticle.customImageUrl.startsWith('data:')) {
        ogImage = activeArticle.customImageUrl;
      }
    } else if (activePage === 'category' && selectedCategory !== 'all') {
      const customCat = customCategories.find(
        (c) => c.slug === selectedCategory || c.id === selectedCategory
      );
      const catLabel = customCat
        ? isEn
          ? customCat.nameEn
          : customCat.nameBn
        : CATEGORY_LABELS[selectedCategory]?.[lang] || selectedCategory;
      const catDesc = customCat
        ? isEn
          ? customCat.descriptionEn
          : customCat.descriptionBn
        : CATEGORY_DESCRIPTIONS[selectedCategory]?.[lang] || pageDesc;
      pageTitle = `${catLabel} – ${siteName}`;
      pageDesc = catDesc;
      canonicalHref = `${baseDomain}${getCategoryPath(selectedCategory)}`;
    } else if (activePage === 'circulars') {
      pageTitle = `${t.latestCircularsHeading} – ${siteName}`;
      pageDesc = t.latestCircularsSub;
      canonicalHref = `${baseDomain}/circulars`;
    } else if (activePage === 'submit_news') {
      pageTitle = `${t.navSubmitNews} – ${siteName}`;
      pageDesc = isEn
        ? 'Submit verified defense and public security news reports for editorial review at Defence 24 BD.'
        : 'ডিফেন্স ২৪ বিডি সম্পাদনা পর্ষদের পর্যালোচনার জন্য যাচাইকৃত সংবাদ ও তথ্য জমা দিন।';
      canonicalHref = `${baseDomain}/submit-news`;
    } else if (activePage === 'contact') {
      pageTitle = `${t.contactTitle} – ${siteName}`;
      pageDesc = t.contactLead;
      canonicalHref = `${baseDomain}/contact`;
    } else if (
      activePage === 'about' ||
      activePage === 'privacy' ||
      activePage === 'terms' ||
      activePage === 'disclaimer' ||
      activePage === 'editorial_policy' ||
      activePage === 'corrections_policy'
    ) {
      pageTitle = `${LEGAL_PAGES[activePage][lang].title} – ${siteName}`;
      pageDesc = LEGAL_PAGES[activePage][lang].lead;
      canonicalHref = `${baseDomain}${getPagePath(activePage)}`;
    } else if (activePage === 'admin') {
      pageTitle = `${t.adminBtn} – ${siteName}`;
      pageDesc = isEn
        ? 'Authorized editorial management console for Defence 24 BD.'
        : 'ডিফেন্স ২৪ বিডি অনুমোদিত সম্পাদকীয় ব্যবস্থাপনা প্যানেল।';
      canonicalHref = `${baseDomain}/admin`;
    } else if (activePage === 'not_found') {
      pageTitle = isEn
        ? `404 Page Not Found – ${siteName}`
        : `৪০৪ পৃষ্ঠাটি খুঁজে পাওয়া যায়নি – ${siteName}`;
      pageDesc = isEn
        ? 'The requested category or defense news dispatch could not be found.'
        : 'অনুরোধকৃত বিভাগ বা প্রতিরক্ষা সংবাদ প্রতিবেদনটি খুঁজে পাওয়া যায়নি।';
      canonicalHref = `${baseDomain}${window.location.pathname}`;
    }

    document.title = pageTitle;

    const setMetaTag = (selector: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el && selector.startsWith('meta[property="')) {
        const propMatch = selector.match(/property="([^"]+)"/);
        if (propMatch) {
          el = document.createElement('meta');
          el.setAttribute('property', propMatch[1]);
          document.head.appendChild(el);
        }
      }
      if (el) el.setAttribute('content', content);
    };
    setMetaTag('meta[name="description"]', pageDesc);
    setMetaTag('meta[property="og:type"]', ogType);
    setMetaTag('meta[property="og:title"]', pageTitle);
    setMetaTag('meta[property="og:description"]', pageDesc);
    setMetaTag('meta[property="og:url"]', canonicalHref);
    setMetaTag('meta[property="og:locale"]', isEn ? 'en_US' : 'bn_BD');
    setMetaTag('meta[property="og:locale:alternate"]', isEn ? 'bn_BD' : 'en_US');
    if (ogImage) {
      setMetaTag('meta[property="og:image"]', ogImage);
    }
    setMetaTag('meta[name="twitter:title"]', pageTitle);
    setMetaTag('meta[name="twitter:description"]', pageDesc);

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.setAttribute('href', canonicalHref);
    }

    // Configure hreflang alternate tags (bn, en, x-default) for equivalent Bengali and English pages
    const relativeCanonicalPath = canonicalHref.replace(baseDomain, '') || '/';
    const { bnUrl, enUrl, xDefaultUrl } = getHreflangUrls(baseDomain, relativeCanonicalPath);
    const setHreflangLink = (id: string, hreflangCode: string, hrefValue: string) => {
      let linkEl = document.getElementById(id) as HTMLLinkElement | null;
      if (!linkEl) {
        linkEl = document.querySelector(`link[rel="alternate"][hreflang="${hreflangCode}"]`) as HTMLLinkElement | null;
      }
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = id;
        linkEl.rel = 'alternate';
        linkEl.hreflang = hreflangCode;
        document.head.appendChild(linkEl);
      }
      linkEl.setAttribute('href', hrefValue);
    };
    setHreflangLink('hreflang-bn', 'bn', bnUrl);
    setHreflangLink('hreflang-en', 'en', enUrl);
    setHreflangLink('hreflang-xdefault', 'x-default', xDefaultUrl);

    // Update Schema.org JSON-LD with BreadcrumbList & NewsArticle when on category or article pages
    const schemaEl = document.getElementById('schema-jsonld');
    if (schemaEl) {
      if (activePage === 'article' && activeArticle) {
        const catLabel =
          CATEGORY_LABELS[activeArticle.category as ForceCategory]?.[lang] ||
          activeArticle.category;
        const catUrl = `${baseDomain}${getCategoryPath(activeArticle.category)}`;
        schemaEl.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'NewsArticle',
              headline: activeArticle[lang].title,
              description: activeArticle[lang].subtitle,
              datePublished: activeArticle.createdAtIso,
              dateModified: activeArticle.updatedAtIso || activeArticle.createdAtIso,
              mainEntityOfPage: canonicalHref,
              image: ogImage ? [ogImage] : undefined,
              author: {
                '@type': 'Person',
                name: activeArticle[lang].author,
              },
              publisher: {
                '@type': 'NewsMediaOrganization',
                name: 'ডিফেন্স ২৪ বিডি | Defence 24 BD',
                url: baseDomain,
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: isEn ? 'Home' : 'প্রচ্ছদ',
                  item: `${baseDomain}/`,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: catLabel,
                  item: catUrl,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: activeArticle[lang].title,
                  item: canonicalHref,
                },
              ],
            },
          ],
        });
      } else if (activePage === 'category' && selectedCategory !== 'all') {
        const catLabel =
          CATEGORY_LABELS[selectedCategory]?.[lang] || selectedCategory;
        schemaEl.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: isEn ? 'Home' : 'প্রচ্ছদ',
              item: `${baseDomain}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: catLabel,
              item: canonicalHref,
            },
          ],
        });
      }
    }
  }, [activePage, activeArticle, selectedCategory, customCategories, lang, isEn, settings, t]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const pushBrowserUrl = (targetPath: string) => {
    try {
      if (window.location.pathname + window.location.search !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } catch {
      // ignore
    }
  };

  const navigateHome = () => {
    setActivePage('home');
    setSelectedCategory('all');
    setSelectedArticleId(null);
    setMobileMenuOpen(false);
    pushBrowserUrl('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateCategory = (cat: ForceCategory | 'all') => {
    setSelectedCategory(cat);
    setActivePage(cat === 'all' ? 'home' : 'category');
    setSelectedArticleId(null);
    setMobileMenuOpen(false);
    pushBrowserUrl(cat === 'all' ? '/' : getCategoryPath(cat));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateArticle = (id: string) => {
    const targetArt = articles.find((a) => a.id === id);
    setSelectedArticleId(id);
    if (targetArt) {
      setSelectedCategory((targetArt.category as ForceCategory) || 'all');
      pushBrowserUrl(getArticlePath(targetArt));
    }
    setActivePage('article');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigatePage = (page: ActivePage) => {
    setActivePage(page);
    setSelectedArticleId(null);
    setMobileMenuOpen(false);
    const cleanPath = getPagePath(page);
    pushBrowserUrl(cleanPath !== '/' || page === 'home' ? cleanPath : `/${encodeURIComponent(page)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const leadArticle = useMemo(
    () => publishedArticles.find((a) => a.isLeadStory) || publishedArticles[0],
    [publishedArticles]
  );

  const secondaryArticles = useMemo(
    () =>
      publishedArticles
        .filter((a) => a.id !== leadArticle?.id)
        .slice(0, 3),
    [publishedArticles, leadArticle]
  );

  const tickerArticles = useMemo(
    () => publishedArticles.filter((a) => a.isBreakingTicker !== false),
    [publishedArticles]
  );

  const emergencyNotice = useMemo(
    () => notices.find((n) => n.isActive && n.noticeType === 'emergency'),
    [notices]
  );

  const distinctOrganizations = useMemo(() => {
    const set = new Set<string>();
    publishedArticles.forEach((a) => {
      if (a.organization) set.add(a.organization);
    });
    return Array.from(set);
  }, [publishedArticles]);

  // Phase 14: Advanced Multi-Filter Search
  const filteredArticles = useMemo(() => {
    return publishedArticles.filter((art) => {
      const matchesCat =
        selectedCategory === 'all' ||
        art.category === selectedCategory ||
        (selectedCategory === 'other_forces' &&
          ['other_forces', 'bgb', 'coast_guard', 'fire_service', 'other_news'].includes(art.category));
      if (!matchesCat) return false;

      if (selectedOrg !== 'all' && art.organization !== selectedOrg) {
        return false;
      }

      if (selectedDateFilter === 'november') {
        if (
          !art.en.publishedDate.toLowerCase().includes('november') &&
          !art.bn.publishedDate.includes('নভেম্বর')
        ) {
          return false;
        }
      } else if (selectedDateFilter === 'october') {
        if (
          !art.en.publishedDate.toLowerCase().includes('october') &&
          !art.bn.publishedDate.includes('অক্টোবর')
        ) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const content = art[lang];
      const catLabel = (CATEGORY_LABELS[art.category as ForceCategory]?.[lang] || art.category).toLowerCase();
      const orgLabel = (art.organization || '').toLowerCase();

      return (
        content.title.toLowerCase().includes(q) ||
        content.subtitle.toLowerCase().includes(q) ||
        content.location.toLowerCase().includes(q) ||
        catLabel.includes(q) ||
        orgLabel.includes(q) ||
        content.body.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [publishedArticles, selectedCategory, selectedOrg, selectedDateFilter, searchQuery, lang]);

  // News Pagination System (10 articles per page, sorted newest first by createdAtIso, NO page numbers)
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [paginationError, setPaginationError] = useState<string | null>(null);

  // Reset pagination to the first page whenever category, search, filters, or active page changes
  useEffect(() => {
    setCursorHistory([]);
    setPaginationError(null);
  }, [selectedCategory, selectedOrg, selectedDateFilter, searchQuery, activePage]);

  const currentAfterCursor =
    cursorHistory.length > 0 ? cursorHistory[cursorHistory.length - 1] : null;

  const paginationState = useMemo(() => {
    let startIndex = 0;
    if (currentAfterCursor) {
      const exactIdx = filteredArticles.findIndex(
        (a) => a.createdAtIso === currentAfterCursor
      );
      if (exactIdx !== -1) {
        startIndex = exactIdx + 1;
      } else {
        const olderIdx = filteredArticles.findIndex(
          (a) => (a.createdAtIso || '') < currentAfterCursor
        );
        startIndex = olderIdx !== -1 ? olderIdx : filteredArticles.length;
      }
    }
    const items = filteredArticles.slice(startIndex, startIndex + NEWS_PAGE_SIZE);
    const hasMore = startIndex + NEWS_PAGE_SIZE < filteredArticles.length;
    return {
      items,
      hasMore,
      isFirstPage: cursorHistory.length === 0,
    };
  }, [filteredArticles, currentAfterCursor, cursorHistory.length]);

  const paginatedArticles = paginationState.items;
  const hasNextNewsPage = paginationState.hasMore;
  const isFirstNewsPage = paginationState.isFirstPage;

  const scrollToNewsListTop = () => {
    const el = document.getElementById('news-pagination-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextNewsPage = async () => {
    if (!hasNextNewsPage || paginatedArticles.length === 0) return;
    const lastArt = paginatedArticles[paginatedArticles.length - 1];
    if (!lastArt?.createdAtIso) return;

    setIsLoadingPage(true);
    setPaginationError(null);
    try {
      // Query Firestore for the next 10 published articles using orderBy('createdAtIso', 'desc') + startAfter + limit(11)
      const fbPage = await fetchPaginatedPublishedArticlesFromFirestore({
        pageSize: NEWS_PAGE_SIZE,
        afterCreatedAtIso: lastArt.createdAtIso,
        category: selectedCategory,
      });
      if (fbPage && fbPage.articles.length > 0) {
        setArticles((prev) => {
          const map = new Map(prev.map((a) => [a.id, a]));
          fbPage.articles.forEach((a) => map.set(a.id, a));
          return Array.from(map.values());
        });
      }
      setCursorHistory((prev) => [...prev, lastArt.createdAtIso]);
      scrollToNewsListTop();
    } catch {
      setPaginationError(
        lang === 'bn'
          ? 'পরবর্তী সংবাদ লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
          : 'Could not load the next news articles. Please try again.'
      );
    } finally {
      setIsLoadingPage(false);
    }
  };

  const handlePreviousNewsPage = () => {
    if (cursorHistory.length === 0) return;
    setPaginationError(null);
    setCursorHistory((prev) => prev.slice(0, -1));
    scrollToNewsListTop();
  };

  const renderNewsPaginationControls = () => {
    // Do NOT display Previous on the first page; do NOT display Next if no more articles exist; NEVER display page numbers
    if (isFirstNewsPage && !hasNextNewsPage) {
      return null;
    }

    const nextLabel = lang === 'bn' ? 'পরবর্তী সংবাদ' : 'Next News';
    const prevLabel = lang === 'bn' ? 'আগের সংবাদ' : 'Previous News';

    return (
      <div className="pt-4 space-y-3">
        {paginationError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300 text-center">
            {paginationError}
          </div>
        )}
        <nav
          aria-label={lang === 'bn' ? 'সংবাদ পৃষ্ঠা নেভিগেশন' : 'News Pagination Navigation'}
          className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-4 rounded-lg shadow-2xs"
        >
          <div>
            {!isFirstNewsPage && (
              <button
                type="button"
                disabled={isLoadingPage}
                onClick={handlePreviousNewsPage}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1F3A] hover:bg-blue-900 text-white text-xs sm:text-sm font-bold rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{prevLabel}</span>
              </button>
            )}
          </div>

          <div className="ml-auto">
            {hasNextNewsPage && (
              <button
                type="button"
                disabled={isLoadingPage}
                onClick={() => void handleNextNewsPage()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1F3A] hover:bg-blue-900 text-white text-xs sm:text-sm font-bold rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{nextLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </nav>
      </div>
    );
  };

  const handlePortalStateUpdated = (payload: {
    articles?: NewsArticle[];
    circulars?: JobCircular[];
    notices?: PortalNotice[];
    settings?: PortalSettings;
    categories?: CustomCategory[];
    pages?: CustomPage[];
    sections?: HomepageSection[];
    media?: MediaItem[];
  }) => {
    if (payload.articles) setArticles(payload.articles);
    if (payload.circulars) setCirculars(payload.circulars);
    if (payload.notices) setNotices(payload.notices);
    if (payload.settings) setSettings(payload.settings);
    if (payload.categories) setCustomCategories(payload.categories);
    if (payload.pages) setCustomPages(payload.pages);
    if (payload.sections) setHomepageSections(payload.sections);
    if (payload.media) setMediaItems(payload.media);
  };

  const handleSubmissionQueued = (pendingArticle: NewsArticle) => {
    setArticles((prev) => [pendingArticle, ...prev]);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setContactName('');
    setContactEmail('');
    setContactMsg('');
  };

  // SEPARATE STANDALONE ADMIN PANEL AT /admin (https://defence24.netlify.app/admin)
  // Works independently from the public website with zero public navigation clutter or ads
  if (activePage === 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <React.Suspense
            fallback={
              <div className="py-28 text-center">
                <div className="inline-block animate-spin rounded-full h-9 w-9 border-4 border-blue-600 border-t-transparent mb-3" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {isEn ? 'Loading DEFENCE 24 BD Admin Portal...' : 'ডিফেন্স ২৪ বিডি অ্যাডমিন প্যানেল লোড হচ্ছে...'}
                </p>
              </div>
            }
          >
            <AdminSection
              lang={lang}
              onChangeLang={setLang}
              articles={articles}
              circulars={circulars}
              notices={notices}
              settings={settings}
              customCategories={customCategories}
              customPages={customPages}
              homepageSections={homepageSections}
              mediaItems={mediaItems}
              onPortalStateUpdated={handlePortalStateUpdated}
              onExitToWebsite={navigateHome}
            />
          </React.Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden">
      {/* Strict 3-Zone Top Bar Contract (Navy Blue & Royal Blue Premium Header) */}
      <header className="sticky top-0 z-40 bg-[#0B1F3A] text-white border-b border-blue-900/80 shadow-xs">
        <div className="max-w-[1380px] mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
          {/* Zone 1: Logo or Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              navigateHome();
            }}
            className="flex items-center shrink-0 cursor-pointer"
          >
            {settings.headerSettings?.logoUrl ? (
              <img
                src={settings.headerSettings.logoUrl}
                alt={isEn ? settings.siteNameEn : settings.siteNameBn}
                style={{
                  height: `${settings.headerSettings.logoHeightPx || 38}px`,
                }}
                className="max-w-full object-contain"
              />
            ) : (
              <span className="text-xl sm:text-2xl font-editorial font-bold tracking-tight text-white whitespace-nowrap">
                {isEn ? settings.siteNameEn : settings.siteNameBn}
              </span>
            )}
          </a>

          {/* Zone 2: Navigation Links (Custom or Standard) */}
          <nav
            aria-label={isEn ? 'Primary Navigation' : 'প্রধান মেনু'}
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-200"
          >
            {settings.headerSettings?.navigationItems &&
            settings.headerSettings.navigationItems.filter((i) => i.isVisible).length > 0 ? (
              settings.headerSettings.navigationItems
                .filter((i) => i.isVisible)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const link = item.href || item.target || '';
                      if (link.includes('category=')) {
                        const cat = link.split('category=')[1];
                        navigateCategory(cat as any);
                      } else if (link.includes('page=')) {
                        const p = link.split('page=')[1];
                        navigatePage(p as any);
                      } else if (item.target === 'circulars' || link.includes('circulars')) {
                        navigatePage('circulars');
                      } else if (item.target === 'submit_news' || link.includes('submit')) {
                        navigatePage('submit_news');
                      } else {
                        navigateHome();
                      }
                    }}
                    className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isEn ? item.labelEn : item.labelBn}
                  </button>
                ))
            ) : (
              <>
                <button
                  type="button"
                  onClick={navigateHome}
                  className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activePage === 'home' && selectedCategory === 'all'
                      ? 'text-white font-semibold underline decoration-red-500 decoration-2'
                      : ''
                  }`}
                >
                  {t.navHome}
                </button>
                <button
                  type="button"
                  onClick={() => navigateCategory('army')}
                  className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activePage === 'category' && selectedCategory === 'army'
                      ? 'text-white font-semibold underline decoration-red-500 decoration-2'
                      : ''
                  }`}
                >
                  {t.navArmy}
                </button>
                <button
                  type="button"
                  onClick={() => navigateCategory('navy')}
                  className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activePage === 'category' && selectedCategory === 'navy'
                      ? 'text-white font-semibold underline decoration-red-500 decoration-2'
                      : ''
                  }`}
                >
                  {t.navNavy}
                </button>
                <button
                  type="button"
                  onClick={() => navigateCategory('airforce')}
                  className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activePage === 'category' && selectedCategory === 'airforce'
                      ? 'text-white font-semibold underline decoration-red-500 decoration-2'
                      : ''
                  }`}
                >
                  {t.navAirForce}
                </button>
                <button
                  type="button"
                  onClick={() => navigatePage('circulars')}
                  className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activePage === 'circulars'
                      ? 'text-white font-semibold underline decoration-red-500 decoration-2'
                      : ''
                  }`}
                >
                  {t.navCirculars}
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Language Change Control (বাংলা | English) + Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              role="group"
              aria-label={t.langChangeLabel}
              className="inline-flex items-center bg-blue-950/90 border border-blue-700/80 rounded p-0.5 text-xs"
            >
              <span className="hidden sm:inline-block px-2 py-1 text-[11px] text-slate-300 font-medium">
                {t.langChangeLabel}:
              </span>
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  lang === 'en'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={isEn ? 'Toggle Menu' : 'মেনু খুলুন'}
              className="lg:hidden p-2 text-slate-200 hover:bg-blue-900 rounded cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-blue-900 bg-[#0B1F3A] px-4 py-4 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-blue-900 pb-3 text-xs text-slate-200">
              <span className="font-semibold">{t.langChangeLabel}:</span>
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                    lang === 'bn' ? 'bg-emerald-600 text-white' : 'bg-blue-900/60 text-slate-200'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                    lang === 'en' ? 'bg-emerald-600 text-white' : 'bg-blue-900/60 text-slate-200'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm font-medium text-slate-100">
              <button
                type="button"
                onClick={navigateHome}
                className="text-left py-2 px-3 rounded hover:bg-blue-900 whitespace-nowrap"
              >
                {t.navHome}
              </button>
              {ALL_15_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => navigateCategory(cat)}
                  className="text-left py-2 px-3 rounded hover:bg-blue-900 whitespace-nowrap truncate"
                >
                  {CATEGORY_LABELS[cat][lang]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => navigatePage('submit_news')}
                className="text-left py-2 px-3 rounded bg-blue-800/70 text-white whitespace-nowrap col-span-2"
              >
                {t.navSubmitNews}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Operational Utility Bar: All 15 Categories + Theme Switcher + Submit News + Protected Admin Login */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col gap-2.5">
          {/* Top Utility Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
              <span className="font-medium font-tabular">
                {liveClock ||
                  (isEn
                    ? 'Sunday, November 8, 2026 · Dhaka Standard Time (BST)'
                    : 'রবিবার, ৮ নভেম্বর ২০২৬ · বাংলাদেশ প্রমাণ সময়')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Phase 2: Dark Mode & Light Mode Switch Button with Sun & Moon Icons */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? t.themeLightLabel : t.themeDarkLabel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:border-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.themeLightLabel}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-blue-900" />
                    <span>{t.themeDarkLabel}</span>
                  </>
                )}
              </button>

              {/* Phase 7: Public Submit News Button (No Admin button on public interface) */}
              <button
                type="button"
                onClick={() => navigatePage('submit_news')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t.navSubmitNews}</span>
              </button>
            </div>
          </div>

          {/* Categories Navigation Bar (Dynamic from Custom Categories) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            <button
              type="button"
              onClick={navigateHome}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'all' && activePage === 'home'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.allForcesTab}
            </button>
            {(customCategories.length > 0
              ? customCategories
              : ALL_15_CATEGORIES.map((cat) => ({
                  id: cat,
                  slug: cat,
                  nameEn: CATEGORY_LABELS[cat].en,
                  nameBn: CATEGORY_LABELS[cat].bn,
                  isActive: true,
                }))
            )
              .filter((c) => c.isActive !== false)
              .map((cat) => {
                const catKey = cat.slug || cat.id;
                const isSelected = selectedCategory === catKey && activePage === 'category';
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => navigateCategory(catKey as any)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-700 text-white font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isEn ? cat.nameEn : cat.nameBn}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Phase 5: Emergency Notice Banner (Controlled by Admin) */}
      {settings.emergencyBannerEnabled && emergencyNotice && (
        <div className="bg-[#1E3A5F] text-white border-b border-[#162C49]">
          <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-amber-200 shrink-0">
                {t.emergencyNoticeLabel}:
              </span>
              <button
                type="button"
                onClick={() =>
                  emergencyNotice.linkedArticleId
                    ? navigateArticle(emergencyNotice.linkedArticleId)
                    : navigatePage('circulars')
                }
                className="text-left font-medium text-white hover:underline cursor-pointer"
              >
                {isEn ? emergencyNotice.titleEn : emergencyNotice.titleBn}
              </button>
            </div>
            <span className="text-[11px] text-blue-100 font-tabular shrink-0">
              {isEn ? emergencyNotice.dateEn : emergencyNotice.dateBn}
            </span>
          </div>
        </div>
      )}

      {/* Phase 5: Breaking News & Notices Scrolling Ticker */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/90 overflow-hidden">
        <div className="max-w-[1380px] mx-auto flex items-center">
          <div className="bg-[#0B1F3A] text-white px-4 py-2.5 text-xs font-bold tracking-wider uppercase whitespace-nowrap shrink-0 z-10 border-r border-blue-800">
            {t.tickerLabel}
          </div>
          <div className="relative flex-1 overflow-hidden py-2">
            <div className="ticker-track items-center">
              {notices
                .filter((n) => n.isActive)
                .map((n, idx) => (
                  <button
                    key={`notice-${n.id}-${idx}`}
                    type="button"
                    onClick={() =>
                      n.linkedArticleId
                        ? navigateArticle(n.linkedArticleId)
                        : navigatePage('circulars')
                    }
                    className="inline-flex items-center gap-2.5 px-5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {isEn ? 'NOTICE' : 'নোটিশ'}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">
                      /
                    </span>
                    <span className="font-medium">{isEn ? n.titleEn : n.titleBn}</span>
                    <span aria-hidden="true" className="text-slate-400 pl-3">
                      ·
                    </span>
                  </button>
                ))}
              {[...tickerArticles, ...tickerArticles].map((art, idx) => (
                <button
                  key={`tick-${art.id}-${idx}`}
                  type="button"
                  onClick={() => navigateArticle(art.id)}
                  className="inline-flex items-center gap-2.5 px-5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span className="font-semibold text-blue-700 dark:text-blue-400">
                    {CATEGORY_LABELS[art.category as ForceCategory]?.[lang] || art.category}
                  </span>
                  <span aria-hidden="true" className="text-slate-400">
                    /
                  </span>
                  <span className="font-medium">{art[lang].title}</span>
                  <span aria-hidden="true" className="text-slate-400 pl-3">
                    ·
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-8">
        {/* HOME PAGE VIEW */}
        {activePage === 'home' && leadArticle && (
          <div className="space-y-12">
            {/* Phase 14: Advanced Search & Filter Bar */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-lg space-y-3 shadow-2xs">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-6 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    aria-label={t.filterByOrgLabel}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded"
                  >
                    <option value="all">{t.filterByOrgLabel}</option>
                    {distinctOrganizations.map((org) => (
                      <option key={org} value={org}>
                        {getLocalizedOrganization(org, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <select
                    value={selectedDateFilter}
                    onChange={(e) => setSelectedDateFilter(e.target.value)}
                    aria-label={t.filterByDateLabel}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded"
                  >
                    <option value="all">{t.filterByDateLabel}</option>
                    <option value="november">
                      {isEn ? 'November 2026 Dispatches' : 'নভেম্বর ২০২৬-এর সংবাদ'}
                    </option>
                    <option value="october">
                      {isEn ? 'October 2026 Dispatches' : 'অক্টোবর ২০২৬-এর সংবাদ'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Quick Search Suggestions */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isEn ? 'Popular Searches:' : 'জনপ্রিয় অনুসন্ধান:'}
                </span>
                {SEARCH_SUGGESTIONS[lang].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setSearchQuery(sug)}
                    className="hover:text-blue-700 dark:hover:text-blue-400 hover:underline cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
                {(searchQuery || selectedOrg !== 'all' || selectedDateFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedOrg('all');
                      setSelectedDateFilter('all');
                    }}
                    className="ml-auto text-red-600 dark:text-red-400 font-semibold hover:underline cursor-pointer"
                  >
                    {t.clearFilter}
                  </button>
                )}
              </div>
            </section>

            {/* Phase 7: Compact Force Navigation Box Section (Zero Public Counts) */}
            <CategoryBoxSection
              lang={lang}
              categories={customCategories.length > 0 ? customCategories : DEFAULT_CUSTOM_CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={(catSlug) => navigateCategory(catSlug as any)}
            />

            {/* 3-Tier Editorial Front-Page Salience */}
            {!searchQuery.trim() && selectedOrg === 'all' && selectedDateFilter === 'all' && (
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Tier 1: Lead Story (7 columns) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg flex flex-col justify-between">
                  <div
                    onClick={() => navigateArticle(leadArticle.id)}
                    className="group cursor-pointer space-y-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-blue-700 dark:text-blue-400">
                        {CATEGORY_LABELS[leadArticle.category as ForceCategory]?.[lang] || leadArticle.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {t.leadStoryKicker}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{leadArticle[lang].location}</span>
                    </div>

                    <EditorialMedia
                      visualKey={leadArticle.visualKey}
                      customImageUrl={leadArticle.customImageUrl}
                      alt={leadArticle[lang].title}
                      aspectClass="aspect-[16/9]"
                    />
                    <p className="text-xs font-editorial italic text-slate-500 dark:text-slate-400">
                      {leadArticle[lang].figureCaption}
                    </p>

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-editorial font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors leading-tight text-balance">
                      {leadArticle[lang].title}
                    </h1>

                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                      {leadArticle[lang].subtitle}
                    </p>
                  </div>

                  <div className="pt-5 mt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {leadArticle[lang].author}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{leadArticle[lang].publishedDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{leadArticle[lang].readTime}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateArticle(leadArticle.id)}
                      className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <span>{t.readFullStory}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tier 2: Secondary Featured Force Reports (5 columns) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg flex flex-col justify-between space-y-5">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                      {t.secondaryKicker}
                    </h2>
                    <span className="text-xs text-slate-400 font-tabular">
                      {isEn ? '2026' : '২০২৬'}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-800 flex-1 flex flex-col justify-between">
                    {secondaryArticles.map((art) => (
                      <article
                        key={art.id}
                        onClick={() => navigateArticle(art.id)}
                        className="py-4 first:pt-0 last:pb-0 group cursor-pointer grid grid-cols-1 sm:grid-cols-12 gap-4 items-start"
                      >
                        <div className="sm:col-span-5">
                          <EditorialMedia
                            visualKey={art.visualKey}
                            customImageUrl={art.customImageUrl}
                            alt={art[lang].title}
                            aspectClass="aspect-[4/3]"
                          />
                        </div>
                        <div className="sm:col-span-7 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-blue-700 dark:text-blue-400">
                              {CATEGORY_LABELS[art.category as ForceCategory]?.[lang] || art.category}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{art[lang].publishedDate}</span>
                          </div>
                          <h3 className="text-base font-editorial font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors leading-snug">
                            {art[lang].title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                            {art[lang].subtitle}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Tier 3: All 15 Categories Filter & Paginated News Cards (10 per page, newest first) */}
            <section id="news-pagination-anchor" className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-editorial font-bold text-slate-900 dark:text-white">
                  {t.categoryFilterHeading}
                </h2>
              </div>

              {/* 15 Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/75 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#0B1F3A] text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  {t.allForcesTab}
                </button>
                {ALL_15_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#0B1F3A] text-white font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    {CATEGORY_LABELS[cat][lang]}
                  </button>
                ))}
              </div>

              {isLoadingPage ? (
                <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                  <div className="inline-block animate-spin rounded-full h-7 w-7 border-4 border-blue-600 border-t-transparent" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {lang === 'bn' ? 'সংবাদ লোড হচ্ছে...' : 'Loading news articles...'}
                  </p>
                </div>
              ) : paginatedArticles.length === 0 ? (
                <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t.noSearchResults}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                      setSelectedOrg('all');
                      setSelectedDateFilter('all');
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-blue-700 text-white rounded cursor-pointer"
                  >
                    {t.clearFilter}
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                    {paginatedArticles.map((art) => (
                      <article
                        key={art.id}
                        onClick={() => navigateArticle(art.id)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between group cursor-pointer hover:border-blue-600 dark:hover:border-blue-500 transition-colors"
                      >
                        <div>
                          <EditorialMedia
                            visualKey={art.visualKey}
                            customImageUrl={art.customImageUrl}
                            alt={art[lang].title}
                            aspectClass="aspect-[4/3]"
                          />
                          <div className="p-5 space-y-2.5">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-bold text-blue-700 dark:text-blue-400">
                                {CATEGORY_LABELS[art.category as ForceCategory]?.[lang] || art.category}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{art[lang].publishedDate}</span>
                              <span aria-hidden="true">·</span>
                              <span>{art[lang].readTime}</span>
                            </div>
                            <h3 className="text-lg font-editorial font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors leading-snug">
                              {art[lang].title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                              {art[lang].subtitle}
                            </p>
                          </div>
                        </div>
                        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="truncate max-w-[65%]">
                            <strong className="text-slate-700 dark:text-slate-300">{art[lang].author}</strong> · {getLocalizedOrganization(art.organization, lang)}
                          </span>
                          <span className="font-semibold text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 shrink-0">
                            <span>{t.readFullStory}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                  {renderNewsPaginationControls()}
                </>
              )}
            </section>

            {/* Latest Official Recruitment Circulars Section */}
            <section className="bg-[#0B1F3A] text-white p-6 sm:p-8 rounded-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-blue-800 pb-4">
                <div>
                  <h2 className="text-2xl font-editorial font-bold text-white">
                    {t.latestCircularsHeading}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    {t.latestCircularsSub}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigatePage('circulars')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{t.viewAllCirculars}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {circulars.slice(0, 6).map((circ) => (
                  <div
                    key={circ.id}
                    onClick={() => setSelectedCircular(circ)}
                    className="bg-slate-900/90 border border-blue-800/80 p-5 rounded-lg flex flex-col justify-between hover:border-emerald-400 transition-colors cursor-pointer group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="font-bold text-emerald-400">
                          {CATEGORY_LABELS[circ.category][lang]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-tabular text-slate-400">
                          {circ[lang].referenceNo}
                        </span>
                      </div>

                      <h3 className="text-base font-editorial font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                        {circ[lang].title}
                      </h3>

                      <div className="text-xs text-slate-300 space-y-1 pt-1">
                        <p>
                          <strong className="text-white">{t.positionLabel}:</strong>{' '}
                          {circ[lang].position}
                        </p>
                        <p className="line-clamp-2">
                          <strong className="text-white">{t.qualificationLabel}:</strong>{' '}
                          {circ[lang].qualification}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-blue-900/80 flex items-center justify-between text-xs">
                      <span className="text-slate-300">
                        <strong className="text-orange-400">{t.deadlineLabel}:</strong>{' '}
                        {circ[lang].deadlineDate}
                      </span>
                      <span className="font-semibold text-emerald-400 group-hover:underline inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Details' : 'বিস্তারিত'}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Clearly Distinguished AdSense-Compliant Display Unit (Active Only After Approval & Valid Publisher ID) */}
            {settings.enableTopBannerAd &&
              Boolean(settings.adsensePublisherId) &&
              !settings.adsensePublisherId.includes('00000000') && (
              <aside
                aria-label={t.adSlotLabel}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 rounded-lg text-center space-y-1"
              >
                <p className="text-[11px] uppercase tracking-widest text-slate-400">
                  {t.adSlotLabel}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.adSlotBody}
                </p>
              </aside>
            )}
          </div>
        )}

        {/* DEDICATED CATEGORY PAGE (All 15 Categories Supported, Paginated 10 per page) */}
        {activePage === 'category' && selectedCategory !== 'all' && (
          <div id="news-pagination-anchor" className="space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <button
                    type="button"
                    onClick={navigateHome}
                    className="font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isEn ? 'Home' : 'প্রচ্ছদ'}
                  </button>
                  <span aria-hidden="true">/</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {CATEGORY_LABELS[selectedCategory]?.[lang] ||
                      customCategories.find((c) => c.slug === selectedCategory || c.id === selectedCategory)?.[
                        isEn ? 'nameEn' : 'nameBn'
                      ] ||
                      selectedCategory}
                  </span>
                </nav>
                <h1 className="text-3xl sm:text-4xl font-editorial font-bold text-slate-900 dark:text-white">
                  {CATEGORY_LABELS[selectedCategory]?.[lang] ||
                    customCategories.find((c) => c.slug === selectedCategory || c.id === selectedCategory)?.[
                      isEn ? 'nameEn' : 'nameBn'
                    ] ||
                    selectedCategory}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                  {CATEGORY_DESCRIPTIONS[selectedCategory]?.[lang] ||
                    customCategories.find((c) => c.slug === selectedCategory || c.id === selectedCategory)?.[
                      isEn ? 'descriptionEn' : 'descriptionBn'
                    ] ||
                    ''}
                </p>
              </div>
              <div className="w-full md:w-72 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
              </div>
            </div>

            {isLoadingPage ? (
              <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-4 border-blue-600 border-t-transparent" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {lang === 'bn' ? 'সংবাদ লোড হচ্ছে...' : 'Loading news articles...'}
                </p>
              </div>
            ) : paginatedArticles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                  {paginatedArticles.map((art) => (
                    <article
                      key={art.id}
                      onClick={() => navigateArticle(art.id)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between group cursor-pointer hover:border-blue-600 transition-colors"
                    >
                      <div>
                        <EditorialMedia
                          visualKey={art.visualKey}
                          customImageUrl={art.customImageUrl}
                          alt={art[lang].title}
                          aspectClass="aspect-[4/3]"
                        />
                        <div className="p-5 space-y-2.5">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-blue-700 dark:text-blue-400">
                              {CATEGORY_LABELS[art.category as ForceCategory]?.[lang] || art.category}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{art[lang].publishedDate}</span>
                          </div>
                          <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors leading-snug">
                            {art[lang].title}
                          </h2>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {art[lang].subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{art[lang].location}</span>
                        <span className="font-semibold text-blue-700 dark:text-blue-400">
                          {t.readFullStory} →
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
                {renderNewsPaginationControls()}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-xl text-center space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isEn
                    ? 'No news reports currently filed under this category.'
                    : 'এই বিভাগে বর্তমানে কোনো প্রতিবেদন প্রকাশিত নেই।'}
                </p>
                <button
                  type="button"
                  onClick={navigateHome}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                >
                  {isEn ? 'Return to Frontpage' : 'প্রচ্ছদে ফিরে যান'}
                </button>
              </div>
            )}

            {/* Category-Specific Official Recruitment Circulars */}
            {(() => {
              const categoryCirculars = circulars.filter(
                (c) =>
                  c.category === selectedCategory ||
                  (c.category as any) === selectedCategory ||
                  (selectedCategory === 'other_forces' &&
                    ['other_forces', 'bgb', 'coast_guard', 'fire_service', 'other_news'].includes(c.category as string))
              );
              if (categoryCirculars.length === 0) return null;

              return (
                <section className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 space-y-6 mt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1">
                        <Briefcase className="w-3 h-3" />
                        {isEn ? 'Official Recruitment Circulars' : 'চলমান দাপ্তরিক নিয়োগ বিজ্ঞপ্তি'}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-editorial font-bold">
                        {CATEGORY_LABELS[selectedCategory]?.[lang] || selectedCategory} — {isEn ? 'Recruitment Circulars' : 'নিয়োগ বিজ্ঞপ্তি'}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigatePage('circulars')}
                      className="text-xs font-semibold text-blue-300 hover:text-white underline cursor-pointer"
                    >
                      {isEn ? 'View All Armed Forces Circulars →' : 'সকল বাহিনীর নিয়োগ বিজ্ঞপ্তি দেখুন →'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categoryCirculars.map((circ) => (
                      <div
                        key={circ.id}
                        className="bg-slate-800/90 border border-slate-700 rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors"
                      >
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-amber-400">
                            {circ[lang].organization}
                          </span>
                          <h3 className="text-base font-bold text-white leading-snug">
                            {circ[lang].title}
                          </h3>
                          <p className="text-xs text-slate-300 line-clamp-2">
                            {circ[lang].summary}
                          </p>
                        </div>

                        <div className="border-t border-slate-700/80 pt-3 space-y-2 text-xs text-slate-300">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{isEn ? 'Deadline:' : 'আবেদনের শেষ তারিখ:'}</span>
                            <span className="font-bold text-red-400">{circ[lang].deadlineDate}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedCircular(circ)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-center text-xs transition-colors cursor-pointer"
                          >
                            {isEn ? 'View Circular & Details' : 'বিজ্ঞপ্তি ও আবেদনের বিস্তারিত'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}
          </div>
        )}

        {/* ARTICLE READING VIEW */}
        {activePage === 'article' && activeArticle && (
          <article className="max-w-5xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 rounded-lg space-y-8">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-4">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={navigateHome}
                  className="font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {isEn ? 'Home' : 'প্রচ্ছদ'}
                </button>
                <span aria-hidden="true">/</span>
                <button
                  type="button"
                  onClick={() => navigateCategory(activeArticle.category as ForceCategory)}
                  className="font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {CATEGORY_LABELS[activeArticle.category as ForceCategory]?.[lang] || activeArticle.category}
                </button>
                <span aria-hidden="true">/</span>
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs sm:max-w-md">
                  {activeArticle[lang].title}
                </span>
              </nav>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => navigateCategory(activeArticle.category as ForceCategory)}
                  className="font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {CATEGORY_LABELS[activeArticle.category as ForceCategory]?.[lang] || activeArticle.category}
                </button>
                <span aria-hidden="true">·</span>
                <span>{activeArticle[lang].location}</span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle[lang].publishedDate}</span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle[lang].readTime}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-editorial font-bold text-slate-900 dark:text-white leading-tight text-balance">
                {activeArticle[lang].title}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                {activeArticle[lang].subtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeArticle[lang].author}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle[lang].authorRole}</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  {t.sourceLabel}: {activeArticle.sourceInfo || getLocalizedOrganization(activeArticle.organization, lang)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <EditorialMedia
                visualKey={activeArticle.visualKey}
                customImageUrl={activeArticle.customImageUrl}
                alt={activeArticle[lang].title}
                aspectClass="aspect-[16/9]"
              />
              <p className="text-xs font-editorial italic text-slate-500 dark:text-slate-400">
                {activeArticle[lang].figureCaption}
              </p>
            </div>

            {activeArticle.videoUrl && (
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-bold text-blue-700 dark:text-blue-400">
                  {isEn ? 'Attached Video Briefing:' : 'সংযুক্ত ভিডিও প্রতিবেদন:'}
                </span>{' '}
                <a
                  href={activeArticle.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline break-all"
                >
                  {activeArticle.videoUrl}
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-2">
              <div className="lg:col-span-8 space-y-5 text-base sm:text-[17px] text-slate-800 dark:text-slate-200 leading-relaxed max-w-prose">
                {activeArticle[lang].body.map((paragraph, index) => (
                  <p
                    key={index}
                    className={
                      index === 0
                        ? 'first-letter:text-4xl first-letter:font-editorial first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-blue-900 dark:first-letter:text-blue-400'
                        : ''
                    }
                  >
                    {paragraph}
                  </p>
                ))}

                {activeArticle[lang].pullQuote && (
                  <blockquote className="my-8 py-6 border-t border-b border-slate-200 dark:border-slate-800 text-xl sm:text-2xl font-editorial italic text-slate-800 dark:text-slate-200 text-balance">
                    “{activeArticle[lang].pullQuote}”
                  </blockquote>
                )}

                {settings.enableInArticleAd &&
                  Boolean(settings.adsensePublisherId) &&
                  !settings.adsensePublisherId.includes('00000000') && (
                  <aside className="my-6 p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded text-center space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      {t.adSlotLabel}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.adSlotBody}
                    </p>
                  </aside>
                )}
              </div>

              <aside className="lg:col-span-4 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 p-5 rounded-lg space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 border-b border-slate-200 dark:border-slate-700 pb-2">
                    {t.keyFactsTitle}
                  </h2>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {activeArticle[lang].keyFacts.map((fact, idx) => (
                      <li
                        key={idx}
                        className="pb-2.5 border-b border-slate-200/70 dark:border-slate-700/70 last:border-b-0 last:pb-0"
                      >
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 p-5 rounded-lg space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2">
                    {t.relatedStoriesTitle}
                  </h2>
                  <div className="space-y-3">
                    {publishedArticles
                      .filter((a) => a.id !== activeArticle.id)
                      .slice(0, 4)
                      .map((rel) => (
                        <div
                          key={rel.id}
                          onClick={() => navigateArticle(rel.id)}
                          className="cursor-pointer group pb-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0 last:pb-0 flex items-start gap-3"
                        >
                          <div className="w-20 shrink-0 rounded overflow-hidden">
                            <EditorialMedia
                              visualKey={rel.visualKey}
                              customImageUrl={rel.customImageUrl}
                              alt={rel[lang].title}
                              aspectClass="aspect-[16/9]"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {CATEGORY_LABELS[rel.category as ForceCategory]?.[lang] || rel.category} · {rel[lang].publishedDate}
                            </div>
                            <h3 className="text-xs sm:text-sm font-editorial font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 mt-0.5 line-clamp-2">
                              {rel[lang].title}
                            </h3>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </aside>
            </div>
          </article>
        )}

        {/* DEDICATED CIRCULARS ARCHIVE PAGE */}
        {activePage === 'circulars' && (
          <div className="space-y-8">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
              <button
                type="button"
                onClick={navigateHome}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline mb-3 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.backToFrontpage}</span>
              </button>
              <h1 className="text-3xl sm:text-4xl font-editorial font-bold text-slate-900 dark:text-white">
                {t.latestCircularsHeading}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {t.latestCircularsSub}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {circulars.map((circ) => (
                <article
                  key={circ.id}
                  onClick={() => setSelectedCircular(circ)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-4 hover:border-blue-600 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <span>
                      <strong className="text-blue-700 dark:text-blue-400">
                        {CATEGORY_LABELS[circ.category][lang]}
                      </strong>{' '}
                      · {circ[lang].organization}
                    </span>
                    <span className="font-tabular">{circ[lang].referenceNo}</span>
                  </div>

                  <h2 className="text-xl font-editorial font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {circ[lang].title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {circ[lang].summary}
                  </p>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded border border-slate-200 dark:border-slate-700">
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">{t.positionLabel}</dt>
                      <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                        {circ[lang].position}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">{t.deadlineLabel}</dt>
                      <dd className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {circ[lang].deadlineDate}
                      </dd>
                    </div>
                    <div className="sm:col-span-2 pt-1">
                      <dt className="text-slate-500 dark:text-slate-400">
                        {t.qualificationLabel}
                      </dt>
                      <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                        {circ[lang].qualification}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      {t.officialPortalLabel}:{' '}
                      <strong className="text-slate-800 dark:text-slate-200 font-tabular">
                        {circ[lang].officialPortalLabel}
                      </strong>
                    </span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400 group-hover:underline">
                      {t.viewCircularDetails} →
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* PHASE 7: PUBLIC SUBMIT NEWS PAGE */}
        {activePage === 'submit_news' && (
          <PublicSubmitNews
            lang={lang}
            onSubmissionQueued={handleSubmissionQueued}
            onBackHome={navigateHome}
          />
        )}

        {/* PHASE 10: ALL 7 ADSENSE POLICY & INSTITUTIONAL PAGES (ABOUT, PRIVACY, TERMS, DISCLAIMER, EDITORIAL POLICY, CORRECTIONS POLICY) */}
        {(activePage === 'about' ||
          activePage === 'privacy' ||
          activePage === 'terms' ||
          activePage === 'disclaimer' ||
          activePage === 'editorial_policy' ||
          activePage === 'corrections_policy') && (
          <article className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 rounded-lg space-y-8">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={navigateHome}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.backToFrontpage}</span>
                </button>
                <div className="inline-flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {t.langChangeLabel}:
                  </span>
                  <button
                    type="button"
                    onClick={() => setLang('bn')}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      lang === 'bn'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      lang === 'en'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Quick Navigation Across All 7 Official Policy Pages */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {(
                  [
                    { page: 'about', label: t.footerAboutLink },
                    { page: 'contact', label: t.footerContactLink },
                    { page: 'privacy', label: t.footerPrivacyLink },
                    { page: 'terms', label: t.footerTermsLink },
                    { page: 'editorial_policy', label: t.footerEditorialLink },
                    { page: 'disclaimer', label: t.footerDisclaimerLink },
                    { page: 'corrections_policy', label: t.footerCorrectionsLink },
                  ] as { page: ActivePage; label: string }[]
                ).map((item) => (
                  <button
                    key={item.page}
                    type="button"
                    onClick={() => navigatePage(item.page)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      activePage === item.page
                        ? 'bg-[#0B1F3A] text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <p className="text-xs uppercase tracking-widest text-blue-700 dark:text-blue-400 font-semibold pt-2">
                {LEGAL_PAGES[activePage][lang].kicker}
              </p>
              <h1 className="text-3xl font-editorial font-bold text-slate-900 dark:text-white">
                {LEGAL_PAGES[activePage][lang].title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {LEGAL_PAGES[activePage][lang].lastUpdated}
              </p>
            </div>

            <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {LEGAL_PAGES[activePage][lang].lead}
            </p>

            <div className="space-y-6">
              {LEGAL_PAGES[activePage][lang].sections.map((sec, idx) => (
                <section
                  key={idx}
                  className="space-y-2.5 border-t border-slate-200 dark:border-slate-800 pt-5"
                >
                  <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white">
                    {sec.heading}
                  </h2>
                  {sec.paragraphs.map((p, pIdx) => (
                    <p
                      key={pIdx}
                      className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed"
                    >
                      {p}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </article>
        )}

        {/* CONTACT US PAGE */}
        {activePage === 'contact' && (
          <section className="max-w-4xl mx-auto space-y-8">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={navigateHome}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.backToFrontpage}</span>
                </button>
                <div className="inline-flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {t.langChangeLabel}:
                  </span>
                  <button
                    type="button"
                    onClick={() => setLang('bn')}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      lang === 'bn'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      lang === 'en'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Quick Navigation Across All 7 Official Policy Pages */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {(
                  [
                    { page: 'about', label: t.footerAboutLink },
                    { page: 'contact', label: t.footerContactLink },
                    { page: 'privacy', label: t.footerPrivacyLink },
                    { page: 'terms', label: t.footerTermsLink },
                    { page: 'editorial_policy', label: t.footerEditorialLink },
                    { page: 'disclaimer', label: t.footerDisclaimerLink },
                    { page: 'corrections_policy', label: t.footerCorrectionsLink },
                  ] as { page: ActivePage; label: string }[]
                ).map((item) => (
                  <button
                    key={item.page}
                    type="button"
                    onClick={() => navigatePage(item.page)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      activePage === item.page
                        ? 'bg-[#0B1F3A] text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <p className="text-xs uppercase tracking-widest text-blue-700 dark:text-blue-400 font-semibold pt-2">
                {t.contactKicker}
              </p>
              <h1 className="text-3xl font-editorial font-bold text-slate-900 dark:text-white mt-1">
                {t.contactTitle}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {t.contactLead}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg">
                {contactSubmitted ? (
                  <div className="py-8 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <Check className="w-5 h-5" />
                      <span>{t.contactSuccessMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContactSubmitted(false)}
                      className="px-4 py-2 text-xs font-semibold bg-blue-700 text-white rounded cursor-pointer"
                    >
                      {isEn ? 'Send Another Inquiry' : 'আরেকটি বার্তা পাঠান'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.contactNameLabel}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.contactEmailLabel}
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.contactSubjectLabel}
                      </label>
                      <select
                        value={contactDept}
                        onChange={(e) => setContactDept(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                      >
                        <option value="editorial">{t.contactSubjectOpt1}</option>
                        <option value="circulars">{t.contactSubjectOpt2}</option>
                        <option value="correction">{t.contactSubjectOpt3}</option>
                        <option value="ads">{t.contactSubjectOpt4}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.contactMessageLabel}
                      </label>
                      <textarea
                        rows={5}
                        required
                        value={contactMsg}
                        onChange={(e) => setContactMsg(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#0B1F3A] hover:bg-blue-900 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                    >
                      {t.contactSubmitBtn}
                    </button>
                  </form>
                )}
              </div>

              <aside className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-6 text-sm">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    {t.officeAddressTitle}
                  </h2>
                  <p className="text-slate-900 dark:text-white font-medium mt-1">
                    {(isEn
                      ? (settings.footerSettings?.contactAddressEn || settings.footer?.addressEn)
                      : (settings.footerSettings?.contactAddressBn || settings.footer?.addressBn)) || t.officeAddressValue}
                  </p>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    {t.officeEmailTitle}
                  </h2>
                  <p className="text-slate-900 dark:text-white font-tabular mt-1">
                    {settings.footerSettings?.contactEmail || settings.footer?.emailEn || 'mostak4526159@gmail.com'}
                  </p>
                  {(settings.footerSettings?.contactPhone || settings.footer?.phoneEn) && (
                    <p className="text-slate-900 dark:text-white font-tabular mt-1">
                      {isEn ? 'Hotline:' : 'হটলাইন:'} {settings.footerSettings?.contactPhone || settings.footer?.phoneEn}
                    </p>
                  )}
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    {t.officeHoursTitle}
                  </h2>
                  <p className="text-slate-700 dark:text-slate-300 mt-1">
                    {(isEn
                      ? (settings.footerSettings?.hoursEn || settings.footer?.hoursEn)
                      : (settings.footerSettings?.hoursBn || settings.footer?.hoursBn)) || t.officeHoursValue}
                  </p>
                </div>
              </aside>
            </div>
          </section>
        )}

        {/* CUSTOM USER-CREATED PAGES (FROM ADMIN PAGE BUILDER — EXCLUDING BUILT-IN 7 POLICY PAGES) */}
        {(() => {
          const builtInPolicySlugs = [
            'about',
            'contact',
            'privacy',
            'terms',
            'disclaimer',
            'editorial_policy',
            'editorial-policy',
            'corrections_policy',
            'corrections-policy',
          ];
          if (builtInPolicySlugs.includes(activePage)) return null;
          const matchingCustomPage = customPages.find(
            (p) =>
              (p.slug === activePage || p.id === activePage) &&
              p.isPublished &&
              !builtInPolicySlugs.includes(p.slug)
          );
          if (!matchingCustomPage) return null;
          return (
            <article className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 rounded-lg space-y-8">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-2">
                <button
                  type="button"
                  onClick={navigateHome}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline mb-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.backToFrontpage}</span>
                </button>
                <h1 className="text-3xl font-editorial font-bold text-slate-900 dark:text-white">
                  {isEn ? matchingCustomPage.titleEn : matchingCustomPage.titleBn}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {matchingCustomPage.updatedAtIso
                    ? new Date(matchingCustomPage.updatedAtIso).toLocaleDateString(isEn ? 'en-US' : 'bn-BD')
                    : ''}
                </p>
              </div>

              <div className="space-y-4">
                {(() => {
                  const rawContent = isEn ? matchingCustomPage.contentEn : matchingCustomPage.contentBn;
                  const paras = Array.isArray(rawContent)
                    ? rawContent
                    : (rawContent || '').split('\n\n').filter(Boolean);
                  return paras.map((p, idx) => (
                    <p key={idx} className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                      {p}
                    </p>
                  ));
                })()}
              </div>
            </article>
          );
        })()}

        {/* 404 NOT FOUND VIEW FOR INVALID CATEGORY OR ARTICLE URLS */}
        {(activePage === 'not_found' || (activePage === 'article' && !activeArticle)) && (
          <section className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 rounded-xl text-center space-y-5 my-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-xl">
              404
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-slate-900 dark:text-white">
              {isEn ? 'Page or News Dispatch Not Found' : 'পৃষ্ঠা বা সংবাদ প্রতিবেদনটি খুঁজে পাওয়া যায়নি'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              {isEn
                ? 'The URL you requested may have been moved, renamed, or does not exist. Use the category links or return to the frontpage.'
                : 'আপনার অনুরোধকৃত লিংকটি পরিবর্তিত হয়েছে অথবা বর্তমানে বিদ্যমান নেই। নিচের বাটনে ক্লিক করে প্রচ্ছদে ফিরে যান।'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={navigateHome}
                className="px-5 py-2.5 bg-[#0B1F3A] dark:bg-blue-600 hover:bg-blue-800 text-white rounded-md text-xs font-bold cursor-pointer transition-colors"
              >
                {isEn ? 'Return to Frontpage' : 'প্রচ্ছদে ফিরে যান'}
              </button>
              <button
                type="button"
                onClick={() => navigateCategory('army')}
                className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold cursor-pointer transition-colors"
              >
                {CATEGORY_LABELS.army[lang]}
              </button>
              <button
                type="button"
                onClick={() => navigatePage('circulars')}
                className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold cursor-pointer transition-colors"
              >
                {t.navCirculars}
              </button>
            </div>
          </section>
        )}

      </main>

      {/* Circular Detail Modal */}
      {selectedCircular && (
        <div
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedCircular(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-blue-700 dark:text-blue-400">
                    {CATEGORY_LABELS[selectedCircular.category][lang]}
                  </span>{' '}
                  · {selectedCircular[lang].organization} ·{' '}
                  <span className="font-tabular">
                    {selectedCircular[lang].referenceNo}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-editorial font-bold text-slate-900 dark:text-white mt-1">
                  {selectedCircular[lang].title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCircular(null)}
                className="p-1.5 text-slate-500 hover:text-slate-950 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {selectedCircular[lang].summary}
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{t.positionLabel}</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {selectedCircular[lang].position}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{t.ageLimitLabel}</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {selectedCircular[lang].ageRequirement}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{t.publishedLabel}</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedCircular[lang].publishedDate}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">{t.deadlineLabel}</dt>
                <dd className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {selectedCircular[lang].deadlineDate}
                </dd>
              </div>
              <div className="sm:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                <dt className="text-slate-500 dark:text-slate-400">
                  {t.qualificationLabel}
                </dt>
                <dd className="font-medium text-slate-900 dark:text-white mt-0.5">
                  {selectedCircular[lang].qualification}
                </dd>
              </div>
            </dl>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {isEn
                  ? 'Official Application Procedure'
                  : 'আবেদন করার দাপ্তরিক নিয়মাবলি'}
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {selectedCircular[lang].applicationSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            {selectedCircular.pdfUrl && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold block">
                    {isEn ? 'Official Circular Document / PDF Attached' : 'দাপ্তরিক নিয়োগ বিজ্ঞপ্তির পিডিএফ / দলিল সংযুক্ত'}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {isEn ? 'View or download the full circular notice.' : 'সম্পূর্ণ বিজ্ঞপ্তিটি দেখতে বা ডাউনলোড করতে নিচের বাটনে ক্লিক করুন।'}
                  </span>
                </div>
                <a
                  href={selectedCircular.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded transition-colors"
                >
                  {isEn ? 'Open / Download PDF ↗' : 'পিডিএফ দেখুন / ডাউনলোড ↗'}
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                {t.officialPortalLabel}:{' '}
                <strong className="text-slate-950 dark:text-white font-tabular">
                  {selectedCircular[lang].officialPortalLabel}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedCircular(null)}
                className="px-4 py-2 bg-[#0B1F3A] text-white font-semibold rounded hover:bg-blue-900 cursor-pointer"
              >
                {isEn ? 'Close Circular' : 'বন্ধ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Institutional Footer (Zero Public ZIP Download Buttons) */}
      <footer className="bg-[#0B1F3A] text-slate-300 border-t border-blue-900 mt-16">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 text-xs">
          <div className="md:col-span-4 space-y-3">
            <div className="text-xl font-editorial font-bold text-white">
              {isEn ? settings.siteNameEn : settings.siteNameBn}
            </div>
            <p className="text-slate-300 leading-relaxed">
              {(isEn
                ? (settings.footerSettings?.aboutTextEn || settings.footer?.aboutTextEn)
                : (settings.footerSettings?.aboutTextBn || settings.footer?.aboutTextBn)) || t.footerAboutBody}
            </p>
            <p className="text-slate-400 pt-1">
              {(isEn
                ? (settings.footerSettings?.contactAddressEn || settings.footer?.addressEn)
                : (settings.footerSettings?.contactAddressBn || settings.footer?.addressBn)) || t.officeAddressValue}
            </p>
            {(settings.footerSettings?.contactPhone || settings.footer?.phoneEn) && (
              <p className="text-slate-400">
                {isEn ? 'Hotline:' : 'হটলাইন:'} {settings.footerSettings?.contactPhone || settings.footer?.phoneEn}
              </p>
            )}
          </div>

          <div className="md:col-span-5 space-y-2.5">
            <h3 className="font-bold uppercase tracking-wider text-white">
              {t.footerCategoriesTitle}
            </h3>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {(customCategories.length > 0
                ? customCategories
                : ALL_15_CATEGORIES.map((c) => ({
                    id: c,
                    slug: c,
                    nameEn: CATEGORY_LABELS[c].en,
                    nameBn: CATEGORY_LABELS[c].bn,
                    isActive: true,
                  }))
              )
                .filter((c) => c.isActive !== false)
                .map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => navigateCategory((cat.slug || cat.id) as any)}
                      className="hover:text-white hover:underline cursor-pointer text-left truncate max-w-full"
                    >
                      {isEn ? cat.nameEn : cat.nameBn}
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h3 className="font-bold uppercase tracking-wider text-white">
              {t.footerLegalTitle}
            </h3>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => navigatePage('about')}
                  className="hover:text-white hover:underline cursor-pointer"
                >
                  {t.footerAboutLink}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigatePage('editorial_policy')}
                  className="hover:text-white hover:underline cursor-pointer"
                >
                  {t.footerEditorialLink}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigatePage('contact')}
                  className="hover:text-white hover:underline cursor-pointer"
                >
                  {t.footerContactLink}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigatePage('privacy')}
                  className="hover:text-white hover:underline cursor-pointer"
                >
                  {t.footerPrivacyLink}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigatePage('terms')}
                  className="hover:text-white hover:underline cursor-pointer"
                >
                  {t.footerTermsLink}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigatePage('disclaimer')}
                  className="hover:text-white hover:underline cursor-pointer"
                >
                  {t.footerDisclaimerLink}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigatePage('corrections_policy')}
                  className="hover:text-white hover:underline cursor-pointer"
                >
                  {t.footerCorrectionsLink}
                </button>
              </li>
              {customPages
                .filter(
                  (p) =>
                    p.isPublished &&
                    ![
                      'about',
                      'contact',
                      'privacy',
                      'terms',
                      'disclaimer',
                      'editorial-policy',
                      'editorial_policy',
                      'corrections-policy',
                      'corrections_policy',
                    ].includes(p.slug)
                )
                .map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => navigatePage(p.slug as any)}
                      className="hover:text-white hover:underline cursor-pointer"
                    >
                      {isEn ? p.titleEn : p.titleBn}
                    </button>
                  </li>
                ))}
              <li>
                <button
                  type="button"
                  onClick={() => navigatePage('submit_news')}
                  className="hover:text-white hover:underline cursor-pointer text-emerald-400 font-semibold"
                >
                  {t.footerSubmitNewsLink}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-900/80 py-4 px-4 sm:px-6 text-center text-xs text-slate-400">
          {(isEn
            ? (settings.footerSettings?.copyrightTextEn || settings.footer?.copyrightTextEn)
            : (settings.footerSettings?.copyrightTextBn || settings.footer?.copyrightTextBn)) || t.footerCopyright}
        </div>
      </footer>
    </div>
  );
}
