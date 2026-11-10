import { getPublicPortalData } from '../../src/db/repository.ts';
import { generateSitemapXml } from '../../src/lib/feedGenerators.ts';
import { DEFAULT_CUSTOM_CATEGORIES, DEFAULT_CUSTOM_PAGES } from '../../src/data/customizationDefaults.ts';

export const handler = async (event: any) => {
  try {
    const host = event.headers.host || 'defence24.netlify.app';
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const siteUrl = `${proto}://${host}`;

    const portalData = await getPublicPortalData();
    const articles = portalData.articles || [];
    const settings = portalData.settings;

    const xml = generateSitemapXml(
      siteUrl,
      articles,
      DEFAULT_CUSTOM_CATEGORIES,
      DEFAULT_CUSTOM_PAGES,
      settings
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      },
      body: xml,
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: `Error generating sitemap: ${error.message || 'Unknown error'}`,
    };
  }
};
