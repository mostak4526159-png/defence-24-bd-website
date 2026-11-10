import { getPublicPortalData } from '../../src/db/repository.ts';
import { generateGoogleNewsSitemapXml } from '../../src/lib/feedGenerators.ts';

export const handler = async (event: any) => {
  try {
    const host = event.headers.host || 'defence24.netlify.app';
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const siteUrl = `${proto}://${host}`;

    const portalData = await getPublicPortalData();
    const articles = portalData.articles || [];
    const settings = portalData.settings;

    const xml = generateGoogleNewsSitemapXml(siteUrl, articles, settings);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=900, s-maxage=1800',
      },
      body: xml,
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: `Error generating news sitemap: ${error.message || 'Unknown error'}`,
    };
  }
};
