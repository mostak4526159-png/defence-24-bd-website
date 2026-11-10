// Centralized Site Configuration for DEFENCE 24 BD
// All internally generated canonical URLs, sitemaps, RSS feeds, and social share cards use this domain.

export const SITE_URL = 'https://defence24.netlify.app';
export const SITE_NAME_EN = 'Defence 24 BD';
export const SITE_NAME_BN = 'ডিফেন্স ২৪ বিডি';
export const SITE_HOST = 'defence24.netlify.app';
export const DEFAULT_CANONICAL_DOMAIN = 'https://defence24.netlify.app';
export const SUPER_ADMIN_EMAIL = 'mostak4526159@gmail.com';

export function getCanonicalUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}
