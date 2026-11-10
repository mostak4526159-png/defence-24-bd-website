import { getPublicPortalData } from '../../src/db/repository.ts';
import { generateRssFeedXml } from '../../src/lib/feedGenerators.ts';

export const handler = async (event: any) => {
  try {
    const host = event.headers.host || 'defence24.netlify.app';
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const siteUrl = `${proto}://${host}`;

    const portalData = await getPublicPortalData();
    const articles = portalData.articles || [];
    const settings = portalData.settings;

    const xml = generateRssFeedXml(siteUrl, articles, settings);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600',
      },
      body: xml,
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: `Error generating RSS feed: ${error.message || 'Unknown error'}`,
    };
  }
};
