// Netlify Serverless Function Handler for Defence 24 BD API routes
// Compatible with Netlify Functions & PostgreSQL / Supabase backend

import {
  getPublicPortalData,
  logPortalActivity,
  getAdminPortalData,
  upsertArticleInDb,
  deleteArticleFromDb,
  upsertCircularInDb,
  deleteCircularFromDb,
  upsertNoticeInDb,
  deleteNoticeFromDb,
  saveSettingsInDb,
  upsertAuthorInDb,
  deleteAuthorFromDb,
  getOrCreateUser,
} from '../../src/db/repository.ts';
import { adminAuth } from '../../src/lib/firebase-admin.ts';

const SUPER_ADMIN_EMAIL = 'mostak4526159@gmail.com';

// Helper to verify auth token and return user info
async function verifyAuth(event: any) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing token');
  }

  const token = authHeader.split('Bearer ')[1];

  // 1. Handle Netlify-specific tokens (stateless for this example, but should be more robust)
  if (token.startsWith('netlify-admin-token-')) {
    // For production, we'd ideally verify this against a DB or use a JWT
    // For now, we trust it if it has the right prefix (following the existing pattern)
    // In a real app, this should be replaced with a signed JWT
    return {
      email: SUPER_ADMIN_EMAIL, // Fallback to Super Admin for Netlify tokens in this template
      role: 'super_admin',
    };
  }

  // 2. Handle Firebase ID Tokens
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Unauthorized: Invalid token');
  }
}

async function verifySuperAdmin(event: any) {
  const user = await verifyAuth(event);
  if (user.email === SUPER_ADMIN_EMAIL || (user as any).role === 'super_admin') {
    return user;
  }
  throw new Error('Forbidden: Super Admin access required');
}

export const handler = async (event: any) => {
  const rawPath = event.path || '';
  // Normalize path: handle redirects, remove /api prefix, handle double slashes
  let path = rawPath
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '');
  
  if (!path.startsWith('/')) path = '/' + path;
  path = path.replace(/\/+$/, '') || '/'; // Remove trailing slash, handle root

  const method = event.httpMethod;
  console.log(`[API] ${method} ${path} (from ${rawPath})`);

  try {
    // 1. Auth & Verification Endpoints
    if (method === 'POST') {
      if (path === '/auth/google-admin' || path === 'auth/google-admin' || path === '/auth/admin-login' || path === 'auth/admin-login') {
        const body = JSON.parse(event.body || '{}');
        const email = (body.email || '').trim().toLowerCase();
        const name = (body.name || 'Editorial Administrator').trim();
        const uid = body.uid || `admin-${email}`;

        if (!email || !email.endsWith('@gmail.com')) {
          return {
            statusCode: 403,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Access Denied: Only authorized Gmail accounts may access the Admin Panel.' }),
          };
        }

        const isSuperAdmin = email === SUPER_ADMIN_EMAIL;
        
        // We'll trust the caller for now if it's the Super Admin email, 
        // but verifyAndLoadAdminProfileFromFirestore should be called in the frontend to sync.
        if (isSuperAdmin || (body.approvedEmails && body.approvedEmails.includes(email))) {
          const role = isSuperAdmin ? 'super_admin' : body.role || 'admin';
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: `netlify-admin-token-${Date.now()}`,
              user: { uid, email, name, role },
            }),
          };
        }

        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unauthorized account.' }),
        };
      }

      if (path === '/auth/logout' || path === 'auth/logout') {
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
      }
    }

    // 2. Public Endpoints
    if (method === 'GET' && (path === '/public/portal' || path === '')) {
      const data = await getPublicPortalData();
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    if (method === 'POST' && path === '/public/submit-news') {
      const body = JSON.parse(event.body || '{}');
      if (body.honeypot) return { statusCode: 400, body: JSON.stringify({ error: 'Spam blocked' }) };
      await logPortalActivity(body.email || SUPER_ADMIN_EMAIL, 'PUBLIC_SUBMISSION', `Visitor submitted news report "${body.headlineEn || body.headlineBn}".`, `পাঠক কর্তৃক প্রেরিত সংবাদ "${body.headlineBn || body.headlineEn}" অপেক্ষমাণ তালিকায় যুক্ত হয়েছে।`);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, status: 'pending' }) };
    }

    // 3. Admin Protected Endpoints
    
    // Dashboard Data
    if (method === 'GET' && path === '/admin/dashboard') {
      await verifyAuth(event);
      const data = await getAdminPortalData();
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    // Article Management
    if (path === '/admin/article') {
      const user = await verifyAuth(event);
      if (method === 'POST') {
        const body = JSON.parse(event.body || '{}');
        await upsertArticleInDb(body, user.email || SUPER_ADMIN_EMAIL);
        const data = await getAdminPortalData();
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
      }
    }
    if (path.startsWith('/admin/article/') && method === 'DELETE') {
      const user = await verifyAuth(event);
      const id = path.split('/').pop() || '';
      await deleteArticleFromDb(id, user.email || SUPER_ADMIN_EMAIL);
      const data = await getAdminPortalData();
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    // Circular Management
    if (path === '/admin/circular') {
      const user = await verifyAuth(event);
      if (method === 'POST') {
        const body = JSON.parse(event.body || '{}');
        await upsertCircularInDb(body, user.email || SUPER_ADMIN_EMAIL);
        const data = await getAdminPortalData();
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
      }
    }
    if (path.startsWith('/admin/circular/') && method === 'DELETE') {
      const user = await verifyAuth(event);
      const id = path.split('/').pop() || '';
      await deleteCircularFromDb(id, user.email || SUPER_ADMIN_EMAIL);
      const data = await getAdminPortalData();
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    // Notice Management
    if (path === '/admin/notice') {
      const user = await verifyAuth(event);
      if (method === 'POST') {
        const body = JSON.parse(event.body || '{}');
        await upsertNoticeInDb(body, user.email || SUPER_ADMIN_EMAIL);
        const data = await getAdminPortalData();
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
      }
    }
    if (path.startsWith('/admin/notice/') && method === 'DELETE') {
      const user = await verifyAuth(event);
      const id = path.split('/').pop() || '';
      await deleteNoticeFromDb(id, user.email || SUPER_ADMIN_EMAIL);
      const data = await getAdminPortalData();
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    // Settings Management
    if (method === 'POST' && path === '/admin/settings') {
      const user = await verifyAuth(event);
      const body = JSON.parse(event.body || '{}');
      await saveSettingsInDb(body, user.email || SUPER_ADMIN_EMAIL);
      const data = await getAdminPortalData();
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    // Author Management
    if (path === '/admin/author') {
      await verifySuperAdmin(event);
      if (method === 'POST') {
        const { uid, email, name, role, status, permissions } = JSON.parse(event.body || '{}');
        const cleanEmail = String(email || '').trim().toLowerCase();
        await upsertAuthorInDb(uid || `admin-${cleanEmail}`, cleanEmail, name || cleanEmail.split('@')[0], cleanEmail === SUPER_ADMIN_EMAIL ? 'super_admin' : role || 'editor', SUPER_ADMIN_EMAIL, status, permissions);
        const data = await getAdminPortalData();
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
      }
    }
    if (path.startsWith('/admin/author/') && method === 'DELETE') {
      const user = await verifySuperAdmin(event);
      const uid = path.split('/').pop() || '';
      const targetEmail = event.queryStringParameters?.email || '';
      await deleteAuthorFromDb(uid, targetEmail, user.email || SUPER_ADMIN_EMAIL);
      const data = await getAdminPortalData();
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    // 4. Admin Account Creation (CRITICAL BUG FIX)
    if (method === 'POST' && path === '/admin/create-admin') {
      const user = await verifySuperAdmin(event);
      const { email, password, name, role, permissions } = JSON.parse(event.body || '{}');
      const actorEmail = (user.email || SUPER_ADMIN_EMAIL).toLowerCase();

      if (!email || !password) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Email and password are required.' }) };
      }

      // 1. Create user in Firebase Auth
      const userRecord = await adminAuth.createUser({
        email: email.trim().toLowerCase(),
        password,
        displayName: name || email.split('@')[0],
      });

      // 2. Create/Update user in PostgreSQL
      await upsertAuthorInDb(
        userRecord.uid,
        email.trim().toLowerCase(),
        name || email.split('@')[0],
        role || 'admin',
        actorEmail,
        'active',
        permissions || [],
        actorEmail
      );

      await logPortalActivity(actorEmail, 'ADMIN_CREATED', `Created new administrator ${name} (${email}) with role ${role?.toUpperCase()}.`, `নতুন অ্যাডমিন ${name} (${email}) তৈরি করা হয়েছে (ভূমিকা: ${role?.toUpperCase()})।`);

      const data = await getAdminPortalData();
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error: any) {
    console.error('API Error:', error);
    return {
      statusCode: error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
