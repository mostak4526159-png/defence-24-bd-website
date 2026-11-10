/**
 * Netlify Serverless Function for Defence 24 BD
 * Endpoint: /.netlify/functions/portal-status (or /api/netlify-status)
 */
export async function handler() {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({
      portal: 'Defence 24 BD',
      hosting: 'Netlify Serverless + Static CDN',
      firebaseProject: 'southern-linker-nfx4d',
      firestoreDatabaseId: 'ai-studio-defence24bd-b33aa361-b799-4b5b-b83b-3a54dfed8380',
      categoriesCount: 15,
      status: 'operational',
      timestamp: new Date().toISOString(),
    }),
  };
}
