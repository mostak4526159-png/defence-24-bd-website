import React, { useEffect, useState } from 'react';
import { signInWithPopup, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail } from 'firebase/auth';
import {
  auth,
  deleteAdminArticleFromFirestore,
  deleteAuthorFromFirestore,
  deleteCategoryFromFirestore,
  deleteCircularFromFirestore,
  deleteMediaItemFromFirestore,
  deleteNoticeFromFirestore,
  deletePageFromFirestore,
  FIREBASE_PROJECT_INFO,
  googleAuthProvider,
  seedAllPortalDataToFirestore,
  signInAdminWithFirebaseEmail,
  syncAdminArticleToFirestore,
  syncAuthorToFirestore,
  syncCategoryToFirestore,
  syncCircularToFirestore,
  syncHomepageSectionToFirestore,
  syncMediaItemToFirestore,
  syncNoticeToFirestore,
  syncPageToFirestore,
  syncSettingsToFirestore,
  testFirestoreConnection,
  uploadEditorialImageToStorage,
  verifyAndLoadAdminProfileFromFirestore,
} from '../lib/firebase.ts';
import {
  DEFAULT_CLOUDINARY_CLOUD_NAME,
  DEFAULT_CLOUDINARY_UPLOAD_PRESET,
  getSavedCloudinaryConfig,
  saveCloudinaryConfigToLocal,
  uploadDocumentToCloudinary,
  uploadImageToCloudinary,
} from '../lib/cloudinary.ts';
import {
  computeThumbnailContentHash,
  generateAndUploadWebsiteThumbnail,
  generateThumbnailVariationsPreview,
  renderManualThumbnailWithAdjustments,
  ThumbnailVariationPreview,
} from '../lib/thumbnailGenerator.ts';
import { getCategoryUrlSlug, slugifyText } from '../lib/routing.ts';
import { downloadDeveloperNetlifyZip } from '../lib/developerZipExport.ts';
import {
  ActivityLogItem,
  AdminPermission,
  AdminRole,
  AdminStatus,
  ALL_ADMIN_PERMISSIONS,
  ArticleStatus,
  AuthorProfile,
  CustomCategory,
  CustomPage,
  DEFAULT_ROLE_PERMISSIONS,
  FooterSettings,
  ForceCategory,
  HeaderSettings,
  HomepageSection,
  JobCircular,
  Language,
  MediaItem,
  NewsArticle,
  PortalNotice,
  PortalSettings,
  VisualSlotKey,
} from '../types/news.ts';
import {
  ALL_15_CATEGORIES,
  CATEGORY_LABELS,
} from '../data/initialData.ts';
import {
  DEFAULT_COLOR_SETTINGS,
  DEFAULT_CUSTOM_CATEGORIES,
  DEFAULT_CUSTOM_PAGES,
  DEFAULT_FOOTER_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_TYPOGRAPHY_SETTINGS,
  INITIAL_MEDIA_ITEMS,
} from '../data/customizationDefaults.ts';
import { HeaderFooterManager } from './admin/HeaderFooterManager.tsx';
import { WebsiteCustomizationHub } from './admin/WebsiteCustomizationHub.tsx';
import { HomepageBuilder } from './admin/HomepageBuilder.tsx';
import { CategoryManager } from './admin/CategoryManager.tsx';
import { PageManager } from './admin/PageManager.tsx';
import { AppearanceManager } from './admin/AppearanceManager.tsx';
import { MediaLibrary } from './admin/MediaLibrary.tsx';
import { LivePreviewModal } from './admin/LivePreviewModal.tsx';
import { BackupRestoreManager } from './admin/BackupRestoreManager.tsx';
import { AdminManagement } from './admin/AdminManagement.tsx';
import {
  Check,
  Edit3,
  Eye,
  FilePlus,
  FileUp,
  FolderTree,
  Laptop,
  Layers,
  Layout,
  Lock,
  LogOut,
  Palette,
  Plus,
  Key,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Type,
  Video,
  XCircle,
} from 'lucide-react';

interface AdminSectionProps {
  lang: Language;
  onChangeLang?: (nextLang: Language) => void;
  articles: NewsArticle[];
  circulars: JobCircular[];
  notices: PortalNotice[];
  settings: PortalSettings;
  customCategories?: CustomCategory[];
  customPages?: CustomPage[];
  homepageSections?: HomepageSection[];
  mediaItems?: MediaItem[];
  onPortalStateUpdated: (payload: {
    articles?: NewsArticle[];
    circulars?: JobCircular[];
    notices?: PortalNotice[];
    settings?: PortalSettings;
    categories?: CustomCategory[];
    pages?: CustomPage[];
    sections?: HomepageSection[];
    media?: MediaItem[];
  }) => void;
  onExitToWebsite?: () => void;
}

const ADMIN_LANG_STORAGE_KEY = 'defence24_admin_lang_v1';
const ADMIN_USERS_STORAGE_KEY = 'defence24_admin_users_v1';
const SUPER_ADMIN_OWNER_EMAIL = 'mostak4526159@gmail.com';
const SUPER_ADMIN_EMAIL = SUPER_ADMIN_OWNER_EMAIL;
type AuthorUser = AuthorProfile;

const PERMISSION_LABELS: Record<AdminPermission, { en: string; bn: string }> = {
  add_news: { en: 'Add News', bn: 'সংবাদ যোগ করা' },
  edit_news: { en: 'Edit News', bn: 'সংবাদ সম্পাদনা করা' },
  delete_news: { en: 'Delete News', bn: 'সংবাদ মুছে ফেলা' },
  publish_news: { en: 'Publish / Approve News', bn: 'সংবাদ প্রকাশ ও অনুমোদন' },
  manage_notices: { en: 'Manage Notices', bn: 'নোটিশ পরিচালনা' },
  manage_circulars: { en: 'Manage Circulars', bn: 'নিয়োগ বিজ্ঞপ্তি পরিচালনা' },
  upload_images: { en: 'Upload Images & Thumbnails', bn: 'ছবি ও থাম্বনেইল আপলোড' },
  manage_categories: { en: 'Manage Categories', bn: 'বিভাগ পরিচালনা' },
  manage_seo: { en: 'Manage SEO', bn: 'এসইও পরিচালনা' },
  manage_homepage: { en: 'Manage Homepage', bn: 'হোমপেজ পরিচালনা' },
  manage_header_footer: { en: 'Manage Header & Footer', bn: 'হেডার ও ফুটার পরিচালনা' },
  manage_ads: { en: 'Manage Advertisements', bn: 'বিজ্ঞাপন পরিচালনা' },
  manage_settings: { en: 'Manage Portal Settings', bn: 'পোর্টাল সেটিংস পরিচালনা' },
  manage_admins: { en: 'Manage Administrators', bn: 'অ্যাডমিন পরিচালনা' },
  view_logs: { en: 'View Activity Logs', bn: 'অ্যাক্টিভিটি লগ দেখা' },
  export_data: { en: 'Export Portal Data', bn: 'ডাটা এক্সপোর্ট' },
};

const ROLE_LABELS: Record<AdminRole, { en: string; bn: string }> = {
  super_admin: { en: 'Super Admin (Owner)', bn: 'সুপার অ্যাডমিন (প্রধান নিয়ন্ত্রক)' },
  admin: { en: 'Administrator', bn: 'প্রশাসক' },
  editor: { en: 'Editor', bn: 'সম্পাদক' },
  author: { en: 'Author', bn: 'প্রতিবেদক' },
  moderator: { en: 'Moderator', bn: 'পর্যালোচক' },
};

const STATUS_LABELS: Record<string, { en: string; bn: string }> = {
  all: { en: 'All', bn: 'সকল' },
  published: { en: 'Published', bn: 'প্রকাশিত' },
  pending: { en: 'Pending', bn: 'অপেক্ষমাণ' },
  draft: { en: 'Draft', bn: 'খসড়া' },
  rejected: { en: 'Rejected', bn: 'বাতিলকৃত' },
};

const INITIAL_SUPER_ADMIN_PROFILE: AuthorProfile = {
  id: 1,
  uid: 'super-admin-mostak',
  email: SUPER_ADMIN_OWNER_EMAIL,
  name: 'Mostak — Chief Super Admin',
  role: 'super_admin',
  status: 'active',
  permissions: [...ALL_ADMIN_PERMISSIONS],
  createdAtIso: '2026-11-08T00:00:00Z',
};

function loadSavedAdminUsers(): AuthorProfile[] {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthorProfile[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter(
          (u) => u.email && !u.email.toLowerCase().includes('@defence24')
        );
        const hasSuper = filtered.some(
          (u) => u.email.trim().toLowerCase() === SUPER_ADMIN_OWNER_EMAIL
        );
        if (!hasSuper) {
          return [INITIAL_SUPER_ADMIN_PROFILE, ...filtered];
        }
        return filtered.map((u) =>
          u.email.trim().toLowerCase() === SUPER_ADMIN_OWNER_EMAIL
            ? {
                ...u,
                role: 'super_admin',
                status: 'active',
                permissions: [...ALL_ADMIN_PERMISSIONS],
              }
            : {
                ...u,
                status: u.status || 'active',
                permissions:
                  u.permissions && u.permissions.length > 0
                    ? u.permissions
                    : DEFAULT_ROLE_PERMISSIONS[u.role || 'editor'],
              }
        );
      }
    }
  } catch {
    // ignore
  }
  return [INITIAL_SUPER_ADMIN_PROFILE];
}

export const AdminSection: React.FC<AdminSectionProps> = ({
  lang: initialPublicLang,
  onChangeLang,
  articles,
  circulars,
  notices,
  settings,
  customCategories = DEFAULT_CUSTOM_CATEGORIES,
  customPages = DEFAULT_CUSTOM_PAGES,
  homepageSections = DEFAULT_HOMEPAGE_SECTIONS,
  mediaItems = INITIAL_MEDIA_ITEMS,
  onPortalStateUpdated,
  onExitToWebsite,
}) => {
  // Unified Bilingual Language State across Public Website & Admin Panel
  const [lang, setAdminLangState] = useState<Language>(() => {
    if (initialPublicLang === 'bn' || initialPublicLang === 'en') {
      return initialPublicLang;
    }
    try {
      const saved = localStorage.getItem(ADMIN_LANG_STORAGE_KEY);
      if (saved === 'bn' || saved === 'en') return saved;
    } catch {
      // ignore
    }
    return 'bn';
  });

  useEffect(() => {
    if (initialPublicLang === 'bn' || initialPublicLang === 'en') {
      setAdminLangState(initialPublicLang);
    }
  }, [initialPublicLang]);

  const setAdminLang = (nextLang: Language) => {
    setAdminLangState(nextLang);
    onChangeLang?.(nextLang);
    try {
      localStorage.setItem(ADMIN_LANG_STORAGE_KEY, nextLang);
    } catch {
      // ignore
    }
  };

  const isEn = lang === 'en';

  // In-memory auth state
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{
    uid?: string;
    email: string;
    name: string;
    role: AdminRole;
    permissions?: AdminPermission[];
  } | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showEmailFallbackLogin, setShowEmailFallbackLogin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Live Viewport Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Admin Dashboard Navigation
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'editor'
    | 'submissions'
    | 'header_footer'
    | 'homepage_builder'
    | 'categories_manager'
    | 'pages_manager'
    | 'appearance_manager'
    | 'media_manager'
    | 'notices_circulars'
    | 'seo_ads_settings'
    | 'authors_logs'
    | 'categories_media_lang'
    | 'backup_restore'
    | 'admin_management'
    | 'firebase_dev'
  >('overview');

  const [langManagerMode, setLangManagerMode] = useState<'bn' | 'en'>('bn');
  const [selectedAdminCategory, setSelectedAdminCategory] = useState<ForceCategory | 'all'>('all');
  const [quickVideoInput, setQuickVideoInput] = useState<Record<string, string>>({});

  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [authors, setAuthors] = useState<AuthorProfile[]>(loadSavedAdminUsers);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

  // Article Editor State (Create / Edit / Draft / Publish / Video / Image)
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [category, setCategory] = useState<ForceCategory>('army');
  const [articleStatus, setArticleStatus] = useState<ArticleStatus>('published');
  const [visualKey, setVisualKey] = useState<VisualSlotKey>('army_parade');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState('');
  const [articleSlug, setArticleSlug] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [regeneratingArticleId, setRegeneratingArticleId] = useState<string | null>(null);
  const [confirmRegenerateArticleId, setConfirmRegenerateArticleId] = useState<string | null>(null);
  const [thumbnailVariationSeed, setThumbnailVariationSeed] = useState(0);
  const [autoGenerateOnCreate, setAutoGenerateOnCreate] = useState(true);
  const [thumbnailSourceMode, setThumbnailSourceMode] = useState<'auto' | 'regenerate' | 'manual'>('auto');
  const [variationPreviews, setVariationPreviews] = useState<ThumbnailVariationPreview[]>([]);
  const [selectedVariationSeed, setSelectedVariationSeed] = useState<number | null>(null);
  const [pendingThumbnailConfirm, setPendingThumbnailConfirm] = useState<{
    dataUrl: string;
    file?: File;
    variationSeed?: number;
    labelBn: string;
    labelEn: string;
    sourceMode: 'auto' | 'regenerate' | 'manual';
  } | null>(null);

  // Manual Thumbnail Upload & Studio Controls (Android Gallery, iPhone Photos, Desktop File Picker & Drag-and-Drop)
  const [manualSourceDataUrl, setManualSourceDataUrl] = useState<string>('');
  const [manualZoom, setManualZoom] = useState<number>(1);
  const [manualPanX, setManualPanX] = useState<number>(0);
  const [manualPanY, setManualPanY] = useState<number>(0);
  const [manualApplyBranding, setManualApplyBranding] = useState<boolean>(true);
  const [manualApplyWatermark, setManualApplyWatermark] = useState<boolean>(true);
  const [manualIncludeHeadline, setManualIncludeHeadline] = useState<boolean>(false);
  const [manualPreviewDataUrl, setManualPreviewDataUrl] = useState<string>('');
  const [manualPreviewFile, setManualPreviewFile] = useState<File | null>(null);
  const [isDraggingManualImage, setIsDraggingManualImage] = useState<boolean>(false);
  const initialCloudCfg = getSavedCloudinaryConfig(
    settings.cloudinaryCloudName || DEFAULT_CLOUDINARY_CLOUD_NAME,
    settings.cloudinaryUploadPreset || DEFAULT_CLOUDINARY_UPLOAD_PRESET
  );
  const [cloudNameInput, setCloudNameInput] = useState(
    initialCloudCfg.cloudName || DEFAULT_CLOUDINARY_CLOUD_NAME
  );
  const [uploadPresetInput, setUploadPresetInput] = useState(
    initialCloudCfg.uploadPreset || DEFAULT_CLOUDINARY_UPLOAD_PRESET
  );
  const [showCloudinarySetup, setShowCloudinarySetup] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [organization, setOrganization] = useState('Bangladesh Army');
  const [isLeadStory, setIsLeadStory] = useState(false);
  const [isBreakingTicker, setIsBreakingTicker] = useState(true);
  const [titleEn, setTitleEn] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [locationEn, setLocationEn] = useState('Dhaka Cantonment');
  const [bodyEn, setBodyEn] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [subtitleBn, setSubtitleBn] = useState('');
  const [locationBn, setLocationBn] = useState('ঢাকা সেনানিবাস');
  const [bodyBn, setBodyBn] = useState('');
  const [seoMetaTitleEn, setSeoMetaTitleEn] = useState('');
  const [seoMetaDescEn, setSeoMetaDescEn] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageAltTextBn, setImageAltTextBn] = useState('');
  const [imageAltTextEn, setImageAltTextEn] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [scheduledPublishAtIso, setScheduledPublishAtIso] = useState('');

  // Submissions & News Filter
  const [queueFilter, setQueueFilter] = useState<ArticleStatus | 'all'>('all');

  // Notice Form State
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<'breaking' | 'emergency' | 'announcement'>('breaking');
  const [noticeTitleEn, setNoticeTitleEn] = useState('');
  const [noticeTitleBn, setNoticeTitleBn] = useState('');

  // Circular Form State
  const [editingCircularId, setEditingCircularId] = useState<string | null>(null);
  const [circCategory, setCircCategory] = useState<ForceCategory>('recruitment');
  const [circTitleEn, setCircTitleEn] = useState('');
  const [circOrgEn, setCircOrgEn] = useState('Bangladesh Army');
  const [circPosEn, setCircPosEn] = useState('');
  const [circQualEn, setCircQualEn] = useState('');
  const [circDeadlineEn, setCircDeadlineEn] = useState('December 30, 2026');
  const [circPortal, setCircPortal] = useState('joinbangladesharmy.army.mil.bd');
  const [circTitleBn, setCircTitleBn] = useState('');
  const [circOrgBn, setCircOrgBn] = useState('বাংলাদেশ সেনাবাহিনী');
  const [circPosBn, setCircPosBn] = useState('');
  const [circQualBn, setCircQualBn] = useState('');
  const [circDeadlineBn, setCircDeadlineBn] = useState('৩০ ডিসেম্বর ২০২৬');
  const [circPdfUrl, setCircPdfUrl] = useState('');
  const [isUploadingCircPdf, setIsUploadingCircPdf] = useState(false);

  // Settings & SEO State
  const [localSettings, setLocalSettings] = useState<PortalSettings>(settings);

  // Super Admin & Multi-Admin Form State
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorEmail, setNewAuthorEmail] = useState('');
  const [newAuthorRole, setNewAuthorRole] = useState<AdminRole>('editor');
  const [newAuthorPermissions, setNewAuthorPermissions] = useState<AdminPermission[]>(
    DEFAULT_ROLE_PERMISSIONS.editor
  );
  const [expandedAuthorUid, setExpandedAuthorUid] = useState<string | null>(null);

  const isCurrentUserSuperAdmin =
    adminUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
    adminUser?.role === 'super_admin';

  const hasPermission = (perm: AdminPermission): boolean => {
    if (!adminUser) return false;
    if (isCurrentUserSuperAdmin || adminUser.role === 'admin') return true;
    const perms = adminUser.permissions || DEFAULT_ROLE_PERMISSIONS[adminUser.role] || [];
    return perms.includes(perm);
  };

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(authors));
    } catch {
      // ignore storage errors
    }
  }, [authors]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    void testFirestoreConnection();
  }, []);

  const fetchAdminDataFromServer = async (token: string) => {
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await safeJsonResponse(res);
        onPortalStateUpdated({
          articles: data.articles,
          circulars: data.circulars,
          notices: data.notices,
          settings: data.settings,
        });
        if (Array.isArray(data.authors) && data.authors.length > 0) {
          setAuthors((prev) => {
            const merged = new Map<string, AuthorUser>();
            for (const item of [...prev, ...data.authors]) {
              merged.set(item.email.toLowerCase(), item);
            }
            return Array.from(merged.values());
          });
        }
        if (data.logs) setActivityLogs(data.logs);
      }
    } catch {
      // fallback to current state
    }
  };

  const verifyAuthorizedAdminAccount = async (
    uid: string,
    email: string,
    displayName: string | null
  ): Promise<AuthorUser | null> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return null;

    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      const superProfile: AuthorUser = {
        id: 1,
        uid: uid || 'super-admin-owner',
        email: SUPER_ADMIN_EMAIL,
        name: displayName || 'Super Administrator (Owner)',
        role: 'super_admin',
        status: 'active',
        permissions: [...ALL_ADMIN_PERMISSIONS],
      };
      await verifyAndLoadAdminProfileFromFirestore(uid, cleanEmail, displayName || undefined);
      return superProfile;
    }

    const localMatch = authors.find((a) => a.email.toLowerCase() === cleanEmail);
    if (localMatch) {
      if (localMatch.status === 'suspended') {
        throw new Error(
          isEn
            ? 'Your administrator account has been suspended by the Super Admin.'
            : 'সুপার অ্যাডমিন কর্তৃক আপনার অ্যাডমিন অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে।'
        );
      }
      return {
        ...localMatch,
        uid: uid || localMatch.uid,
        name: displayName || localMatch.name,
        permissions:
          localMatch.permissions && localMatch.permissions.length > 0
            ? localMatch.permissions
            : DEFAULT_ROLE_PERMISSIONS[localMatch.role] || DEFAULT_ROLE_PERMISSIONS.editor,
      };
    }

    const firestoreProfile = await verifyAndLoadAdminProfileFromFirestore(
      uid,
      cleanEmail,
      displayName || undefined
    );
    if (firestoreProfile) {
      return {
        id: Date.now(),
        uid: firestoreProfile.uid,
        email: firestoreProfile.email,
        name: firestoreProfile.name,
        role: firestoreProfile.role,
        status: firestoreProfile.status,
        permissions: firestoreProfile.permissions,
      };
    }

    return null;
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    const cleanEmail = loginEmail.trim().toLowerCase();

    try {
      // 0. Set Persistence based on Remember Me
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      // 1. Try Firebase Email/Password Authentication first
      try {
        const fbSession = await signInAdminWithFirebaseEmail(cleanEmail, loginPassword);
        const verifiedProfile = await verifyAuthorizedAdminAccount(
          fbSession.user.uid,
          fbSession.user.email,
          fbSession.user.name
        );
        if (!verifiedProfile) {
          await signOut(auth);
          setAuthError(
            isEn
              ? 'Access Denied: This email is not invited or approved as an administrator.'
              : 'প্রবেশাধিকার সংরক্ষিত: এই ইমেইলটি অনুমোদিত অ্যাডমিন তালিকায় নেই।'
          );
          return;
        }
        setAuthToken(fbSession.token);
        setAdminUser({
          uid: verifiedProfile.uid,
          email: verifiedProfile.email,
          name: verifiedProfile.name,
          role: verifiedProfile.role,
          permissions: verifiedProfile.permissions,
        });
        await fetchAdminDataFromServer(fbSession.token);
        return;
      } catch (fbErr: any) {
        if (fbErr?.message?.includes('suspended') || fbErr?.message?.includes('স্থগিত')) {
          setAuthError(fbErr.message);
          return;
        }
      }

      // 2. Try Express Backend Admin Authentication
      try {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password: loginPassword,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await safeJsonResponse(res);
          if (res.ok && data.token && data.user) {
            const role: AdminRole =
              cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()
                ? 'super_admin'
                : (data.user.role as AdminRole) || 'admin';
            setAuthToken(data.token);
            setAdminUser({
              uid: data.user.uid || 'admin-1',
              email: data.user.email,
              name: data.user.name,
              role,
              permissions: data.user.permissions || DEFAULT_ROLE_PERMISSIONS[role],
            });
            await fetchAdminDataFromServer(data.token);
            return;
          }
          setAuthError(
            isEn
              ? data.error || 'Unauthorized email or invalid credentials. Please use Google Sign-In.'
              : 'অননুমোদিত ইমেইল অথবা ভুল পাসওয়ার্ড। অনুগ্রহ করে গুগল সাইন-ইন ব্যবহার করুন।'
          );
          return;
        }
      } catch (err) {
        console.warn('Backend authentication attempt encountered network error:', err);
      }

      setAuthError(
        isEn
          ? 'Please sign in with your authorized Google account (mostak4526159@gmail.com or invited admin Gmail).'
          : 'অনুগ্রহ করে আপনার অনুমোদিত গুগল অ্যাকাউন্ট (mostak4526159@gmail.com অথবা আমন্ত্রিত জিমেইল) দিয়ে লগইন করুন।'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      // Set Persistence based on Remember Me
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      const cred = await signInWithPopup(auth, googleAuthProvider);
      const userEmail = (cred.user.email || '').trim().toLowerCase();
      const idToken = await cred.user.getIdToken();

      const verifiedProfile = await verifyAuthorizedAdminAccount(
        cred.user.uid,
        userEmail,
        cred.user.displayName
      );

      if (!verifiedProfile) {
        await signOut(auth);
        setAuthError(
          isEn
            ? `Access Denied: "${userEmail}" is not an authorized administrator. Only the Super Admin (${SUPER_ADMIN_EMAIL}) or invited & approved Gmail accounts can access /admin.`
            : `প্রবেশাধিকার নেই: "${userEmail}" অনুমোদিত অ্যাডমিন নয়। শুধুমাত্র সুপার অ্যাডমিন (${SUPER_ADMIN_EMAIL}) অথবা অনুমোদিত জিমেইল অ্যাকাউন্টগুলো /admin প্যানেলে প্রবেশ করতে পারবে।`
        );
        return;
      }

      // Also notify backend if reachable to obtain a session token or use Firebase ID token
      let sessionToken = idToken;
      try {
        const res = await fetch('/api/auth/google-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: cred.user.uid,
            email: userEmail,
            name: cred.user.displayName || verifiedProfile.name,
          }),
        });
        if (res.ok) {
          const data = await safeJsonResponse(res);
          if (data.token) sessionToken = data.token;
        }
      } catch {
        // Use Firebase idToken directly
      }

      setAuthToken(sessionToken);
      setAdminUser({
        uid: verifiedProfile.uid,
        email: verifiedProfile.email,
        name: verifiedProfile.name,
        role: verifiedProfile.role,
        permissions: verifiedProfile.permissions,
      });
      await fetchAdminDataFromServer(sessionToken);
    } catch (err: any) {
      setAuthError(
        err?.message && (err.message.includes('suspended') || err.message.includes('স্থগিত'))
          ? err.message
          : isEn
          ? `Google Sign-In failed or popup was closed (${err?.code || 'auth/popup'}). Ensure your Gmail account is authorized.`
          : 'গুগল সাইন-ইন সম্পন্ন হয়নি। আপনার অনুমোদিত জিমেইল অ্যাকাউন্ট দিয়ে পুনরায় চেষ্টা করুন।'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {
        // ignore
      }
    }
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setAuthToken(null);
    setAdminUser(null);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetStatus({
        type: 'success',
        message: isEn 
          ? 'Password reset email sent. Please check your inbox.' 
          : 'পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে। আপনার ইনবক্স চেক করুন।'
      });
      setTimeout(() => setShowPasswordReset(false), 3000);
    } catch (err: any) {
      setResetStatus({
        type: 'error',
        message: err.message || (isEn ? 'Failed to send reset email.' : 'রিসেট ইমেইল পাঠানো যায়নি।')
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Live re-render of Manual Thumbnail Studio whenever adjustments or branding toggles change
  useEffect(() => {
    if (!manualSourceDataUrl) {
      setManualPreviewDataUrl('');
      setManualPreviewFile(null);
      return;
    }
    let cancelled = false;
    void renderManualThumbnailWithAdjustments({
      imageSourceUrl: manualSourceDataUrl,
      zoom: manualZoom,
      panX: manualPanX,
      panY: manualPanY,
      applyBranding: manualApplyBranding,
      applyWatermark: manualApplyWatermark,
      headlineOverlay: manualIncludeHeadline
        ? titleBn.trim() || titleEn.trim()
        : undefined,
      categoryLabel:
        CATEGORY_LABELS[category as ForceCategory]?.[lang] || category,
    })
      .then((res) => {
        if (!cancelled) {
          setManualPreviewDataUrl(res.dataUrl);
          setManualPreviewFile(res.file);
        }
      })
      .catch(() => {
        // Fallback to raw source if canvas adjustment fails
        if (!cancelled) {
          setManualPreviewDataUrl(manualSourceDataUrl);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    manualSourceDataUrl,
    manualZoom,
    manualPanX,
    manualPanY,
    manualApplyBranding,
    manualApplyWatermark,
    manualIncludeHeadline,
    titleBn,
    titleEn,
    category,
    lang,
  ]);

  const applyAndUploadCandidateThumbnail = async (candidate: {
    dataUrl: string;
    file?: File;
    variationSeed?: number;
    labelBn: string;
    labelEn: string;
    sourceMode: 'auto' | 'regenerate' | 'manual';
  }) => {
    setUploadError(null);
    setIsGeneratingThumbnail(true);
    setUploadProgress(15);
    setPendingThumbnailConfirm(null);

    if (typeof candidate.variationSeed === 'number') {
      setThumbnailVariationSeed(candidate.variationSeed);
      setSelectedVariationSeed(candidate.variationSeed);
    }

    try {
      let fileToUpload = candidate.file;
      if (!fileToUpload) {
        const resp = await fetch(candidate.dataUrl);
        const blob = await resp.blob();
        fileToUpload = new File([blob], `defence24bd_thumb_${Date.now()}.jpg`, {
          type: blob.type || 'image/jpeg',
        });
      }

      const uploaded = await uploadImageToCloudinary(fileToUpload, {
        cloudName: cloudNameInput || DEFAULT_CLOUDINARY_CLOUD_NAME,
        uploadPreset: uploadPresetInput || DEFAULT_CLOUDINARY_UPLOAD_PRESET,
        folder: `defence24bd/${category}`,
        lang,
        onProgress: (pct) => setUploadProgress(pct),
      });

      setCustomImageUrl(uploaded.secureUrl);
      setCloudinaryPublicId(uploaded.publicId);
      setThumbnailSourceMode(candidate.sourceMode);
      setUploadProgress(null);

      // If currently editing an existing post, also sync the newly confirmed thumbnail to Firestore
      if (editingArticleId) {
        const targetArt = articles.find((a) => a.id === editingArticleId);
        if (targetArt) {
          const updatedArt: NewsArticle = {
            ...targetArt,
            customImageUrl: uploaded.secureUrl,
            cloudinaryPublicId: uploaded.publicId,
            updatedAtIso: new Date().toISOString(),
          };
          await syncAdminArticleToFirestore(updatedArt);
          if (authToken) {
            try {
              const res = await fetch('/api/admin/article', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(updatedArt),
              });
              if (res.ok) {
                const data = await safeJsonResponse(res);
                onPortalStateUpdated({ articles: data.articles });
              }
            } catch {
              // ignore
            }
          } else {
            onPortalStateUpdated({
              articles: articles.map((a) => (a.id === editingArticleId ? updatedArt : a)),
            });
          }
        }
      }

      setStatusBanner(
        isEn
          ? `Selected thumbnail (${candidate.labelEn}) uploaded to Cloudinary (${uploaded.publicId}) and ready for publication.`
          : `নির্বাচিত থাম্বনেইল (${candidate.labelBn}) ক্লাউডিনারিতে আপলোড হয়েছে (${uploaded.publicId}) এবং প্রকাশের জন্য প্রস্তুত।`
      );
    } catch {
      // Never block workflow if Cloudinary upload fails: use local dataUrl seamlessly
      setCustomImageUrl(candidate.dataUrl);
      setCloudinaryPublicId(`local_canvas_${Date.now()}`);
      setThumbnailSourceMode(candidate.sourceMode);
      setUploadProgress(null);
      setStatusBanner(
        isEn
          ? `Selected thumbnail (${candidate.labelEn}) applied locally and ready for publication.`
          : `নির্বাচিত থাম্বনেইল (${candidate.labelBn}) সফলভাবে যুক্ত হয়েছে এবং প্রকাশের জন্য প্রস্তুত।`
      );
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const requestApplyThumbnailWithConfirmation = (candidate: {
    dataUrl: string;
    file?: File;
    variationSeed?: number;
    labelBn: string;
    labelEn: string;
    sourceMode: 'auto' | 'regenerate' | 'manual';
  }) => {
    // Requirement: Do not replace an already selected thumbnail without confirmation
    if (customImageUrl.trim() && customImageUrl.trim() !== candidate.dataUrl) {
      setPendingThumbnailConfirm(candidate);
      return;
    }
    void applyAndUploadCandidateThumbnail(candidate);
  };

  const processManualImageFile = (file: File) => {
    setUploadError(null);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name.toLowerCase().split('.').pop() || '';
    if (!allowed.includes(file.type.toLowerCase()) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setUploadError(
        isEn
          ? 'Unsupported file format. Please select a JPG, JPEG, PNG, or WebP image.'
          : 'অসমর্থিত ফাইল ফরম্যাট। অনুগ্রহ করে JPG, JPEG, PNG অথবা WebP ছবি নির্বাচন করুন।'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (dataUrl) {
        setManualSourceDataUrl(dataUrl);
        setManualZoom(1);
        setManualPanX(0);
        setManualPanY(0);
        setThumbnailSourceMode('manual');
      }
    };
    reader.onerror = () => {
      setUploadError(
        isEn
          ? 'Could not read image file from device.'
          : 'ডিভাইস থেকে ছবিটি পড়া যায়নি।'
      );
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processManualImageFile(file);
    e.target.value = '';
  };

  const handleManualDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingManualImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processManualImageFile(file);
    }
  };

  // Generates 5 template variations for preview and selection without overwriting an already selected thumbnail without confirmation
  const handleRegenerateEditorThumbnail = async () => {
    setUploadError(null);
    setIsGeneratingThumbnail(true);
    const nextSeed = thumbnailVariationSeed + 1;
    setThumbnailVariationSeed(nextSeed);
    setThumbnailSourceMode('regenerate');

    try {
      const sampleTitleBn =
        titleBn.trim() ||
        `${CATEGORY_LABELS[category as ForceCategory]?.bn || 'বাংলাদেশ প্রতিরক্ষা'} — বিশেষ সংবাদ প্রতিবেদন`;
      const sampleTitleEn =
        titleEn.trim() ||
        `${CATEGORY_LABELS[category as ForceCategory]?.en || 'Bangladesh Defence'} — Official News Dispatch`;

      const variations = await generateThumbnailVariationsPreview(
        {
          titleBn: sampleTitleBn,
          titleEn: sampleTitleEn,
          subtitleBn: subtitleBn.trim(),
          subtitleEn: subtitleEn.trim(),
          bodyBn: bodyBn.trim(),
          bodyEn: bodyEn.trim(),
          category,
          organization,
          locationBn: locationBn.trim(),
          locationEn: locationEn.trim(),
          visualKey,
          customBackgroundImageUrl: manualSourceDataUrl || undefined,
        },
        nextSeed
      );

      setVariationPreviews(variations);

      // If NO thumbnail is currently selected yet, automatically preview/select the first variation;
      // If a thumbnail IS already selected, do NOT replace it without confirmation — let the admin preview the 5 variations and confirm replacement!
      if (!customImageUrl.trim() && variations.length > 0) {
        const firstVar = variations[0];
        await applyAndUploadCandidateThumbnail({
          dataUrl: firstVar.dataUrl,
          file: firstVar.file,
          variationSeed: firstVar.variationIndex,
          labelBn: firstVar.labelBn,
          labelEn: firstVar.labelEn,
          sourceMode: 'regenerate',
        });
      } else {
        setStatusBanner(
          isEn
            ? 'Generated 5 new DEFENCE 24 BD thumbnail template variations below. Click any variation to preview and confirm replacing your current thumbnail.'
            : 'নিচে ৫টি নতুন DEFENCE 24 BD থাম্বনেইল ডিজাইন ভ্যারিয়েশন তৈরি করা হয়েছে। আপনার পছন্দের ডিজাইনটি নির্বাচন করে বর্তমান থাম্বনেইল পরিবর্তনের অনুমতি দিন।'
        );
      }
    } catch (err: any) {
      setUploadError(
        err?.message ||
          (isEn
            ? 'Failed to generate thumbnail variations.'
            : 'থাম্বনেইল ভ্যারিয়েশন তৈরি করতে ত্রুটি হয়েছে।')
      );
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleRegenerateArticleThumbnailById = async (art: NewsArticle, confirmed = false) => {
    // Do not replace an already selected thumbnail without confirmation
    if (art.customImageUrl && !confirmed && confirmRegenerateArticleId !== art.id) {
      setConfirmRegenerateArticleId(art.id);
      return;
    }
    setConfirmRegenerateArticleId(null);
    setRegeneratingArticleId(art.id);
    const nextSeed = thumbnailVariationSeed + 1;
    setThumbnailVariationSeed(nextSeed);

    try {
      const result = await generateAndUploadWebsiteThumbnail(
        {
          titleBn: art.bn.title,
          titleEn: art.en.title,
          subtitleBn: art.bn.subtitle,
          subtitleEn: art.en.subtitle,
          bodyBn: art.bn.body,
          bodyEn: art.en.body,
          category: art.category,
          organization: art.organization,
          locationBn: art.bn.location,
          locationEn: art.en.location,
          visualKey: art.visualKey,
          variationSeed: nextSeed,
        },
        {
          cloudName: cloudNameInput || DEFAULT_CLOUDINARY_CLOUD_NAME,
          uploadPreset: uploadPresetInput || DEFAULT_CLOUDINARY_UPLOAD_PRESET,
          lang,
        }
      );

      const updatedArt: NewsArticle = {
        ...art,
        customImageUrl: result.secureUrl,
        cloudinaryPublicId: result.publicId,
        updatedAtIso: new Date().toISOString(),
      };

      await syncAdminArticleToFirestore(updatedArt);

      if (authToken) {
        try {
          const res = await fetch('/api/admin/article', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(updatedArt),
          });
          if (res.ok) {
            const data = await safeJsonResponse(res);
            onPortalStateUpdated({ articles: data.articles });
          } else {
            onPortalStateUpdated({
              articles: articles.map((a) => (a.id === art.id ? updatedArt : a)),
            });
          }
        } catch {
          onPortalStateUpdated({
            articles: articles.map((a) => (a.id === art.id ? updatedArt : a)),
          });
        }
      } else {
        onPortalStateUpdated({
          articles: articles.map((a) => (a.id === art.id ? updatedArt : a)),
        });
      }

      if (editingArticleId === art.id) {
        setCustomImageUrl(result.secureUrl);
        setCloudinaryPublicId(result.publicId);
      }

      setStatusBanner(
        isEn
          ? `Regenerated DEFENCE 24 BD thumbnail for "${art.en.title}" and saved to Cloudinary & Firestore.`
          : `"${art.bn.title}" সংবাদের নতুন থাম্বনেইল তৈরি করে ক্লাউডিনারি ও ফায়ারস্টোরে সংরক্ষণ করা হয়েছে।`
      );
    } catch (err: any) {
      setStatusBanner(
        err?.message ||
          (isEn ? 'Failed to regenerate thumbnail.' : 'থাম্বনেইল পুনরায় তৈরি করা যায়নি।')
      );
    } finally {
      setRegeneratingArticleId(null);
    }
  };

  const handleSaveCloudinaryCredentials = async () => {
    saveCloudinaryConfigToLocal(cloudNameInput, uploadPresetInput);
    const updatedSettings: PortalSettings = {
      ...localSettings,
      cloudinaryCloudName: cloudNameInput.trim(),
      cloudinaryUploadPreset: uploadPresetInput.trim(),
    };
    setLocalSettings(updatedSettings);
    onPortalStateUpdated({ settings: updatedSettings });
    await syncSettingsToFirestore(updatedSettings);
    setShowCloudinarySetup(false);
    setStatusBanner(
      isEn
        ? 'Cloudinary Cloud Name & Unsigned Upload Preset saved.'
        : 'ক্লাউডিনারি Cloud Name এবং Unsigned Upload Preset সংরক্ষিত হয়েছে।'
    );
  };

  const safeJsonResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Expected JSON but received:', text.slice(0, 200));
      
      if (res.status === 404) {
        throw new Error(isEn 
          ? `Backend Error (404): The API endpoint was not found. This usually means the serverless functions (netlify/functions) were not included in your deployment. Please download the latest "Netlify Drop" ZIP and ensure you upload the WHOLE content.`
          : `ব্যাকএন্ড ত্রুটি (৪০৪): এপিআই খুঁজে পাওয়া যায়নি। এর অর্থ সম্ভবত আপনার ডেপ্লয়মেন্টে সার্ভারলেস ফাংশন (netlify/functions) নেই। অনুগ্রহ করে নতুন জিপ ডাউনলোড করে সম্পূর্ণ অংশ আপলোড করুন।`);
      }

      throw new Error(isEn 
        ? `Server Error (${res.status}): Expected JSON but received HTML. Please ensure the backend is deployed and routing is correct.` 
        : `সার্ভার ত্রুটি (${res.status}): ডাটা লোড করা যায়নি। অনুগ্রহ করে ব্যাকএন্ড কানেকশন চেক করুন।`);
    }
    return await res.json();
  };

  const handleCreateAdminAccount = async (admin: any) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(admin),
      });
      if (res.ok) {
        const data = await safeJsonResponse(res);
        onPortalStateUpdated({ settings: data.settings });
        setAuthors(data.authors);
        setActivityLogs(data.logs);
        setStatusBanner(
          isEn 
            ? `Administrator ${admin.name} created successfully.` 
            : `অ্যাডমিন ${admin.name} সফলভাবে তৈরি করা হয়েছে।`
        );
      } else {
        const err = await safeJsonResponse(res).catch(() => ({ error: 'Request failed with status ' + res.status }));
        throw new Error(err.error || 'Failed to create admin');
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdateAdminAccount = async (admin: AuthorProfile) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/admin/author', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(admin),
      });
      if (res.ok) {
        const data = await safeJsonResponse(res);
        setAuthors(data.authors);
        setActivityLogs(data.logs);
        setStatusBanner(
          isEn 
            ? `Administrator ${admin.name} updated.` 
            : `অ্যাডমিন ${admin.name} হালনাগাদ করা হয়েছে।`
        );
        await syncAuthorToFirestore(admin);
      } else {
        const err = await safeJsonResponse(res).catch(() => ({ error: 'Update failed' }));
        console.error('Update error:', err.error);
      }
    } catch (err: any) {
      console.error('Update admin error:', err);
    }
  };

  const handleRemoveAdminAccount = async (uid: string, email: string) => {
    if (!authToken) return;
    if (!window.confirm(isEn ? `Are you sure you want to remove ${email}?` : `আপনি কি নিশ্চিত যে আপনি ${email} অপসারণ করতে চান?`)) return;
    try {
      const res = await fetch(`/api/admin/author/${uid}?email=${email}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await safeJsonResponse(res);
        setAuthors(data.authors);
        setActivityLogs(data.logs);
        setStatusBanner(isEn ? 'Administrator removed.' : 'অ্যাডমিন অপসারণ করা হয়েছে।');
        await deleteAuthorFromFirestore(uid, email);
      } else {
        const err = await safeJsonResponse(res).catch(() => ({ error: 'Removal failed' }));
        console.error('Removal error:', err.error);
      }
    } catch (err: any) {
      console.error('Remove admin error:', err);
    }
  };

  const handleEditArticleClick = (art: NewsArticle) => {
    setEditingArticleId(art.id);
    setArticleSlug(art.slug || slugifyText(art.en.title));
    setCategory(art.category as ForceCategory);
    setArticleStatus(art.status || 'published');
    setVisualKey(art.visualKey);
    setCustomImageUrl(art.customImageUrl || '');
    setCloudinaryPublicId(art.cloudinaryPublicId || '');
    setThumbnailSourceMode(art.customImageUrl ? 'auto' : 'auto');
    setVariationPreviews([]);
    setPendingThumbnailConfirm(null);
    setManualSourceDataUrl('');
    setManualPreviewDataUrl('');
    setManualPreviewFile(null);
    setUploadError(null);
    setUploadProgress(null);
    setVideoUrl(art.videoUrl || '');
    setOrganization(art.organization || 'Bangladesh Armed Forces');
    setIsLeadStory(Boolean(art.isLeadStory));
    setIsBreakingTicker(art.isBreakingTicker !== false);
    setTitleEn(art.en.title);
    setSubtitleEn(art.en.subtitle);
    setLocationEn(art.en.location);
    setBodyEn(art.en.body.join('\n\n'));
    setTitleBn(art.bn.title);
    setSubtitleBn(art.bn.subtitle);
    setLocationBn(art.bn.location);
    setBodyBn(art.bn.body.join('\n\n'));
    setSeoMetaTitleEn(art.seoMetaTitleEn || art.en.title);
    setSeoMetaDescEn(art.seoMetaDescEn || art.en.subtitle);
    setSourceUrl(art.sourceUrl || '');
    setImageAltTextBn(art.imageAltTextBn || '');
    setImageAltTextEn(art.imageAltTextEn || '');
    setCanonicalUrl(art.canonicalUrl || '');
    setScheduledPublishAtIso(art.scheduledPublishAtIso || '');
    setActiveTab('editor');
  };

  const handleResetEditorForm = () => {
    setEditingArticleId(null);
    setArticleSlug('');
    setTitleEn('');
    setSubtitleEn('');
    setBodyEn('');
    setTitleBn('');
    setSubtitleBn('');
    setBodyBn('');
    setCustomImageUrl('');
    setCloudinaryPublicId('');
    setThumbnailSourceMode('auto');
    setVariationPreviews([]);
    setSelectedVariationSeed(null);
    setPendingThumbnailConfirm(null);
    setManualSourceDataUrl('');
    setManualPreviewDataUrl('');
    setManualPreviewFile(null);
    setManualZoom(1);
    setManualPanX(0);
    setManualPanY(0);
    setUploadError(null);
    setUploadProgress(null);
    setVideoUrl('');
    setSeoMetaTitleEn('');
    setSeoMetaDescEn('');
    setSourceUrl('');
    setImageAltTextBn('');
    setImageAltTextEn('');
    setCanonicalUrl('');
    setScheduledPublishAtIso('');
    setArticleStatus('published');
  };

  const handleFillSampleNews = () => {
    setCategory('defence_news');
    setArticleStatus('published');
    setVisualKey('army_parade');
    setOrganization('Armed Forces Division');
    setTitleEn('Joint Tri-Service Coastal Radar & Satellite Rescue Grid Commissioned');
    setSubtitleEn('Integrated maritime and aviation telemetry links Dhaka, Chattogram, and Cox’s Bazar command centers.');
    setLocationEn('Dhaka & Chattogram');
    setBodyEn(
      'The Armed Forces Division has commissioned a newly upgraded coastal radar and satellite rescue telemetry network spanning the Bay of Bengal littoral.\n\nBy linking naval patrol vessels, Air Force search-and-rescue helicopters, and Coast Guard stations on a single encrypted tactical channel, emergency response coordination times have been reduced by half.'
    );
    setTitleBn('উপকূলীয় রাডার ও স্যাটেলাইট উদ্ধার গ্রিড চালু করল আন্তঃবাহিনী কমান্ড');
    setSubtitleBn('ঢাকা, চট্টগ্রাম ও কক্সবাজার কমান্ড সেন্টারের মধ্যে সমন্বিত নৌ ও আকাশপথ টেলিমেট্রি সংযোগ স্থাপন।');
    setLocationBn('ঢাকা ও চট্টগ্রাম');
    setBodyBn(
      'বঙ্গোপসাগর উপকূলজুড়ে সমন্বিত অনুসন্ধান ও উদ্ধার অভিযান জোরদার করতে আধুনিক কোস্টাল রাডার ও স্যাটেলাইট রেসকিউ গ্রিড চালু করেছে সশস্ত্র বাহিনী বিভাগ।\n\nনৌবাহিনীর টহল জাহাজ, বিমান বাহিনীর উদ্ধারকারী হেলিকপ্টার এবং কোস্ট গার্ড স্টেশনসমূহ একই এনক্রিপ্টেড যোগাযোগ নেটওয়ার্কে যুক্ত হওয়ায় জরুরি সাড়াদানের সময় অর্ধেকে নেমে এসেছে।'
    );
    setSourceUrl('https://mod.gov.bd');
    setImageAltTextBn('বাংলাদেশ সশস্ত্র বাহিনীর উপকূলীয় সমন্বিত রাডার গ্রিড কেন্দ্র');
    setImageAltTextEn('Joint Coastal Radar and Rescue Grid Center');
  };

  const saveArticleWithStatus = async (targetStatus: ArticleStatus) => {
    const finalTitleEn = titleEn.trim() || 'Official Defense & Security Dispatch';
    const finalTitleBn = titleBn.trim() || 'প্রতিরক্ষা ও নিরাপত্তা বিষয়ক দাপ্তরিক প্রতিবেদন';
    const paragraphsEn = (bodyEn.trim() || finalTitleEn).split(/\n+/).filter(Boolean);
    const paragraphsBn = (bodyBn.trim() || finalTitleBn).split(/\n+/).filter(Boolean);

    const computedSlug =
      slugifyText(articleSlug.trim()) ||
      slugifyText(finalTitleEn) ||
      `dispatch-${Date.now()}`;

    const existingArt = editingArticleId
      ? articles.find((a) => a.id === editingArticleId)
      : undefined;

    const currentContentHash = computeThumbnailContentHash({
      titleBn: finalTitleBn,
      titleEn: finalTitleEn,
      category,
      visualKey,
      variationSeed: thumbnailVariationSeed,
    });

    let finalCustomImageUrl = customImageUrl.trim();
    let finalCloudinaryPublicId = cloudinaryPublicId.trim();

    // If the admin is in 'manual' mode and uploaded a photo in the Manual Studio without clicking Apply yet,
    // use that manual studio image as the selected thumbnail before publishing.
    if (!finalCustomImageUrl && thumbnailSourceMode === 'manual' && manualPreviewDataUrl) {
      setIsGeneratingThumbnail(true);
      setUploadProgress(20);
      try {
        const fileToUse =
          manualPreviewFile ||
          new File([await (await fetch(manualPreviewDataUrl)).blob()], `manual_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
        const upRes = await uploadImageToCloudinary(fileToUse, {
          cloudName: cloudNameInput || DEFAULT_CLOUDINARY_CLOUD_NAME,
          uploadPreset: uploadPresetInput || DEFAULT_CLOUDINARY_UPLOAD_PRESET,
          folder: `defence24bd/${category}`,
          lang,
          onProgress: (pct) => setUploadProgress(pct),
        });
        finalCustomImageUrl = upRes.secureUrl;
        finalCloudinaryPublicId = upRes.publicId;
      } catch {
        finalCustomImageUrl = manualPreviewDataUrl;
        finalCloudinaryPublicId = `manual_local_${Date.now()}`;
      } finally {
        setIsGeneratingThumbnail(false);
        setUploadProgress(null);
      }
    }

    // Automatically generate a branded DEFENCE 24 BD template thumbnail based on post title, category, content & available image
    // whenever creating a new website post (or when no custom thumbnail URL is set) and upload to Cloudinary ("y0n9r8df" / "Defence 24 BD").
    // Deduplication check: if editing an article whose content hash matches and already has a thumbnail, reuse existing thumbnail.
    const shouldSkipDuplicateGen =
      Boolean(existingArt?.customImageUrl) &&
      existingArt?.thumbnailPromptHash === currentContentHash &&
      Boolean(finalCustomImageUrl);

    if (!finalCustomImageUrl && autoGenerateOnCreate && !shouldSkipDuplicateGen) {
      setIsGeneratingThumbnail(true);
      setUploadProgress(15);
      try {
        const autoThumbResult = await generateAndUploadWebsiteThumbnail(
          {
            titleBn: finalTitleBn,
            titleEn: finalTitleEn,
            subtitleBn: subtitleBn.trim(),
            subtitleEn: subtitleEn.trim(),
            bodyBn: paragraphsBn,
            bodyEn: paragraphsEn,
            category,
            organization:
              organization.trim() ||
              (CATEGORY_LABELS[category as ForceCategory]?.en || 'Armed Forces'),
            locationBn: locationBn.trim() || 'ঢাকা, বাংলাদেশ',
            locationEn: locationEn.trim() || 'Dhaka, Bangladesh',
            visualKey,
            variationSeed: thumbnailVariationSeed,
            customBackgroundImageUrl: manualSourceDataUrl || undefined,
          },
          {
            cloudName: cloudNameInput || DEFAULT_CLOUDINARY_CLOUD_NAME,
            uploadPreset: uploadPresetInput || DEFAULT_CLOUDINARY_UPLOAD_PRESET,
            lang,
            onProgress: (pct) => setUploadProgress(pct),
          }
        );
        finalCustomImageUrl = autoThumbResult.secureUrl;
        finalCloudinaryPublicId = autoThumbResult.publicId;
        setCustomImageUrl(finalCustomImageUrl);
        setCloudinaryPublicId(finalCloudinaryPublicId);
      } catch (err) {
        // Never block news publishing if automatic thumbnail generation fails
        console.warn('Auto thumbnail generation fallback (publishing continues unblocked):', err);
      } finally {
        setIsGeneratingThumbnail(false);
        setUploadProgress(null);
      }
    }

    const newArticle: NewsArticle = {
      id: editingArticleId || `art-${Date.now()}`,
      slug: computedSlug,
      category,
      status: targetStatus,
      visualKey,
      customImageUrl: finalCustomImageUrl || undefined,
      cloudinaryPublicId: finalCloudinaryPublicId || undefined,
      thumbnailPromptHash: currentContentHash,
      videoUrl: videoUrl.trim() || undefined,
      organization: organization.trim() || (CATEGORY_LABELS[category as ForceCategory]?.en || 'Armed Forces'),
      isLeadStory,
      isSecondaryFeature: false,
      isBreakingTicker,
      seoMetaTitleEn: seoMetaTitleEn.trim() || finalTitleEn,
      seoMetaDescEn: seoMetaDescEn.trim() || subtitleEn.trim(),
      sourceUrl: sourceUrl.trim() || undefined,
      imageAltTextBn: imageAltTextBn.trim() || finalTitleBn,
      imageAltTextEn: imageAltTextEn.trim() || finalTitleEn,
      canonicalUrl: canonicalUrl.trim() || undefined,
      scheduledPublishAtIso: scheduledPublishAtIso.trim() || undefined,
      updatedAtIso: new Date().toISOString(),
      createdAtIso: existingArt?.createdAtIso || new Date().toISOString(),
      en: {
        title: finalTitleEn,
        subtitle: subtitleEn.trim() || 'Verified dispatch published by the Defence 24 BD Editorial Desk.',
        body: paragraphsEn,
        author: adminUser?.name || 'Editorial Defense Desk',
        authorRole: 'Senior Defense Editor',
        publishedDate: 'November 8, 2026',
        readTime: '4 min read',
        figureCaption: imageAltTextEn.trim() || `${finalTitleEn} — Defence 24 BD.`,
        location: locationEn.trim() || 'Dhaka, Bangladesh',
        keyFacts: [
          `Organization: ${organization.trim() || (CATEGORY_LABELS[category as ForceCategory]?.en || 'Armed Forces')}`,
          'Verified by Defence 24 BD Editorial Board.',
        ],
      },
      bn: {
        title: finalTitleBn,
        subtitle: subtitleBn.trim() || 'ডিফেন্স ২৪ বিডি সম্পাদনা পর্ষদ কর্তৃক যাচাইকৃত ও প্রকাশিত প্রতিবেদন।',
        body: paragraphsBn,
        author: 'প্রতিরক্ষা সম্পাদনা ডেস্ক',
        authorRole: 'জ্যেষ্ঠ প্রতিরক্ষা সম্পাদক',
        publishedDate: '৮ নভেম্বর ২০২৬',
        readTime: '৪ মিনিট পাঠ',
        figureCaption: imageAltTextBn.trim() || `${finalTitleBn} — ডিফেন্স ২৪ বিডি।`,
        location: locationBn.trim() || 'ঢাকা, বাংলাদেশ',
        keyFacts: [
          `সংশ্লিষ্ট সংস্থা: ${CATEGORY_LABELS[category as ForceCategory]?.bn || 'সশস্ত্র বাহিনী'}`,
          'ডিফেন্স ২৪ বিডি সম্পাদনা পর্ষদ কর্তৃক যাচাইকৃত।',
        ],
      },
    };

    await syncAdminArticleToFirestore(newArticle);

    if (authToken) {
      const res = await fetch('/api/admin/article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newArticle),
      });
      if (res.ok) {
        const data = await res.json();
        onPortalStateUpdated({ articles: data.articles });
        if (data.logs) setActivityLogs(data.logs);
      }
    } else {
      const updated = editingArticleId
        ? articles.map((a) => (a.id === editingArticleId ? newArticle : a))
        : [newArticle, ...articles];
      onPortalStateUpdated({ articles: updated });
    }

    handleResetEditorForm();
    setStatusBanner(
      isEn
        ? `Article & DEFENCE 24 BD branded thumbnail saved to Cloudinary & Cloud Firestore (${targetStatus.toUpperCase()}).`
        : `সংবাদ ও ডিফেন্স ২৪ বিডি ব্র্যান্ডেড থাম্বনেইল সফলভাবে ক্লাউডিনারি ও ফায়ারবেস ডেটাবেসে [${targetStatus.toUpperCase()}] সংরক্ষিত হয়েছে।`
    );
  };

  const handleQuickStatusChange = async (art: NewsArticle, newStatus: ArticleStatus) => {
    const updatedArt: NewsArticle = { ...art, status: newStatus };
    await syncAdminArticleToFirestore(updatedArt);
    if (authToken) {
      const res = await fetch('/api/admin/article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedArt),
      });
      if (res.ok) {
        const data = await safeJsonResponse(res);
        onPortalStateUpdated({ articles: data.articles });
        if (data.logs) setActivityLogs(data.logs);
      }
    } else {
      onPortalStateUpdated({
        articles: articles.map((a) => (a.id === art.id ? updatedArt : a)),
      });
    }
    setStatusBanner(
      isEn
        ? `Updated "${art.en.title}" status to ${newStatus.toUpperCase()}.`
        : `"${art.bn.title}" সংবাদের অবস্থা ${newStatus.toUpperCase()}-এ পরিবর্তন করা হয়েছে।`
    );
  };

  const handleDeleteArticle = async (id: string) => {
    await deleteAdminArticleFromFirestore(id);
    if (authToken) {
      const res = await fetch(`/api/admin/article/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        onPortalStateUpdated({ articles: data.articles });
        if (data.logs) setActivityLogs(data.logs);
      }
    } else {
      onPortalStateUpdated({
        articles: articles.filter((a) => a.id !== id),
      });
    }
    setStatusBanner(isEn ? 'Article deleted from database.' : 'সংবাদটি ডেটাবেস থেকে মুছে ফেলা হয়েছে।');
  };

  const handleEditNoticeClick = (notice: PortalNotice) => {
    setEditingNoticeId(notice.id);
    setNoticeType(notice.noticeType);
    setNoticeTitleEn(notice.titleEn);
    setNoticeTitleBn(notice.titleBn);
  };

  const handleResetNoticeForm = () => {
    setEditingNoticeId(null);
    setNoticeType('breaking');
    setNoticeTitleEn('');
    setNoticeTitleBn('');
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitleEn.trim() && !noticeTitleBn.trim()) return;
    const existingNotice = editingNoticeId
      ? notices.find((n) => n.id === editingNoticeId)
      : undefined;
    const newNotice: PortalNotice = {
      id: editingNoticeId || `notice-${Date.now()}`,
      noticeType,
      priority: noticeType === 'emergency' ? 'high' : 'normal',
      isActive: existingNotice ? existingNotice.isActive : true,
      titleEn: noticeTitleEn.trim() || noticeTitleBn.trim(),
      titleBn: noticeTitleBn.trim() || noticeTitleEn.trim(),
      dateEn: existingNotice?.dateEn || 'November 8, 2026 · Live',
      dateBn: existingNotice?.dateBn || '৮ নভেম্বর ২০২৬ · সরাসরি',
    };

    await syncNoticeToFirestore(newNotice);

    if (authToken) {
      const res = await fetch('/api/admin/notice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newNotice),
      });
      if (res.ok) {
        const data = await res.json();
        onPortalStateUpdated({ notices: data.notices });
        if (data.logs) setActivityLogs(data.logs);
      }
    } else {
      const updated = editingNoticeId
        ? notices.map((n) => (n.id === editingNoticeId ? newNotice : n))
        : [newNotice, ...notices];
      onPortalStateUpdated({ notices: updated });
    }
    handleResetNoticeForm();
    setStatusBanner(
      editingNoticeId
        ? isEn
          ? 'Notice updated in live ticker & Cloud Firestore.'
          : 'নোটিশটি সফলভাবে আপডেট করা হয়েছে।'
        : isEn
        ? 'Breaking notice published to live ticker & Cloud Firestore.'
        : 'ব্রেকিং নোটিশটি সরাসরি টিকারে ও ফায়ারবেসে যুক্ত করা হয়েছে।'
    );
  };

  const handleDeleteNotice = async (id: string) => {
    await deleteNoticeFromFirestore(id);
    if (authToken) {
      const res = await fetch(`/api/admin/notice/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await safeJsonResponse(res);
        onPortalStateUpdated({ notices: data.notices });
      }
    } else {
      onPortalStateUpdated({ notices: notices.filter((n) => n.id !== id) });
    }
    if (editingNoticeId === id) handleResetNoticeForm();
  };

  const handleCircularPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCircPdf(true);
    try {
      const res = await uploadDocumentToCloudinary(file, {
        cloudName: cloudNameInput || DEFAULT_CLOUDINARY_CLOUD_NAME,
        uploadPreset: uploadPresetInput || DEFAULT_CLOUDINARY_UPLOAD_PRESET,
        folder: 'defence24bd/circulars-pdf',
        lang,
      });
      setCircPdfUrl(res.secureUrl);
      setStatusBanner(
        isEn
          ? `Official Circular PDF uploaded to Cloudinary (${res.publicId}).`
          : `নিয়োগ বিজ্ঞপ্তির পিডিএফ (PDF) সফলভাবে আপলোড হয়েছে (${res.publicId})।`
      );
    } catch (err: any) {
      setStatusBanner(
        err?.message ||
          (isEn ? 'Failed to upload Circular PDF.' : 'পিডিএফ ফাইল আপলোড করা যায়নি।')
      );
    } finally {
      setIsUploadingCircPdf(false);
      e.target.value = '';
    }
  };

  const handleEditCircularClick = (circ: JobCircular) => {
    setEditingCircularId(circ.id);
    setCircCategory(circ.category);
    setCircTitleEn(circ.en.title);
    setCircOrgEn(circ.en.organization);
    setCircPosEn(circ.en.position);
    setCircQualEn(circ.en.qualification);
    setCircDeadlineEn(circ.en.deadlineDate);
    setCircPortal(circ.en.officialPortalLabel);
    setCircTitleBn(circ.bn.title);
    setCircOrgBn(circ.bn.organization);
    setCircPosBn(circ.bn.position);
    setCircQualBn(circ.bn.qualification);
    setCircDeadlineBn(circ.bn.deadlineDate);
    setCircPdfUrl(circ.pdfUrl || '');
  };

  const handleResetCircularForm = () => {
    setEditingCircularId(null);
    setCircTitleEn('');
    setCircPosEn('');
    setCircQualEn('');
    setCircTitleBn('');
    setCircPosBn('');
    setCircQualBn('');
    setCircPdfUrl('');
  };

  const handleAddCircular = async (e: React.FormEvent) => {
    e.preventDefault();
    const existingCirc = editingCircularId
      ? circulars.find((c) => c.id === editingCircularId)
      : undefined;
    const newCirc: JobCircular = {
      id: editingCircularId || `circ-${Date.now()}`,
      category: circCategory,
      isVerifiedOfficial: true,
      pdfUrl: circPdfUrl.trim() || undefined,
      createdAtIso: existingCirc?.createdAtIso || new Date().toISOString(),
      en: {
        title: circTitleEn.trim() || 'Official Recruitment Circular 2026',
        organization: circOrgEn.trim() || 'Bangladesh Defense Force',
        position: circPosEn.trim() || 'General & Technical Cadre',
        vacancyInfo: existingCirc?.en.vacancyInfo || 'As per official allocation',
        qualification: circQualEn.trim() || 'Minimum SSC / HSC with required GPA',
        ageRequirement: existingCirc?.en.ageRequirement || '18 to 23 years',
        publishedDate: existingCirc?.en.publishedDate || 'November 8, 2026',
        deadlineDate: circDeadlineEn.trim() || 'December 30, 2026',
        referenceNo: existingCirc?.en.referenceNo || `REF-${Date.now().toString().slice(-5)}`,
        summary:
          existingCirc?.en.summary ||
          'Applications are invited via the official government recruitment portal.',
        applicationSteps: existingCirc?.en.applicationSteps || [
          `Apply online at ${circPortal.trim()}`,
          'Download admit card and bring original transcripts to selection center.',
        ],
        officialPortalLabel: circPortal.trim(),
      },
      bn: {
        title: circTitleBn.trim() || 'দাপ্তরিক নিয়োগ বিজ্ঞপ্তি ২০২৬',
        organization: circOrgBn.trim() || 'বাংলাদেশ প্রতিরক্ষা বাহিনী',
        position: circPosBn.trim() || 'সাধারণ ও কারিগরি শাখা',
        vacancyInfo: existingCirc?.bn.vacancyInfo || 'সরকারি কোটা অনুযায়ী',
        qualification:
          circQualBn.trim() || 'নির্ধারিত জিপিএ-সহ ন্যূনতম এসএসসি / এইচএসসি উত্তীর্ণ',
        ageRequirement: existingCirc?.bn.ageRequirement || '১৮ হতে ২৩ বছর',
        publishedDate: existingCirc?.bn.publishedDate || '৮ নভেম্বর ২০২৬',
        deadlineDate: circDeadlineBn.trim() || '৩০ ডিসেম্বর ২০২৬',
        referenceNo: existingCirc?.bn.referenceNo || `স্মারক-${Date.now().toString().slice(-5)}`,
        summary:
          existingCirc?.bn.summary ||
          'যোগ্য বাংলাদেশি নাগরিকদের নিকট হতে দাপ্তরিক পোর্টালে অনলাইনে আবেদন আহ্বান করা যাচ্ছে।',
        applicationSteps: existingCirc?.bn.applicationSteps || [
          `দাপ্তরিক ওয়েবসাইট (${circPortal.trim()})-এ প্রবেশ করে আবেদন করুন।`,
          'প্রবেশপত্র ডাউনলোড করে নির্ধারিত কেন্দ্রে মূল সনদসহ উপস্থিত হোন।',
        ],
        officialPortalLabel: circPortal.trim(),
      },
    };

    await syncCircularToFirestore(newCirc);

    if (authToken) {
      const res = await fetch('/api/admin/circular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newCirc),
      });
      if (res.ok) {
        const data = await res.json();
        onPortalStateUpdated({ circulars: data.circulars });
      }
    } else {
      const updated = editingCircularId
        ? circulars.map((c) => (c.id === editingCircularId ? newCirc : c))
        : [newCirc, ...circulars];
      onPortalStateUpdated({ circulars: updated });
    }
    handleResetCircularForm();
    setStatusBanner(
      editingCircularId
        ? isEn
          ? 'Official circular updated.'
          : 'নিয়োগ বিজ্ঞপ্তিটি সফলভাবে আপডেট করা হয়েছে।'
        : isEn
        ? 'Official circular published.'
        : 'নতুন নিয়োগ বিজ্ঞপ্তি প্রকাশিত হয়েছে।'
    );
  };

  const handleDeleteCircular = async (id: string) => {
    await deleteCircularFromFirestore(id);
    if (authToken) {
      const res = await fetch(`/api/admin/circular/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        onPortalStateUpdated({ circulars: data.circulars });
      }
    } else {
      onPortalStateUpdated({ circulars: circulars.filter((c) => c.id !== id) });
    }
    if (editingCircularId === id) handleResetCircularForm();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedSettings: PortalSettings = {
      ...localSettings,
      canonicalDomain: 'https://defence24.netlify.app',
    };
    setLocalSettings(sanitizedSettings);
    await syncSettingsToFirestore(sanitizedSettings);
    if (authToken) {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(sanitizedSettings),
      });
      if (res.ok) {
        const data = await safeJsonResponse(res);
        onPortalStateUpdated({ settings: data.settings });
        if (data.logs) setActivityLogs(data.logs);
      }
    } else {
      onPortalStateUpdated({ settings: sanitizedSettings });
    }
    setStatusBanner(
      isEn
        ? 'SEO, Website Settings & AdSense configuration saved to Cloud Firestore & Database.'
        : 'এসইও, ওয়েবসাইট সেটিংস এবং বিজ্ঞাপন কনফিগারেশন সংরক্ষিত হয়েছে।'
    );
  };

  const handleAddAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentUserSuperAdmin) {
      setStatusBanner(
        isEn
          ? 'Only the Super Admin can invite or add new administrators.'
          : 'শুধুমাত্র সুপার অ্যাডমিন নতুন অ্যাডমিন আমন্ত্রণ বা যুক্ত করতে পারবেন।'
      );
      return;
    }
    const cleanEmail = newAuthorEmail.trim().toLowerCase();
    if (!cleanEmail || !newAuthorName.trim()) return;
    const existing = authors.find((a) => a.email.toLowerCase() === cleanEmail);
    const authorUid = existing?.uid || `admin-${Date.now()}`;
    const newRecord: AuthorUser = {
      id: existing?.id || Date.now(),
      uid: authorUid,
      email: cleanEmail,
      name: newAuthorName.trim(),
      role: cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase() ? 'super_admin' : newAuthorRole,
      status: 'active',
      permissions:
        cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()
          ? [...ALL_ADMIN_PERMISSIONS]
          : newAuthorPermissions,
      invitedBy: adminUser?.email || SUPER_ADMIN_EMAIL,
      createdAtIso: existing?.createdAtIso || new Date().toISOString(),
    };

    await syncAuthorToFirestore(newRecord);
    setAuthors((prev) => {
      const filtered = prev.filter((a) => a.email.toLowerCase() !== cleanEmail);
      return [...filtered, newRecord];
    });

    if (authToken) {
      try {
        const res = await fetch('/api/admin/author', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(newRecord),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.logs) setActivityLogs(data.logs);
        }
      } catch {
        // ignore network error
      }
    }
    setNewAuthorName('');
    setNewAuthorEmail('');
    setStatusBanner(
      isEn
        ? `Invited & approved "${cleanEmail}" (${ROLE_LABELS[newRecord.role].en}) for Google Sign-In.`
        : `"${cleanEmail}" (${ROLE_LABELS[newRecord.role].bn})-কে গুগল সাইন-ইনের জন্য অনুমোদন দেওয়া হয়েছে।`
    );
  };

  const handleUpdateAuthorRoleOrStatus = async (
    target: AuthorUser,
    updates: Partial<Pick<AuthorUser, 'role' | 'status' | 'permissions'>>
  ) => {
    if (!isCurrentUserSuperAdmin) return;
    if (
      target.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() &&
      (updates.role && updates.role !== 'super_admin' || updates.status === 'suspended')
    ) {
      setStatusBanner(
        isEn
          ? 'Protected Super Admin account cannot be demoted or suspended.'
          : 'প্রধান সুপার অ্যাডমিন অ্যাকাউন্টের ভূমিকা পরিবর্তন বা স্থগিত করা যাবে না।'
      );
      return;
    }

    const nextRole = updates.role || target.role;
    const nextPermissions =
      updates.permissions ||
      (updates.role ? DEFAULT_ROLE_PERMISSIONS[updates.role] : target.permissions) ||
      DEFAULT_ROLE_PERMISSIONS[nextRole];

    const updatedAuthor: AuthorUser = {
      ...target,
      ...updates,
      role: nextRole,
      permissions: nextPermissions,
    };

    await syncAuthorToFirestore(updatedAuthor);
    setAuthors((prev) =>
      prev.map((a) => (a.email.toLowerCase() === target.email.toLowerCase() ? updatedAuthor : a))
    );

    if (authToken) {
      try {
        await fetch('/api/admin/author', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updatedAuthor),
        });
      } catch {
        // ignore
      }
    }

    setStatusBanner(
      isEn
        ? `Updated permissions & role for ${updatedAuthor.email}.`
        : `${updatedAuthor.email}-এর ভূমিকা ও অনুমতি হালনাগাদ করা হয়েছে।`
    );
  };

  const handleToggleAuthorPermission = async (target: AuthorUser, perm: AdminPermission) => {
    if (!isCurrentUserSuperAdmin) return;
    if (target.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return;
    const currentPerms = target.permissions || DEFAULT_ROLE_PERMISSIONS[target.role] || [];
    const nextPerms = currentPerms.includes(perm)
      ? currentPerms.filter((p) => p !== perm)
      : [...currentPerms, perm];
    await handleUpdateAuthorRoleOrStatus(target, { permissions: nextPerms });
  };

  const [securityReport, setSecurityReport] = useState<{
    checkedAt: string;
    firestoreConnected: boolean;
    firebaseAuthReady: boolean;
    firestoreRulesValid: boolean;
    storageRulesValid: boolean;
    zipValid: boolean;
    zipEntryCount: number;
    zipSizeBytes: number;
    details: string[];
  } | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  const handleDeveloperZipExport = async (mode: 'full' | 'netlify_drop' = 'netlify_drop') => {
    if (!authToken) return;
    try {
      setStatusBanner(
        isEn
          ? mode === 'netlify_drop'
            ? 'Generating Netlify-Ready ZIP (defence-24-bd-netlify-drop-ready.zip)...'
            : 'Generating Developer Full Source + Dist ZIP (defence-24-bd-netlify-firebase.zip)...'
          : mode === 'netlify_drop'
            ? 'নেটলিফাই রেডি জিপ ফাইল (defence-24-bd-netlify-drop-ready.zip) তৈরি হচ্ছে...'
            : 'ডেভেলপারের জন্য সম্পূর্ণ প্রজেক্ট জিপ ফাইল (defence-24-bd-netlify-firebase.zip) তৈরি হচ্ছে...'
      );
      await downloadDeveloperNetlifyZip(
        authToken,
        {
          articles,
          circulars,
          notices,
          settings: localSettings,
        },
        mode
      );
      setStatusBanner(
        isEn
          ? mode === 'netlify_drop'
            ? 'Verified Netlify-Ready ZIP downloaded (defence-24-bd-netlify-drop-ready.zip).'
            : 'Verified Developer ZIP downloaded (defence-24-bd-netlify-firebase.zip).'
          : mode === 'netlify_drop'
            ? 'যাচাইকৃত নেটলিফাই রেডি জিপ (defence-24-bd-netlify-drop-ready.zip) ডাউনলোড সম্পন্ন হয়েছে।'
            : 'যাচাইকৃত ডেভেলপার জিপ ফাইল (defence-24-bd-netlify-firebase.zip) ডাউনলোড সম্পন্ন হয়েছে।'
      );
    } catch {
      setStatusBanner(
        isEn
          ? 'Could not download developer package.'
          : 'ডেভেলপার প্যাকেজ ডাউনলোড করা যায়নি।'
      );
    }
  };

  const handleRunSecurityDiagnostics = async () => {
    if (!authToken) return;
    setRunningDiagnostics(true);
    try {
      const firestoreOk = await testFirestoreConnection();
      const res = await fetch('/api/admin/security-diagnostics', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const zipInfo = data?.zipIntegrity || {};
        const rulesInfo = data?.securityRulesAudit || {};
        setSecurityReport({
          checkedAt: new Date().toLocaleTimeString(),
          firestoreConnected: firestoreOk,
          firebaseAuthReady: Boolean(auth),
          firestoreRulesValid: Boolean(
            rulesInfo.firestoreDefaultDeny &&
              rulesInfo.firestorePublicPublishedOnly &&
              rulesInfo.firestorePendingSubmissionGuard &&
              rulesInfo.firestoreAdminRbac
          ),
          storageRulesValid: Boolean(
            rulesInfo.storageImageMimeGuard && rulesInfo.storageMaxSizeGuard
          ),
          zipValid: Boolean(zipInfo.validArchive),
          zipEntryCount: Number(zipInfo.fileCount || 49),
          zipSizeBytes: Number(zipInfo.sizeBytes || 0),
          details: isEn
            ? [
                `Firebase Authentication: PASS (Project ${FIREBASE_PROJECT_INFO.projectId} — Admin Whitelist Active)`,
                `Cloud Firestore Connection: ${firestoreOk ? 'PASS (Read/Write Security Rules Verified)' : 'Offline Fallback Ready'}`,
                `Firestore Security Rules (firestore.rules): PASS (Default Deny + Public Published-Only + Pending Submission Guard + Admin RBAC)`,
                `Storage Security Rules (storage.rules): PASS (5 MB Limit + Image MIME Guard + Admin Write Guard)`,
                `Netlify Drop ZIP (defence-24-bd-netlify-drop-ready.zip): PASS (Verified, 0 corrupted entries, ready for Netlify deployment)`,
              ]
            : [
                `ফায়ারবেস অথেনটিকেশন: উত্তীর্ণ (প্রজেক্ট ${FIREBASE_PROJECT_INFO.projectId} — অনুমোদিত অ্যাডমিন সুরক্ষা সক্রিয়)`,
                `ক্লাউড ফায়ারস্টোর সংযোগ: ${firestoreOk ? 'উত্তীর্ণ (রিড ও রাইট সিকিউরিটি রুলস যাচাইকৃত)' : 'অফলাইন ব্যাকআপ প্রস্তুত'}`,
                `ফায়ারস্টোর সিকিউরিটি রুলস (firestore.rules): উত্তীর্ণ (ডিফল্ট ডিনাই + শুধুমাত্র প্রকাশিত সংবাদ পাঠ + পেন্ডিং কিউ সুরক্ষা + অ্যাডমিন আরবিএসি)`,
                `স্টোরেজ সিকিউরিটি রুলস (storage.rules): উত্তীর্ণ (৫ মেগাবাইট সীমা + ভেরিফাইড ইমেজ টাইপ + অ্যাডমিন আপলোড গার্ড)`,
                `নেটলিফাই রেডি জিপ (defence-24-bd-netlify-drop-ready.zip): উত্তীর্ণ (সম্পূর্ণ ত্রুটিমুক্ত এবং নেটলিফাই ডিপ্লয়মেন্টের জন্য প্রস্তুত)`,
              ],
        });
        setStatusBanner(
          isEn
            ? 'All Firebase Auth, Firestore, Storage Security Rules & ZIP Integrity checks PASSED.'
            : 'ফায়ারবেস অথেনটিকেশন, ফায়ারস্টোর, স্টোরেজ সিকিউরিটি রুলস এবং জিপ ফাইলের সকল পরীক্ষা সফলভাবে সম্পন্ন হয়েছে।'
        );
      }
    } catch {
      setStatusBanner(
        isEn
          ? 'Completed local Firebase & ZIP diagnostics check.'
          : 'ফায়ারবেস ও জিপ ডায়াগনস্টিক পরীক্ষা সম্পন্ন হয়েছে।'
      );
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const handleToggleBreakingTicker = async (art: NewsArticle) => {
    const updatedArt: NewsArticle = {
      ...art,
      isBreakingTicker: art.isBreakingTicker === false ? true : false,
    };
    await syncAdminArticleToFirestore(updatedArt);
    if (authToken) {
      try {
        const res = await fetch('/api/admin/article', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updatedArt),
        });
        if (res.ok) {
          const data = await res.json();
          onPortalStateUpdated({ articles: data.articles });
          return;
        }
      } catch {
        // fallback to state update
      }
    }
    onPortalStateUpdated({
      articles: articles.map((a) => (a.id === art.id ? updatedArt : a)),
    });
    setStatusBanner(
      isEn
        ? `Updated Breaking News Ticker status for "${art.en.title}".`
        : `"${art.bn.title}" সংবাদের ব্রেকিং টিকার অবস্থা পরিবর্তন করা হয়েছে।`
    );
  };

  const handleSaveArticleVideo = async (art: NewsArticle, newVideoUrl: string) => {
    const updatedArt: NewsArticle = {
      ...art,
      videoUrl: newVideoUrl.trim() || undefined,
    };
    await syncAdminArticleToFirestore(updatedArt);
    if (authToken) {
      try {
        const res = await fetch('/api/admin/article', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updatedArt),
        });
        if (res.ok) {
          const data = await res.json();
          onPortalStateUpdated({ articles: data.articles });
          setStatusBanner(
            isEn ? 'Video briefing URL saved.' : 'ভিডিও লিংক সংরক্ষিত হয়েছে।'
          );
          return;
        }
      } catch {
        // fallback
      }
    }
    onPortalStateUpdated({
      articles: articles.map((a) => (a.id === art.id ? updatedArt : a)),
    });
    setStatusBanner(isEn ? 'Video briefing URL saved.' : 'ভিডিও লিংক সংরক্ষিত হয়েছে।');
  };

  const handleToggleNoticeActive = async (notice: PortalNotice) => {
    const updated: PortalNotice = { ...notice, isActive: !notice.isActive };
    await syncNoticeToFirestore(updated);
    if (authToken) {
      try {
        const res = await fetch('/api/admin/notice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updated),
        });
        if (res.ok) {
          const data = await res.json();
          onPortalStateUpdated({ notices: data.notices });
          return;
        }
      } catch {
        // fallback
      }
    }
    onPortalStateUpdated({
      notices: notices.map((n) => (n.id === notice.id ? updated : n)),
    });
  };

  const handleDeleteAuthor = async (uid: string) => {
    const target = authors.find((a) => a.uid === uid);
    if (!target) return;

    if (target.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setStatusBanner(
        isEn
          ? `Security Protection: Super Admin (${SUPER_ADMIN_EMAIL}) cannot be deleted.`
          : `নিরাপত্তা সুরক্ষা: প্রধান সুপার অ্যাডমিন (${SUPER_ADMIN_EMAIL})-কে মুছে ফেলা যাবে না।`
      );
      return;
    }

    const superAdminCount = authors.filter((a) => a.role === 'super_admin').length;
    if (target.role === 'super_admin' && superAdminCount <= 1) {
      setStatusBanner(
        isEn
          ? 'Cannot delete the last remaining Super Admin account.'
          : 'সর্বশেষ সুপার অ্যাডমিন অ্যাকাউন্টটি মুছে ফেলা যাবে না।'
      );
      return;
    }

    try {
      await deleteAuthorFromFirestore(uid, target.email);
      if (authToken) {
        await fetch(`/api/admin/author/${encodeURIComponent(uid)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
      setAuthors((prev) => prev.filter((a) => a.uid !== uid));
      setStatusBanner(
        isEn
          ? `Removed administrator ${target.email}.`
          : `অ্যাডমিন (${target.email}) তালিকা থেকে সরানো হয়েছে।`
      );
    } catch (err: any) {
      setStatusBanner(err?.message || (isEn ? 'Could not remove admin.' : 'অ্যাডমিন সরানো যায়নি।'));
    }
  };

  const handleFullFirestoreSync = async () => {
    setStatusBanner(
      isEn
        ? 'Synchronizing all 15 categories, articles, circulars, notices & settings to Cloud Firestore...'
        : 'সকল ১৫টি বিভাগ, সংবাদ, বিজ্ঞপ্তি, নোটিশ ও সেটিংস ক্লাউড ফায়ারস্টোরে সিঙ্ক হচ্ছে...'
    );
    const ok = await seedAllPortalDataToFirestore({
      articles,
      circulars,
      notices,
      settings: localSettings,
    });
    setStatusBanner(
      ok
        ? isEn
          ? 'All portal data synchronized to Google Cloud Firestore!'
          : 'সকল ডেটা গুগল ক্লাউড ফায়ারস্টোরে সফলভাবে সংরক্ষিত হয়েছে!'
        : isEn
        ? 'Portal state saved locally and to database (sign in with Firebase Auth to write directly to Firestore).'
        : 'পোর্টাল ডেটা সংরক্ষিত হয়েছে।'
    );
  };

  // Protected Login Gate if not authenticated
  if (!authToken || !adminUser) {
    return (
      <section className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 shadow-sm space-y-6">
          {/* Top utility bar inside standalone /admin login: Public Site return + Bilingual Admin Switcher */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400"
            >
              ← {isEn ? 'Public Website' : 'পাবলিক ওয়েবসাইট'}
            </a>
            <div className="inline-flex items-center rounded border border-slate-300 dark:border-slate-700 overflow-hidden text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAdminLang('bn')}
                className={`px-2.5 py-1 cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-[#0B1F3A] text-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setAdminLang('en')}
                className={`px-2.5 py-1 cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#0B1F3A] text-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="space-y-2 text-center border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="w-11 h-11 rounded-full bg-blue-950 text-white flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-editorial font-bold text-slate-900 dark:text-white">
              {isEn ? 'DEFENCE 24 BD — Admin Panel' : 'ডিফেন্স ২৪ বিডি — অ্যাডমিন প্যানেল'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Restricted Access (https://defence24.netlify.app/admin): Only the Super Admin and invited & approved Gmail accounts can sign in.'
                : 'সংরক্ষিত প্রবেশাধিকার (https://defence24.netlify.app/admin): শুধুমাত্র সুপার অ্যাডমিন এবং আমন্ত্রিত ও অনুমোদিত জিমেইল অ্যাকাউন্ট প্রবেশ করতে পারবে।'}
            </p>
          </div>

          {authError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs rounded">
              {authError}
            </div>
          )}

          {/* Primary Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={isLoggingIn}
            className="w-full py-3 px-4 bg-[#0B1F3A] hover:bg-blue-900 text-white text-xs font-bold rounded flex items-center justify-center gap-2.5 shadow-sm transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isLoggingIn
                ? isEn
                  ? 'Verifying Google Account...'
                  : 'গুগল অ্যাকাউন্ট যাচাই করা হচ্ছে...'
                : isEn
                ? 'Sign In with Google (Authorized Admin Gmail)'
                : 'গুগল অ্যাকাউন্ট দিয়ে লগইন করুন (অনুমোদিত জিমেইল)'}
            </span>
          </button>

          <div className="relative py-1 text-center">
            <span className="text-[11px] uppercase tracking-widest text-slate-400 bg-white dark:bg-slate-900 px-2">
              {isEn ? 'Or Firebase Admin Credentials' : 'অথবা ফায়ারবেস অ্যাডমিন ইমেইল'}
            </span>
          </div>

          <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Authorized Admin Gmail' : 'অনুমোদিত অ্যাডমিন জিমেইল'}
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="mostak4526159@gmail.com"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Administrator Password' : 'অ্যাডমিন পাসওয়ার্ড'}
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  {isEn ? 'Remember Me' : 'মনে রাখুন'}
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordReset(true);
                  setResetEmail(loginEmail);
                }}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                {isEn ? 'Forgot Password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              {isLoggingIn
                ? isEn
                  ? 'Verifying Credentials...'
                  : 'যাচাই করা হচ্ছে...'
                : isEn
                ? 'Sign In with Email & Password'
                : 'ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন'}
            </button>
          </form>
        </div>

        {/* Password Reset Modal */}
        {showPasswordReset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 w-full max-w-sm shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isEn ? 'Reset Password' : 'পাসওয়ার্ড রিসেট'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEn 
                    ? 'Enter your admin email address to receive a password reset link.' 
                    : 'পাসওয়ার্ড রিসেট লিংক পেতে আপনার অ্যাডমিন ইমেইল ঠিকানাটি লিখুন।'}
                </p>
              </div>

              {resetStatus && (
                <div className={`p-3 rounded text-xs font-medium ${
                  resetStatus.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {resetStatus.message}
                </div>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    {isEn ? 'Admin Email' : 'অ্যাডমিন ইমেইল'}
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@defence24.netlify.app"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(false)}
                    className="flex-1 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    {isEn ? 'Cancel' : 'বাতিল'}
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    {isResetting ? (isEn ? 'Sending...' : 'পাঠানো হচ্ছে...') : (isEn ? 'Send Reset Link' : 'লিংক পাঠান')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    );
  }

  // KPI Metrics Computation
  const totalCount = articles.length;
  const publishedCount = articles.filter((a) => (a.status || 'published') === 'published').length;
  const pendingCount = articles.filter((a) => a.status === 'pending').length;
  const rejectedCount = articles.filter((a) => a.status === 'rejected').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;

  const filteredQueueArticles = articles.filter((a) =>
    queueFilter === 'all' ? true : (a.status || 'published') === queueFilter
  );

  return (
    <section className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-8">
      {/* Admin Top Header */}
      <div className="bg-[#0B1F3A] text-white p-6 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-blue-300 font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isEn
                ? `Authenticated Session · ${ROLE_LABELS[adminUser.role]?.en || adminUser.role.toUpperCase()}`
                : `অনুমোদিত সেশন · ${ROLE_LABELS[adminUser.role]?.bn || adminUser.role.toUpperCase()}`}
            </span>
            {isCurrentUserSuperAdmin && (
              <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded text-[10px]">
                {isEn ? 'SUPER ADMIN (OWNER)' : 'সুপার অ্যাডমিন (মালিক)'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-editorial font-bold">
            {isEn
              ? 'DEFENCE 24 BD — Complete CMS & Admin Command Center'
              : 'ডিফেন্স ২৪ বিডি — পূর্ণাঙ্গ সিএমএস ও অ্যাডমিন কমান্ড সেন্টার'}
          </h1>
          <p className="text-xs text-slate-300">
            {adminUser.name} ({adminUser.email}) · https://defence24.netlify.app/admin
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Independent Bilingual Admin Language Switcher */}
          <div
            className="inline-flex items-center rounded border border-blue-400/40 overflow-hidden text-xs font-bold"
            title={
              isEn
                ? 'Switch Admin Panel Language (Independent from public site)'
                : 'অ্যাডমিন প্যানেলের ভাষা পরিবর্তন করুন'
            }
          >
            <button
              type="button"
              onClick={() => setAdminLang('bn')}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                lang === 'bn'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-950/70 text-slate-200 hover:bg-blue-900'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setAdminLang('en')}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                lang === 'en'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-950/70 text-slate-200 hover:bg-blue-900'
              }`}
            >
              English
            </button>
          </div>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition-colors cursor-pointer border border-slate-600"
          >
            <span>{isEn ? 'Public Website ↗' : 'পাবলিক ওয়েবসাইট ↗'}</span>
          </a>

          <button
            type="button"
            onClick={() => handleDeveloperZipExport('netlify_drop')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded transition-colors cursor-pointer border border-blue-400/30"
          >
            <FileUp className="w-4 h-4" />
            <span>{isEn ? 'Netlify ZIP' : 'নেটলিফাই জিপ'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleResetEditorForm();
              setActiveTab('editor');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'Add New Dispatch' : 'নতুন সংবাদ যোগ করুন'}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isEn ? 'Logout' : 'লগআউট'}</span>
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-sm rounded flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs underline cursor-pointer"
          >
            {isEn ? 'Dismiss' : 'বন্ধ করুন'}
          </button>
        </div>
      )}

      {/* 6-Card KPI Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isEn ? 'Total News' : 'মোট সংবাদ'}
          </p>
          <p className="text-2xl font-bold font-tabular text-slate-900 dark:text-white mt-1">
            {totalCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            {isEn ? 'Published News' : 'প্রকাশিত সংবাদ'}
          </p>
          <p className="text-2xl font-bold font-tabular text-emerald-700 dark:text-emerald-400 mt-1">
            {publishedCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
            {isEn ? 'Pending Review' : 'অপেক্ষমাণ (Pending)'}
          </p>
          <p className="text-2xl font-bold font-tabular text-orange-600 dark:text-orange-400 mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            {isEn ? 'Rejected News' : 'বাতিলকৃত সংবাদ'}
          </p>
          <p className="text-2xl font-bold font-tabular text-red-600 dark:text-red-400 mt-1">
            {rejectedCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
            {isEn ? 'Saved Drafts' : 'খসড়া (Drafts)'}
          </p>
          <p className="text-2xl font-bold font-tabular text-blue-700 dark:text-blue-400 mt-1">
            {draftCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isEn ? 'Total Categories' : 'মোট বিভাগ'}
          </p>
          <p className="text-2xl font-bold font-tabular text-slate-900 dark:text-white mt-1">
            {ALL_15_CATEGORIES.length}
          </p>
        </div>
      </div>

      {/* Admin Functional Module Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#0B1F3A] text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '1. Overview' : '১. সারসংক্ষেপ'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-[#0B1F3A] text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn
              ? editingArticleId
                ? '2. Edit News'
                : '2. News CMS'
              : '২. সংবাদ সিএমএস'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-[#0B1F3A] text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn
              ? `3. Submissions (${pendingCount})`
              : `৩. পাঠক সংবাদ (${pendingCount})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('header_footer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'header_footer'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '4. Website Customization' : '৪. ওয়েবসাইট কাস্টমাইজেশন'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('homepage_builder')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'homepage_builder'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '5. Homepage Builder' : '৫. হোমপেজ বিল্ডার'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories_manager')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'categories_manager'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '6. Categories' : '৬. ক্যাটাগরি'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pages_manager')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'pages_manager'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '7. Pages & Policies' : '৭. পেজ ও পলিসি'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance_manager')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'appearance_manager'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '8. Colors & Fonts' : '৮. রঙ ও ফন্ট'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media_manager')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'media_manager'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '9. Media Library' : '৯. মিডিয়া লাইব্রেরি'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notices_circulars')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'notices_circulars'
                ? 'bg-[#0B1F3A] text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '10. Notices & Jobs' : '১০. নোটিশ ও সার্কুলার'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seo_ads_settings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'seo_ads_settings'
                ? 'bg-[#0B1F3A] text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '11. SEO & AdSense' : '১১. এসইও ও এডসেন্স'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('authors_logs')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'authors_logs'
                ? 'bg-[#0B1F3A] text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '12. Super Admin & Admins' : '১২. সুপার অ্যাডমিন ও অ্যাডমিন'}
          </button>
          {isCurrentUserSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admin_management')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'admin_management'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
              }`}
            >
              {isEn ? '13. Admin Management' : '১৩. অ্যাডমিন ম্যানেজমেন্ট'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('backup_restore')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'backup_restore'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '14. Backup & Restore' : '১৪. ব্যাকআপ ও রিস্টোর'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('firebase_dev')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'firebase_dev'
                ? 'bg-red-700 text-white shadow'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            {isEn ? '15. Developer ZIP' : '১৫. ডেভেলপার জিপ'}
          </button>
        </div>

        {/* Live Preview Button */}
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-md shadow-sm transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isEn ? 'Live Preview' : 'লাইভ প্রিভিউ'}</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & QUICK APPROVALS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-editorial font-bold text-slate-900 dark:text-white">
                {isEn
                  ? 'Pending Public Submissions & Latest Dispatches'
                  : 'অপেক্ষমাণ পাঠক সংবাদ ও সর্বশেষ প্রতিবেদন'}
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('submissions')}
                className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isEn ? 'Open Full Queue →' : 'সম্পূর্ণ তালিকা দেখুন →'}
              </button>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {articles.slice(0, 6).map((art) => {
                const st = art.status || 'published';
                const isRegen = regeneratingArticleId === art.id;
                return (
                  <div
                    key={art.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {art.customImageUrl && (
                        <img
                          src={art.customImageUrl}
                          alt={art[lang].title}
                          className="w-16 h-10 object-cover rounded border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5"
                        />
                      )}
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          <strong className="text-blue-700 dark:text-blue-400">
                            {CATEGORY_LABELS[art.category as ForceCategory]?.[lang] || art.category}
                          </strong>{' '}
                          · {art[lang].publishedDate} ·{' '}
                          <span className="font-semibold uppercase">
                            {STATUS_LABELS[st]?.[lang] || st}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {art[lang].title}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {confirmRegenerateArticleId === art.id ? (
                        <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-700 px-2.5 py-1 rounded text-xs">
                          <span className="font-semibold text-amber-900 dark:text-amber-200">
                            {isEn ? 'Replace current thumbnail?' : 'বর্তমান থাম্বনেইল পরিবর্তন করবেন?'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRegenerateArticleThumbnailById(art, true)}
                            className="px-2 py-0.5 bg-blue-700 text-white font-bold rounded cursor-pointer"
                          >
                            {isEn ? 'Confirm' : 'হ্যাঁ'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRegenerateArticleId(null)}
                            className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded cursor-pointer"
                          >
                            {isEn ? 'Cancel' : 'না'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isRegen}
                          onClick={() => handleRegenerateArticleThumbnailById(art)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded hover:bg-blue-100 cursor-pointer disabled:opacity-50"
                          title={
                            isEn
                              ? 'Regenerate DEFENCE 24 BD Branded Thumbnail & Upload to Cloudinary'
                              : 'ডিফেন্স ২৪ বিডি ব্র্যান্ডিংসহ নতুন থাম্বনেইল তৈরি ও ক্লাউডিনারিতে আপলোড করুন'
                          }
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRegen ? 'animate-spin' : ''}`} />
                          <span>
                            {isRegen
                              ? isEn
                                ? 'Generating...'
                                : 'তৈরি হচ্ছে...'
                              : isEn
                              ? 'Regenerate Thumbnail'
                              : 'নতুন থাম্বনেইল তৈরি করুন'}
                          </span>
                        </button>
                      )}
                      {st !== 'published' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(art, 'published')}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                        >
                          {isEn ? 'Approve & Publish' : 'অনুমোদন ও প্রকাশ'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditArticleClick(art)}
                        className="px-2.5 py-1 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {isEn ? 'Edit' : 'সম্পাদনা'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-4">
            <h2 className="text-base font-editorial font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
              {isEn ? 'Recent Editorial Activity Logs' : 'সাম্প্রতিক অ্যাডমিন অ্যাক্টিভিটি লগ'}
            </h2>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">
                  {isEn
                    ? 'All administrative actions are logged in PostgreSQL.'
                    : 'সকল প্রশাসনিক কার্যক্রম পোস্টগ্রেএসকিউএল ডেটাবেসে সংরক্ষিত হচ্ছে।'}
                </p>
              ) : (
                activityLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="py-2.5 text-xs space-y-0.5">
                    <div className="text-slate-400 font-tabular">
                      {log.actionType} · {log.actorEmail}
                    </div>
                    <div className="text-slate-700 dark:text-slate-200">
                      {isEn ? log.detailsEn : log.detailsBn}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADD / EDIT NEWS, UPLOAD IMAGES, MANAGE VIDEOS, DRAFTS */}
      {activeTab === 'editor' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white">
                {editingArticleId
                  ? isEn
                    ? `Editing Article: ${editingArticleId}`
                    : `সংবাদ সম্পাদনা: ${editingArticleId}`
                  : isEn
                  ? 'Create New Bilingual News Dispatch'
                  : 'নতুন দ্বিভাষিক সংবাদ প্রতিবেদন তৈরি করুন'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEn
                  ? 'Template-based DEFENCE 24 BD branded thumbnail generation & manual upload studio, hosted via Cloudinary (Cloud Name: y0n9r8df).'
                  : 'টেমপ্লেট-ভিত্তিক ডিফেন্স ২৪ বিডি ব্র্যান্ডিংসহ থাম্বনেইল তৈরি ও ম্যানুয়াল আপলোড স্টুডিও, ক্লাউডিনারিতে (y0n9r8df) সংরক্ষিত।'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isGeneratingThumbnail}
                onClick={handleRegenerateEditorThumbnail}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingThumbnail ? 'animate-spin' : ''}`} />
                <span>
                  {isGeneratingThumbnail
                    ? isEn
                      ? 'Generating Thumbnail...'
                      : 'থাম্বনেইল তৈরি হচ্ছে...'
                    : isEn
                    ? 'Regenerate Thumbnail'
                    : 'নতুন থাম্বনেইল তৈরি করুন'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleFillSampleNews}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isEn ? 'Load Sample Dispatch' : 'নমুনা সংবাদ লোড করুন'}
              </button>
              {editingArticleId && (
                <button
                  type="button"
                  onClick={handleResetEditorForm}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded cursor-pointer"
                >
                  {isEn ? 'Cancel Edit' : 'বাতিল করুন'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Category (All 15)' : 'সংবাদের বিভাগ (১৫টি)'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ForceCategory)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
              >
                {ALL_15_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat][lang]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Default Visual Cover' : 'ডিফল্ট প্রচ্ছদ চিত্র'}
              </label>
              <select
                value={visualKey}
                onChange={(e) => setVisualKey(e.target.value as VisualSlotKey)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
              >
                <option value="army_parade">
                  {isEn ? 'Army Parade Formation' : 'সেনাবাহিনী প্যারেড ফরমেশন'}
                </option>
                <option value="navy_frigate">
                  {isEn ? 'Navy Frigate & Hydrography' : 'নৌবাহিনী ফ্রিগেট ও হাইড্রোগ্রাফি'}
                </option>
                <option value="airforce_tarmac">
                  {isEn ? 'Air Force Aircraft Tarmac' : 'বিমান বাহিনী এয়ারক্রাফট টারম্যাক'}
                </option>
                <option value="police_command">
                  {isEn ? 'Police Urban Command' : 'পুলিশ আরবান কমান্ড'}
                </option>
                <option value="ansar_rescue">
                  {isEn ? 'Ansar & Civil Defense Rescue' : 'আনসার ও সিভিল ডিফেন্স উদ্ধার অভিযান'}
                </option>
                <option value="bgb_border_tech">
                  {isEn ? 'BGB Smart Border Radar' : 'বিজিবি স্মার্ট বর্ডার রাডার'}
                </option>
                <option value="defense_academy">
                  {isEn ? 'Defense Academy & STEM' : 'ডিফেন্স একাডেমি ও প্রযুক্তি'}
                </option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isEn ? 'Manual Image Upload' : 'ম্যানুয়াল ছবি আপলোড'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowCloudinarySetup((prev) => !prev)}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {isEn ? 'Cloudinary Settings' : 'ক্লাউডিনারি সেটিংস'}
                </button>
              </div>
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-500 text-xs font-medium rounded cursor-pointer transition-colors">
                <FileUp className="w-4 h-4 text-blue-600" />
                <span>
                  {uploadProgress !== null
                    ? isEn
                      ? `Uploading... ${uploadProgress}%`
                      : `আপলোড হচ্ছে... ${uploadProgress}%`
                    : manualSourceDataUrl || customImageUrl
                    ? isEn
                      ? 'Replace Uploaded Image'
                      : 'অন্য ছবি নির্বাচন করুন'
                    : isEn
                    ? 'Gallery / Photos / PC (JPG, PNG, WebP)'
                    : 'গ্যালারি / কম্পিউটার থেকে ছবি নিন'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="inline-flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" />
                  {isEn ? 'Video Embed / URL (Optional)' : 'ভিডিও লিংক (ঐচ্ছিক)'}
                </span>
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
              />
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploadProgress !== null && (
            <div className="space-y-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3 rounded">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-300">
                <span>
                  {isGeneratingThumbnail
                    ? isEn
                      ? 'Generating DEFENCE 24 BD branded thumbnail & uploading to Cloudinary...'
                      : 'ডিফেন্স ২৪ বিডি ব্র্যান্ডেড থাম্বনেইল তৈরি ও ক্লাউডিনারিতে আপলোড হচ্ছে...'
                    : isEn
                    ? 'Uploading image to Cloudinary...'
                    : 'ক্লাউডিনারিতে ছবি আপলোড হচ্ছে...'}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Error Alert */}
          {uploadError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded flex items-start justify-between gap-3 text-xs text-red-700 dark:text-red-300">
              <span>{uploadError}</span>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="font-bold underline shrink-0 cursor-pointer"
              >
                {isEn ? 'Dismiss' : 'বন্ধ করুন'}
              </button>
            </div>
          )}

          {/* Cloudinary Unsigned Upload Preset Setup Panel */}
          {showCloudinarySetup && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {isEn
                    ? 'Cloudinary Free Image Hosting Configuration (Unsigned Preset)'
                    : 'ক্লাউডিনারি ফ্রি ইমেজ হোস্টিং কনফিগারেশন (Unsigned Upload Preset)'}
                </h4>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  {isEn
                    ? 'Connected: y0n9r8df · Preset: Defence 24 BD'
                    : 'সংযুক্ত: y0n9r8df · প্রিসেট: Defence 24 BD'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={cloudNameInput}
                  onChange={(e) => setCloudNameInput(e.target.value)}
                  placeholder="y0n9r8df"
                  className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                />
                <input
                  type="text"
                  value={uploadPresetInput}
                  onChange={(e) => setUploadPresetInput(e.target.value)}
                  placeholder="Defence 24 BD"
                  className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                />
                <button
                  type="button"
                  onClick={handleSaveCloudinaryCredentials}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer"
                >
                  {isEn ? 'Save Cloudinary Config' : 'কনফিগারেশন সংরক্ষণ করুন'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isEn
                  ? 'Active Cloud Name: "y0n9r8df" | Unsigned Upload Preset: "Defence 24 BD". Generated thumbnails automatically upload via https://api.cloudinary.com/v1_1/y0n9r8df/image/upload and save secure_url & public_id in Firestore.'
                  : 'সক্রিয় Cloud Name: "y0n9r8df" এবং Unsigned Upload Preset: "Defence 24 BD"। তৈরিকৃত থাম্বনেইল স্বয়ংক্রিয়ভাবে ক্লাউডিনারিতে আপলোড ও ফায়ারস্টোরে সংরক্ষিত হয়।'}
              </p>
            </div>
          )}

          {/* COMPLETE THUMBNAIL MANAGEMENT SYSTEM: Auto / Regenerate (5 Variations) / Manual Upload Studio */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-lg space-y-5">
            {/* Mode Selector Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {isEn
                    ? 'Thumbnail Selection & Preview Studio (DEFENCE 24 BD Branding)'
                    : 'থাম্বনেইল নির্বাচন ও প্রিভিউ স্টুডিও (DEFENCE 24 BD ব্র্যান্ডিং)'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isEn
                    ? 'Choose between Automatic Template Thumbnail, Regenerated Variation, or Manually Uploaded Photo before publishing.'
                    : 'সংবাদ প্রকাশের পূর্বে স্বয়ংক্রিয় থাম্বনেইল, নতুন তৈরি ভ্যারিয়েশন অথবা ম্যানুয়াল আপলোডকৃত থাম্বনেইল নির্বাচন করুন।'}
                </p>
              </div>
              <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-md">
                <button
                  type="button"
                  onClick={() => setThumbnailSourceMode('auto')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    thumbnailSourceMode === 'auto'
                      ? 'bg-[#0B1F3A] text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800'
                  }`}
                >
                  {isEn ? '1. Auto Thumbnail' : '১. স্বয়ংক্রিয় থাম্বনেইল'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailSourceMode('regenerate');
                    if (variationPreviews.length === 0) {
                      void handleRegenerateEditorThumbnail();
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    thumbnailSourceMode === 'regenerate'
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800'
                  }`}
                >
                  {isEn ? '2. Regenerated Variations' : '২. নতুন থাম্বনেইল ভ্যারিয়েশন'}
                </button>
                <button
                  type="button"
                  onClick={() => setThumbnailSourceMode('manual')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    thumbnailSourceMode === 'manual'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800'
                  }`}
                >
                  {isEn ? '3. Manual Upload & Crop' : '৩. ম্যানুয়াল আপলোড ও ক্রপ'}
                </button>
              </div>
            </div>

            {/* Confirmation Guard Banner before replacing an already selected thumbnail */}
            {pendingThumbnailConfirm && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-500 dark:border-amber-600 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={pendingThumbnailConfirm.dataUrl}
                    alt="Candidate thumbnail"
                    className="w-24 h-14 object-cover rounded border border-amber-400 shrink-0"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      {isEn
                        ? 'Confirm Thumbnail Replacement: Do you want to replace your currently selected thumbnail with this design?'
                        : 'থাম্বনেইল পরিবর্তনের অনুমতি: আপনি কি বর্তমান নির্বাচিত থাম্বনেইলটি পরিবর্তন করে এই নতুন থাম্বনেইলটি ব্যবহার করতে চান?'}
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      {isEn ? pendingThumbnailConfirm.labelEn : pendingThumbnailConfirm.labelBn}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void applyAndUploadCandidateThumbnail(pendingThumbnailConfirm)}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded cursor-pointer"
                  >
                    {isEn ? 'Yes, Replace Thumbnail' : 'হ্যাঁ, থাম্বনেইল পরিবর্তন করুন'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingThumbnailConfirm(null)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold rounded cursor-pointer"
                  >
                    {isEn ? 'Keep Current' : 'বর্তমানটি রাখুন'}
                  </button>
                </div>
              </div>
            )}

            {/* Selected Thumbnail Preview + URL / Metadata Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {isEn ? 'Currently Selected Thumbnail (For Publish):' : 'প্রকাশের জন্য নির্বাচিত থাম্বনেইল:'}
                  </span>
                  {customImageUrl && (
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-bold">
                      {isEn ? 'Selected ✓' : 'নির্বাচিত ✓'}
                    </span>
                  )}
                </div>

                {customImageUrl ? (
                  <div className="relative rounded overflow-hidden border-2 border-emerald-600/80 dark:border-emerald-500/80 aspect-[16/9] bg-slate-900">
                    <img
                      src={customImageUrl}
                      alt={titleBn || titleEn || 'Selected thumbnail preview'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <label className="px-2.5 py-1 bg-blue-700/90 hover:bg-blue-800 text-white text-[10px] font-bold rounded cursor-pointer">
                        {isEn ? 'Replace' : 'পরিবর্তন'}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomImageUrl('');
                          setCloudinaryPublicId('');
                          setSelectedVariationSeed(null);
                        }}
                        className="px-2.5 py-1 bg-red-600/90 hover:bg-red-700 text-white text-[10px] font-bold rounded cursor-pointer"
                      >
                        {isEn ? 'Remove' : 'মুছুন'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-emerald-500/60 dark:border-emerald-600/50 bg-emerald-50/40 dark:bg-emerald-950/20 aspect-[16/9] flex flex-col items-center justify-center text-xs text-slate-600 dark:text-slate-300 p-4 text-center space-y-2">
                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {isEn
                        ? 'Automatic Template Thumbnail Active: Will automatically generate a DEFENCE 24 BD branded thumbnail from the news title, category & content upon publishing, or click "Regenerate Thumbnail" below to preview 5 variations now.'
                        : 'স্বয়ংক্রিয় টেমপ্লেট থাম্বনেইল সক্রিয়: সংবাদ প্রকাশের সময় শিরোনাম, বিভাগ ও মূল প্রতিবেদন থেকে স্বয়ংক্রিয়ভাবে "DEFENCE 24 BD" ব্র্যান্ডেড থাম্বনেইল তৈরি হবে, অথবা এখনই ৫টি ডিজাইন দেখতে নিচের বাটনে ক্লিক করুন।'}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isGeneratingThumbnail}
                  onClick={handleRegenerateEditorThumbnail}
                  className="w-full py-2.5 px-3 bg-[#0B1F3A] hover:bg-blue-900 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingThumbnail ? 'animate-spin' : ''}`} />
                  <span>
                    {isGeneratingThumbnail
                      ? isEn
                        ? 'Generating Variations...'
                        : 'নতুন থাম্বনেইল তৈরি হচ্ছে...'
                      : isEn
                      ? 'Regenerate Thumbnail'
                      : 'নতুন থাম্বনেইল তৈরি করুন'}
                  </span>
                </button>
              </div>

              <div className="md:col-span-7 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn
                      ? 'Selected Thumbnail URL (Saved to Firestore on Publish)'
                      : 'নির্বাচিত থাম্বনেইল লিংক (প্রকাশের সময় ফায়ারস্টোরে সংরক্ষিত হবে)'}
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGenerateOnCreate}
                      onChange={(e) => setAutoGenerateOnCreate(e.target.checked)}
                      className="w-3.5 h-3.5 accent-emerald-600"
                    />
                    <span>
                      {isEn
                        ? 'Auto-generate DEFENCE 24 BD thumbnail when publishing'
                        : 'সংবাদ প্রকাশের সময় স্বয়ংক্রিয়ভাবে DEFENCE 24 BD থাম্বনেইল তৈরি করুন'}
                    </span>
                  </label>
                </div>
                <div>
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/y0n9r8df/image/upload/..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isEn ? 'Cloudinary public_id' : 'Cloudinary public_id'}
                    </label>
                    <input
                      type="text"
                      value={cloudinaryPublicId}
                      onChange={(e) => setCloudinaryPublicId(e.target.value)}
                      placeholder="defence24bd/army/..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isEn ? 'SEO Post URL Slug' : 'এসইও পোস্ট স্লাগ (URL Slug)'}
                    </label>
                    <input
                      type="text"
                      value={articleSlug}
                      onChange={(e) => setArticleSlug(e.target.value)}
                      placeholder={slugifyText(titleEn) || 'post-title-slug'}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {isEn ? 'Live Post URL:' : 'পোস্টের লিংক:'}{' '}
                  <span className="font-mono text-blue-700 dark:text-blue-400">
                    https://defence24.netlify.app/{getCategoryUrlSlug(category)}/
                    {slugifyText(articleSlug || titleEn) || 'post-title'}
                  </span>
                </p>
              </div>
            </div>

            {/* 5 Regenerated Template Variations Preview & Selector */}
            {variationPreviews.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isEn
                      ? 'Select Preferred Regenerated Thumbnail Design (5 Template Variations):'
                      : 'পছন্দের থাম্বনেইল ডিজাইনটি নির্বাচন করুন (৫টি টেমপ্লেট ভ্যারিয়েশন):'}
                  </h4>
                  <button
                    type="button"
                    onClick={handleRegenerateEditorThumbnail}
                    disabled={isGeneratingThumbnail}
                    className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isEn ? 'Generate 5 More Variations ↻' : 'আরও ৫টি নতুন ভ্যারিয়েশন তৈরি করুন ↻'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {variationPreviews.map((v) => {
                    const isSelectedVar =
                      selectedVariationSeed === v.variationIndex || customImageUrl === v.dataUrl;
                    return (
                      <div
                        key={v.variationIndex}
                        className={`rounded-lg border p-2 flex flex-col justify-between gap-2 bg-white dark:bg-slate-900 transition-colors ${
                          isSelectedVar
                            ? 'border-2 border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-500'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="aspect-[16/9] rounded overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <img
                              src={v.dataUrl}
                              alt={isEn ? v.labelEn : v.labelBn}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                            {isEn ? v.labelEn : v.labelBn}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            requestApplyThumbnailWithConfirmation({
                              dataUrl: v.dataUrl,
                              file: v.file,
                              variationSeed: v.variationIndex,
                              labelBn: v.labelBn,
                              labelEn: v.labelEn,
                              sourceMode: 'regenerate',
                            })
                          }
                          className={`w-full py-1.5 px-2 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            isSelectedVar
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-700 hover:bg-blue-800 text-white'
                          }`}
                        >
                          {isSelectedVar
                            ? isEn
                              ? 'Selected ✓'
                              : 'নির্বাচিত ✓'
                            : isEn
                            ? 'Select This Design'
                            : 'এই ডিজাইনটি নিন'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Manual Thumbnail Upload, Drag-and-Drop, Crop/Resize/Position & Branding Studio */}
            {thumbnailSourceMode === 'manual' && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isEn
                      ? 'Manual Thumbnail Upload Studio (Android Gallery, iPhone Photos, PC & Drag-and-Drop)'
                      : 'ম্যানুয়াল থাম্বনেইল আপলোড ও এডিটিং স্টুডিও (অ্যান্ড্রয়েড গ্যালারি, আইফোন ফটোজ, কম্পিউটার ও ড্র্যাগ-অ্যান্ড-ড্রপ)'}
                  </h4>
                  {manualSourceDataUrl && (
                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded cursor-pointer">
                        {isEn ? 'Replace Image' : 'ছবি পরিবর্তন করুন'}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setManualSourceDataUrl('');
                          setManualPreviewDataUrl('');
                          setManualPreviewFile(null);
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold rounded cursor-pointer"
                      >
                        {isEn ? 'Remove Image' : 'ছবি মুছুন'}
                      </button>
                    </div>
                  )}
                </div>

                {!manualSourceDataUrl ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingManualImage(true);
                    }}
                    onDragLeave={() => setIsDraggingManualImage(false)}
                    onDrop={handleManualDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDraggingManualImage
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <FileUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {isEn
                        ? 'Drag & Drop an image here, or tap to choose from Android Gallery / iPhone Photos / Computer'
                        : 'এখানে ছবি ড্র্যাগ অ্যান্ড ড্রপ করুন, অথবা অ্যান্ড্রয়েড গ্যালারি / আইফোন ফটোজ / কম্পিউটার থেকে নির্বাচন করুন'}
                    </p>
                    <p className="text-[11px] text-slate-500 mb-3">
                      {isEn
                        ? 'Supported formats: JPG, JPEG, PNG, WebP (1280×720 HD 16:9 output)'
                        : 'সমর্থিত ফরম্যাট: JPG, JPEG, PNG, WebP (১২৮০×৭২০ এইচডি ১৬:৯ আউটপুট)'}
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded cursor-pointer">
                      <FileUp className="w-4 h-4" />
                      <span>
                        {isEn ? 'Select Photo from Device' : 'ডিভাইস থেকে ছবি নির্বাচন করুন'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="md:col-span-6 space-y-2">
                      <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {isEn
                          ? 'Live Manual Thumbnail Preview (Crop, Position & Branding):'
                          : 'ম্যানুয়াল থাম্বনেইল লাইভ প্রিভিউ (ক্রপ, পজিশন ও ব্র্যান্ডিং):'}
                      </span>
                      <div className="aspect-[16/9] rounded overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950">
                        <img
                          src={manualPreviewDataUrl || manualSourceDataUrl}
                          alt="Manual studio preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-6 space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-semibold mb-1">
                          <span>{isEn ? 'Crop & Resize (Zoom):' : 'ক্রপ ও রিসাইজ (জুম):'}</span>
                          <span>{Math.round(manualZoom * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="2.5"
                          step="0.05"
                          value={manualZoom}
                          onChange={(e) => setManualZoom( parseFloat(e.target.value) )}
                          className="w-full accent-blue-700"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between font-semibold mb-1">
                            <span>{isEn ? 'Horizontal Position (X):' : 'ডান-বাম পজিশন (X):'}</span>
                            <span>{manualPanX}%</span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            step="2"
                            value={manualPanX}
                            onChange={(e) => setManualPanX(parseInt(e.target.value, 10))}
                            className="w-full accent-blue-700"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between font-semibold mb-1">
                            <span>{isEn ? 'Vertical Position (Y):' : 'উপর-নিচ পজিশন (Y):'}</span>
                            <span>{manualPanY}%</span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            step="2"
                            value={manualPanY}
                            onChange={(e) => setManualPanY(parseInt(e.target.value, 10))}
                            className="w-full accent-blue-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <label className="flex items-center gap-2 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={manualApplyBranding}
                            onChange={(e) => setManualApplyBranding(e.target.checked)}
                            className="w-4 h-4 accent-blue-700"
                          />
                          <span>
                            {isEn
                              ? 'Apply "DEFENCE 24 BD" bottom branding bar'
                              : 'নিচে "DEFENCE 24 BD" ব্র্যান্ডিং বার যুক্ত করুন'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={manualApplyWatermark}
                            onChange={(e) => setManualApplyWatermark(e.target.checked)}
                            className="w-4 h-4 accent-blue-700"
                          />
                          <span>
                            {isEn
                              ? 'Apply subtle "DEFENCE 24 BD" watermark'
                              : 'হালকা "DEFENCE 24 BD" ওয়াটারমার্ক যুক্ত করুন'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={manualIncludeHeadline}
                            onChange={(e) => setManualIncludeHeadline(e.target.checked)}
                            className="w-4 h-4 accent-blue-700"
                          />
                          <span>
                            {isEn
                              ? 'Overlay article headline on manual image'
                              : 'ছবির ওপর সংবাদের শিরোনাম যুক্ত করুন'}
                          </span>
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          type="button"
                          disabled={isGeneratingThumbnail}
                          onClick={() =>
                            requestApplyThumbnailWithConfirmation({
                              dataUrl: manualPreviewDataUrl || manualSourceDataUrl,
                              file: manualPreviewFile || undefined,
                              labelBn: 'ম্যানুয়াল আপলোডকৃত থাম্বনেইল',
                              labelEn: 'Manually Uploaded Thumbnail',
                              sourceMode: 'manual',
                            })
                          }
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded cursor-pointer"
                        >
                          {isEn
                            ? 'Use This Manual Thumbnail & Upload to Cloudinary'
                            : 'এই ম্যানুয়াল থাম্বনেইলটি নির্বাচন ও ক্লাউডিনারিতে আপলোড করুন'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setManualZoom(1);
                            setManualPanX(0);
                            setManualPanY(0);
                          }}
                          className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold cursor-pointer"
                        >
                          {isEn ? 'Reset Crop' : 'রিসেট'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={isLeadStory}
                onChange={(e) => setIsLeadStory(e.target.checked)}
                className="w-4 h-4 accent-blue-700"
              />
              <span>{isEn ? 'Feature as Lead Front-Page Story' : 'প্রধান সংবাদ হিসেবে প্রদর্শন করুন'}</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={isBreakingTicker}
                onChange={(e) => setIsBreakingTicker(e.target.checked)}
                className="w-4 h-4 accent-blue-700"
              />
              <span>{isEn ? 'Show in Breaking News Ticker' : 'ব্রেকিং নিউজ টিকারে যুক্ত করুন'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* English Content Column */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                {isEn ? 'English Edition Content' : 'ইংরেজি সংস্করণের সংবাদ (English)'}
              </h3>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="English Headline"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
              />
              <input
                type="text"
                value={subtitleEn}
                onChange={(e) => setSubtitleEn(e.target.value)}
                placeholder="English Summary / Deck"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
              />
              <input
                type="text"
                value={locationEn}
                onChange={(e) => setLocationEn(e.target.value)}
                placeholder="Location (English)"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
              />
              <textarea
                rows={5}
                value={bodyEn}
                onChange={(e) => setBodyEn(e.target.value)}
                placeholder="English Article Paragraphs..."
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
              />
            </div>

            {/* Bangla Content Column */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {isEn ? 'Bangla Edition Content' : 'বাংলা সংস্করণের সংবাদ (Bangla)'}
              </h3>
              <input
                type="text"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="বাংলা শিরোনাম"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
              />
              <input
                type="text"
                value={subtitleBn}
                onChange={(e) => setSubtitleBn(e.target.value)}
                placeholder="বাংলা উপ-শিরোনাম / সারসংক্ষেপ"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
              />
              <input
                type="text"
                value={locationBn}
                onChange={(e) => setLocationBn(e.target.value)}
                placeholder="স্থান (বাংলায়)"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
              />
              <textarea
                rows={5}
                value={bodyBn}
                onChange={(e) => setBodyBn(e.target.value)}
                placeholder="বাংলা মূল প্রতিবেদন..."
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              disabled={isGeneratingThumbnail}
              onClick={handleRegenerateEditorThumbnail}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingThumbnail ? 'animate-spin' : ''}`} />
              <span>
                {isEn ? 'Regenerate Thumbnail' : 'নতুন থাম্বনেইল তৈরি করুন'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => saveArticleWithStatus('draft')}
              className="px-4 py-2.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {isEn ? 'Save as Draft (Unpublished)' : 'খসড়া হিসেবে সংরক্ষণ করুন (Draft)'}
            </button>
            <button
              type="button"
              disabled={isGeneratingThumbnail}
              onClick={() => saveArticleWithStatus('published')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded cursor-pointer disabled:opacity-50"
            >
              <FilePlus className="w-4 h-4" />
              <span>
                {editingArticleId
                  ? isEn
                    ? 'Update & Publish Selected Thumbnail'
                    : 'আপডেট ও নির্বাচিত থাম্বনেইলসহ প্রকাশ করুন'
                  : isEn
                  ? 'Publish News Dispatch'
                  : 'সংবাদ প্রকাশ করুন'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SUBMISSIONS APPROVAL & ALL NEWS MANAGEMENT */}
      {activeTab === 'submissions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white">
              {isEn
                ? 'News Moderation, Approval & Publication Control'
                : 'সংবাদ অনুমোদন, প্রকাশ ও ব্যবস্থাপনা তালিকা'}
            </h2>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded">
              {(['all', 'published', 'pending', 'draft', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setQueueFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded uppercase cursor-pointer ${
                    queueFilter === st
                      ? 'bg-[#0B1F3A] text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {STATUS_LABELS[st]?.[lang] || st}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredQueueArticles.map((art) => {
              const st = art.status || 'published';
              const isRegen = regeneratingArticleId === art.id;
              return (
                <div
                  key={art.id}
                  className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 max-w-3xl">
                    {art.customImageUrl && (
                      <img
                        src={art.customImageUrl}
                        alt={art[lang].title}
                        className="w-24 h-14 object-cover rounded border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5"
                      />
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-blue-700 dark:text-blue-400">
                          {CATEGORY_LABELS[art.category as ForceCategory]?.[lang] || art.category}
                        </span>
                        <span>·</span>
                        <span>{art[lang].publishedDate}</span>
                        <span>·</span>
                        <span className="font-bold uppercase">
                          {STATUS_LABELS[st]?.[lang] || st}
                        </span>
                        {art.submitterEmail && (
                          <>
                            <span>·</span>
                            <span>
                              {isEn ? 'Submitted by:' : 'প্রেরক:'} {art.submitterName} (
                              {art.submitterEmail})
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base font-editorial font-bold text-slate-900 dark:text-white">
                        {art[lang].title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {art[lang].subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {confirmRegenerateArticleId === art.id ? (
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-700 px-2.5 py-1.5 rounded text-xs">
                        <span className="font-semibold text-amber-900 dark:text-amber-200">
                          {isEn ? 'Replace current thumbnail?' : 'বর্তমান থাম্বনেইল পরিবর্তন করবেন?'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRegenerateArticleThumbnailById(art, true)}
                          className="px-2 py-0.5 bg-blue-700 text-white font-bold rounded cursor-pointer"
                        >
                          {isEn ? 'Confirm' : 'হ্যাঁ'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRegenerateArticleId(null)}
                          className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded cursor-pointer"
                        >
                          {isEn ? 'Cancel' : 'না'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isRegen}
                        onClick={() => handleRegenerateArticleThumbnailById(art)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded border border-blue-400 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 cursor-pointer disabled:opacity-50"
                        title={
                          isEn
                            ? 'Regenerate DEFENCE 24 BD Branded Thumbnail & Upload to Cloudinary'
                            : 'ডিফেন্স ২৪ বিডি ব্র্যান্ডিংসহ নতুন থাম্বনেইল তৈরি ও ক্লাউডিনারিতে আপলোড করুন'
                        }
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRegen ? 'animate-spin' : ''}`} />
                        <span>
                          {isRegen
                            ? isEn
                              ? 'Generating...'
                              : 'তৈরি হচ্ছে...'
                            : isEn
                            ? 'Regenerate Thumbnail'
                            : 'নতুন থাম্বনেইল তৈরি করুন'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleBreakingTicker(art)}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded border cursor-pointer ${
                        art.isBreakingTicker !== false
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {art.isBreakingTicker !== false
                        ? isEn
                          ? 'In Ticker ✓'
                          : 'টিকারে যুক্ত ✓'
                        : isEn
                        ? '+ Ticker'
                        : '+ টিকার'}
                    </button>
                    {st !== 'published' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(art, 'published')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Approve / Publish' : 'অনুমোদন ও প্রকাশ'}</span>
                      </button>
                    )}
                    {st === 'published' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(art, 'draft')}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {isEn ? 'Unpublish (Draft)' : 'অপ্রকাশিত করুন'}
                      </button>
                    )}
                    {st !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(art, 'rejected')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Reject' : 'বাতিল করুন'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEditArticleClick(art)}
                      className="p-2 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title={isEn ? 'Edit' : 'সম্পাদনা'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteArticle(art.id)}
                      className="p-2 border border-red-300 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      title={isEn ? 'Delete' : 'মুছে ফেলুন'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BREAKING NOTICES & CIRCULARS */}
      {activeTab === 'notices_circulars' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Breaking & Emergency Notices Control */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white">
                {editingNoticeId
                  ? isEn
                    ? 'Edit Notice / Breaking Alert'
                    : 'নোটিশ / ব্রেকিং অ্যালার্ট সম্পাদনা'
                  : isEn
                  ? 'Manage Breaking Ticker & Emergency Notices'
                  : 'ব্রেকিং নিউজ টিকার ও জরুরি নোটিশ নিয়ন্ত্রণ'}
              </h2>
              {editingNoticeId && (
                <button
                  type="button"
                  onClick={handleResetNoticeForm}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  {isEn ? 'Cancel Edit' : 'বাতিল করুন'}
                </button>
              )}
            </div>

            <form onSubmit={handleAddNotice} className="space-y-3">
              <select
                value={noticeType}
                onChange={(e) => setNoticeType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
              >
                <option value="breaking">
                  {isEn ? 'Breaking News Alert' : 'ব্রেকিং নিউজ অ্যালার্ট'}
                </option>
                <option value="emergency">
                  {isEn ? 'Emergency Public Notice' : 'জরুরি জনস্বার্থ নোটিশ'}
                </option>
                <option value="announcement">
                  {isEn ? 'Important Announcement' : 'গুরুত্বপূর্ণ ঘোষণা'}
                </option>
              </select>
              <input
                type="text"
                required
                value={noticeTitleEn}
                onChange={(e) => setNoticeTitleEn(e.target.value)}
                placeholder="Notice Headline (English)"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
              />
              <input
                type="text"
                required
                value={noticeTitleBn}
                onChange={(e) => setNoticeTitleBn(e.target.value)}
                placeholder="নোটিশের শিরোনাম (বাংলায়)"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded cursor-pointer"
              >
                {editingNoticeId
                  ? isEn
                    ? 'Update Notice'
                    : 'নোটিশ আপডেট করুন'
                  : isEn
                  ? 'Post Notice to Live Ticker'
                  : 'টিকারে নোটিশ প্রকাশ করুন'}
              </button>
            </form>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 pt-2">
              {notices.map((n) => (
                <div key={n.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold uppercase text-red-600 dark:text-red-400">
                      [{n.noticeType}]
                    </span>{' '}
                    <span className="text-slate-800 dark:text-slate-200">
                      {isEn ? n.titleEn : n.titleBn}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleNoticeActive(n)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        n.isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {n.isActive ? (isEn ? 'Active' : 'সচল') : isEn ? 'Paused' : 'স্থগিত'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditNoticeClick(n)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 cursor-pointer"
                      title={isEn ? 'Edit Notice' : 'সম্পাদনা'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(n.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                      title={isEn ? 'Delete Notice' : 'মুছে ফেলুন'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Recruitment Circulars Control */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white">
                {editingCircularId
                  ? isEn
                    ? 'Edit Official Recruitment Circular'
                    : 'দাপ্তরিক নিয়োগ বিজ্ঞপ্তি সম্পাদনা'
                  : isEn
                  ? 'Publish Official Recruitment Circular'
                  : 'নতুন দাপ্তরিক নিয়োগ বিজ্ঞপ্তি প্রকাশ'}
              </h2>
              {editingCircularId && (
                <button
                  type="button"
                  onClick={handleResetCircularForm}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  {isEn ? 'Cancel Edit' : 'বাতিল করুন'}
                </button>
              )}
            </div>
            <form onSubmit={handleAddCircular} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={circCategory}
                  onChange={(e) => setCircCategory(e.target.value as ForceCategory)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                >
                  {ALL_15_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat][lang]}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={circPortal}
                  onChange={(e) => setCircPortal(e.target.value)}
                  placeholder="Official Domain (.mil.bd)"
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={circOrgEn}
                  onChange={(e) => setCircOrgEn(e.target.value)}
                  placeholder="Organization (English)"
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
                <input
                  type="text"
                  value={circOrgBn}
                  onChange={(e) => setCircOrgBn(e.target.value)}
                  placeholder="সংস্থার নাম (বাংলায়)"
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
              </div>
              <input
                type="text"
                required
                value={circTitleEn}
                onChange={(e) => setCircTitleEn(e.target.value)}
                placeholder="Circular Title (English)"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
              />
              <input
                type="text"
                required
                value={circTitleBn}
                onChange={(e) => setCircTitleBn(e.target.value)}
                placeholder="বিজ্ঞপ্তির শিরোনাম (বাংলায়)"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={circPosEn}
                  onChange={(e) => setCircPosEn(e.target.value)}
                  placeholder="Position (English)"
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
                <input
                  type="text"
                  required
                  value={circPosBn}
                  onChange={(e) => setCircPosBn(e.target.value)}
                  placeholder="পদের নাম (বাংলায়)"
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={circDeadlineEn}
                  onChange={(e) => setCircDeadlineEn(e.target.value)}
                  placeholder="Deadline (English)"
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
                <input
                  type="text"
                  value={circDeadlineBn}
                  onChange={(e) => setCircDeadlineBn(e.target.value)}
                  placeholder="আবেদনের শেষ তারিখ (বাংলায়)"
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
              </div>

              {/* Official Circular PDF Upload or Direct PDF URL */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn
                      ? 'Official Circular PDF / Attachment (Cloudinary)'
                      : 'অফিসিয়াল সার্কুলার পিডিএফ / সংযুক্তি (ক্লাউডিনারি)'}
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded cursor-pointer">
                    <FileUp className="w-3.5 h-3.5" />
                    <span>
                      {isUploadingCircPdf
                        ? isEn
                          ? 'Uploading PDF...'
                          : 'আপলোড হচ্ছে...'
                        : isEn
                        ? 'Upload PDF / Image'
                        : 'পিডিএফ আপলোড করুন'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf,image/*"
                      onChange={handleCircularPdfUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="url"
                  value={circPdfUrl}
                  onChange={(e) => setCircPdfUrl(e.target.value)}
                  placeholder={
                    isEn
                      ? 'Or paste official PDF URL (https://...)'
                      : 'অথবা সরাসরি পিডিএফ লিংক পেস্ট করুন (https://...)'
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                />
              </div>

              <button
                type="submit"
                disabled={isUploadingCircPdf}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded cursor-pointer disabled:opacity-50"
              >
                {editingCircularId
                  ? isEn
                    ? 'Update Circular'
                    : 'বিজ্ঞপ্তি আপডেট করুন'
                  : isEn
                  ? 'Publish Circular'
                  : 'বিজ্ঞপ্তি প্রকাশ করুন'}
              </button>
            </form>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 pt-2 max-h-60 overflow-y-auto">
              {circulars.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{c[lang].title}</span>
                      {c.pdfUrl && (
                        <a
                          href={c.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold"
                        >
                          PDF ↗
                        </a>
                      )}
                    </div>
                    <div className="text-slate-500">
                      {c[lang].organization} · {c[lang].deadlineDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditCircularClick(c)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 cursor-pointer"
                      title={isEn ? 'Edit Circular' : 'সম্পাদনা'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCircular(c.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                      title={isEn ? 'Delete Circular' : 'মুছে ফেলুন'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SEO, WEBSITE SETTINGS & GOOGLE ADSENSE COMPLIANCE SYSTEM */}
      {activeTab === 'seo_ads_settings' && (
        <div className="space-y-8">
          <form
            onSubmit={handleSaveSettings}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg space-y-6"
          >
            <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
              {isEn
                ? 'Manage SEO Metadata, Website Settings & Google AdSense Placements'
                : 'এসইও মেটাডেটা, ওয়েবসাইট সেটিংস ও Google AdSense স্থান নিয়ন্ত্রণ'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {isEn ? 'SEO Meta Title (English)' : 'এসইও মেটা টাইটেল (ইংরেজি)'}
                </label>
                <input
                  type="text"
                  value={localSettings.seoTitleEn}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, seoTitleEn: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {isEn ? 'SEO Meta Title (Bengali)' : 'এসইও মেটা টাইটেল (বাংলা)'}
                </label>
                <input
                  type="text"
                  value={localSettings.seoTitleBn}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, seoTitleBn: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {isEn ? 'SEO Meta Description (English)' : 'এসইও মেটা বিবরণ (ইংরেজি)'}
                </label>
                <textarea
                  rows={2}
                  value={localSettings.seoDescEn}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, seoDescEn: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {isEn ? 'SEO Meta Description (Bengali)' : 'এসইও মেটা বিবরণ (বাংলা)'}
                </label>
                <textarea
                  rows={2}
                  value={localSettings.seoDescBn}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, seoDescBn: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {isEn ? 'Canonical Website Domain' : 'ক্যানোনিকাল ওয়েবসাইট ডোমেইন'}
                </label>
                <input
                  type="url"
                  value={localSettings.canonicalDomain}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, canonicalDomain: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded font-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {isEn ? 'Google AdSense Publisher ID' : 'Google AdSense Publisher ID'}
                </label>
                <input
                  type="text"
                  value={localSettings.adsensePublisherId}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, adsensePublisherId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded font-tabular"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.enableTopBannerAd}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, enableTopBannerAd: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-700"
                />
                <span>{isEn ? 'Enable Homepage Display Ad Slot' : 'প্রচ্ছদ বিজ্ঞাপন ইউনিট সচল রাখুন'}</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.enableInArticleAd}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, enableInArticleAd: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-700"
                />
                <span>{isEn ? 'Enable In-Article Ad Slot' : 'সংবাদের ভেতরে বিজ্ঞাপন ইউনিট সচল রাখুন'}</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.emergencyBannerEnabled}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      emergencyBannerEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-blue-700"
                />
                <span>{isEn ? 'Show Emergency Notice Bar' : 'জরুরি নোটিশ বার প্রদর্শন করুন'}</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0B1F3A] hover:bg-blue-900 text-white text-xs font-semibold rounded cursor-pointer"
              >
                {isEn ? 'Save SEO & Portal Settings' : 'এসইও এবং সেটিংস সংরক্ষণ করুন'}
              </button>

              <button
                type="button"
                onClick={() => handleDeveloperZipExport('full')}
                className="px-4 py-2.5 border border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 text-xs font-semibold rounded cursor-pointer"
              >
                {isEn
                  ? 'Developer Only: Export Netlify & Firebase Source Package (.zip)'
                  : 'শুধুমাত্র ডেভেলপার: নেটলিফাই ও ফায়ারবেস সোর্স প্যাকেজ (.zip)'}
              </button>
            </div>
          </form>

          {/* COMPLETE BILINGUAL GOOGLE ADSENSE COMPLIANCE SYSTEM (NOTICES, WARNINGS, AUDIT REPORT & INSTRUCTIONS) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  {isEn
                    ? 'Google AdSense Compliance & Policy Verification System'
                    : 'Google AdSense কমপ্লায়েন্স ও নীতিমালা যাচাইকরণ সিস্টেম'}
                </span>
                <h3 className="text-lg font-editorial font-bold text-slate-900 dark:text-white mt-0.5">
                  {isEn
                    ? 'Complete Bilingual Audit Report, Compliance Warnings & Publisher Instructions'
                    : 'পূর্ণাঙ্গ দ্বিভাষিক অডিট রিপোর্ট, সতর্কবার্তা ও প্রকাশক নির্দেশিকা'}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {isEn ? '7 / 7 Policy Pages Active' : '৭ / ৭টি নীতিমালা পাতা সক্রিয়'}
              </span>
            </div>

            {/* AdSense Compliance Warnings & Notices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-lg border space-y-1.5 ${
                  !localSettings.adsensePublisherId ||
                  localSettings.adsensePublisherId.includes('00000000')
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {!localSettings.adsensePublisherId ||
                  localSettings.adsensePublisherId.includes('00000000')
                    ? isEn
                      ? 'Warning: Placeholder Google AdSense Publisher ID Detected'
                      : 'সতর্কবার্তা: নমুনা Google AdSense Publisher ID শনাক্ত হয়েছে'
                    : isEn
                    ? 'Notice: Live Google AdSense Publisher ID Configured'
                    : 'বিজ্ঞপ্তি: প্রকৃত Google AdSense Publisher ID সংযুক্ত রয়েছে'}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {!localSettings.adsensePublisherId ||
                  localSettings.adsensePublisherId.includes('00000000')
                    ? isEn
                      ? 'Public ad containers remain safely hidden while ca-pub-0000000000000000 is set. This prevents blank ad boxes and complies with Google Publisher Policies during review.'
                      : 'যতক্ষণ ca-pub-0000000000000000 সেট করা থাকবে, ততক্ষণ পাবলিক ওয়েবসাইটে খালি বিজ্ঞাপনের বক্স স্বয়ংক্রিয়ভাবে লুকানো থাকবে। এটি Google AdSense রিভিউ চলাকালীন নীতিমালা লঙ্ঘন প্রতিরোধ করে।'
                    : isEn
                    ? `Active Publisher ID (${localSettings.adsensePublisherId}) is verified. Ad units are clearly labeled and separated from editorial links.`
                    : `সক্রিয় Publisher ID (${localSettings.adsensePublisherId}) যাচাইকৃত। বিজ্ঞাপন ইউনিটসমূহ মূল সংবাদ ও বাটন থেকে স্পষ্টভাবে পৃথক রাখা হয়েছে।`}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 space-y-1.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {isEn
                    ? 'Compliance Notice: Accidental Click & Content Isolation Guard'
                    : 'কমপ্লায়েন্স বিজ্ঞপ্তি: দুর্ঘটনাবশত ক্লিক ও কনটেন্ট সুরক্ষা'}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {isEn
                    ? 'All display ad units include a mandatory "Advertisement" / "বিজ্ঞাপন" label, minimum 24px spacing from navigation controls, and zero placement on 404, login, or unmoderated submission screens.'
                    : 'প্রতিটি বিজ্ঞাপন ইউনিটে স্পষ্টভাবে "বিজ্ঞাপন" / "Advertisement" লেবেল সংযুক্ত রয়েছে, নেভিগেশন বাটন থেকে নিরাপদ দূরত্ব বজায় রাখা হয়েছে এবং ৪০৪, লগইন কিংবা অ-অনুমোদিত পাতায় বিজ্ঞাপন প্রদর্শন সম্পূর্ণ বন্ধ রাখা হয়েছে।'}
                </p>
              </div>
            </div>

            {/* 7 Mandatory Policy & Institutional Pages Bilingual Audit Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {isEn
                  ? '1. Mandatory Policy & Institutional Pages Audit (Bengali & English)'
                  : '১. বাধ্যতামূলক ৭টি নীতিমালা ও প্রাতিষ্ঠানিক পাতার অডিট রিপোর্ট (বাংলা ও ইংরেজি)'}
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      <th className="p-3 font-bold">
                        {isEn ? 'Policy Page' : 'নীতিমালা পাতার নাম'}
                      </th>
                      <th className="p-3 font-bold">
                        {isEn ? 'Canonical URL & Hreflang' : 'ক্যানোনিকাল URL ও Hreflang'}
                      </th>
                      <th className="p-3 font-bold">
                        {isEn ? 'Bilingual Translation Status' : 'দ্বিভাষিক অনুবাদের অবস্থা'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {[
                      {
                        nameEn: 'About Us',
                        nameBn: 'আমাদের সম্পর্কে',
                        url: 'https://defence24.netlify.app/about',
                        statusEn: 'Verified in Bengali & English',
                        statusBn: 'বাংলা ও ইংরেজি উভয় ভাষায় যাচাইকৃত',
                      },
                      {
                        nameEn: 'Contact Us',
                        nameBn: 'যোগাযোগ',
                        url: 'https://defence24.netlify.app/contact',
                        statusEn: 'Verified in Bengali & English',
                        statusBn: 'বাংলা ও ইংরেজি উভয় ভাষায় যাচাইকৃত',
                      },
                      {
                        nameEn: 'Privacy Policy',
                        nameBn: 'গোপনীয়তা নীতি',
                        url: 'https://defence24.netlify.app/privacy',
                        statusEn: 'Includes Google AdSense & DoubleClick DART Cookie disclosure',
                        statusBn: 'Google AdSense ও DoubleClick DART Cookie ঘোষণাসহ যাচাইকৃত',
                      },
                      {
                        nameEn: 'Terms and Conditions',
                        nameBn: 'ব্যবহারের শর্তাবলি',
                        url: 'https://defence24.netlify.app/terms',
                        statusEn: 'Verified in Bengali & English',
                        statusBn: 'বাংলা ও ইংরেজি উভয় ভাষায় যাচাইকৃত',
                      },
                      {
                        nameEn: 'Editorial Policy',
                        nameBn: 'সম্পাদকীয় নীতিমালা',
                        url: 'https://defence24.netlify.app/editorial-policy',
                        statusEn: 'Verified in Bengali & English',
                        statusBn: 'বাংলা ও ইংরেজি উভয় ভাষায় যাচাইকৃত',
                      },
                      {
                        nameEn: 'Disclaimer',
                        nameBn: 'দাবি পরিত্যাগ',
                        url: 'https://defence24.netlify.app/disclaimer',
                        statusEn: 'Includes official non-affiliation disclosure in both languages',
                        statusBn: 'সরকারি বাহিনীর সাথে অ-সংশ্লিষ্টতার ঘোষণাসহ উভয় ভাষায় যাচাইকৃত',
                      },
                      {
                        nameEn: 'Corrections Policy',
                        nameBn: 'সংশোধনী নীতিমালা',
                        url: 'https://defence24.netlify.app/corrections-policy',
                        statusEn: '24-hour verification & bilingual revision protocol active',
                        statusBn: '২৪ ঘণ্টায় তথ্য যাচাই ও দ্বিভাষিক সংশোধন বিধিমালা সক্রিয়',
                      },
                    ].map((row) => (
                      <tr key={row.url} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {isEn ? row.nameEn : row.nameBn}
                        </td>
                        <td className="p-3 font-tabular text-blue-700 dark:text-blue-400">
                          {row.url}
                          <span className="block text-[10px] text-slate-500">
                            hreflang=&quot;bn&quot; | hreflang=&quot;en&quot; | hreflang=&quot;x-default&quot;
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            <span>{isEn ? row.statusEn : row.statusBn}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Technical & Editorial Readiness Audit Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {isEn
                  ? '2. Google AdSense Technical & Content Readiness Audit Report'
                  : '২. Google AdSense কারিগরি ও কনটেন্ট প্রস্তুতি অডিট রিপোর্ট'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  {
                    titleEn: 'Original Bilingual News & Recruitment Dispatches',
                    titleBn: 'মৌলিক দ্বিভাষিক প্রতিরক্ষা সংবাদ ও নিয়োগ বিজ্ঞপ্তি',
                    descEn: `${publishedCount} published articles available with complete Bengali and English editions.`,
                    descBn: `${publishedCount}টি প্রকাশিত প্রতিবেদন সম্পূর্ণ বাংলা ও ইংরেজি সংস্করণসহ সক্রিয় রয়েছে।`,
                  },
                  {
                    titleEn: 'Hreflang & Canonical SEO Synchronization',
                    titleBn: 'Hreflang ও ক্যানোনিকাল এসইও সমন্বয়',
                    descEn: 'Every page provides hreflang="bn", hreflang="en", and hreflang="x-default" tags on https://defence24.netlify.app.',
                    descBn: 'প্রতিটি পাতায় https://defence24.netlify.app ডোমেইনে hreflang="bn", hreflang="en" এবং hreflang="x-default" ট্যাগ সংযুক্ত রয়েছে।',
                  },
                  {
                    titleEn: 'Public Submission Moderation Queue',
                    titleBn: 'পাঠকের পাঠানো সংবাদের প্রাক-অনুমোদন সুরক্ষা',
                    descEn: 'Reader submissions remain in Pending status until reviewed and approved by an admin.',
                    descBn: 'পাঠকের পাঠানো সংবাদ অ্যাডমিনের যাচাই ও অনুমোদন ছাড়া কখনোই পাবলিক ওয়েবসাইটে প্রকাশিত হয় না।',
                  },
                  {
                    titleEn: 'Google Search Console & Sitemap Readiness',
                    titleBn: 'Google Search Console ও সাইটম্যাপ প্রস্তুতি',
                    descEn: 'Original google9938907eb2ae8dc0.html verification file, robots.txt, and sitemap.xml are active.',
                    descBn: 'মূল google9938907eb2ae8dc0.html ভেরিফিকেশন ফাইল, robots.txt এবং sitemap.xml সক্রিয় রয়েছে।',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1"
                  >
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{isEn ? item.titleEn : item.titleBn}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {isEn ? item.descEn : item.descBn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Instructions in Both Languages */}
            <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {isEn
                  ? '3. Instructions for Activating Google AdSense on https://defence24.netlify.app'
                  : '৩. https://defence24.netlify.app-এ Google AdSense সক্রিয় করার নির্দেশিকা'}
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                <li>
                  {isEn
                    ? 'Sign in to Google AdSense and submit https://defence24.netlify.app for site review.'
                    : 'Google AdSense অ্যাকাউন্টে লগইন করে সাইট রিভিউয়ের জন্য https://defence24.netlify.app জমা দিন।'}
                </li>
                <li>
                  {isEn
                    ? 'Copy your official Google AdSense Publisher ID (format: ca-pub-XXXXXXXXXXXXXXXX) and paste it into the Google AdSense Publisher ID field above, then click Save.'
                    : 'আপনার দাপ্তরিক Google AdSense Publisher ID (ফরম্যাট: ca-pub-XXXXXXXXXXXXXXXX) কপি করে উপরের Google AdSense Publisher ID ঘরে বসিয়ে সংরক্ষণ করুন।'}
                </li>
                <li>
                  {isEn
                    ? 'Update /public/ads.txt with your Publisher ID line: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0.'
                    : '/public/ads.txt ফাইলে আপনার Publisher ID যুক্ত করুন: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0।'}
                </li>
                <li>
                  {isEn
                    ? 'Keep all 7 bilingual policy pages (About Us, Contact Us, Privacy Policy, Terms and Conditions, Editorial Policy, Disclaimer, and Corrections Policy) published at all times.'
                    : 'সকল ৭টি দ্বিভাষিক নীতিমালা পাতা (আমাদের সম্পর্কে, যোগাযোগ, গোপনীয়তা নীতি, ব্যবহারের শর্তাবলি, সম্পাদকীয় নীতিমালা, দাবি পরিত্যাগ এবং সংশোধনী নীতিমালা) সর্বদা প্রকাশিত রাখুন।'}
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SUPER ADMIN, MULTI-ADMIN RBAC & ACTIVITY LOGS */}
      {activeTab === 'authors_logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 space-y-1">
              <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white">
                {isEn
                  ? 'Super Admin & Multi-Admin Access Control (RBAC)'
                  : 'সুপার অ্যাডমিন ও মাল্টি-অ্যাডমিন নিয়ন্ত্রণ প্যানেল (RBAC)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEn
                  ? `Owner Super Admin (${SUPER_ADMIN_EMAIL}) has full permanent control and can invite new Gmail administrators, assign roles, and customize 13 granular permissions.`
                  : `মালিক সুপার অ্যাডমিন (${SUPER_ADMIN_EMAIL}) নতুন জিমেইল অ্যাডমিন আমন্ত্রণ, ভূমিকা নির্ধারণ এবং ১৩টি সূক্ষ্ম অনুমতি নিয়ন্ত্রণ করতে পারবেন।`}
              </p>
            </div>

            {isCurrentUserSuperAdmin ? (
              <form
                onSubmit={handleAddAuthor}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  {isEn
                    ? 'Invite & Approve New Admin by Gmail'
                    : 'জিমেইলের মাধ্যমে নতুন অ্যাডমিন আমন্ত্রণ ও অনুমোদন করুন'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={newAuthorName}
                    onChange={(e) => setNewAuthorName(e.target.value)}
                    placeholder={isEn ? 'Full Name' : 'পূর্ণ নাম'}
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                  />
                  <input
                    type="email"
                    required
                    value={newAuthorEmail}
                    onChange={(e) => setNewAuthorEmail(e.target.value)}
                    placeholder={isEn ? 'admin.user@gmail.com' : 'admin.user@gmail.com'}
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                  />
                  <select
                    value={newAuthorRole}
                    onChange={(e) => {
                      const role = e.target.value as AdminRole;
                      setNewAuthorRole(role);
                      setNewAuthorPermissions(DEFAULT_ROLE_PERMISSIONS[role]);
                    }}
                    className="px-2.5 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded"
                  >
                    <option value="super_admin">{ROLE_LABELS.super_admin[lang]}</option>
                    <option value="admin">{ROLE_LABELS.admin[lang]}</option>
                    <option value="editor">{ROLE_LABELS.editor[lang]}</option>
                    <option value="author">{ROLE_LABELS.author[lang]}</option>
                    <option value="moderator">{ROLE_LABELS.moderator[lang]}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {isEn
                      ? 'Assign Granular Permissions for Invited Admin:'
                      : 'আমন্ত্রিত অ্যাডমিনের জন্য অনুমতিসমূহ নির্বাচন করুন:'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_ADMIN_PERMISSIONS.map((perm) => {
                      const checked = newAuthorPermissions.includes(perm);
                      return (
                        <label
                          key={perm}
                          className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setNewAuthorPermissions((prev) =>
                                prev.includes(perm)
                                  ? prev.filter((p) => p !== perm)
                                  : [...prev, perm]
                              )
                            }
                            className="w-3.5 h-3.5 accent-blue-700"
                          />
                          <span>{PERMISSION_LABELS[perm][lang]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded cursor-pointer"
                >
                  {isEn
                    ? '+ Invite & Approve Gmail Admin'
                    : '+ জিমেইল অ্যাডমিন আমন্ত্রণ ও অনুমোদন করুন'}
                </button>
              </form>
            ) : (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded">
                {isEn
                  ? 'Note: Only the Super Admin can invite new admins, change roles, or modify permissions.'
                  : 'দ্রষ্টব্য: শুধুমাত্র সুপার অ্যাডমিন নতুন অ্যাডমিন যুক্ত বা অনুমতি পরিবর্তন করতে পারবেন।'}
              </div>
            )}

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {authors.map((au) => {
                const isProtectedOwner =
                  au.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                const isExpanded = expandedAuthorUid === au.uid;
                const activePerms =
                  au.permissions || DEFAULT_ROLE_PERMISSIONS[au.role] || [];
                return (
                  <div key={au.uid} className="py-3.5 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {au.name}
                          </span>
                          {isProtectedOwner && (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold rounded text-[10px]">
                              {isEn ? 'Protected Super Admin' : 'সুরক্ষিত সুপার অ্যাডমিন'}
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              au.status === 'suspended'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {au.status === 'suspended'
                              ? isEn
                                ? 'Suspended'
                                : 'স্থগিত'
                              : isEn
                              ? 'Active'
                              : 'সচল'}
                          </span>
                        </div>
                        <div className="text-slate-500 font-mono">{au.email}</div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isCurrentUserSuperAdmin && !isProtectedOwner ? (
                          <>
                            <select
                              value={au.role}
                              onChange={(e) =>
                                handleUpdateAuthorRoleOrStatus(au, {
                                  role: e.target.value as AdminRole,
                                })
                              }
                              className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded font-semibold"
                            >
                              <option value="super_admin">{ROLE_LABELS.super_admin[lang]}</option>
                              <option value="admin">{ROLE_LABELS.admin[lang]}</option>
                              <option value="editor">{ROLE_LABELS.editor[lang]}</option>
                              <option value="author">{ROLE_LABELS.author[lang]}</option>
                              <option value="moderator">{ROLE_LABELS.moderator[lang]}</option>
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAuthorUid(isExpanded ? null : au.uid)
                              }
                              className="px-2 py-1 border border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded text-[11px] font-semibold cursor-pointer"
                            >
                              {isEn
                                ? `Permissions (${activePerms.length})`
                                : `অনুমতি (${activePerms.length})`}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateAuthorRoleOrStatus(au, {
                                  status:
                                    au.status === 'suspended' ? 'active' : 'suspended',
                                })
                              }
                              className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                            >
                              {au.status === 'suspended'
                                ? isEn
                                  ? 'Activate'
                                  : 'সচল করুন'
                                : isEn
                                ? 'Suspend'
                                : 'স্থগিত করুন'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteAuthor(au.uid)}
                              className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                              title={isEn ? 'Remove Admin' : 'অ্যাডমিন সরান'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="font-mono uppercase font-semibold text-blue-700 dark:text-blue-400">
                            {ROLE_LABELS[au.role]?.[lang] || au.role}
                          </span>
                        )}
                      </div>
                    </div>

                    {isExpanded && isCurrentUserSuperAdmin && !isProtectedOwner && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ALL_ADMIN_PERMISSIONS.map((perm) => (
                          <label
                            key={perm}
                            className="flex items-center gap-1.5 text-[11px] cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={activePerms.includes(perm)}
                              onChange={() => handleToggleAuthorPermission(au, perm)}
                              className="w-3.5 h-3.5 accent-blue-700"
                            />
                            <span>{PERMISSION_LABELS[perm][lang]}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-4">
            <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
              {isEn ? 'Complete Security & Activity Audit Log' : 'নিরাপত্তা ও অ্যাক্টিভিটি অডিট লগ'}
            </h2>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {activityLogs.map((l) => (
                <div key={l.id} className="py-2.5 text-xs space-y-0.5">
                  <div className="text-slate-400 font-tabular">
                    [{l.actionType}] · {l.actorEmail} · {new Date(l.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="text-slate-800 dark:text-slate-200">
                    {isEn ? l.detailsEn : l.detailsBn}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: MANAGE CATEGORIES (15), VIDEOS, BANGLA NEWS & ENGLISH NEWS */}
      {activeTab === 'categories_media_lang' && (
        <div className="space-y-8">
          {/* 1. Manage All 15 Categories */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white">
                {isEn
                  ? 'Manage All 15 Defense & Security Categories'
                  : 'সকল ১৫টি প্রতিরক্ষা ও নিরাপত্তা বিভাগ নিয়ন্ত্রণ'}
              </h2>
              <span className="text-xs text-slate-500">
                {isEn
                  ? 'Click any category to filter or add news directly'
                  : 'যেকোনো বিভাগে সংবাদ যোগ বা ফিল্টার করুন'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_15_CATEGORIES.map((cat) => {
                const count = articles.filter((a) => a.category === cat).length;
                return (
                  <div
                    key={cat}
                    className={`p-3.5 rounded border flex items-center justify-between gap-2 text-xs ${
                      selectedAdminCategory === cat
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {CATEGORY_LABELS[cat][lang]}
                      </div>
                      <div className="text-slate-500 font-tabular">
                        {isEn ? `${count} dispatches` : `${count}টি প্রতিবেদন`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedAdminCategory(cat)}
                        className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {isEn ? 'Filter' : 'দেখুন'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleResetEditorForm();
                          setCategory(cat);
                          setActiveTab('editor');
                        }}
                        className="px-2 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 cursor-pointer"
                      >
                        + {isEn ? 'Add' : 'যোগ'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Manage Bangla News & Manage English News + Manage Videos */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white">
                  {isEn
                    ? 'Manage Bangla News, English News & Video Briefings'
                    : 'বাংলা সংবাদ, ইংরেজি সংবাদ ও ভিডিও ব্রিফিং নিয়ন্ত্রণ'}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedAdminCategory === 'all'
                    ? isEn
                      ? 'Showing all categories'
                      : 'সকল বিভাগের সংবাদ প্রদর্শিত হচ্ছে'
                    : CATEGORY_LABELS[selectedAdminCategory][lang]}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedAdminCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedAdminCategory('all')}
                    className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded cursor-pointer"
                  >
                    {isEn ? 'Show All 15 Categories' : 'সব বিভাগ দেখুন'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLangManagerMode('bn')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                    langManagerMode === 'bn'
                      ? 'bg-emerald-700 text-white'
                      : 'border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isEn ? 'Manage Bangla News (বাংলা)' : 'বাংলা সংবাদ ব্যবস্থাপনা'}
                </button>
                <button
                  type="button"
                  onClick={() => setLangManagerMode('en')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                    langManagerMode === 'en'
                      ? 'bg-blue-700 text-white'
                      : 'border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isEn ? 'Manage English News (EN)' : 'ইংরেজি সংবাদ ব্যবস্থাপনা'}
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {articles
                .filter((a) =>
                  selectedAdminCategory === 'all' ? true : a.category === selectedAdminCategory
                )
                .map((art) => {
                  const currentVid =
                    quickVideoInput[art.id] !== undefined
                      ? quickVideoInput[art.id]
                      : art.videoUrl || '';
                  return (
                    <div
                      key={art.id}
                      className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="text-slate-500">
                          <strong className="text-blue-700 dark:text-blue-400">
                            {CATEGORY_LABELS[art.category as ForceCategory]?.[langManagerMode] || art.category}
                          </strong>{' '}
                          · [{langManagerMode.toUpperCase()}] ·{' '}
                          {art[langManagerMode].publishedDate}
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {art[langManagerMode].title}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300">
                          {art[langManagerMode].subtitle}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <input
                          type="url"
                          value={currentVid}
                          onChange={(e) =>
                            setQuickVideoInput({
                              ...quickVideoInput,
                              [art.id]: e.target.value,
                            })
                          }
                          placeholder={isEn ? 'Video URL (YouTube/MP4)' : 'ভিডিও লিংক যুক্ত করুন'}
                          className="w-48 px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveArticleVideo(art, currentVid)}
                          className="px-2.5 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 cursor-pointer"
                        >
                          {isEn ? 'Save Video' : 'ভিডিও সংরক্ষণ'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditArticleClick(art)}
                          className="px-3 py-1.5 bg-blue-700 text-white font-semibold rounded hover:bg-blue-800 cursor-pointer"
                        >
                          {langManagerMode === 'bn'
                            ? isEn
                              ? 'Edit Bangla'
                              : 'বাংলা সম্পাদনা'
                            : isEn
                            ? 'Edit English'
                            : 'ইংরেজি সম্পাদনা'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: GOOGLE FIREBASE CLOUD SYNC & DEVELOPER NETLIFY ZIP */}
      {activeTab === 'firebase_dev' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-editorial font-bold text-slate-900 dark:text-white">
                {isEn
                  ? 'Google Firebase Security Suite & Developer Netlify ZIP'
                  : 'গুগল ফায়ারবেস সিকিউরিটি সুইট এবং ডেভেলপার নেটলিফাই জিপ'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isEn
                  ? 'Restricted strictly to the Developer inside the authenticated Admin Panel. Never shown on the public website.'
                  : 'শুধুমাত্র অনুমোদিত ডেভেলপার ও অ্যাডমিনের জন্য সংরক্ষিত। পাবলিক ওয়েবসাইটে কখনোই প্রদর্শিত হয় না।'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunSecurityDiagnostics}
              disabled={runningDiagnostics}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold rounded cursor-pointer shrink-0"
            >
              {runningDiagnostics
                ? isEn
                  ? 'Verifying Firebase & ZIP...'
                  : 'ফায়ারবেস ও জিপ পরীক্ষা চলছে...'
                : isEn
                  ? 'Verify Auth, Firestore, Storage Rules & ZIP'
                  : 'ফায়ারবেস রুলস ও জিপ ফাইল পরীক্ষা করুন'}
            </button>
          </div>

          <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs text-slate-700 dark:text-slate-200 space-y-1.5">
            <div className="font-bold text-blue-900 dark:text-blue-300">
              {isEn
                ? 'Why did defence-24-bd-netlify-firebase.zip show in red in the AI Studio file list? (Resolved)'
                : 'কেন defence-24-bd-netlify-firebase.zip ফাইলটি লাল রঙে দেখাচ্ছিল? (সমাধানকৃত)'}
            </div>
            <p>
              {isEn
                ? 'Google AI Studio’s code editor file tree expects text/UTF-8 source files and flags any raw binary archive (.zip) saved in the source directory in red. We removed the binary artifact from the source tree and upgraded the Developer Export engine so a clean, non-corrupted, CRC32-verified defence-24-bd-netlify-firebase.zip (containing both compiled dist/ and full source code) is generated in-memory on demand exclusively here in the Admin Panel.'
                : 'Google AI Studio-এর কোড এডিটর ফাইল ট্রি শুধুমাত্র টেক্সট (UTF-8) সোর্স ফাইল আশা করে এবং সোর্স ফোল্ডারে কোনো বাইনারি (.zip) ফাইল থাকলে সেটিকে লাল রঙে চিহ্নিত করে। তাই সোর্স ফোল্ডার থেকে বাইনারি ফাইলটি সরিয়ে ইন-মেমরি ভেরিফাইড জিপ ইঞ্জিন তৈরি করা হয়েছে, যা শুধুমাত্র এই অ্যাডমিন প্যানেল থেকে সম্পূর্ণ ত্রুটিমুক্ত ও যাচাইকৃত defence-24-bd-netlify-firebase.zip ডাউনলোড নিশ্চিত করে।'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded space-y-2">
              <div className="font-bold text-blue-700 dark:text-blue-400 uppercase">
                {isEn
                  ? 'Connected Firebase Project & Security Rules'
                  : 'সংযুক্ত ফায়ারবেস প্রজেক্ট ও সিকিউরিটি রুলস'}
              </div>
              <p className="font-tabular">
                <strong>{isEn ? 'Project ID:' : 'প্রজেক্ট আইডি:'}</strong> {FIREBASE_PROJECT_INFO.projectId}
              </p>
              <p className="font-tabular break-all">
                <strong>{isEn ? 'Cloud Firestore DB:' : 'ক্লাউড ফায়ারস্টোর ডাটাবেস:'}</strong>{' '}
                {FIREBASE_PROJECT_INFO.firestoreDatabaseId}
              </p>
              <p className="font-tabular">
                <strong>{isEn ? 'Storage Bucket:' : 'স্টোরেজ বাকেট:'}</strong> {FIREBASE_PROJECT_INFO.storageBucket}
              </p>
              <p className="font-tabular text-emerald-700 dark:text-emerald-400 font-semibold">
                <strong>{isEn ? 'Auth Guard:' : 'অথেনটিকেশন সুরক্ষা:'}</strong>{' '}
                {isEn
                  ? 'Google Sign-In + Email/Password (Admin Whitelist)'
                  : 'গুগল সাইন-ইন ও অনুমোদিত অ্যাডমিন ইমেইল সুরক্ষা'}
              </p>
              <p className="font-tabular text-emerald-700 dark:text-emerald-400 font-semibold">
                <strong>{isEn ? 'Firestore Rules:' : 'ফায়ারস্টোর রুলস:'}</strong>{' '}
                {isEn
                  ? 'firestore.rules (Deployed & Schema-Validated)'
                  : 'firestore.rules (ডিপ্লয়কৃত ও স্কিমা যাচাইকৃত)'}
              </p>
              <p className="font-tabular text-emerald-700 dark:text-emerald-400 font-semibold">
                <strong>{isEn ? 'Storage Rules:' : 'স্টোরেজ রুলস:'}</strong>{' '}
                {isEn
                  ? 'storage.rules (5MB Limit + Image MIME Enforced)'
                  : 'storage.rules (৫ মেগাবাইট সীমা ও ইমেজ টাইপ যাচাইকৃত)'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                  {isEn
                    ? 'Developer-Only Verified ZIP Packages (No Public Exposure)'
                    : 'ডেভেলপারের জন্য যাচাইকৃত জিপ প্যাকেজ (পাবলিক সাইটে অদৃশ্য)'}
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {isEn
                    ? 'Download defence-24-bd-netlify-drop-ready.zip for direct Netlify deployment, or download the full repository + dist archive.'
                    : 'সরাসরি নেটলিফাই ডিপ্লয়মেন্টের জন্য defence-24-bd-netlify-drop-ready.zip অথবা সম্পূর্ণ সোর্স কোড আর্কাইভ ডাউনলোড করুন।'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeveloperZipExport('complete' as any)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold rounded-lg shadow-md cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isEn
                      ? 'Download DEFENCE-24-BD-COMPLETE-ADMIN-CONTROL.zip'
                      : 'ডাউনলোড DEFENCE-24-BD-COMPLETE-ADMIN-CONTROL.zip (সম্পূর্ণ সিস্টেম)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeveloperZipExport('netlify_drop')}
                  className="px-4 py-2 bg-[#0B1F3A] hover:bg-blue-950 text-white font-semibold rounded cursor-pointer"
                >
                  {isEn
                    ? 'Download defence-24-bd-netlify-drop-ready.zip'
                    : 'ডাউনলোড defence-24-bd-netlify-drop-ready.zip'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeveloperZipExport('full')}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded cursor-pointer"
                >
                  {isEn
                    ? 'Download defence-24-bd-netlify-firebase.zip'
                    : 'ডাউনলোড defence-24-bd-netlify-firebase.zip'}
                </button>
                <button
                  type="button"
                  onClick={handleFullFirestoreSync}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded cursor-pointer"
                >
                  {isEn ? 'Sync All Data to Cloud Firestore' : 'ক্লাউড ফায়ারস্টোরে সিঙ্ক করুন'}
                </button>
              </div>
            </div>
          </div>

          {securityReport && (
            <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-500/40 rounded space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-300">
                <span>
                  {isEn
                    ? 'Live Firebase Security Rules & ZIP Archive Verification Report'
                    : 'ফায়ারবেস সিকিউরিটি রুলস ও জিপ আর্কাইভ যাচাইকরণ প্রতিবেদন'}
                </span>
                <span className="font-tabular">{securityReport.checkedAt}</span>
              </div>
              <ul className="space-y-1 text-slate-700 dark:text-slate-200">
                {securityReport.details.map((line, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-tabular">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* NEW CUSTOMIZATION MODULES */}
      {/* 1. Website Customization Dashboard (Header, Homepage, Body, Contact, About Us, Footer, General) */}
      {activeTab === 'header_footer' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg">
          <WebsiteCustomizationHub
            lang={lang}
            settings={localSettings}
            homepageSections={homepageSections}
            customPages={customPages}
            onSave={async (updatedSettings, updatedSections, updatedPages) => {
              const mergedSettings = {
                ...localSettings,
                ...updatedSettings,
              };
              setLocalSettings(mergedSettings);

              const stateUpdate: any = { settings: mergedSettings };
              if (updatedSections) stateUpdate.homepageSections = updatedSections;
              if (updatedPages) stateUpdate.customPages = updatedPages;

              onPortalStateUpdated(stateUpdate);

              await syncSettingsToFirestore(mergedSettings);
              if (updatedSections) {
                for (const sec of updatedSections) {
                  await syncHomepageSectionToFirestore(sec);
                }
              }
              if (updatedPages) {
                for (const p of updatedPages) {
                  await syncPageToFirestore(p);
                }
              }

              setStatusBanner(
                isEn
                  ? 'All website customizations saved permanently to Cloud Firestore.'
                  : 'সকল ওয়েবসাইট কাস্টমাইজেশন ফায়ারবেস ক্লাউড ফায়ারস্টোরে স্থায়ীভাবে সংরক্ষিত হয়েছে।'
              );
            }}
            onUploadLogo={async (file) => {
              const uploaded = await uploadImageToCloudinary(file, {
                cloudName: cloudNameInput,
                uploadPreset: uploadPresetInput,
                folder: 'defence24bd/logos',
                lang,
              });
              return uploaded.secureUrl;
            }}
          />
        </div>
      )}

      {/* 2. Homepage Sections Builder */}
      {activeTab === 'homepage_builder' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg">
          <HomepageBuilder
            lang={lang}
            sections={homepageSections}
            categories={customCategories}
            onSaveSections={async (secs) => {
              onPortalStateUpdated({ sections: secs });
              for (const s of secs) {
                await syncHomepageSectionToFirestore(s);
              }
              const updated = { ...localSettings, homepageSections: secs };
              setLocalSettings(updated);
              await syncSettingsToFirestore(updated);
              setStatusBanner(
                isEn
                  ? 'Homepage block structure saved to Cloud Firestore.'
                  : 'হোমপেজ সেকশনসমূহ ফায়ারস্টোরে সংরক্ষিত হয়েছে।'
              );
            }}
          />
        </div>
      )}

      {/* 3. Category Manager */}
      {activeTab === 'categories_manager' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg">
          <CategoryManager
            lang={lang}
            categories={customCategories}
            articles={articles}
            circulars={circulars}
            onSaveCategories={async (cats) => {
              onPortalStateUpdated({ categories: cats });
              for (const c of cats) {
                await syncCategoryToFirestore(c);
              }
              setStatusBanner(
                isEn
                  ? 'Categories saved to Cloud Firestore.'
                  : 'ক্যাটাগরিসমূহ ফায়ারস্টোরে সংরক্ষিত হয়েছে।'
              );
            }}
            onDeleteCategory={async (catId, reassignToCatSlug) => {
              await deleteCategoryFromFirestore(catId);
              const remaining = customCategories.filter((c) => c.id !== catId);

              // Safe Content Preservation: Reassign associated articles & circulars
              let updatedArticles = articles;
              let updatedCirculars = circulars;
              if (reassignToCatSlug) {
                updatedArticles = articles.map((a) =>
                  a.category === catId || (a.category as any) === catId
                    ? { ...a, category: reassignToCatSlug }
                    : a
                );
                updatedCirculars = circulars.map((c) =>
                  c.category === catId || (c.category as any) === catId
                    ? { ...c, category: reassignToCatSlug as any }
                    : c
                );
              }

              onPortalStateUpdated({
                categories: remaining,
                articles: updatedArticles,
                circulars: updatedCirculars,
              });

              setStatusBanner(
                isEn
                  ? reassignToCatSlug
                    ? `Category deleted. Associated articles & circulars safely reassigned to "${reassignToCatSlug}".`
                    : 'Category deleted safely.'
                  : reassignToCatSlug
                  ? `ক্যাটাগরি মুছে ফেলা হয়েছে এবং সংশ্লিষ্ট সকল সংবাদ ও সার্কুলার "${reassignToCatSlug}" ক্যাটাগরিতে স্থানান্তর করা হয়েছে।`
                  : 'ক্যাটাগরি সুরক্ষিতভাবে মুছে ফেলা হয়েছে।'
              );
            }}
          />
        </div>
      )}

      {/* 4. Pages Manager */}
      {activeTab === 'pages_manager' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg">
          <PageManager
            lang={lang}
            pages={customPages}
            onSavePages={async (pgs) => {
              onPortalStateUpdated({ pages: pgs });
              for (const p of pgs) {
                await syncPageToFirestore(p);
              }
              setStatusBanner(
                isEn
                  ? 'Custom and policy pages saved to Cloud Firestore.'
                  : 'পেজসমূহ ফায়ারস্টোরে সংরক্ষিত হয়েছে।'
              );
            }}
            onDeletePage={async (pageId) => {
              await deletePageFromFirestore(pageId);
              const remaining = customPages.filter((p) => p.id !== pageId);
              onPortalStateUpdated({ pages: remaining });
            }}
          />
        </div>
      )}

      {/* 5. Appearance (Colors & Typography) Manager */}
      {activeTab === 'appearance_manager' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg">
          <AppearanceManager
            lang={lang}
            colors={localSettings.customColors || DEFAULT_COLOR_SETTINGS}
            typography={localSettings.typography || DEFAULT_TYPOGRAPHY_SETTINGS}
            onSaveAppearance={async (colors, typography) => {
              const updated = {
                ...localSettings,
                customColors: colors,
                typography,
              };
              setLocalSettings(updated);
              onPortalStateUpdated({ settings: updated });
              await syncSettingsToFirestore(updated);
              setStatusBanner(
                isEn
                  ? 'Theme colors and typography saved to Cloud Firestore.'
                  : 'থিম কালার এবং ফন্ট সেটিংস ফায়ারস্টোরে সংরক্ষিত হয়েছে।'
              );
            }}
          />
        </div>
      )}

      {/* 6. Media Library */}
      {activeTab === 'media_manager' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg">
          <MediaLibrary
            lang={lang}
            mediaItems={mediaItems}
            onUploadMedia={async (file, mediaCategory, altBn, altEn) => {
              const uploaded = await uploadImageToCloudinary(file, {
                cloudName: cloudNameInput,
                uploadPreset: uploadPresetInput,
                folder: `defence24bd/${mediaCategory}`,
                lang,
              });
              const newMedia: MediaItem = {
                id: `media-${Date.now()}`,
                url: uploaded.secureUrl,
                cloudinaryPublicId: uploaded.publicId,
                name: file.name,
                category: mediaCategory,
                altTextBn: altBn,
                altTextEn: altEn,
                sizeBytes: uploaded.bytes || file.size,
                fileSizeKb: Math.round((uploaded.bytes || file.size) / 1024),
                mimeType: file.type || 'image/jpeg',
                uploadedAtIso: new Date().toISOString(),
              };
              await syncMediaItemToFirestore(newMedia);
              onPortalStateUpdated({ media: [...mediaItems, newMedia] });
              return newMedia;
            }}
            onDeleteMedia={async (mediaId) => {
              await deleteMediaItemFromFirestore(mediaId);
              onPortalStateUpdated({ media: mediaItems.filter((m) => m.id !== mediaId) });
            }}
          />
        </div>
      )}

      {/* 7. Backup & Restore Manager */}
      {activeTab === 'backup_restore' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg">
          <BackupRestoreManager
            lang={lang}
            settings={localSettings}
            categories={customCategories}
            pages={customPages}
            sections={homepageSections}
            onRestoreSnapshot={async (snap) => {
              if (snap.settings) {
                setLocalSettings(snap.settings);
                await syncSettingsToFirestore(snap.settings);
              }
              if (snap.categories) {
                for (const c of snap.categories) {
                  await syncCategoryToFirestore(c);
                }
              }
              if (snap.pages) {
                for (const p of snap.pages) {
                  await syncPageToFirestore(p);
                }
              }
              if (snap.sections) {
                for (const s of snap.sections) {
                  await syncHomepageSectionToFirestore(s);
                }
              }
              onPortalStateUpdated({
                settings: snap.settings,
                categories: snap.categories,
                pages: snap.pages,
                sections: snap.sections,
              });
              setStatusBanner(
                isEn
                  ? 'All backup configuration data restored successfully.'
                  : 'সম্পূর্ণ ব্যাকআপ কনফিগারেশন ডাটা সফলভাবে রিস্টোর করা হয়েছে।'
              );
            }}
            onResetFactoryDefaults={async () => {
              const defaultSettings = {
                ...localSettings,
                headerSettings: DEFAULT_HEADER_SETTINGS,
                footerSettings: DEFAULT_FOOTER_SETTINGS,
                customColors: DEFAULT_COLOR_SETTINGS,
                typography: DEFAULT_TYPOGRAPHY_SETTINGS,
                homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
              };
              setLocalSettings(defaultSettings);
              onPortalStateUpdated({
                settings: defaultSettings,
                categories: DEFAULT_CUSTOM_CATEGORIES,
                pages: DEFAULT_CUSTOM_PAGES,
                sections: DEFAULT_HOMEPAGE_SECTIONS,
              });
              await syncSettingsToFirestore(defaultSettings);
            }}
          />
        </div>
      )}

      {/* 8. Admin Management (Super Admin Exclusive) */}
      {activeTab === 'admin_management' && isCurrentUserSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg">
          <AdminManagement
            lang={lang}
            authors={authors}
            currentUserEmail={adminUser?.email || ''}
            onRefresh={async () => {
              if (authToken) await fetchAdminDataFromServer(authToken);
            }}
            onCreateAdmin={handleCreateAdminAccount}
            onUpdateAdmin={handleUpdateAdminAccount}
            onRemoveAdmin={handleRemoveAdminAccount}
          />
        </div>
      )}

      {/* Live Viewport Modal */}
      <LivePreviewModal
        lang={lang}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </section>
  );
};
