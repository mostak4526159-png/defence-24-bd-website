import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import {
  AuthRequest,
  createAdminSession,
  requireAuth,
  requireSuperAdmin,
  revokeAdminSession,
} from './src/middleware/auth.ts';
import {
  deleteArticleFromDb,
  deleteAuthorFromDb,
  deleteCircularFromDb,
  deleteNoticeFromDb,
  getAdminPortalData,
  getOrCreateUser,
  getPublicPortalData,
  logPortalActivity,
  saveSettingsInDb,
  upsertArticleInDb,
  upsertAuthorInDb,
  upsertCircularInDb,
  upsertNoticeInDb,
} from './src/db/repository.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { NewsArticle } from './src/types/news.ts';
import {
  generateSitemapXml,
  generateGoogleNewsSitemapXml,
  generateRssFeedXml,
} from './src/lib/feedGenerators.ts';
import {
  DEFAULT_CUSTOM_CATEGORIES,
  DEFAULT_CUSTOM_PAGES,
} from './src/data/customizationDefaults.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // 1. Public Read Endpoint (Only published news, active notices, and circulars)
  app.get('/api/public/portal', async (_req, res) => {
    try {
      const data = await getPublicPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Public portal fetch error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch portal data' });
    }
  });

  // XML Dynamic Feeds & Sitemaps for Google News, Search Console & RSS Readers
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers.host || 'defence24.netlify.app';
      const siteUrl = `${proto}://${host}`;
      const portalData = await getPublicPortalData();
      const xml = generateSitemapXml(
        siteUrl,
        portalData.articles || [],
        DEFAULT_CUSTOM_CATEGORIES,
        DEFAULT_CUSTOM_PAGES,
        portalData.settings
      );
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (err: any) {
      res.status(500).send(`Error generating sitemap: ${err.message}`);
    }
  });

  app.get('/news-sitemap.xml', async (req, res) => {
    try {
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers.host || 'defence24.netlify.app';
      const siteUrl = `${proto}://${host}`;
      const portalData = await getPublicPortalData();
      const xml = generateGoogleNewsSitemapXml(
        siteUrl,
        portalData.articles || [],
        portalData.settings
      );
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=900');
      res.send(xml);
    } catch (err: any) {
      res.status(500).send(`Error generating news sitemap: ${err.message}`);
    }
  });

  app.get('/feed.xml', async (req, res) => {
    try {
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers.host || 'defence24.netlify.app';
      const siteUrl = `${proto}://${host}`;
      const portalData = await getPublicPortalData();
      const xml = generateRssFeedXml(
        siteUrl,
        portalData.articles || [],
        portalData.settings
      );
      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(xml);
    } catch (err: any) {
      res.status(500).send(`Error generating RSS feed: ${err.message}`);
    }
  });

  // 2. Public News Submission Endpoint (Visitors can ONLY submit as PENDING, never publish)
  app.post('/api/public/submit-news', async (req, res) => {
    try {
      const {
        fullName,
        email,
        headlineEn,
        headlineBn,
        category,
        descriptionEn,
        descriptionBn,
        imageUrl,
        sourceInfo,
        honeypot,
      } = req.body || {};

      // Anti-spam check
      if (honeypot) {
        return res.status(400).json({ error: 'Spam submission blocked.' });
      }
      if (!fullName || !email || (!headlineEn && !headlineBn) || (!descriptionEn && !descriptionBn)) {
        return res.status(400).json({ error: 'Required submission fields are missing.' });
      }

      const cleanTitleEn = (headlineEn || headlineBn || '').trim();
      const cleanTitleBn = (headlineBn || headlineEn || '').trim();
      const cleanBodyEn = (descriptionEn || descriptionBn || '')
        .split(/\n+/)
        .map((p: string) => p.trim())
        .filter(Boolean);
      const cleanBodyBn = (descriptionBn || descriptionEn || '')
        .split(/\n+/)
        .map((p: string) => p.trim())
        .filter(Boolean);

      const pendingArticle: NewsArticle = {
        id: `sub-${Date.now()}`,
        category: category || 'defence_news',
        status: 'pending', // Strictly forced to PENDING
        visualKey: 'army_parade',
        customImageUrl: imageUrl || undefined,
        organization: 'Public Reader Submission',
        isLeadStory: false,
        isSecondaryFeature: false,
        isBreakingTicker: false,
        submitterName: fullName.trim(),
        submitterEmail: email.trim(),
        sourceInfo: (sourceInfo || 'Reader Submitted Report').trim(),
        createdAtIso: new Date().toISOString(),
        en: {
          title: cleanTitleEn,
          subtitle: `Community news dispatch submitted by ${fullName.trim()} — Source: ${sourceInfo || 'Primary Field Report'}`,
          body: cleanBodyEn.length > 0 ? cleanBodyEn : [cleanTitleEn],
          author: fullName.trim(),
          authorRole: 'Verified Public Contributor',
          publishedDate: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          readTime: '3 min read',
          figureCaption: `Submitted visual documentation — Source: ${sourceInfo || 'Contributor'}`,
          location: 'Bangladesh',
          keyFacts: [
            `Submitted by: ${fullName.trim()} (${email.trim()})`,
            `Cited Source: ${sourceInfo || 'Field Observation'}`,
          ],
        },
        bn: {
          title: cleanTitleBn,
          subtitle: `পাঠক প্রতিবেদক (${fullName.trim()}) কর্তৃক প্রেরিত সংবাদ — সূত্র: ${sourceInfo || 'মাঠপর্যায়ের তথ্য'}`,
          body: cleanBodyBn.length > 0 ? cleanBodyBn : [cleanTitleBn],
          author: fullName.trim(),
          authorRole: 'নাগরিক প্রতিবেদক',
          publishedDate: '৮ নভেম্বর ২০২৬',
          readTime: '৩ মিনিট পাঠ',
          figureCaption: `প্রেরিত আলোকচিত্র — তথ্যসূত্র: ${sourceInfo || 'পাঠক প্রতিবেদক'}`,
          location: 'বাংলাদেশ',
          keyFacts: [
            `প্রেরক: ${fullName.trim()} (${email.trim()})`,
            `উল্লিখিত সূত্র: ${sourceInfo || 'প্রত্যক্ষদর্শী ও দাপ্তরিক তথ্য'}`,
          ],
        },
      };

      await upsertArticleInDb(pendingArticle, email.trim());
      await logPortalActivity(
        email.trim(),
        'PUBLIC_SUBMISSION',
        `New visitor news submission "${cleanTitleEn}" queued as PENDING for Admin approval.`,
        `পাঠক প্রেরিত সংবাদ "${cleanTitleBn}" অনুমোদনের জন্য অপেক্ষমাণ (PENDING) তালিকায় যুক্ত হয়েছে।`
      );

      res.json({ success: true, id: pendingArticle.id, status: 'pending' });
    } catch (error: any) {
      console.error('Public submission error:', error);
      res.status(500).json({ error: error.message || 'Failed to submit news' });
    }
  });

  // 3. Google Sign-In & Multi-Admin Verification Endpoint
  const handleAdminVerification = async (req: express.Request, res: express.Response) => {
    try {
      const { email, name, uid, approvedEmails } = req.body || {};
      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

      if (!cleanEmail || !cleanEmail.endsWith('@gmail.com')) {
        return res.status(403).json({
          error: 'Access Denied: Only authorized Gmail accounts may access the Admin Panel.',
        });
      }

      const isSuperAdmin = cleanEmail === 'mostak4526159@gmail.com';
      let isApprovedInvitedAdmin = false;
      let resolvedRole = isSuperAdmin ? 'super_admin' : 'admin';
      let resolvedName = isSuperAdmin
        ? 'Mostak — Chief Super Admin'
        : (name || 'Editorial Administrator').trim();

      if (!isSuperAdmin) {
        try {
          const portalAdminData = await getAdminPortalData();
          const matchedAuthor = portalAdminData.authors.find(
            (a) => a.email.trim().toLowerCase() === cleanEmail && a.status !== 'suspended'
          );
          if (matchedAuthor) {
            isApprovedInvitedAdmin = true;
            resolvedRole = matchedAuthor.role || 'admin';
            resolvedName = matchedAuthor.name || resolvedName;
          }
        } catch {
          // fallback to approvedEmails list
        }
        if (
          !isApprovedInvitedAdmin &&
          Array.isArray(approvedEmails) &&
          approvedEmails.map((e: string) => String(e).trim().toLowerCase()).includes(cleanEmail)
        ) {
          isApprovedInvitedAdmin = true;
        }
      }

      if (isSuperAdmin || isApprovedInvitedAdmin) {
        const userRecord = await getOrCreateUser(
          uid || `admin-${cleanEmail}`,
          cleanEmail,
          resolvedName
        );
        const finalRole = isSuperAdmin ? 'super_admin' : userRecord.role || resolvedRole;
        const token = createAdminSession(cleanEmail, userRecord.name, finalRole);
        await logPortalActivity(
          cleanEmail,
          'ADMIN_GOOGLE_LOGIN',
          `Authorized administrator signed in via Google (${cleanEmail}, role: ${finalRole.toUpperCase()}).`,
          `অনুমোদিত অ্যাডমিন গুগল লগইনের মাধ্যমে ড্যাশবোর্ডে প্রবেশ করেছেন (${cleanEmail})।`
        );
        return res.json({
          token,
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            name: userRecord.name,
            role: finalRole,
          },
        });
      }

      return res.status(403).json({
        error:
          'Unauthorized Gmail account. Only Super Admin (mostak4526159@gmail.com) or invited and approved Gmail administrators may access this panel.',
      });
    } catch (error: any) {
      console.error('Admin verification error:', error);
      res.status(500).json({ error: 'Authentication service error' });
    }
  };

  app.post('/api/auth/google-admin', handleAdminVerification);
  app.post('/api/auth/admin-login', handleAdminVerification);

  // New endpoint for creating admin accounts with email/password using Firebase Admin SDK
  app.post('/api/admin/create-admin', requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const { email, password, name, role, permissions } = req.body || {};
      const actorEmail = (req.user?.email || 'mostak4526159@gmail.com').toLowerCase();

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
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

      await logPortalActivity(
        actorEmail,
        'ADMIN_CREATED',
        `Created new administrator ${name} (${email}) with role ${role?.toUpperCase()}.`,
        `নতুন অ্যাডমিন ${name} (${email}) তৈরি করা হয়েছে (ভূমিকা: ${role?.toUpperCase()})।`
      );

      const data = await getAdminPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Create admin error:', error);
      res.status(500).json({ error: error.message || 'Failed to create administrator' });
    }
  });

  app.post('/api/auth/logout', requireAuth, async (req: AuthRequest, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      revokeAdminSession(authHeader.split('Bearer ')[1]);
    }
    res.json({ success: true });
  });

  // 4. Protected Admin Dashboard Endpoint
  app.get('/api/admin/dashboard', requireAuth, async (req: AuthRequest, res) => {
    try {
      const email = req.user?.email || 'mostak4526159@gmail.com';
      const uid = req.user?.uid || `uid-${email}`;
      await getOrCreateUser(uid, email, 'Editorial Administrator');
      const data = await getAdminPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Admin dashboard fetch error:', error);
      res.status(500).json({ error: error.message || 'Failed to load admin dashboard' });
    }
  });

  // 5. Protected Admin Article Create / Edit / Publish / Approve / Reject
  app.post('/api/admin/article', requireAuth, async (req: AuthRequest, res) => {
    try {
      const actorEmail = req.user?.email || 'mostak4526159@gmail.com';
      const article = req.body as NewsArticle;
      if (!article || !article.id) {
        return res.status(400).json({ error: 'Invalid article payload' });
      }
      await upsertArticleInDb(article, actorEmail);
      const data = await getAdminPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Admin article save error:', error);
      res.status(500).json({ error: error.message || 'Failed to save article' });
    }
  });

  app.delete('/api/admin/article/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const actorEmail = req.user?.email || 'mostak4526159@gmail.com';
      await deleteArticleFromDb(req.params.id, actorEmail);
      const data = await getAdminPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Admin article delete error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete article' });
    }
  });

  // 6. Protected Admin Circular Management
  app.post('/api/admin/circular', requireAuth, async (req: AuthRequest, res) => {
    try {
      const actorEmail = req.user?.email || 'mostak4526159@gmail.com';
      await upsertCircularInDb(req.body, actorEmail);
      const data = await getAdminPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Admin circular save error:', error);
      res.status(500).json({ error: error.message || 'Failed to save circular' });
    }
  });

  app.delete('/api/admin/circular/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const actorEmail = req.user?.email || 'mostak4526159@gmail.com';
      await deleteCircularFromDb(req.params.id, actorEmail);
      const data = await getAdminPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Admin circular delete error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete circular' });
    }
  });

  // 7. Protected Admin Notices & Breaking Ticker Management
  app.post('/api/admin/notice', requireAuth, async (req: AuthRequest, res) => {
    try {
      const actorEmail = req.user?.email || 'mostak4526159@gmail.com';
      await upsertNoticeInDb(req.body, actorEmail);
      const data = await getAdminPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Admin notice save error:', error);
      res.status(500).json({ error: error.message || 'Failed to save notice' });
    }
  });

  app.delete('/api/admin/notice/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const actorEmail = req.user?.email || 'mostak4526159@gmail.com';
      await deleteNoticeFromDb(req.params.id, actorEmail);
      const data = await getAdminPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Admin notice delete error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete notice' });
    }
  });

  // 8. Protected Admin Website Settings, SEO & AdSense Management
  app.post('/api/admin/settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const actorEmail = req.user?.email || 'mostak4526159@gmail.com';
      await saveSettingsInDb(req.body, actorEmail);
      const data = await getAdminPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Admin settings save error:', error);
      res.status(500).json({ error: error.message || 'Failed to save settings' });
    }
  });

  // 9. Protected Admin Authors & Multi-Admin Role Management
  app.post('/api/admin/author', requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const actorEmail = (req.user?.email || 'mostak4526159@gmail.com').toLowerCase();
      const { uid, email, name, role, status, permissions } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      
      if (cleanEmail === 'mostak4526159@gmail.com' && role !== 'super_admin') {
        return res.status(403).json({ error: 'Protected Super Admin account cannot be demoted.' });
      }

      await upsertAuthorInDb(
        uid || `admin-${cleanEmail}`,
        cleanEmail,
        name || cleanEmail.split('@')[0],
        cleanEmail === 'mostak4526159@gmail.com' ? 'super_admin' : role || 'editor',
        actorEmail,
        status,
        permissions
      );
      const data = await getAdminPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Admin author save error:', error);
      res.status(500).json({ error: error.message || 'Failed to update administrator' });
    }
  });

  app.delete('/api/admin/author/:uid', requireAuth, async (req: AuthRequest, res) => {
    try {
      const actorEmail = (req.user?.email || 'mostak4526159@gmail.com').toLowerCase();
      const targetEmail = String(req.query.email || '').trim().toLowerCase();
      if (targetEmail === 'mostak4526159@gmail.com' || req.params.uid === 'super-admin-mostak') {
        return res.status(403).json({ error: 'Protected Super Admin account cannot be removed.' });
      }
      await deleteAuthorFromDb(req.params.uid, targetEmail, actorEmail);
      const data = await getAdminPortalData();
      res.json(data);
    } catch (error: any) {
      console.error('Admin author delete error:', error);
      res.status(500).json({ error: error.message || 'Failed to remove administrator' });
    }
  });

  // 10. Protected Developer-Only Netlify & Firebase ZIP Package Export (Strictly Admin-Gated, In-Memory)
  const addDirectoryToZip = async (zip: JSZip, fsDirPath: string, zipPrefix: string) => {
    try {
      const entries = await fs.readdir(fsDirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(fsDirPath, entry.name);
        const targetZipPath = zipPrefix ? `${zipPrefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await addDirectoryToZip(zip, fullPath, targetZipPath);
        } else if (entry.isFile()) {
          const content = await fs.readFile(fullPath);
          zip.file(targetZipPath, content);
        }
      }
    } catch {
      // ignore if directory not present
    }
  };

  const buildDeveloperZipBuffer = async (
    mode: 'full' | 'netlify_drop' = 'full'
  ): Promise<Buffer> => {
    const zip = new JSZip();

    if (mode === 'netlify_drop') {
      // Direct Netlify Drag-and-Drop package: compiled dist/ files placed at ZIP root
      // PLUS the required netlify/functions source and src/ dependencies for serverless execution
      await addDirectoryToZip(zip, path.join(process.cwd(), 'dist'), '');
      await addDirectoryToZip(zip, path.join(process.cwd(), 'netlify'), 'netlify');
      await addDirectoryToZip(zip, path.join(process.cwd(), 'src'), 'src');
      
      const essentialFiles = [
        'netlify.toml',
        'firebase-applet-config.json',
        'firebase.json',
        'firestore.rules',
        'storage.rules',
        'README.md',
        'package.json',
        'tsconfig.json'
      ];

      for (const cfgFile of essentialFiles) {
        try {
          const buf = await fs.readFile(path.join(process.cwd(), cfgFile));
          zip.file(cfgFile, buf);
        } catch {
          // ignore
        }
      }
      return await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        platform: 'UNIX',
      });
    }

    const filesToInclude = [
      'package.json',
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      'netlify.toml',
      'netlify/functions/portal-status.js',
      'netlify/functions/api.ts',
      'netlify/functions/sitemap.ts',
      'netlify/functions/news-sitemap.ts',
      'netlify/functions/feed.ts',
      'firebase.json',
      'firebase-applet-config.json',
      'firebase-config.template.json',
      'firestore.rules',
      'firestore.indexes.json',
      'storage.rules',
      'firebase-blueprint.json',
      'security_spec.md',
      'metadata.json',
      'README.md',
      '.env.example',
      'server.ts',
      'public/_redirects',
      'public/ads.txt',
      'public/robots.txt',
      'public/sitemap.xml',
      'public/google9938907eb2ae8dc0.html',
      'src/main.tsx',
      'src/App.tsx',
      'src/index.css',
      'src/types/news.ts',
      'src/config/site.ts',
      'src/data/initialData.ts',
      'src/data/legalPagesData.ts',
      'src/data/customizationDefaults.ts',
      'src/components/CategoryBoxSection.tsx',
      'src/components/EditorialMedia.tsx',
      'src/components/PublicSubmitNews.tsx',
      'src/components/AdminSection.tsx',
      'src/components/common/NumberStepControl.tsx',
      'src/lib/firebase.ts',
      'src/lib/firebase-admin.ts',
      'src/lib/cloudinary.ts',
      'src/lib/thumbnailGenerator.ts',
      'src/lib/routing.ts',
      'src/lib/developerZipExport.ts',
      'src/lib/themeApplier.ts',
      'src/lib/feedGenerators.ts',
      'src/middleware/auth.ts',
      'src/db/schema.ts',
      'src/db/index.ts',
      'src/db/repository.ts',
    ];

    for (const relPath of filesToInclude) {
      try {
        const absPath = path.join(process.cwd(), relPath);
        const content = await fs.readFile(absPath);
        zip.file(relPath, content);
      } catch {
        // skip optional file if missing
      }
    }

    // Include generated editorial images
    await addDirectoryToZip(zip, path.join(process.cwd(), 'src/assets/images'), 'src/assets/images');

    // Include admin subcomponents
    await addDirectoryToZip(zip, path.join(process.cwd(), 'src/components/admin'), 'src/components/admin');

    // Include compiled production dist/ folder so the ZIP is both Git-ready and pre-built for Netlify
    await addDirectoryToZip(zip, path.join(process.cwd(), 'dist'), 'dist');

    return await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
      platform: 'UNIX',
    });
  };

  app.get('/api/admin/developer-export-zip', requireAuth, async (req: AuthRequest, res) => {
    try {
      const mode = (req.query.mode as string) || 'complete';
      let filename = 'DEFENCE-24-BD-COMPLETE-ADMIN-CONTROL.zip';
      if (mode === 'netlify_drop') {
        filename = 'defence-24-bd-netlify-drop-ready.zip';
      } else if (mode === 'firebase') {
        filename = 'defence-24-bd-netlify-firebase.zip';
      }
      const buffer = await buildDeveloperZipBuffer(mode === 'netlify_drop' ? 'netlify_drop' : 'full');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Length', String(buffer.length));
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to build developer ZIP' });
    }
  });

  // 11. Protected Admin Security & ZIP Integrity Diagnostics
  app.get('/api/admin/security-diagnostics', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const dropZipBuf = await buildDeveloperZipBuffer('netlify_drop');
      const parsedDropZip = await JSZip.loadAsync(dropZipBuf);
      const dropEntries = Object.keys(parsedDropZip.files).filter((k) => !parsedDropZip.files[k].dir);

      const fullZipBuf = await buildDeveloperZipBuffer('full');
      const parsedFullZip = await JSZip.loadAsync(fullZipBuf);
      const fullEntries = Object.keys(parsedFullZip.files).filter((k) => !parsedFullZip.files[k].dir);

      const firestoreRulesText = await fs.readFile(path.join(process.cwd(), 'firestore.rules'), 'utf-8');
      const storageRulesText = await fs.readFile(path.join(process.cwd(), 'storage.rules'), 'utf-8');

      res.json({
        ok: true,
        zipIntegrity: {
          validArchive: true,
          primaryFileName: 'defence-24-bd-netlify-drop-ready.zip',
          dropZipFileCount: dropEntries.length,
          dropZipSizeBytes: dropZipBuf.length,
          dropZipHasIndexHtmlAtRoot: dropEntries.includes('index.html'),
          fileCount: fullEntries.length,
          sizeBytes: fullZipBuf.length,
          includesCompiledDist: fullEntries.some((f) => f.startsWith('dist/index.html')),
          includesFirestoreRules: fullEntries.includes('firestore.rules'),
          includesStorageRules: fullEntries.includes('storage.rules'),
          includesNetlifyConfig: fullEntries.includes('netlify.toml'),
        },
        securityRulesAudit: {
          firestoreDefaultDeny: firestoreRulesText.includes('allow read, write: if false;'),
          firestorePublicPublishedOnly: firestoreRulesText.includes("resource.data.status == 'published'"),
          firestorePendingSubmissionGuard: firestoreRulesText.includes("request.resource.data.status == 'pending'"),
          firestoreAdminRbac: firestoreRulesText.includes('mostak4526159@gmail.com'),
          storageImageMimeGuard: storageRulesText.includes("request.resource.contentType.matches('image/.*')"),
          storageMaxSizeGuard: storageRulesText.includes('5 * 1024 * 1024'),
        },
      });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Defence 24 BD Server running on http://localhost:${PORT}`);
  });
}

startServer();
