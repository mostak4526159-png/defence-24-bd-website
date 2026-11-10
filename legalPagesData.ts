import { Language } from '../types/news.ts';

export interface PolicySection {
  heading: string;
  paragraphs: string[];
}

export interface LegalPageContent {
  kicker: string;
  title: string;
  lastUpdated: string;
  lead: string;
  sections: PolicySection[];
}

export const LEGAL_PAGES: Record<
  'about' | 'privacy' | 'terms' | 'disclaimer' | 'editorial_policy' | 'corrections_policy',
  Record<Language, LegalPageContent>
> = {
  about: {
    en: {
      kicker: 'Institutional Profile & Ownership Disclosure',
      title: 'About Defence 24 BD',
      lastUpdated: 'Effective Date: November 2026',
      lead: 'Defence 24 BD is an independent, public-interest international and national defense news publication dedicated to covering national security, armed forces modernization, peacekeeping missions, civil defense, and verified recruitment circulars.',
      sections: [
        {
          heading: '1. Our Editorial Mission',
          paragraphs: [
            'Founded with a commitment to factual, non-partisan journalism, Defence 24 BD provides citizens, researchers, students, and defense aspirants with clear, verified reporting across the Bangladesh Army, Navy, Air Force, Police, Ansar & VDP, Border Guard Bangladesh (BGB), Coast Guard, Fire Service & Civil Defence, and international military missions.',
            'We operate two strictly separated editions—English and Bangla—so readers in both languages enjoy native, unmixed editorial clarity without machine-translated clutter.',
          ],
        },
        {
          heading: '2. Fact-Checking & Verification Standards',
          paragraphs: [
            'Every news dispatch and recruitment summary published on Defence 24 BD undergoes multi-step editorial verification. Our correspondents cross-reference public releases from the Inter-Services Public Relations (ISPR) Directorate, ministry gazettes, United Nations peacekeeping press desks, and official service recruitment portals before publication.',
            'We never publish speculative rumors, classified operational coordinates, or sensationalized claims. Respect for national security, institutional dignity, and public accuracy guides every editorial decision.',
          ],
        },
        {
          heading: '3. Original Content & Copyright Compliance',
          paragraphs: [
            'All articles, recruitment guides, diagrams, and photographs published by Defence 24 BD are originally written and commissioned by our editorial team. We strictly comply with international copyright laws and Google Publisher Policies.',
          ],
        },
        {
          heading: '4. Editorial Leadership & Transparent Ownership',
          paragraphs: [
            'Chief Editor: Brig. Gen. (Retd.) M. A. Karim, Advisory Fellow in Strategic & Peacekeeping Studies.',
            'Managing Editor (Bangla Edition): Mahmudul Hasan, Senior Defense & Public Service Journalist.',
            'Managing Editor (English Edition): Farhana Rahman, Maritime & Diplomatic Affairs Analyst.',
            'Headquarters: House 42, Road 7, Sector 4, Uttara Model Town, Dhaka-1230, Bangladesh.',
          ],
        },
      ],
    },
    bn: {
      kicker: 'প্রতিষ্ঠান পরিচিতি ও মালিকানা স্বচ্ছতা',
      title: 'ডিফেন্স ২৪ বিডি সম্পর্কে',
      lastUpdated: 'কার্যকর তারিখ: নভেম্বর ২০২৬',
      lead: 'ডিফেন্স ২৪ বিডি বাংলাদেশের প্রতিরক্ষা বাহিনী, আন্তর্জাতিক সামরিক সংবাদ, জননিরাপত্তা, জাতিসংঘ শান্তিরক্ষা মিশন, দুর্যোগ ব্যবস্থাপনা এবং দাপ্তরিক নিয়োগ বিজ্ঞপ্তি বিষয়ক একটি স্বাধীন ও জনস্বার্থমূলক ডিজিটাল সংবাদ পোর্টাল।',
      sections: [
        {
          heading: '১. আমাদের সম্পাদকীয় লক্ষ্য',
          paragraphs: [
            'বস্তুনিষ্ঠ ও দায়িত্বশীল সাংবাদিকতার অঙ্গীকার নিয়ে প্রতিষ্ঠিত ডিফেন্স ২৪ বিডি বাংলাদেশ সেনাবাহিনী, নৌবাহিনী, বিমান বাহিনী, পুলিশ, আনসার ও ভিডিপি, বর্ডার গার্ড বাংলাদেশ (বিজিবি), কোস্ট গার্ড, ফায়ার সার্ভিস এবং আন্তর্জাতিক সামরিক বিষয়াবলি সংক্রান্ত তথ্যবহুল প্রতিবেদন প্রকাশ করে।',
            'পাঠকদের সুবিধার্থে আমাদের ওয়েবসাইটে বাংলা এবং ইংরেজি—এই দুটি সম্পূর্ণ স্বতন্ত্র সংস্করণ রয়েছে, যাতে কোনো ভাষার মিশ্রণ ছাড়াই পাঠক প্রাঞ্জল ভাষায় সংবাদ ও বিজ্ঞপ্তি পাঠ করতে পারেন।',
          ],
        },
        {
          heading: '২. তথ্য যাচাই ও সত্যতা নিশ্চিতকরণ নীতি',
          paragraphs: [
            'ডিফেন্স ২৪ বিডি-তে প্রকাশিত প্রতিটি সংবাদ এবং নিয়োগ বিজ্ঞপ্তির সারসংক্ষেপ প্রকাশের পূর্বে আমাদের সম্পাদনা পর্ষদ একাধিক ধাপে যাচাই করে। আন্তঃবাহিনী জনসংযোগ পরিদপ্তর (আইএসপিআর), সংশ্লিষ্ট মন্ত্রণালয়ের গেজেট এবং বাহিনীসমূহের দাপ্তরিক ওয়েবসাইটের তথ্যের সাথে মিলিয়ে প্রতিবেদন তৈরি করা হয়।',
            'আমরা কোনো ধরনের গুজব, যাচাইবিহীন তথ্য কিংবা রাষ্ট্রীয় নিরাপত্তার জন্য সংবেদনশীল কোনো কৌশলগত তথ্য প্রকাশ করি না।',
          ],
        },
        {
          heading: '৩. মৌলিক কনটেন্ট ও কপিরাইট নীতিমালা',
          paragraphs: [
            'এই পোর্টালে প্রকাশিত সকল নিবন্ধ, নিয়োগ নির্দেশিকা, চিত্র ও আলোকচিত্র আমাদের নিজস্ব সম্পাদনা দলের মৌলিক সৃষ্টি। আমরা আন্তর্জাতিক কপিরাইট আইন এবং গুগল প্রকাশক নীতিমালা শতভাগ অনুসরণ করি।',
          ],
        },
        {
          heading: '৪. সম্পাদনা পর্ষদ ও প্রধান কার্যালয়',
          paragraphs: [
            'প্রধান সম্পাদক: ব্রিগেডিয়ার জেনারেল (অব.) এম. এ. করিম, কৌশলগত ও শান্তিরক্ষা গবেষণা উপদেষ্টা।',
            'নির্বাহী সম্পাদক (বাংলা সংস্করণ): মাহমুদুল হাসান, জ্যেষ্ঠ প্রতিরক্ষা ও জন-প্রশাসন সাংবাদিক।',
            'নির্বাহী সম্পাদক (ইংরেজি সংস্করণ): ফারহানা রহমান, সমুদ্র নিরাপত্তা ও কূটনৈতিক বিশ্লেষক।',
            'প্রধান কার্যালয়: বাড়ি ৪২, সড়ক ৭, সেক্টর ৪, উত্তরা মডেল টাউন, ঢাকা-১২৩০, বাংলাদেশ।',
          ],
        },
      ],
    },
  },
  editorial_policy: {
    en: {
      kicker: 'Journalistic Ethics, Sourcing & Moderation Charter',
      title: 'Editorial Policy',
      lastUpdated: 'Last Updated: November 8, 2026',
      lead: 'Defence 24 BD adheres to strict journalistic integrity, source attribution, and editorial independence. This Editorial Policy explains how we verify news, review public submissions, and maintain clear separation between editorial content and advertisements.',
      sections: [
        {
          heading: '1. Source Attribution & Primary Verification',
          paragraphs: [
            'All defense, security, and recruitment reporting must cite verifiable primary sources, including official press releases from ISPR, Ministry of Home Affairs, Ministry of Defense, United Nations Peacekeeping Missions, or accredited defense academies.',
            'Anonymous claims are never published. When a public contributor submits a news report through our Submit News portal, the report enters a mandatory PENDING state and is never visible to the public until verified and approved by an authorized Senior Editor.',
          ],
        },
        {
          heading: '2. Zero Plagiarism & Original Writing Mandate',
          paragraphs: [
            'Our correspondents write original analytical reports and accessible recruitment guides in separate English and Bangla editions. Copying verbatim articles from other news outlets or automated scraping is strictly prohibited.',
          ],
        },
        {
          heading: '3. Corrections & Accountability Protocol',
          paragraphs: [
            'If a factual error is identified after publication, our editorial team issues a transparent correction note at the bottom of the dispatch stating the date and nature of the revision.',
          ],
        },
        {
          heading: '4. Distinction Between Editorial Content and Advertisements',
          paragraphs: [
            'Editorial decisions are never influenced by advertisers. All display advertisement spaces on Defence 24 BD are clearly labeled as "Advertisement" and strictly separated from news articles and official circular links to prevent accidental clicks.',
          ],
        },
      ],
    },
    bn: {
      kicker: 'সাংবাদিকতার নীতিমালা, তথ্যসূত্র যাচাই ও সম্পাদনা সনদ',
      title: 'সম্পাদকীয় নীতিমালা',
      lastUpdated: 'সর্বশেষ হালনাগাদ: ৮ নভেম্বর ২০২৬',
      lead: 'ডিফেন্স ২৪ বিডি সর্বোচ্চ সাংবাদিকতা নীতি, নির্ভরযোগ্য তথ্যসূত্র উল্লেখ এবং সম্পাদকীয় স্বাধীনতা বজায় রেখে পরিচালিত হয়। আমরা কীভাবে সংবাদ যাচাই করি, পাঠকের পাঠানো সংবাদ পর্যালোচনা করি এবং বিজ্ঞাপন ও সংবাদের মধ্যে স্পষ্ট পার্থক্য বজায় রাখি তা এই নীতিমালায় বর্ণিত হয়েছে।',
      sections: [
        {
          heading: '১. প্রাথমিক তথ্যসূত্র ও যাচাইকরণ প্রক্রিয়া',
          paragraphs: [
            'প্রতিরক্ষা, জননিরাপত্তা ও নিয়োগ সংক্রান্ত প্রতিটি প্রতিবেদনে আইএসপিআর, স্বরাষ্ট্র মন্ত্রণালয়, প্রতিরক্ষা মন্ত্রণালয়, জাতিসংঘ শান্তিরক্ষা মিশন অথবা সংশ্লিষ্ট বাহিনীর দাপ্তরিক বিজ্ঞপ্তির সুনির্দিষ্ট সূত্র উল্লেখ করা বাধ্যতামূলক।',
            'পাঠক বা নাগরিক সাংবাদিকগণ যখন আমাদের "সংবাদ পাঠান" ফরমের মাধ্যমে কোনো খবর জমা দেন, তা সরাসরি প্রকাশিত হয় না। সেটি "অপেক্ষমাণ" অবস্থায় অ্যাডমিন ড্যাশবোর্ডে জমা হয় এবং কেবলমাত্র দায়িত্বপ্রাপ্ত সম্পাদকের যাচাই ও অনুমোদনের পরই পোর্টালে প্রকাশিত হয়।',
          ],
        },
        {
          heading: '২. মৌলিক রচনা ও কপি-মুক্ত সাংবাদিকতা',
          paragraphs: [
            'আমাদের প্রতিবেদকগণ বাংলা ও ইংরেজি উভয় সংস্করণের জন্য সম্পূর্ণ মৌলিক ও বিশ্লেষণধর্মী প্রতিবেদন রচনা করেন। অন্য কোনো সংবাদপত্র বা ওয়েবসাইট থেকে হুবহু কপি করা আমাদের নীতিমালায় সম্পূর্ণ নিষিদ্ধ।',
          ],
        },
        {
          heading: '৩. সংশোধনী প্রকাশ ও জবাবদিহিতা',
          paragraphs: [
            'প্রকাশিত কোনো সংবাদে অনিচ্ছাকৃত তথ্যগত ত্রুটি দৃষ্টিগোচর হলে আমাদের সম্পাদনা পর্ষদ দ্রুততম সময়ে তা যাচাই করে প্রতিবেদনের নিচে সংশোধনের তারিখসহ স্পষ্ট নোট সংযোজন করে।',
          ],
        },
        {
          heading: '৪. সংবাদ ও বিজ্ঞাপনের সুস্পষ্ট পার্থক্য',
          paragraphs: [
            'আমাদের সম্পাদকীয় সিদ্ধান্ত কখনোই বিজ্ঞাপনদাতাদের দ্বারা প্রভাবিত হয় না। পোর্টালে প্রদর্শিত প্রতিটি বিজ্ঞাপনের স্থান স্পষ্টভাবে "বিজ্ঞাপন" হিসেবে চিহ্নিত থাকে এবং মূল সংবাদের বাটন বা লিংক থেকে নিরাপদ দূরত্বে স্থাপন করা হয়।',
          ],
        },
      ],
    },
  },
  privacy: {
    en: {
      kicker: 'Data Protection & AdSense Compliance',
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: November 8, 2026',
      lead: 'At Defence 24 BD, accessible from https://defence24.netlify.app, safeguarding the privacy of our visitors is one of our highest priorities. This Privacy Policy document outlines the types of information collected and recorded by Defence 24 BD and how we use it in full compliance with Google AdSense and international data protection regulations.',
      sections: [
        {
          heading: '1. Information We Collect',
          paragraphs: [
            'We only collect personal information that you voluntarily provide to us when you submit an inquiry through our Contact Us form or submit a community news dispatch for editorial review (such as your name, email address, and submission content).',
            'Like most standard web servers, we utilize non-identifying log files. The information inside the log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date/time stamp, referring/exit pages, and click counts to analyze trends and administer the site.',
          ],
        },
        {
          heading: '2. Google AdSense & DoubleClick DART Cookie',
          paragraphs: [
            'Google is a third-party vendor on our website. It also uses cookies, known as DART cookies, to serve advertisements to our site visitors based upon their visit to Defence 24 BD and other sites on the internet.',
            'Visitors may choose to decline the use of DART cookies by visiting the Google Ad and Content Network Privacy Policy at the following URL: https://policies.google.com/technologies/ads',
            'Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Defence 24 BD, which are sent directly to users’ browsers. Defence 24 BD has no access to or control over these cookies that are used by third-party advertisers.',
          ],
        },
        {
          heading: '3. Cookie Preferences & Local Storage',
          paragraphs: [
            'Defence 24 BD uses functional browser storage solely to remember your preferred language edition (English or Bangla) and display theme (Light or Dark mode). You can disable cookies at any time through your individual browser options.',
          ],
        },
        {
          heading: '4. GDPR & CCPA Privacy Rights',
          paragraphs: [
            'Every user is entitled to the right to access, rectify, erase, or restrict the processing of their personal data. If you wish to exercise any of these rights regarding messages sent to our newsroom, please contact us directly at mostak4526159@gmail.com.',
          ],
        },
        {
          heading: '5. Children’s Information',
          paragraphs: [
            'Defence 24 BD does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you believe that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will promptly remove such information from our records.',
          ],
        },
      ],
    },
    bn: {
      kicker: 'তথ্য সুরক্ষা ও Google AdSense নীতিমালা',
      title: 'গোপনীয়তা নীতি',
      lastUpdated: 'সর্বশেষ হালনাগাদ: ৮ নভেম্বর ২০২৬',
      lead: 'https://defence24.netlify.app ওয়েবসাইটে আগত পাঠকদের ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষা করা ডিফেন্স ২৪ বিডি-এর অন্যতম প্রধান অগ্রাধিকার। আন্তর্জাতিক তথ্য সুরক্ষা আইন এবং Google AdSense-এর নীতিমালা অনুসরণ করে আমরা কীভাবে তথ্য সংগ্রহ ও ব্যবহার করি, তা এই নীতিমালায় স্পষ্টভাবে বর্ণনা করা হয়েছে।',
      sections: [
        {
          heading: '১. আমরা যেসব তথ্য সংগ্রহ করি',
          paragraphs: [
            'পাঠক যখন স্বেচ্ছায় আমাদের "যোগাযোগ" ফরম অথবা "সংবাদ পাঠান" ফরমের মাধ্যমে তথ্য পাঠান (যেমন: নাম, ইমেইল ঠিকানা এবং বার্তার বিষয়বস্তু), কেবল তখনই আমরা সেই তথ্য সংরক্ষণ করি যাতে সম্পাদনা পর্ষদ তা পর্যালোচনা করতে পারে।',
            'অন্যান্য পেশাদার ওয়েবসাইটের মতো আমাদের সার্ভারে স্ট্যান্ডার্ড লগ ফাইল ব্যবহৃত হয়। এর মধ্যে আইপি ঠিকানা, ব্রাউজারের ধরন, ইন্টারনেট সার্ভিস প্রোভাইডার, তারিখ ও সময় এবং পঠিত পাতার পরিসংখ্যান অন্তর্ভুক্ত থাকে, যা শুধুমাত্র সাইটের কারিগরি মান উন্নয়নে ব্যবহৃত হয়।',
          ],
        },
        {
          heading: '২. Google AdSense ও DoubleClick DART Cookie',
          paragraphs: [
            'আমাদের ওয়েবসাইটে তৃতীয় পক্ষের বিজ্ঞাপনদাতা হিসেবে Google বিজ্ঞাপন প্রদর্শন করতে পারে। ব্যবহারকারীর ব্রাউজিং অভিজ্ঞতার ভিত্তিতে প্রাসঙ্গিক বিজ্ঞাপন দেখানোর জন্য Google AdSense ও DoubleClick DART Cookie ব্যবহৃত হয়।',
            'যেকোনো পাঠক চাইলে Google-এর বিজ্ঞাপন ও কনটেন্ট নেটওয়ার্ক গোপনীয়তা নীতিমালা পাতা (https://policies.google.com/technologies/ads) ভিজিট করে DART Cookie-এর ব্যবহার বন্ধ করতে পারেন।',
            'তৃতীয় পক্ষের বিজ্ঞাপন নেটওয়ার্কসমূহ যে কুকি বা প্রযুক্তি ব্যবহার করে, তার ওপর ডিফেন্স ২৪ বিডি-এর কোনো নিয়ন্ত্রণ নেই।',
          ],
        },
        {
          heading: '৩. কুকিজ ও ব্রাউজার স্টোরেজ ব্যবহার',
          paragraphs: [
            'পাঠকের নির্বাচিত ভাষা (বাংলা অথবা ইংরেজি সংস্করণ) এবং থিম (ডার্ক অথবা লাইট মোড) মনে রাখার জন্য আমরা ব্রাউজারের লোকাল স্টোরেজ ব্যবহার করি। আপনি চাইলে আপনার ব্রাউজারের সেটিংস থেকে যেকোনো সময় কুকিজ নিষ্ক্রিয় করতে পারেন।',
          ],
        },
        {
          heading: '৪. ব্যবহারকারীর তথ্য সুরক্ষা অধিকার',
          paragraphs: [
            'প্রতিটি পাঠকের নিজস্ব প্রদত্ত তথ্য জানার, সংশোধন করার বা মুছে ফেলার পূর্ণ অধিকার রয়েছে। আমাদের বার্তা বিভাগে পাঠানো কোনো তথ্য মুছে ফেলতে চাইলে mostak4526159@gmail.com ঠিকানায় ইমেইল করার অনুরোধ করা হচ্ছে।',
          ],
        },
        {
          heading: '৫. শিশুদের তথ্য সুরক্ষা',
          paragraphs: [
            'ডিফেন্স ২৪ বিডি জেনেশুনে ১৩ বছরের কম বয়সী কোনো শিশুর ব্যক্তিগত তথ্য সংগ্রহ করে না। কোনো অভিভাবকের যদি মনে হয় যে তার সন্তান আমাদের সাইটে ব্যক্তিগত তথ্য প্রদান করেছে, তবে আমাদের সাথে যোগাযোগ করলে আমরা তাৎক্ষণিকভাবে তা মুছে ফেলব।',
          ],
        },
      ],
    },
  },
  terms: {
    en: {
      kicker: 'Reader Agreement & Editorial Usage Rules',
      title: 'Terms and Conditions',
      lastUpdated: 'Last Updated: November 8, 2026',
      lead: 'Welcome to Defence 24 BD. By accessing and reading this website, you agree to comply with and be bound by the following Terms and Conditions of Use.',
      sections: [
        {
          heading: '1. Intellectual Property Rights',
          paragraphs: [
            'Unless otherwise stated, Defence 24 BD and/or its editorial licensors own the intellectual property rights for all original articles, curated recruitment summaries, graphics, and site layout.',
            'You may view, download for caching purposes only, and print pages or recruitment checklists from the website for your own personal, non-commercial educational use, subject to the restrictions set out below.',
          ],
        },
        {
          heading: '2. Restrictions on Republishing',
          paragraphs: [
            'You must not republish material from Defence 24 BD verbatim on another commercial website without explicit attribution and a canonical hyperlink back to the original article.',
            'You must not sell, rent, or sub-license material from the website, nor use our brand name or logo to misrepresent yourself as an official government recruitment agent.',
          ],
        },
        {
          heading: '3. Recruitment Circular Verification Responsibility',
          paragraphs: [
            'While our editorial desk summarizes official job circulars with extreme care, candidates applying for positions in the Bangladesh Army, Navy, Air Force, Police, Ansar, BGB, Coast Guard, or Fire Service must always submit their applications directly through the official government portals cited in each notice.',
            'Defence 24 BD never charges fees for recruitment information and never acts as a middleman in any selection process.',
          ],
        },
        {
          heading: '4. Governing Law',
          paragraphs: [
            'These terms and conditions are governed by and construed in accordance with the laws of the People’s Republic of Bangladesh, and you irrevocably submit to the exclusive jurisdiction of the courts in Dhaka.',
          ],
        },
      ],
    },
    bn: {
      kicker: 'পাঠক চুক্তি ও ওয়েবসাইট ব্যবহারের নিয়মাবলি',
      title: 'ব্যবহারের শর্তাবলি',
      lastUpdated: 'সর্বশেষ হালনাগাদ: ৮ নভেম্বর ২০২৬',
      lead: 'ডিফেন্স ২৪ বিডি-তে আপনাকে স্বাগতম। এই ওয়েবসাইটটি ব্রাউজ ও ব্যবহার করার মাধ্যমে আপনি নিম্নোক্ত শর্তাবলি মেনে চলতে সম্মতি প্রদান করছেন।',
      sections: [
        {
          heading: '১. মেধাস্বত্ব ও কপিরাইট অধিকার',
          paragraphs: [
            'বিশেষভাবে উল্লেখ না থাকলে, ডিফেন্স ২৪ বিডি-তে প্রকাশিত সকল মৌলিক প্রতিবেদন, নিয়োগ বিজ্ঞপ্তির বিশ্লেষণ, গ্রাফিক্স এবং ওয়েবসাইট কাঠামোর মেধাস্বত্ব সংরক্ষিত।',
            'পাঠকগণ শুধুমাত্র ব্যক্তিগত ও অ-বাণিজ্যিক শিক্ষা বা প্রস্তুতির প্রয়োজনে এই ওয়েবসাইটের নিবন্ধ বা নিয়োগ নির্দেশিকা প্রিন্ট ও সংরক্ষণ করতে পারবেন।',
          ],
        },
        {
          heading: '২. পুনঃপ্রকাশ সংক্রান্ত বিধিনিষেধ',
          paragraphs: [
            'ডিফেন্স ২৪ বিডি-এর লিখিত অনুমতি ও মূল প্রতিবেদনের সূত্র উল্লেখ ব্যতীত কোনো নিবন্ধ হুবহু অন্য কোনো বাণিজ্যিক ওয়েবসাইট বা পোর্টালে পুনঃপ্রকাশ করা সম্পূর্ণ নিষিদ্ধ।',
            'আমাদের নাম বা লোগো ব্যবহার করে কোনো ধরনের আর্থিক লেনদেন বা নিয়োগ সহায়তার দাবি করা আইনত দণ্ডনীয়।',
          ],
        },
        {
          heading: '৩. নিয়োগ বিজ্ঞপ্তির আবেদন সংক্রান্ত নির্দেশনা',
          paragraphs: [
            'আমাদের সম্পাদনা দল সর্বোচ্চ সতর্কতার সাথে সরকারি নিয়োগ বিজ্ঞপ্তির সারসংক্ষেপ প্রকাশ করে। তথাপি বাংলাদেশ সেনাবাহিনী, নৌবাহিনী, বিমান বাহিনী, পুলিশ, আনসার, বিজিবি, কোস্ট গার্ড বা ফায়ার সার্ভিসে আবেদনকারী প্রার্থীদের অবশ্যই সংশ্লিষ্ট বাহিনীর দাপ্তরিক সরকারি ওয়েবসাইটে প্রবেশ করে আবেদন সম্পন্ন করতে হবে।',
            'ডিফেন্স ২৪ বিডি কখনোই কোনো নিয়োগ প্রক্রিয়ার সাথে প্রত্যক্ষভাবে যুক্ত নয় এবং কোনো প্রার্থীর নিকট হতে অর্থ বা আবেদন ফি গ্রহণ করে না।',
          ],
        },
        {
          heading: '৪. প্রযোজ্য আইন ও বিচারিক এখতিয়ার',
          paragraphs: [
            'এই শর্তাবলি গণপ্রজাতন্ত্রী বাংলাদেশের প্রচলিত আইন দ্বারা পরিচালিত ও নিয়ন্ত্রিত হবে এবং যেকোনো আইনি বিরোধ নিষ্পত্তির ক্ষেত্রে ঢাকার আদালতের এখতিয়ার চূড়ান্ত বলে গণ্য হবে।',
          ],
        },
      ],
    },
  },
  disclaimer: {
    en: {
      kicker: 'Official Non-Affiliation & Public Notice',
      title: 'Disclaimer',
      lastUpdated: 'Last Updated: November 8, 2026',
      lead: 'Important Public Notice: Defence 24 BD is an independent news and educational information portal. We are NOT an official website of the Government of Bangladesh, the Armed Forces Division, the Inter-Services Public Relations (ISPR) Directorate, or any law enforcement agency.',
      sections: [
        {
          heading: '1. Non-Affiliation Statement',
          paragraphs: [
            'All institutional names—including Bangladesh Army, Bangladesh Navy, Bangladesh Air Force, Bangladesh Police, Bangladesh Ansar & VDP, Border Guard Bangladesh (BGB), Bangladesh Coast Guard, and Fire Service & Civil Defence—are referenced strictly for journalistic reporting, educational awareness, and public-interest recruitment coverage.',
            'Official government portals always end in `.mil.bd`, `.gov.bd`, or `.teletalk.com.bd`. Readers are advised never to confuse our independent news portal with an official government command website.',
          ],
        },
        {
          heading: '2. Accuracy of Recruitment Circulars',
          paragraphs: [
            'The job circulars and eligibility summaries published on Defence 24 BD are compiled in good faith from official press releases, national daily newspapers, and verified government websites to help aspirants understand requirements clearly in English and Bangla.',
            'In the event of any discrepancy between a summary on this portal and the official government gazette or circular, the terms published on the respective force’s official website shall prevail.',
          ],
        },
        {
          heading: '3. Financial & Anti-Fraud Warning',
          paragraphs: [
            'Recruitment into the armed forces and police services of Bangladesh is conducted strictly on merit and transparency. Defence 24 BD strongly cautions candidates and guardians against engaging with any third-party brokers or financial intermediaries claiming to influence recruitment.',
          ],
        },
        {
          heading: '4. Corrections & Takedown Requests',
          paragraphs: [
            'If any public relations officer, institution, or reader identifies a factual inaccuracy in our reporting, please notify our Editorial Desk at mostak4526159@gmail.com. Verified corrections are published within 24 hours.',
          ],
        },
      ],
    },
    bn: {
      kicker: 'দাপ্তরিক অ-সংশ্লিষ্টতা ও জনস্বার্থ ঘোষণা',
      title: 'দাবি পরিত্যাগ',
      lastUpdated: 'সর্বশেষ হালনাগাদ: ৮ নভেম্বর ২০২৬',
      lead: 'গুরুত্বপূর্ণ ঘোষণা: ডিফেন্স ২৪ বিডি একটি সম্পূর্ণ স্বাধীন সংবাদ ও শিক্ষামূলক তথ্য পোর্টাল। এটি গণপ্রজাতন্ত্রী বাংলাদেশ সরকার, সশস্ত্র বাহিনী বিভাগ, আন্তঃবাহিনী জনসংযোগ পরিদপ্তর (আইএসপিআর) কিংবা কোনো আইনশৃঙ্খলা বাহিনীর দাপ্তরিক ওয়েবসাইট নয়।',
      sections: [
        {
          heading: '১. সরকারি বাহিনীর সাথে অ-সংশ্লিষ্টতার ঘোষণা',
          paragraphs: [
            'এই পোর্টালে উল্লিখিত বাংলাদেশ সেনাবাহিনী, বাংলাদেশ নৌবাহিনী, বাংলাদেশ বিমান বাহিনী, বাংলাদেশ পুলিশ, আনসার ও ভিডিপি, বিজিবি, কোস্ট গার্ড এবং ফায়ার সার্ভিসের নাম শুধুমাত্র বস্তুনিষ্ঠ সংবাদ পরিবেশন এবং জনস্বার্থে নিয়োগ বিজ্ঞপ্তির তথ্য প্রচারের উদ্দেশ্যে ব্যবহৃত হয়েছে।',
            'সরকারি বাহিনীসমূহের দাপ্তরিক ওয়েবসাইট সর্বদা `.mil.bd`, `.gov.bd` অথবা `.teletalk.com.bd` ডোমেইন যুক্ত থাকে। আমাদের স্বাধীন সংবাদ পোর্টালকে কোনো সরকারি দপ্তরের অফিসিয়াল ওয়েবসাইট হিসেবে গণ্য না করার জন্য পাঠকদের বিশেষভাবে অনুরোধ করা হচ্ছে।',
          ],
        },
        {
          heading: '২. নিয়োগ বিজ্ঞপ্তির তথ্যের সঠিকতা',
          paragraphs: [
            'চাকরিপ্রার্থীদের সুবিধার্থে সরকারি গেজেট, জাতীয় দৈনিক পত্রিকা এবং সংশ্লিষ্ট বাহিনীর অফিসিয়াল পোর্টাল থেকে তথ্য সংগ্রহ করে সহজ বাংলা ও ইংরেজিতে নিয়োগ বিজ্ঞপ্তির সারসংক্ষেপ প্রকাশ করা হয়।',
            'মুদ্রণজনিত কোনো ত্রুটি বা তথ্যের অমিল পরিলক্ষিত হলে সংশ্লিষ্ট বাহিনীর মূল দাপ্তরিক বিজ্ঞপ্তির তথ্যই চূড়ান্ত বলে গণ্য হবে।',
          ],
        },
        {
          heading: '৩. আর্থিক লেনদেন ও প্রতারণা বিষয়ে সতর্কবার্তা',
          paragraphs: [
            'বাংলাদেশের প্রতিরক্ষা ও আইনশৃঙ্খলা বাহিনীতে নিয়োগ প্রক্রিয়া সম্পূর্ণ মেধা ও যোগ্যতার ভিত্তিতে সম্পন্ন হয়। নিয়োগের প্রলোভন দেখিয়ে কোনো ব্যক্তি বা অসাধু চক্রের সাথে আর্থিক লেনদেন না করার জন্য প্রার্থী ও অভিভাবকদের সতর্ক করা হচ্ছে।',
          ],
        },
        {
          heading: '৪. তথ্য সংশোধন ও মতামত নীতি',
          paragraphs: [
            'আমাদের প্রকাশিত কোনো প্রতিবেদনে তথ্যগত অসঙ্গতি পরিলক্ষিত হলে mostak4526159@gmail.com ঠিকানায় জানানোর অনুরোধ করা হচ্ছে। যাচাই সাপেক্ষে ২৪ ঘণ্টার মধ্যে প্রয়োজনীয় সংশোধনী প্রকাশ করা হয়।',
          ],
        },
      ],
    },
  },
  corrections_policy: {
    en: {
      kicker: 'Factual Accuracy, Accountability & Revision Protocol',
      title: 'Corrections Policy',
      lastUpdated: 'Last Updated: November 8, 2026',
      lead: 'Defence 24 BD is committed to the highest standards of factual accuracy across all defense, national security, peacekeeping, and official recruitment dispatches. When an error occurs, we correct it promptly, transparently, and permanently in both our English and Bengali editions.',
      sections: [
        {
          heading: '1. Our Commitment to Factual Accuracy',
          paragraphs: [
            'Because our readers rely on Defence 24 BD for critical defense developments and official force recruitment timelines, accuracy is our paramount responsibility. Every article and recruitment circular summary is cross-checked against primary releases from the Inter-Services Public Relations (ISPR) Directorate, government gazettes, and official service portals prior to publication.',
            'However, if a factual error, typographical mistake in a circular date, or outdated eligibility figure is discovered after publication, our editorial team acts immediately to verify and rectify the record.',
          ],
        },
        {
          heading: '2. How Readers & Institutions Can Report an Error',
          paragraphs: [
            'Readers, defense public relations officers, and institutional representatives are encouraged to report suspected factual errors directly to our Editorial Desk via email at mostak4526159@gmail.com or through our official Contact Us page at https://defence24.netlify.app/contact.',
            'To help our editors verify the request quickly, please include the article headline or URL, the specific statement or figure in question, and a verifiable reference or official circular link supporting the correction.',
          ],
        },
        {
          heading: '3. Transparent Correction & Clarification Procedure',
          paragraphs: [
            'Substantive Factual Corrections: When a factual error in a headline, body text, or recruitment circular summary is confirmed, we update the article immediately and append a dated "Editorial Correction Note" at the bottom of the report explaining what was changed and why.',
            'Clarifications & Updates: When new official information emerges—such as an extended application deadline issued by the Bangladesh Army, Navy, Air Force, Police, BGB, or Ansar—we add an "Updated Dispatch Note" with the timestamp while preserving the context of the original report.',
            'Minor Typographical Edits: Minor spelling, grammar, or formatting adjustments that do not alter the factual meaning of the report are corrected silently to maintain readability.',
          ],
        },
        {
          heading: '4. Bilingual Synchronization & Archival Integrity',
          paragraphs: [
            'Whenever a factual correction is issued on Defence 24 BD, our editorial desk simultaneously updates both the Bengali and English versions of the dispatch so readers in both languages receive identical, accurate information.',
            'We do not silently delete published articles to conceal errors. Retractions are reserved strictly for extraordinary cases where an entire report is found to be unsubstantiated, in which case a transparent retraction notice replaces the text in compliance with Google News and Google AdSense publisher standards.',
          ],
        },
      ],
    },
    bn: {
      kicker: 'তথ্যগত নির্ভুলতা, জবাবদিহিতা ও সংশোধন বিধিমালা',
      title: 'সংশোধনী নীতিমালা',
      lastUpdated: 'সর্বশেষ হালনাগাদ: ৮ নভেম্বর ২০২৬',
      lead: 'ডিফেন্স ২৪ বিডি প্রতিরক্ষা, জাতীয় নিরাপত্তা, শান্তিরক্ষা মিশন এবং দাপ্তরিক নিয়োগ বিজ্ঞপ্তি সংক্রান্ত প্রতিটি প্রতিবেদনে সর্বোচ্চ তথ্যগত নির্ভুলতা বজায় রাখতে অঙ্গীকারবদ্ধ। প্রকাশিত কোনো সংবাদে অনিচ্ছাকৃত তথ্যগত ত্রুটি পরিলক্ষিত হলে আমরা দ্রুততম সময়ে, স্বচ্ছতার সাথে এবং স্থায়ীভাবে বাংলা ও ইংরেজি উভয় সংস্করণে তা সংশোধন করি।',
      sections: [
        {
          heading: '১. নির্ভুল তথ্যের প্রতি আমাদের অঙ্গীকার',
          paragraphs: [
            'আমাদের পাঠক ও চাকরিপ্রার্থীগণ প্রতিরক্ষা খাতের গুরুত্বপূর্ণ সংবাদ এবং বিভিন্ন বাহিনীর নিয়োগ বিজ্ঞপ্তির সময়সূচির জন্য ডিফেন্স ২৪ বিডি-এর ওপর আস্থা রাখেন। তাই প্রতিটি প্রতিবেদন প্রকাশের পূর্বে আন্তঃবাহিনী জনসংযোগ পরিদপ্তর (আইএসপিআর), সরকারি গেজেট এবং সংশ্লিষ্ট বাহিনীর দাপ্তরিক পোর্টালের মূল বিজ্ঞপ্তির সাথে মিলিয়ে যাচাই করা হয়।',
            'তথাপি প্রকাশের পর কোনো প্রতিবেদনে তথ্যগত ভুল, তারিখের অসঙ্গতি কিংবা শিক্ষাগত যোগ্যতার বিবরণীতে কোনো ত্রুটি ধরা পড়লে আমাদের সম্পাদনা পর্ষদ তাৎক্ষণিকভাবে তা যাচাই ও সংশোধনের পদক্ষেপ গ্রহণ করে।',
          ],
        },
        {
          heading: '২. তথ্যগত ত্রুটি জানানোর নিয়ম',
          paragraphs: [
            'যেকোনো পাঠক, জনসংযোগ কর্মকর্তা অথবা সংশ্লিষ্ট প্রতিষ্ঠানের প্রতিনিধি প্রকাশিত কোনো সংবাদের তথ্যগত ত্রুটি সম্পর্কে আমাদের অবহিত করতে পারেন। এজন্য সরাসরি mostak4526159@gmail.com ঠিকানায় ইমেইল পাঠাতে পারেন অথবা আমাদের ওয়েবসাইটের https://defence24.netlify.app/contact পাতার মাধ্যমে বার্তা পাঠাতে পারেন।',
            'দ্রুত যাচাইয়ের সুবিধার্থে অনুগ্রহ করে সংবাদের শিরোনাম বা লিংক, যে তথ্যটি সংশোধন করা প্রয়োজন তার বিবরণ এবং সমর্থনযোগ্য দাপ্তরিক সূত্র বা বিজ্ঞপ্তির তথ্য উল্লেখ করার অনুরোধ করা হচ্ছে।',
          ],
        },
        {
          heading: '৩. স্বচ্ছ সংশোধন ও হালনাগাদ প্রক্রিয়া',
          paragraphs: [
            'মৌলিক তথ্যগত সংশোধন: কোনো সংবাদের শিরোনাম, মূল অংশ বা নিয়োগ বিজ্ঞপ্তির তথ্যে গুরুত্বপূর্ণ ভুল প্রমাণিত হলে আমরা অবিলম্বে মূল লেখাটি সংশোধন করি এবং প্রতিবেদনের নিচে সংশোধনের তারিখ ও সময়সহ একটি স্পষ্ট "সম্পাদকীয় সংশোধনী নোট" সংযোজন করি।',
            'তথ্য হালনাগাদ ও স্পষ্টীকরণ: কোনো বাহিনী (যেমন বাংলাদেশ সেনাবাহিনী, নৌবাহিনী, বিমান বাহিনী, পুলিশ, বিজিবি বা আনসার) যদি পরবর্তীতে আবেদনের সময়সীমা বৃদ্ধি করে বা নতুন নির্দেশনা দেয়, তবে আমরা প্রতিবেদনে "হালনাগাদ তথ্য" হিসেবে তারিখসহ তা যুক্ত করি।',
            'বানান ও মুদ্রণজনিত সংশোধন: যেসব সাধারণ বানান বা ব্যাকরণগত ত্রুটি সংবাদের মূল অর্থ পরিবর্তন করে না, পাঠকের পাঠযোগ্যতা বজায় রাখতে সেগুলো সরাসরি পরিমার্জন করা হয়।',
          ],
        },
        {
          heading: '৪. দ্বিভাষিক সমন্বয় ও আর্কাইভের স্বচ্ছতা',
          paragraphs: [
            'ডিফেন্স ২৪ বিডি-তে কোনো তথ্য সংশোধন করা হলে আমাদের সম্পাদনা পর্ষদ একই সাথে বাংলা এবং ইংরেজি উভয় সংস্করণের প্রতিবেদনটি হালনাগাদ করে, যাতে উভয় ভাষার পাঠক অভিন্ন ও সঠিক তথ্য পান।',
            'ভুল আড়াল করার উদ্দেশ্যে আমরা কোনো প্রকাশিত প্রতিবেদন নীরবে মুছে ফেলি না। Google News এবং Google AdSense-এর প্রকাশক নীতিমালা অনুসরণ করে আমরা প্রতিটি সংশোধনীতে পূর্ণ স্বচ্ছতা ও সাংবাদিকতার নৈতিক মানদণ্ড বজায় রাখি।',
          ],
        },
      ],
    },
  },
};

export const UI_STRINGS: Record<Language, Record<string, string>> = {
  en: {
    siteName: 'Defence 24 BD',
    siteSubtitle: 'Premium International & National Defense, Security & Official Recruitment Portal',
    editionLabel: 'English Edition',
    langChangeLabel: 'Language Change',
    switchLangBtn: 'বাংলা',
    sourceLabel: 'Source',
    themeLightLabel: 'Light Mode',
    themeDarkLabel: 'Dark Mode',
    navHome: 'Home',
    navArmy: 'Bangladesh Army',
    navNavy: 'Bangladesh Navy',
    navAirForce: 'Bangladesh Air Force',
    navCirculars: 'Recruitment Circulars',
    navSubmitNews: 'Submit News',
    adminBtn: 'Admin Portal',
    tickerLabel: 'Breaking & Notices',
    emergencyNoticeLabel: 'Emergency Notice',
    leadStoryKicker: 'Lead Defense Dispatch',
    secondaryKicker: 'Featured Force Reports',
    latestCircularsHeading: 'Latest Official Recruitment Circulars',
    latestCircularsSub: 'Verified summaries of active recruitment notices across Armed Forces and Public Security Services.',
    viewAllCirculars: 'View All Circulars',
    categoryFilterHeading: 'All 15 Defense & Security Categories',
    allForcesTab: 'All Categories (15)',
    readFullStory: 'Read Full Report',
    viewCircularDetails: 'View Circular & Apply Guide',
    deadlineLabel: 'Application Deadline',
    positionLabel: 'Position / Course',
    qualificationLabel: 'Qualification',
    ageLimitLabel: 'Age Limit',
    referenceLabel: 'Circular Ref',
    officialPortalLabel: 'Official Application Portal',
    publishedLabel: 'Published',
    backToFrontpage: 'Back to Front Page',
    keyFactsTitle: 'Verified Dispatch Highlights',
    relatedStoriesTitle: 'More Reports in This Sector',
    adSlotLabel: 'Advertisement · Distinguished Ad Unit',
    adSlotBody: 'Responsive Display Advertisement Slot — Clearly separated from editorial content in compliance with Google Publisher Policies.',
    footerAboutTitle: 'Editorial Mandate & Ownership',
    footerAboutBody: 'Defence 24 BD is an independent defense, peacekeeping, and public service news portal. We are not affiliated with ISPR or any government agency. All content is original and verified.',
    footerCategoriesTitle: 'Force & News Categories',
    footerLegalTitle: 'Policy & Institutional Pages',
    footerAboutLink: 'About Us',
    footerContactLink: 'Contact Us',
    footerPrivacyLink: 'Privacy Policy',
    footerTermsLink: 'Terms and Conditions',
    footerDisclaimerLink: 'Disclaimer',
    footerEditorialLink: 'Editorial Policy',
    footerCorrectionsLink: 'Corrections Policy',
    footerSubmitNewsLink: 'Submit News Report',
    footerAdminLink: 'Authorized Admin Login',
    footerCopyright: '© 2026 Defence 24 BD. Original Journalism · All Rights Reserved.',
    searchPlaceholder: 'Search by headline, organization, circular, date, or keyword...',
    filterByOrgLabel: 'All Organizations',
    filterByDateLabel: 'Any Date',
    noSearchResults: 'No dispatches matched your search criteria.',
    clearFilter: 'Reset All Filters',
    contactKicker: 'Newsroom Desk & Reader Inquiries',
    contactTitle: 'Contact Defence 24 BD',
    contactLead: 'Have a press release, recruitment circular query, or factual correction? Reach our Dhaka editorial desk directly.',
    contactNameLabel: 'Your Full Name',
    contactEmailLabel: 'Email Address',
    contactSubjectLabel: 'Inquiry Department',
    contactSubjectOpt1: 'Editorial Desk / News Tip',
    contactSubjectOpt2: 'Recruitment Circular Clarification',
    contactSubjectOpt3: 'Correction or Policy Inquiry',
    contactSubjectOpt4: 'Advertising & Institutional Partnership',
    contactMessageLabel: 'Your Message',
    contactSubmitBtn: 'Send Message to Editorial Desk',
    contactSuccessMsg: 'Thank you. Your message has been logged with the Defence 24 BD Editorial Desk. We respond within 24 business hours.',
    officeAddressTitle: 'Editorial Office Address',
    officeAddressValue: 'House 42, Road 7, Sector 4, Uttara Model Town, Dhaka-1230, Bangladesh',
    officeEmailTitle: 'Official Email Contacts',
    officeHoursTitle: 'Newsroom Desk Hours',
    officeHoursValue: 'Sunday – Thursday: 09:00 AM – 08:00 PM (BST)',
  },
  bn: {
    siteName: 'ডিফেন্স ২৪ বিডি',
    siteSubtitle: 'জাতীয় ও আন্তর্জাতিক প্রতিরক্ষা, জননিরাপত্তা ও দাপ্তরিক নিয়োগ সংবাদ পোর্টাল',
    editionLabel: 'বাংলা সংস্করণ',
    langChangeLabel: 'ভাষা পরিবর্তন',
    switchLangBtn: 'English',
    sourceLabel: 'তথ্যসূত্র',
    themeLightLabel: 'লাইট মোড',
    themeDarkLabel: 'ডার্ক মোড',
    navHome: 'প্রচ্ছদ',
    navArmy: 'বাংলাদেশ সেনাবাহিনী',
    navNavy: 'বাংলাদেশ নৌবাহিনী',
    navAirForce: 'বাংলাদেশ বিমান বাহিনী',
    navCirculars: 'নিয়োগ বিজ্ঞপ্তি',
    navSubmitNews: 'সংবাদ পাঠান',
    adminBtn: 'অ্যাডমিন প্যানেল',
    tickerLabel: 'ব্রেকিং ও নোটিশ',
    emergencyNoticeLabel: 'জরুরি বিজ্ঞপ্তি',
    leadStoryKicker: 'প্রধান প্রতিরক্ষা প্রতিবেদন',
    secondaryKicker: 'বিশেষ বাহিনীর সংবাদ',
    latestCircularsHeading: 'সর্বশেষ দাপ্তরিক নিয়োগ বিজ্ঞপ্তি',
    latestCircularsSub: 'সশস্ত্র বাহিনী ও আইনশৃঙ্খলা বাহিনীতে চলমান নিয়োগ বিজ্ঞপ্তির যাচাইকৃত সারসংক্ষেপ ও আবেদন নির্দেশিকা।',
    viewAllCirculars: 'সকল বিজ্ঞপ্তি দেখুন',
    categoryFilterHeading: 'সকল ১৫টি প্রতিরক্ষা ও সংবাদ বিভাগ',
    allForcesTab: 'সকল বিভাগ (১৫)',
    readFullStory: 'বিস্তারিত প্রতিবেদন পড়ুন',
    viewCircularDetails: 'বিজ্ঞপ্তির বিস্তারিত ও আবেদন নিয়ম',
    deadlineLabel: 'আবেদনের শেষ তারিখ',
    positionLabel: 'পদের নাম / কোর্স',
    qualificationLabel: 'শিক্ষাগত যোগ্যতা',
    ageLimitLabel: 'বয়সসীমা',
    referenceLabel: 'স্মারক নম্বর',
    officialPortalLabel: 'দাপ্তরিক আবেদন ওয়েবসাইট',
    publishedLabel: 'প্রকাশিত',
    backToFrontpage: 'প্রচ্ছদে ফিরে যান',
    keyFactsTitle: 'প্রতিবেদনের মূল তথ্যসূত্র',
    relatedStoriesTitle: 'এই বিভাগের আরও সংবাদ',
    adSlotLabel: 'বিজ্ঞাপন স্থান · সুস্পষ্টভাবে পৃথক বিজ্ঞাপন ইউনিট',
    adSlotBody: 'রেসপনসিভ ডিসপ্লে অ্যাড ইউনিট — গুগল প্রকাশক নীতিমালা অনুসরণ করে মূল সংবাদ থেকে স্পষ্টভাবে পৃথক রাখা হয়েছে।',
    footerAboutTitle: 'সম্পাদকীয় অঙ্গীকার ও মালিকানা',
    footerAboutBody: 'ডিফেন্স ২৪ বিডি একটি স্বাধীন প্রতিরক্ষা, শান্তিরক্ষা ও জনসেবামূলক সংবাদ পোর্টাল। এটি আইএসপিআর বা কোনো সরকারি দপ্তরের দাপ্তরিক ওয়েবসাইট নয়। আমাদের সকল প্রতিবেদন মৌলিক ও যাচাইকৃত।',
    footerCategoriesTitle: 'বাহিনী ও সংবাদ বিভাগসমূহ',
    footerLegalTitle: 'নীতিমালা ও প্রাতিষ্ঠানিক পাতা',
    footerAboutLink: 'আমাদের সম্পর্কে',
    footerContactLink: 'যোগাযোগ',
    footerPrivacyLink: 'গোপনীয়তা নীতি',
    footerTermsLink: 'ব্যবহারের শর্তাবলি',
    footerDisclaimerLink: 'দাবি পরিত্যাগ',
    footerEditorialLink: 'সম্পাদকীয় নীতিমালা',
    footerCorrectionsLink: 'সংশোধনী নীতিমালা',
    footerSubmitNewsLink: 'সংবাদ জমা দিন',
    footerAdminLink: 'অনুমোদিত অ্যাডমিন লগইন',
    footerCopyright: '© ২০২৬ ডিফেন্স ২৪ বিডি। মৌলিক সাংবাদিকতা · সর্বস্বত্ব সংরক্ষিত।',
    searchPlaceholder: 'শিরোনাম, বাহিনী, নিয়োগ বিজ্ঞপ্তি, তারিখ বা মূল শব্দ দিয়ে খুঁজুন...',
    filterByOrgLabel: 'সকল বাহিনী ও সংস্থা',
    filterByDateLabel: 'যেকোনো তারিখ',
    noSearchResults: 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো প্রতিবেদন পাওয়া যায়নি।',
    clearFilter: 'ফিল্টার রিসেট করুন',
    contactKicker: 'বার্তা কক্ষ ও পাঠক যোগাযোগ',
    contactTitle: 'ডিফেন্স ২৪ বিডি-তে যোগাযোগ করুন',
    contactLead: 'সংবাদ বিজ্ঞপ্তি পাঠানো, নিয়োগ তথ্যের জিজ্ঞাসা অথবা তথ্য সংশোধনের জন্য আমাদের ঢাকা বার্তা কক্ষে সরাসরি বার্তা পাঠান।',
    contactNameLabel: 'আপনার পূর্ণ নাম',
    contactEmailLabel: 'ইমেইল ঠিকানা',
    contactSubjectLabel: 'যোগাযোগের বিভাগ',
    contactSubjectOpt1: 'বার্তা বিভাগ / সংবাদের তথ্য',
    contactSubjectOpt2: 'নিয়োগ বিজ্ঞপ্তি সংক্রান্ত জিজ্ঞাসা',
    contactSubjectOpt3: 'তথ্য সংশোধন বা নীতিমালা জিজ্ঞাসা',
    contactSubjectOpt4: 'বিজ্ঞাপন ও প্রাতিষ্ঠানিক যোগাযোগ',
    contactMessageLabel: 'আপনার বিস্তারিত বার্তা',
    contactSubmitBtn: 'বার্তা কক্ষে পাঠান',
    contactSuccessMsg: 'ধন্যবাদ। আপনার বার্তাটি ডিফেন্স ২৪ বিডি বার্তা কক্ষে নিবন্ধিত হয়েছে। আমরা ২৪ কর্মঘণ্টার মধ্যে উত্তর প্রদান করি।',
    officeAddressTitle: 'বার্তা ও সম্পাদনা কার্যালয়',
    officeAddressValue: 'বাড়ি ৪২, সড়ক ৭, সেক্টর ৪, উত্তরা মডেল টাউন, ঢাকা-১২৩০, বাংলাদেশ',
    officeEmailTitle: 'দাপ্তরিক ইমেইল ঠিকানা',
    officeHoursTitle: 'বার্তা কক্ষের সময়সূচি',
    officeHoursValue: 'রবিবার – বৃহস্পতিবার: সকাল ০৯:০০ – রাত ০৮:০০ (বাংলাদেশ সময়)',
  },
};
