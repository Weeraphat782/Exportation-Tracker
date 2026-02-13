'use client';

import Link from 'next/link';
import { ArrowLeft, MessageCircle, Mail } from 'lucide-react';

// ลูกค้าไม่สามารถสร้าง quotation เองได้ — staff เป็นคนสร้างให้
export default function NewQuotationPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/portal/quotations" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request a Quotation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Get in touch with our team for a new shipping quote</p>
        </div>
      </div>

      {/* Contact Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact Our Team</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          To request a new quotation, please contact our export team directly. 
          We&apos;ll prepare a detailed quote based on your requirements and assign it to your account.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="mailto:export@company.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Mail className="w-4 h-4" /> Email Us
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Our team typically responds within 2-4 hours during business hours.
        </p>
      </div>

      {/* Back */}
      <div className="text-center">
        <Link href="/portal/quotations" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          &larr; Back to quotations
        </Link>
      </div>
    </div>
  );
}
