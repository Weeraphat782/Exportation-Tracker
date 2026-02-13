'use client';

import Link from 'next/link';
import {
  FileCheck, FileText, Shield, ArrowRight, ArrowLeft,
  CheckCircle2, Clock, Eye, Upload, AlertTriangle,
  Sparkles, FolderOpen, ClipboardCheck, Globe,
  FileSpreadsheet, ChevronRight, Zap,
  Building2, Stamp, Leaf
} from 'lucide-react';

// ============ HERO ============
function CustomsHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 py-20 lg:py-28">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/site" className="inline-flex items-center gap-2 text-emerald-300 hover:text-white text-sm font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium">Customs & Documents</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              End-to-end{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                customs clearance
              </span>{' '}
              & document management
            </h1>

            <p className="text-lg text-emerald-100/80 leading-relaxed max-w-lg">
              From preparing TK forms and commercial invoices to GACP certifications and customs clearance — with AI-powered document verification that catches errors before submission.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/site/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/site/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                Talk to Expert
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold text-white">15+</div>
                <div className="text-xs text-emerald-300">Document Types</div>
              </div>
              <div className="w-px h-10 bg-emerald-700" />
              <div>
                <div className="text-2xl font-bold text-white">AI</div>
                <div className="text-xs text-emerald-300">Auto Verification</div>
              </div>
              <div className="w-px h-10 bg-emerald-700" />
              <div>
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-emerald-300">Digital Process</div>
              </div>
            </div>
          </div>

          {/* Document Visual */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 w-80">
                <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-emerald-400" /> Document Status
                </div>
                {[
                  { name: 'Commercial Invoice', status: 'Approved', color: 'emerald' },
                  { name: 'Packing List', status: 'Approved', color: 'emerald' },
                  { name: 'TK-10 Form', status: 'Under Review', color: 'blue' },
                  { name: 'GACP Certificate', status: 'Pending', color: 'amber' },
                  { name: 'Import Permit', status: 'Required', color: 'red' },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/10 last:border-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/90">{doc.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium bg-${doc.color}-500/20 text-${doc.color}-300`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ DOCUMENT CATEGORIES ============
function DocumentCategories() {
  const categories = [
    {
      icon: Building2,
      title: 'Company Information',
      color: 'sky',
      bgColor: 'bg-sky-50',
      iconColor: 'text-sky-600',
      docs: [
        { name: 'Company Registration', desc: 'Official business registration certificate from the Department of Business Development (DBD)' },
        { name: 'Company Declaration', desc: 'Power of attorney for export operations on behalf of the company' },
        { name: 'ID Card Copy', desc: 'Copy of the authorized signatory\'s national identification card' },
      ],
    },
    {
      icon: Stamp,
      title: 'Permits & TK Forms',
      color: 'violet',
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
      docs: [
        { name: 'TK-10 Form', desc: 'Import/export goods declaration form — available in Thai and English' },
        { name: 'TK-11 Form', desc: 'Import/export authorization application — available in Thai and English' },
        { name: 'TK-31 Form', desc: 'Export license application — available in Thai and English' },
        { name: 'TK-32 Form', desc: 'Import license application form' },
        { name: 'Import Permit', desc: 'Import permit issued by the destination country\'s authority' },
      ],
    },
    {
      icon: FileSpreadsheet,
      title: 'Shipping Documents',
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      docs: [
        { name: 'Commercial Invoice', desc: 'Invoice detailing prices, quantities, and descriptions of exported goods' },
        { name: 'Packing List', desc: 'Detailed list of package contents, weights, dimensions, and carton counts' },
        { name: 'Purchase Order', desc: 'Official purchase order from the importer at the destination' },
        { name: 'MSDS', desc: 'Material Safety Data Sheet for chemical or hazardous goods (if applicable)' },
      ],
    },
    {
      icon: Leaf,
      title: 'Thai GACP Certification',
      color: 'teal',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      docs: [
        { name: 'GACP Certificate (Standard)', desc: 'Thai Good Agricultural and Collection Practice standard certificate' },
        { name: 'GACP Certificate (Farm)', desc: 'Farm-level Thai GACP certificate for agricultural products' },
        { name: 'Farm Purchase Order', desc: 'Purchase order at the farm level for agricultural export goods' },
        { name: 'Farm Commercial Invoice', desc: 'Commercial invoice issued at the farm level' },
      ],
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full mb-4">
            <FolderOpen className="w-4 h-4" /> Document Categories
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Every document you need <span className="text-emerald-600">for export</span>
          </h2>
          <p className="text-gray-500 text-lg">
            Our system supports all export document categories — from company registration and TK forms to shipping documents and GACP certifications.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all overflow-hidden">
              {/* Header */}
              <div className={`${cat.bgColor} px-6 py-4 flex items-center gap-3`}>
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <cat.icon className={`w-5 h-5 ${cat.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{cat.title}</h3>
                </div>
                <div className="ml-auto">
                  <span className={`text-xs font-semibold ${cat.iconColor} bg-white px-2.5 py-1 rounded-full shadow-sm`}>
                    {cat.docs.length} types
                  </span>
                </div>
              </div>

              {/* Documents */}
              <div className="p-4 space-y-1">
                {cat.docs.map((doc, j) => (
                  <div key={j} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <FileText className={`w-4 h-4 ${cat.iconColor} shrink-0 mt-0.5`} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                      <div className="text-xs text-gray-500">{doc.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ AI DOCUMENT REVIEW ============
function AIReviewSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 text-violet-700 text-sm font-medium rounded-full mb-4">
                <Sparkles className="w-4 h-4" /> AI-Powered
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Automated document review <span className="text-violet-600">powered by AI</span>
              </h2>
              <p className="text-gray-500 text-lg">
                Our AI system analyzes uploaded documents, verifies data accuracy, checks figures and formats — and alerts you to issues before actual submission.
              </p>
            </div>

            <div className="space-y-5">
              {[
                {
                  icon: Eye,
                  title: 'Read & understand documents',
                  desc: 'AI reads PDF, Excel, and image files — extracting data for automated cross-checking and validation.',
                },
                {
                  icon: AlertTriangle,
                  title: 'Detect errors & discrepancies',
                  desc: 'Cross-reference data between documents — e.g., Invoice vs Packing List — checking weights, prices, and quantities.',
                },
                {
                  icon: ClipboardCheck,
                  title: 'Compliance verification',
                  desc: 'Verify that documents meet Thai customs requirements and destination country regulations, including required TK forms.',
                },
                {
                  icon: Zap,
                  title: 'Instant results',
                  desc: 'Get analysis results within seconds, with a clear report of what needs to be corrected — no waiting for manual review.',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Demo Visual */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-violet-100 to-emerald-100 rounded-3xl blur-2xl opacity-50" />
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-200" />
                  <span className="text-white font-semibold">AI Document Analysis</span>
                </div>
              </div>

              {/* Analysis Result */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium text-emerald-800">Commercial Invoice — Passed</div>
                    <div className="text-xs text-emerald-600">All data complete, prices match PO</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium text-emerald-800">Packing List — Passed</div>
                    <div className="text-xs text-emerald-600">Total weight: 850 kg, 6 pallets</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <div className="text-sm font-medium text-amber-800">TK-10 — Needs revision</div>
                    <div className="text-xs text-amber-600">Discrepancy found: item quantity doesn&apos;t match Invoice</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">GACP Certificate — Verifying</div>
                    <div className="text-xs text-blue-600">Checking against certification database</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Document completeness</span>
                    <span className="text-sm font-bold text-violet-600">75%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                    <div className="bg-gradient-to-r from-violet-500 to-emerald-500 h-2 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ DOCUMENT WORKFLOW ============
function WorkflowSection() {
  const steps = [
    {
      step: '01',
      icon: Upload,
      title: 'Upload documents',
      desc: 'Upload documents through the portal instantly — supports PDF, Excel, and images up to 10MB each.',
    },
    {
      step: '02',
      icon: Sparkles,
      title: 'AI auto-analysis',
      desc: 'Our AI checks document accuracy and completeness, delivering results within seconds.',
    },
    {
      step: '03',
      icon: Eye,
      title: 'Expert review',
      desc: 'Our specialists perform an additional review. Any corrections needed are communicated through the portal.',
    },
    {
      step: '04',
      icon: CheckCircle2,
      title: 'Approved & processed',
      desc: 'Verified documents are submitted for customs clearance. Track the entire process in real-time.',
    },
  ];

  const statusFlow = [
    { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Upload },
    { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
    { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full mb-4">
            <ClipboardCheck className="w-4 h-4" /> Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Fully <span className="text-emerald-600">digital</span> document workflow
          </h2>
          <p className="text-gray-500 text-lg">
            Everything is handled online — no physical documents, no office visits. Track your document status at any time.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((item, i) => (
            <div key={i} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-emerald-300 to-emerald-100" />
              )}

              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg border border-gray-100 mb-5">
                <item.icon className="w-8 h-8 text-emerald-600" />
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-600 rounded-lg text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {item.step}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Status Flow */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <h3 className="text-center font-bold text-gray-900 mb-6">Document Status Flow</h3>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {statusFlow.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${s.color} font-semibold text-sm`}>
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </div>
                {i < statusFlow.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Status updates in real-time — always visible through your Customer Portal.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============ CUSTOMS CLEARANCE SERVICE ============
function ClearanceSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-700 text-sm font-medium rounded-full mb-4">
            <Shield className="w-4 h-4" /> Customs Clearance
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Full-service <span className="text-sky-600">customs brokerage</span>
          </h2>
          <p className="text-gray-500 text-lg">
            Our expert team handles end-to-end export customs clearance — clearance costs are included in your quotation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: FileCheck,
              title: 'Document preparation & filing',
              desc: 'We prepare the Export Declaration and all required documents, filed electronically through the NSW system.',
              color: 'emerald',
            },
            {
              icon: Globe,
              title: 'Multi-agency coordination',
              desc: 'We liaise with Customs, FDA, and relevant regulatory bodies in both Thailand and the destination country.',
              color: 'sky',
            },
            {
              icon: Shield,
              title: 'Compliance verification',
              desc: 'Ensure your goods and documents meet all regulations for both Thai export and destination country import.',
              color: 'violet',
            },
            {
              icon: Stamp,
              title: 'TK form management',
              desc: 'Preparation and filing of all TK forms — TK-10, TK-11, TK-31, and TK-32 — based on your product requirements.',
              color: 'amber',
            },
            {
              icon: Leaf,
              title: 'GACP & certifications',
              desc: 'Processing of Thai GACP certificates, Certificate of Origin, Phytosanitary Certificates, and more.',
              color: 'teal',
            },
            {
              icon: Clock,
              title: 'Real-time status updates',
              desc: 'Track customs clearance progress through the portal — get notified instantly when your goods clear customs.',
              color: 'rose',
            },
          ].map((item, i) => (
            <div key={i} className={`bg-white rounded-xl border border-gray-100 hover:border-${item.color}-200 p-6 transition-all hover:shadow-lg group`}>
              <div className={`w-12 h-12 bg-${item.color}-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-6 h-6 text-${item.color}-600`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ CTA ============
function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Export documents made simple
        </h2>
        <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
          With AI-powered document review and our expert team, we handle your customs clearance from start to finish.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/site/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-lg"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/site/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
          >
            Ask About Documents
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============ PAGE ============
export default function CustomsDocumentsPage() {
  return (
    <>
      <CustomsHero />
      <DocumentCategories />
      <AIReviewSection />
      <WorkflowSection />
      <ClearanceSection />
      <CTASection />
    </>
  );
}
