'use client';

import {
  Building2, User, Mail, Shield, Bell, Key
} from 'lucide-react';
import { useCustomerAuth } from '@/contexts/customer-auth-context';

export default function ProfilePage() {
  const { profile, user } = useCustomerAuth();

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account information and settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium capitalize">
                  {profile?.role || 'customer'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Company Information */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-400" /> Company Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Company Name</label>
              <div className="text-sm text-gray-900 font-medium">{companyName}</div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" /> Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
              <div className="text-sm text-gray-900 font-medium">{displayName}</div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <div className="text-sm text-gray-900">{email}</div>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" /> Account Settings
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Password</div>
                  <div className="text-xs text-gray-500">Change your password</div>
                </div>
              </div>
              <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Change</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Email</div>
                  <div className="text-xs text-gray-500">{email}</div>
                </div>
              </div>
              <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Change</button>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" /> Notifications
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Quotation Updates', desc: 'When a quotation status changes', enabled: true },
              { label: 'Document Review', desc: 'When documents are approved/rejected', enabled: true },
              { label: 'Shipment Tracking', desc: 'Shipment milestone notifications', enabled: true },
            ].map((pref, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">{pref.label}</div>
                  <div className="text-xs text-gray-500">{pref.desc}</div>
                </div>
                <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${pref.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${pref.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
