import React, { useState } from 'react';
import {
  ALL_15_CATEGORIES,
  CATEGORY_LABELS,
} from '../data/initialData.ts';
import {
  ForceCategory,
  Language,
  NewsArticle,
} from '../types/news.ts';
import { submitPublicArticleToFirestore } from '../lib/firebase.ts';
import { Check, FileUp, ShieldAlert, Send } from 'lucide-react';

interface PublicSubmitNewsProps {
  lang: Language;
  onSubmissionQueued: (pendingArticle: NewsArticle) => void;
  onBackHome: () => void;
}

export const PublicSubmitNews: React.FC<PublicSubmitNewsProps> = ({
  lang,
  onSubmissionQueued,
  onBackHome,
}) => {
  const isEn = lang === 'en';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<ForceCategory>('defence_news');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [sourceInfo, setSourceInfo] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg(
        isEn
          ? 'Image file size must be under 3 MB.'
          : 'ছবির ফাইলের আকার ৩ মেগাবাইটের কম হতে হবে।'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (honeypot) {
      setErrorMsg(isEn ? 'Spam detected.' : 'স্প্যাম শনাক্ত হয়েছে।');
      return;
    }

    const cleanCaptcha = captchaInput.trim();
    if (cleanCaptcha !== '9' && cleanCaptcha !== '৯') {
      setErrorMsg(
        isEn
          ? 'Spam verification failed: Please enter 9 for the security sum (4 + 5).'
          : 'নিরাপত্তা যাচাই ব্যর্থ হয়েছে: অনুগ্রহ করে যোগফলের ঘরে ৯ লিখুন (৪ + ৫)।'
      );
      return;
    }

    if (headline.trim().length < 10 || description.trim().length < 25) {
      setErrorMsg(
        isEn
          ? 'Please provide a descriptive headline (min 10 chars) and full report details (min 25 chars).'
          : 'অনুগ্রহ করে স্পষ্ট শিরোনাম (কমপক্ষে ১০ অক্ষর) এবং বিস্তারিত বিবরণ (কমপক্ষে ২৫ অক্ষর) লিখুন।'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        headlineEn: headline.trim(),
        headlineBn: headline.trim(),
        category,
        descriptionEn: description.trim(),
        descriptionBn: description.trim(),
        imageUrl: imagePreview || undefined,
        sourceInfo: sourceInfo.trim(),
        honeypot,
      };

      const res = await fetch('/api/public/submit-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const paragraphs = description
        .trim()
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      const pendingArticle: NewsArticle = {
        id: `sub-${Date.now()}`,
        category,
        status: 'pending',
        visualKey: 'army_parade',
        customImageUrl: imagePreview || undefined,
        organization: 'Public Reader Submission',
        isLeadStory: false,
        isSecondaryFeature: false,
        isBreakingTicker: false,
        submitterName: fullName.trim(),
        submitterEmail: email.trim(),
        sourceInfo: sourceInfo.trim(),
        createdAtIso: new Date().toISOString(),
        en: {
          title: headline.trim(),
          subtitle: `Submitted by ${fullName.trim()} — Source: ${sourceInfo.trim()}`,
          body: paragraphs,
          author: fullName.trim(),
          authorRole: 'Public Contributor',
          publishedDate: 'November 8, 2026',
          readTime: '3 min read',
          figureCaption: `Submitted documentation — Source: ${sourceInfo.trim()}`,
          location: 'Bangladesh',
          keyFacts: [`Source: ${sourceInfo.trim()}`],
        },
        bn: {
          title: headline.trim(),
          subtitle: `প্রেরক: ${fullName.trim()} — তথ্যসূত্র: ${sourceInfo.trim()}`,
          body: paragraphs,
          author: fullName.trim(),
          authorRole: 'নাগরিক প্রতিবেদক',
          publishedDate: '৮ নভেম্বর ২০২৬',
          readTime: '৩ মিনিট পাঠ',
          figureCaption: `প্রেরিত আলোকচিত্র — সূত্র: ${sourceInfo.trim()}`,
          location: 'বাংলাদেশ',
          keyFacts: [`তথ্যসূত্র: ${sourceInfo.trim()}`],
        },
      };

      if (res.ok) {
        const data = await res.json();
        pendingArticle.id = data.id || pendingArticle.id;
      }

      await submitPublicArticleToFirestore(pendingArticle);
      onSubmissionQueued(pendingArticle);
      setSubmittedRef(pendingArticle.id);
      setFullName('');
      setEmail('');
      setHeadline('');
      setDescription('');
      setSourceInfo('');
      setImagePreview('');
      setCaptchaInput('');
    } catch {
      setErrorMsg(
        isEn
          ? 'Could not submit report. Please verify your inputs and try again.'
          : 'সংবাদটি জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে তথ্য যাচাই করে পুনরায় চেষ্টা করুন।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto py-6 space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-blue-700 dark:text-blue-400 font-semibold">
            {isEn
              ? 'Public Citizen & Correspondent Submission Desk'
              : 'পাঠক ও নাগরিক সাংবাদিক সংবাদ প্রেরণ ডেস্ক'}
          </p>
          <h1 className="text-3xl font-editorial font-bold text-slate-900 dark:text-white mt-1">
            {isEn ? 'Submit News Report for Editorial Review' : 'সম্পাদকীয় পর্যালোচনার জন্য সংবাদ পাঠান'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {isEn
              ? 'Submitted reports enter a mandatory PENDING queue. Only authorized administrators can verify, approve, and publish submissions.'
              : 'প্রেরিত প্রতিটি সংবাদ স্বয়ংক্রিয়ভাবে অপেক্ষমাণ তালিকায় জমা হয়। কেবলমাত্র অনুমোদিত অ্যাডমিন যাচাই সাপেক্ষে তা প্রকাশ করতে পারেন।'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBackHome}
          className="px-4 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isEn ? 'Back to Front Page' : 'প্রচ্ছদে ফিরে যান'}
        </button>
      </div>

      {submittedRef ? (
        <div className="bg-white dark:bg-slate-900 border border-emerald-600/40 p-8 rounded-lg space-y-4">
          <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold text-lg">
            <Check className="w-6 h-6 shrink-0" />
            <span>
              {isEn
                ? 'News Report Received — Status: PENDING ADMIN REVIEW'
                : 'সংবাদটি গৃহীত হয়েছে — বর্তমান অবস্থা: অনুমোদনের অপেক্ষায়'}
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {isEn
              ? `Reference ID: ${submittedRef}. Your submission has been securely stored in the PostgreSQL database with status PENDING. It will appear on the public portal only after an authorized Administrator reviews and approves it.`
              : `রেফারেন্স আইডি: ${submittedRef}। আপনার পাঠানো সংবাদটি ডেটাবেসে অপেক্ষমাণ হিসেবে সংরক্ষিত হয়েছে। দায়িত্বপ্রাপ্ত অ্যাডমিন তথ্যসূত্র যাচাই ও অনুমোদন করার পরই কেবল এটি পোর্টালে প্রকাশিত হবে।`}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSubmittedRef(null)}
              className="px-4 py-2 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 cursor-pointer"
            >
              {isEn ? 'Submit Another Report' : 'আরেকটি সংবাদ পাঠান'}
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="px-4 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded cursor-pointer"
            >
              {isEn ? 'Return to Homepage' : 'প্রচ্ছদে ফিরে যান'}
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-lg space-y-6"
        >
          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Hidden Honeypot Field for Bot Protection */}
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isEn ? '1. Full Name *' : '১. আপনার পূর্ণ নাম *'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isEn ? 'Enter your full name' : 'আপনার পূর্ণ নাম লিখুন'}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isEn ? '2. Email Address *' : '২. ইমেইল ঠিকানা *'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isEn ? 'your.name@example.com' : 'আপনার ইমেইল ঠিকানা লিখুন'}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isEn ? '3. NewsHeadline *' : '৩. সংবাদের শিরোনাম *'}
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={
                  isEn
                    ? 'Enter clear, factual news headline'
                    : 'সুস্পষ্ট ও তথ্যবহুল সংবাদের শিরোনাম লিখুন'
                }
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isEn ? '4. Category *' : '৪. সংবাদের বিভাগ *'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ForceCategory)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded"
              >
                {ALL_15_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat][lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isEn ? '5. News Description & Full Report *' : '৫. সংবাদের বিস্তারিত বিবরণ *'}
            </label>
            <textarea
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isEn
                  ? 'Provide complete, accurate details including date, location, and factual context...'
                  : 'ঘটনার তারিখ, স্থান ও প্রাসঙ্গিক তথ্যসহ বিস্তারিত প্রতিবেদন লিখুন...'
              }
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isEn ? '6. Image Upload (Optional)' : '৬. ছবি আপলোড (ঐচ্ছিক)'}
              </label>
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 rounded cursor-pointer hover:border-blue-600">
                <FileUp className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>
                  {imagePreview
                    ? isEn
                      ? 'Image Attached (Click to change)'
                      : 'ছবি যুক্ত হয়েছে (পরিবর্তন করতে ক্লিক করুন)'
                    : isEn
                    ? 'Choose Image File (JPG/PNG)'
                    : 'ছবির ফাইল নির্বাচন করুন (জেপিজি/পিএনজি)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isEn
                  ? '7. Official Source Information *'
                  : '৭. সংবাদের নির্ভরযোগ্য তথ্যসূত্র *'}
              </label>
              <input
                type="text"
                required
                value={sourceInfo}
                onChange={(e) => setSourceInfo(e.target.value)}
                placeholder={
                  isEn
                    ? 'e.g. ISPR Press Release / District HQ Notice / Direct Observation'
                    : 'যেমন: আইএসপিআর বিজ্ঞপ্তি / জেলা সদর দপ্তর নোটিশ / প্রত্যক্ষ তথ্য'
                }
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded"
              />
            </div>
          </div>

          {/* Anti-Spam Challenge */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isEn
                  ? 'Spam Protection & Verification Question: What is 4 + 5?'
                  : 'স্প্যাম সুরক্ষা যাচাই প্রশ্ন: ৪ + ৫ সমান কত?'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isEn
                  ? 'Visitors cannot self-publish. Verified reports are routed to the Admin Approval Queue.'
                  : 'ভিজিটর সরাসরি সংবাদ প্রকাশ করতে পারেন না। যাচাইকৃত সংবাদ অ্যাডমিন অনুমোদন তালিকায় জমা হবে।'}
              </p>
            </div>
            <input
              type="text"
              required
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              placeholder={isEn ? 'Enter 9' : '৯ লিখুন'}
              className="w-28 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded font-tabular"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? isEn
                    ? 'Submitting to Admin Queue...'
                    : 'অ্যাডমিন প্যানেলে পাঠানো হচ্ছে...'
                  : isEn
                  ? 'Submit News for Admin Review'
                  : 'অ্যাডমিন পর্যালোচনার জন্য জমা দিন'}
              </span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
