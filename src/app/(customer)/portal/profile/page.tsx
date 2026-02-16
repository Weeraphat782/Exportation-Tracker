'use client';

import { useState, useEffect } from 'react';
import {
  Building2, User, Mail, Bell, Loader2
} from 'lucide-react';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import { getCustomerSetting, saveCustomerSetting } from '@/lib/customer-db';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { profile, user } = useCustomerAuth();

  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>({
    quotation_updates: true,
    document_review: true,
    shipment_tracking: true,
  });
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    if (user?.id) {
      const loadSettings = async () => {
        setIsLoading(true);
        const saved = await getCustomerSetting('notification', 'preferences', {
          quotation_updates: true,
          document_review: true,
          shipment_tracking: true,
        });
        setNotifSettings(saved);
        setIsLoading(false);
      };
      loadSettings();
    }
  }, [user?.id]);

  const handleToggle = async (key: string) => {
    const newValue = !notifSettings[key];
    const newSettings = { ...notifSettings, [key]: newValue };

    // Optimistic UI
    setNotifSettings(newSettings);
    setIsSaving(key);

    const success = await saveCustomerSetting('notification', 'preferences', newSettings);

    if (success) {
      toast.success('Settings updated');
    } else {
      toast.error('Failed to update settings');
      setNotifSettings(notifSettings);
    }

    setIsSaving(null);
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
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-emerald-500 via-emerald-600 to-cyan-600 relative">
          <div className="absolute bottom-0 left-6 translate-y-1/2">
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl font-bold text-emerald-600 border-4 border-white">
                {initials}
              </div>
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
              <div className="text-sm text-gray-900 font-bold bg-slate-50 p-3 rounded-lg border border-slate-100">{companyName}</div>
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
              <div className="text-sm text-gray-900 font-bold bg-slate-50 p-3 rounded-lg border border-slate-100">{displayName}</div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <Mail className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-sm text-gray-900 font-medium">{email}</div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm md:col-span-2 group transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-emerald-500 transition-colors">
                <Bell className="w-5 h-5" />
              </div>
              Notifications
            </h3>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { id: 'quotation_updates', label: 'Quotation Updates', desc: 'When a quotation status changes' },
              { id: 'document_review', label: 'Document Review', desc: 'When documents are approved/rejected' },
              { id: 'shipment_tracking', label: 'Shipment Tracking', desc: 'Real-time milestone notifications' },
            ].map((pref) => {
              const enabled = notifSettings[pref.id];
              const saving = isSaving === pref.id;

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
