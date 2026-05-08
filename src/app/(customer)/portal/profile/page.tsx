'use client';

import { useState, useEffect } from 'react';
import {
  Building2, User, Mail, Bell, Loader2, Save, Pencil, X
} from 'lucide-react';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import { getCustomerSetting, saveCustomerSetting, updateCustomerProfile } from '@/lib/customer-db';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useCustomerAuth();

  // Notification settings
  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>({
    quotation_updates: true,
    document_review: true,
    shipment_tracking: true,
  });
  const [isSavingNotif, setIsSavingNotif] = useState<string | null>(null);
  const [isLoadingNotif, setIsLoadingNotif] = useState(true);

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const loadSettings = async () => {
        setIsLoadingNotif(true);
        const saved = await getCustomerSetting('notification', 'preferences', {
          quotation_updates: true,
          document_review: true,
          shipment_tracking: true,
        });
        setNotifSettings(saved);
        setIsLoadingNotif(false);
      };
      loadSettings();
    }
  }, [user?.id]);

  const startEdit = () => {
    setEditFullName(profile?.full_name || '');
    setEditCompany(profile?.company || '');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveProfile = async () => {
    if (!editCompany.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!editFullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    setIsSavingProfile(true);
    const result = await updateCustomerProfile(editFullName, editCompany);
    if (!result.success) {
      toast.error(result.error || 'Failed to save profile');
      setIsSavingProfile(false);
      return;
    }
    await refreshProfile();
    toast.success('Profile updated');
    setIsSavingProfile(false);
    setEditing(false);
  };

  const handleToggle = async (key: string) => {
    const newValue = !notifSettings[key];
    const newSettings = { ...notifSettings, [key]: newValue };
    setNotifSettings(newSettings);
    setIsSavingNotif(key);
    const success = await saveCustomerSetting('notification', 'preferences', newSettings);
    if (success) {
      toast.success('Settings updated');
    } else {
      toast.error('Failed to update settings');
      setNotifSettings(notifSettings);
    }
    setIsSavingNotif(null);
  };

  const displayName = profile?.full_name || 'Customer';
  const companyName = profile?.company || '-';
  const email = profile?.email || user?.email || '-';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'C';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account information and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-emerald-500 via-emerald-600 to-cyan-600 relative">
          <div className="absolute bottom-0 left-6 translate-y-1/2">
            <div className="w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl font-bold text-emerald-600 border-4 border-white">
              {initials}
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{companyName}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                  {profile?.role || 'customer'}
                </span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              </div>
            </div>
            {!editing && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Company Information */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm group transition-all hover:shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-emerald-500 transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            Company Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Company Name</label>
              {editing ? (
                <input
                  type="text"
                  value={editCompany}
                  onChange={e => setEditCompany(e.target.value)}
                  placeholder="Your company name"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <div className="text-sm text-gray-900 font-bold bg-slate-50 p-3 rounded-lg border border-slate-100">{companyName}</div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm group transition-all hover:shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-emerald-500 transition-colors">
              <User className="w-5 h-5" />
            </div>
            Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
              {editing ? (
                <input
                  type="text"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <div className="text-sm text-gray-900 font-bold bg-slate-50 p-3 rounded-lg border border-slate-100">{displayName}</div>
              )}
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <Mail className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-sm text-gray-900 font-medium">{email}</div>
            </div>
          </div>
        </div>

        {/* Save / Cancel row — only shown while editing */}
        {editing && (
          <div className="md:col-span-2 flex items-center justify-end gap-3">
            <button
              onClick={cancelEdit}
              disabled={isSavingProfile}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={isSavingProfile}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        )}

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm md:col-span-2 group transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-emerald-500 transition-colors">
                <Bell className="w-5 h-5" />
              </div>
              Notifications
            </h3>
            {isLoadingNotif && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { id: 'quotation_updates', label: 'Quotation Updates', desc: 'When a quotation status changes' },
              { id: 'document_review', label: 'Document Review', desc: 'When documents are approved/rejected' },
              { id: 'shipment_tracking', label: 'Shipment Tracking', desc: 'Real-time milestone notifications' },
            ].map((pref) => {
              const enabled = notifSettings[pref.id];
              const saving = isSavingNotif === pref.id;

              return (
                <div key={pref.id} className="flex flex-col justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-emerald-100 transition-all hover:bg-emerald-50/10">
                  <div className="mb-4">
                    <div className="text-sm font-bold text-gray-900">{pref.label}</div>
                    <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">{pref.desc}</div>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => handleToggle(pref.id)}
                      disabled={saving}
                      className={`w-12 h-6 rounded-full relative transition-all duration-300 ${enabled ? 'bg-emerald-500' : 'bg-gray-300'} ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 flex items-center justify-center ${enabled ? 'left-[26px]' : 'left-0.5'}`}>
                        {saving && <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400">Settings are automatically saved to your account</p>
      </div>
    </div>
  );
}
