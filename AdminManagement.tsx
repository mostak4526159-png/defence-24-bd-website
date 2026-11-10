import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Lock, 
  Mail, 
  User, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert,
  Activity,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Key
} from 'lucide-react';
import { 
  AuthorProfile, 
  AdminRole, 
  AdminPermission, 
  ALL_ADMIN_PERMISSIONS, 
  Language,
  DEFAULT_ROLE_PERMISSIONS 
} from '../../types/news.ts';

interface AdminManagementProps {
  lang: Language;
  authors: AuthorProfile[];
  currentUserEmail: string;
  onRefresh: () => Promise<void>;
  onCreateAdmin: (admin: any) => Promise<void>;
  onUpdateAdmin: (admin: AuthorProfile) => Promise<void>;
  onRemoveAdmin: (uid: string, email: string) => Promise<void>;
}

const PERMISSION_LABELS: Record<AdminPermission, { en: string; bn: string }> = {
  add_news: { en: 'Add News', bn: 'সংবাদ যোগ করা' },
  edit_news: { en: 'Edit News', bn: 'সংবাদ সম্পাদনা করা' },
  delete_news: { en: 'Delete News', bn: 'সংবাদ মুছে ফেলা' },
  publish_news: { en: 'Publish / Approve News', bn: 'সংবাদ প্রকাশ ও অনুমোদন' },
  manage_notices: { en: 'Manage Notices', bn: 'নোটিশ পরিচালনা' },
  manage_circulars: { en: 'Manage Circulars', bn: 'নিয়োগ বিজ্ঞপ্তি পরিচালনা' },
  upload_images: { en: 'Upload Images & Thumbnails', bn: 'ছবি ও থাম্বনেইল আপলোড' },
  manage_categories: { en: 'Manage Categories', bn: 'বিভাগ পরিচালনা' },
  manage_seo: { en: 'Manage SEO', bn: 'এসইও পরিচালনা' },
  manage_homepage: { en: 'Manage Homepage', bn: 'হোমপেজ পরিচালনা' },
  manage_header_footer: { en: 'Manage Header & Footer', bn: 'হেডার ও ফুটার পরিচালনা' },
  manage_ads: { en: 'Manage Advertisements', bn: 'বিজ্ঞাপন পরিচালনা' },
  manage_settings: { en: 'Manage Portal Settings', bn: 'পোর্টাল সেটিংস পরিচালনা' },
  manage_admins: { en: 'Manage Administrators', bn: 'অ্যাডমিন পরিচালনা' },
  view_logs: { en: 'View Activity Logs', bn: 'অ্যাক্টিভিটি লগ দেখা' },
  export_data: { en: 'Export Portal Data', bn: 'ডাটা এক্সপোর্ট' },
};

const ROLE_LABELS: Record<AdminRole, { en: string; bn: string }> = {
  super_admin: { en: 'Super Admin', bn: 'সুপার অ্যাডমিন' },
  admin: { en: 'Administrator', bn: 'প্রশাসক' },
  editor: { en: 'Editor', bn: 'সম্পাদক' },
  author: { en: 'Author', bn: 'প্রতিবেদক' },
  moderator: { en: 'Moderator', bn: 'পর্যালোচক' },
};

export const AdminManagement: React.FC<AdminManagementProps> = ({
  lang,
  authors,
  currentUserEmail,
  onRefresh,
  onCreateAdmin,
  onUpdateAdmin,
  onRemoveAdmin
}) => {
  const isEn = lang === 'en';
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('admin');
  const [newPermissions, setNewPermissions] = useState<AdminPermission[]>(DEFAULT_ROLE_PERMISSIONS.admin);

  const [editingUid, setEditingUid] = useState<string | null>(null);

  const handleTogglePermission = (perm: AdminPermission, current: AdminPermission[], set: (p: AdminPermission[]) => void) => {
    if (current.includes(perm)) {
      set(current.filter(p => p !== perm));
    } else {
      set([...current, perm]);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateAdmin({
        email: newEmail,
        password: newPassword,
        name: newName,
        role: newRole,
        permissions: newPermissions
      });
      setShowCreateForm(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewRole('admin');
      setNewPermissions(DEFAULT_ROLE_PERMISSIONS.admin);
    } catch (err: any) {
      setError(err.message || 'Failed to create administrator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (role: AdminRole) => {
    setNewRole(role);
    setNewPermissions(DEFAULT_ROLE_PERMISSIONS[role]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            {isEn ? 'Admin Management System' : 'অ্যাডমিন ম্যানেজমেন্ট সিস্টেম'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn 
              ? 'Create and manage administrator accounts, roles, and granular permissions.' 
              : 'অ্যাডমিন অ্যাকাউন্ট তৈরি, ভূমিকা এবং বিস্তারিত অনুমতি পরিচালনা করুন।'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20"
        >
          {showCreateForm ? <XCircle className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          {isEn ? 'Create New Admin' : 'নতুন অ্যাডমিন তৈরি'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-3">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {isEn ? 'Full Name' : 'পূর্ণ নাম'}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  placeholder={isEn ? "e.g. John Doe" : "উদাঃ আবদুল্লাহ আল মামুন"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {isEn ? 'Email Address' : 'ইমেইল ঠিকানা'}
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  placeholder="admin@defence24.netlify.app"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {isEn ? 'Initial Password' : 'প্রাথমিক পাসওয়ার্ড'}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {isEn ? 'System Role' : 'সিস্টেম রোল'}
                </label>
                <select
                  value={newRole}
                  onChange={e => handleRoleChange(e.target.value as AdminRole)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                >
                  <option value="super_admin">{ROLE_LABELS.super_admin[lang]}</option>
                  <option value="admin">{ROLE_LABELS.admin[lang]}</option>
                  <option value="editor">{ROLE_LABELS.editor[lang]}</option>
                  <option value="moderator">{ROLE_LABELS.moderator[lang]}</option>
                  <option value="author">{ROLE_LABELS.author[lang]}</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {isEn ? 'Granular Permissions' : 'বিস্তারিত অনুমতিসমূহ'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_ADMIN_PERMISSIONS.map(perm => (
                  <label key={perm} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={newPermissions.includes(perm)}
                      onChange={() => handleTogglePermission(perm, newPermissions, setNewPermissions)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {PERMISSION_LABELS[perm][lang]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isEn ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-wait"
              >
                {isSubmitting ? (isEn ? 'Creating...' : 'তৈরি হচ্ছে...') : (isEn ? 'Confirm & Create Account' : 'নিশ্চিত করুন ও অ্যাকাউন্ট তৈরি করুন')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isEn ? 'Administrator' : 'অ্যাডমিন'}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  {isEn ? 'Role' : 'ভূমিকা'}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                  {isEn ? 'Status' : 'অবস্থা'}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isEn ? 'Last Activity' : 'শেষ অ্যাক্টিভিটি'}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  {isEn ? 'Actions' : 'অ্যাকশন'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {authors.map(admin => {
                const isSelf = admin.email === currentUserEmail;
                const isSuperAdmin = admin.role === 'super_admin';
                const isSuspended = admin.status === 'suspended';

                return (
                  <tr key={admin.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          isSuperAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-slate-400'
                        }`}>
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {admin.name}
                            {isSelf && (
                              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] rounded uppercase font-black">
                                {isEn ? 'You' : 'আপনি'}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                        isSuperAdmin 
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {ROLE_LABELS[admin.role][lang]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${isSuspended ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                        <span className={`text-[11px] font-bold ${isSuspended ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isSuspended ? (isEn ? 'Suspended' : 'স্থগিত') : (isEn ? 'Active' : 'সক্রিয়')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Activity className="w-3 h-3" />
                          {admin.lastLoginIso 
                            ? new Date(admin.lastLoginIso).toLocaleString(isEn ? 'en-US' : 'bn-BD')
                            : (isEn ? 'No recent login' : 'লগইন তথ্য নেই')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isSelf && !isSuperAdmin && (
                          <>
                            <button
                              onClick={() => onUpdateAdmin({ ...admin, status: isSuspended ? 'active' : 'suspended' })}
                              className={`p-2 rounded-lg transition-colors ${
                                isSuspended 
                                  ? 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' 
                                  : 'text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                              }`}
                              title={isSuspended ? (isEn ? 'Activate' : 'সক্রিয় করুন') : (isEn ? 'Suspend' : 'স্থগিত করুন')}
                            >
                              {isSuspended ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => onRemoveAdmin(admin.uid, admin.email)}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title={isEn ? 'Remove Account' : 'অ্যাকাউন্ট মুছুন'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {authors.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              {isEn ? 'No administrator accounts found.' : 'কোনো অ্যাডমিন অ্যাকাউন্ট পাওয়া যায়নি।'}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              {isEn ? 'Security Best Practices' : 'নিরাপত্তা সংক্রান্ত পরামর্শ'}
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
            <li>{isEn ? 'Use unique passwords for each administrator.' : 'প্রতিটি অ্যাডমিনের জন্য আলাদা পাসওয়ার্ড ব্যবহার করুন।'}</li>
            <li>{isEn ? 'Enforce least privilege by choosing precise roles.' : 'নির্দিষ্ট রোল নির্বাচনের মাধ্যমে সীমিত অনুমতি প্রদান করুন।'}</li>
            <li>{isEn ? 'Regularly review administrator logs and active accounts.' : 'নিয়মিত অ্যাডমিন লগ এবং সক্রিয় অ্যাকাউন্টগুলো পর্যালোচনা করুন।'}</li>
            <li>{isEn ? 'Super Admin is the only role that can manage other admins.' : 'শুধুমাত্র সুপার অ্যাডমিন অন্য অ্যাডমিনদের পরিচালনা করতে পারেন।'}</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
              <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              {isEn ? 'System Status' : 'সিস্টেম স্ট্যাটাস'}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] uppercase font-black text-slate-400 mb-1">{isEn ? 'Total Admins' : 'মোট অ্যাডমিন'}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{authors.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] uppercase font-black text-slate-400 mb-1">{isEn ? 'Suspended' : 'স্থগিত'}</p>
              <p className="text-xl font-bold text-red-600">{authors.filter(a => a.status === 'suspended').length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
