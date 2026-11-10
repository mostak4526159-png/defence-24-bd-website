# Defence 24 BD — Firestore Security Specification

## 1. Overview & Threat Model
Defence 24 BD is a bilingual international and national defense news portal with a protected editorial Admin Panel and a public reader news submission workflow.

### Core Security Principles
1. **Default Deny**: All unmatched paths are strictly denied (`match /{document=**} { allow read, write: if false; }`).
2. **Public Read Isolation**:
   - Visitors can read `/articles/{articleId}` **only** when `resource.data.status == 'published'`. Drafts, pending submissions, and rejected articles are invisible to public readers and can only be read by authenticated administrators.
   - Visitors can read `/circulars/{circularId}`, `/notices/{noticeId}`, and `/settings/{settingId}` for rendering public recruitment circulars, breaking news tickers, emergency notices, and SEO metadata.
3. **Public News Submission (Pending Only)**:
   - Public visitors can `create` documents in `/articles/{articleId}` **only** if `request.resource.data.status == 'pending'`, `isLeadStory == false`, `isSecondaryFeature == false`, and `isBreakingTicker == false`, with strict field and size bounds.
   - Public visitors **cannot** `update` or `delete` any article, nor can they create an article with `status == 'published'`.
4. **Role-Based Access Control (Admin Only)**:
   - Only verified administrators (`isAdmin()`)—verified via the bootstrapped primary admin email `mostak4526159@gmail.com` (`email_verified == true`) or existence in `/admins/$(request.auth.uid)`—can create/update/delete published articles, circulars, notices, site settings, author profiles, and activity logs.
5. **PII Protection**:
   - `/users/{userId}`, `/admins/{adminId}`, and `/activity_logs/{logId}` are restricted strictly to authenticated owners or administrators; zero public reads are allowed.
