'use client';

import Link from 'next/link';
import { 
  Plane, FileCheck, Package, ArrowRight, Globe, Shield, 
  Clock, CheckCircle2, Star, TrendingUp, Users, BarChart3,
  Container, Truck, FileText, Headphones, ChevronRight, Zap
} from 'lucide-react';

// ============ HERO SECTION ============
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 min-h-[600px] flex items-center">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-300 text-sm font-medium">Trusted Export Partner Since 2020</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Your{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                end-to-end
              </span>{' '}
              export logistics platform
            </h1>

            <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
              From factory floor to destination airport — we coordinate air freight, customs clearance, and documentation so you can focus on growing your business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/site/get-started"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-900/30 hover:shadow-xl hover:shadow-emerald-900/40 hover:-translate-y-0.5"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/site/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                Talk to an Expert
              </Link>
            </div>

            {/* Trust stats */}
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-xs text-gray-400">Shipments/Year</div>
              </div>
              <div className="w-px h-10 bg-gray-700" />
              <div>
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-xs text-gray-400">Countries</div>
              </div>
              <div className="w-px h-10 bg-gray-700" />
              <div>
                <div className="text-2xl font-bold text-white">99%</div>
                <div className="text-xs text-gray-400">On-time Delivery</div>
              </div>
            </div>
          </div>

          {/* Right: Dashboard Preview Card */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-2xl" />
              
              {/* Card */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-semibold text-sm">OMG Exp</span>
                  </div>
                  <span className="text-emerald-400 text-xs font-medium">Live Dashboard</span>
                </div>

                {/* Mini dashboard mockup */}
                <div className="space-y-4">
                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Active</div>
                      <div className="text-lg font-bold text-white">12</div>
                      <div className="text-xs text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +3</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-xs text-gray-400">In Transit</div>
                      <div className="text-lg font-bold text-white">8</div>
                      <div className="text-xs text-sky-400 flex items-center gap-1"><Plane className="w-3 h-3" /> Air</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Delivered</div>
                      <div className="text-lg font-bold text-white">47</div>
                      <div className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 100%</div>
                    </div>
                  </div>

                  {/* Recent shipments */}
                  <div className="bg-white/5 rounded-lg p-3 space-y-3">
                    <div className="text-xs text-gray-400 font-medium">Recent Shipments</div>
                    {[
                      { id: 'QT-2026-0042', dest: 'Tokyo, Japan', status: 'In Transit', color: 'blue' },
                      { id: 'QT-2026-0041', dest: 'Sydney, Australia', status: 'Delivered', color: 'emerald' },
                      { id: 'QT-2026-0040', dest: 'Dubai, UAE', status: 'Customs', color: 'amber' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full bg-${s.color}-400`} />
                          <div>
                            <div className="text-xs text-white font-medium">{s.id}</div>
                            <div className="text-[10px] text-gray-400">{s.dest}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${s.color}-500/20 text-${s.color}-300`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
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

// ============ SERVICES SECTION ============
function ServicesSection() {
  const services = [
    {
      icon: Plane,
      title: 'Air Freight',
      desc: 'Express & standard air cargo with transparent Chargeable Weight pricing. Automated volume calculations and competitive freight rates.',
      color: 'sky',
      bgColor: 'bg-sky-50',
      iconColor: 'text-sky-600',
      borderColor: 'hover:border-sky-200',
      href: '/site/services/air-freight',
    },
    {
      icon: FileCheck,
      title: 'Customs & Documents',
      desc: 'End-to-end customs clearance and document management — TK forms, GACP certifications, and AI-powered document verification.',
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'hover:border-emerald-200',
      href: '/site/services/customs-documents',
    },
    {
      icon: Zap,
      title: 'Express Shipping',
      desc: 'Priority handling for time-critical cargo. Dedicated booking, fast-track customs, and delivery within 1-3 business days.',
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'hover:border-blue-200',
      href: '/site/services/air-freight',
    },
    {
      icon: Package,
      title: 'Packing & Palletization',
      desc: 'Automated Volume Weight calculation (L×W×H ÷ 6,000). Supports multiple pallets per shipment with individual quantities.',
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'hover:border-amber-200',
      href: '/site/services/air-freight',
    },
    {
      icon: FileText,
      title: 'Document Management',
      desc: 'Upload Commercial Invoices, Packing Lists, POs, and MSDS through the portal. Track document status in real-time.',
      color: 'violet',
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
      borderColor: 'hover:border-violet-200',
      href: '/site/services/customs-documents',
    },
    {
      icon: Headphones,
      title: 'Dedicated Support',
      desc: 'Personal account manager for every client. Real-time updates via portal, email, and Telegram notifications.',
      color: 'rose',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      borderColor: 'hover:border-rose-200',
      href: '/site/contact',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full mb-4">
            <Container className="w-4 h-4" /> Our Services
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            From factory floor to <span className="text-emerald-600">destination door</span>
          </h2>
          <p className="text-gray-500 text-lg">
            Complete export logistics solutions designed for Thai exporters who want reliability, transparency, and speed.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <Link
              key={i}
              href={service.href}
              className={`group relative p-6 bg-white rounded-xl border border-gray-100 ${service.borderColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
            >
              <div className={`w-12 h-12 ${service.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <service.icon className={`w-6 h-6 ${service.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{service.desc}</p>
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:gap-2 transition-all">
                Learn more <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ HOW IT WORKS ============
function HowItWorksSection() {
  const steps = [
    { step: '01', title: 'Request a Quote', desc: 'Tell us your cargo details and destination. Get a competitive air freight quote within hours.', icon: FileText },
    { step: '02', title: 'Upload Documents', desc: 'Use our portal to upload invoices, packing lists, and certificates. Our AI checks for errors automatically.', icon: FileCheck },
    { step: '03', title: 'We Handle Logistics', desc: 'From booking to customs clearance, we manage the entire process. You get real-time status updates.', icon: Truck },
    { step: '04', title: 'Track & Receive', desc: 'Monitor your shipment every step of the way. Get notified on arrival with proof of delivery photos.', icon: CheckCircle2 },
  ];

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full mb-4">
            <BarChart3 className="w-4 h-4" /> How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Export made <span className="text-emerald-600">simple</span>
          </h2>
          <p className="text-gray-500 text-lg">
            Four simple steps to ship your products worldwide with full visibility and confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, i) => (
            <div key={i} className="relative text-center">
              {/* Connector line */}
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
      </div>
    </section>
  );
}

// ============ WHY CHOOSE US ============
function WhyChooseUsSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full mb-4">
                <Shield className="w-4 h-4" /> Why Choose Us
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Built for Thai exporters who demand <span className="text-emerald-600">excellence</span>
              </h2>
              <p className="text-gray-500 text-lg">
                We combine deep local expertise with cutting-edge technology to deliver the most reliable export logistics experience.
              </p>
            </div>

            <div className="space-y-5">
              {[
                { icon: Shield, title: 'AI-Powered Document Review', desc: 'Our system automatically checks your export documents for errors, reducing delays at customs.' },
                { icon: Clock, title: 'Real-Time Shipment Tracking', desc: 'Track every shipment from pickup to delivery. Get notifications at every milestone.' },
                { icon: Users, title: 'Dedicated Account Manager', desc: 'Every client gets a personal expert who knows your business and shipping needs.' },
                { icon: Globe, title: 'Global Network, Local Expertise', desc: 'Access to 50+ destination countries with deep understanding of Thai export regulations.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Stats Card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-3xl blur-2xl opacity-50" />
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-emerald-50 rounded-xl">
                  <div className="text-4xl font-bold text-emerald-600 mb-1">99%</div>
                  <div className="text-sm text-gray-600">On-time Rate</div>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-xl">
                  <div className="text-4xl font-bold text-blue-600 mb-1">50+</div>
                  <div className="text-sm text-gray-600">Countries</div>
                </div>
                <div className="text-center p-6 bg-violet-50 rounded-xl">
                  <div className="text-4xl font-bold text-violet-600 mb-1">200+</div>
                  <div className="text-sm text-gray-600">Happy Clients</div>
                </div>
                <div className="text-center p-6 bg-amber-50 rounded-xl">
                  <div className="text-4xl font-bold text-amber-600 mb-1">24/7</div>
                  <div className="text-sm text-gray-600">Support</div>
                </div>
              </div>

              {/* Testimonial mini */}
              <div className="mt-6 p-5 bg-gray-50 rounded-xl">
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-gray-600 italic mb-3">
                  &ldquo;OMG Exp transformed our shipping process. What used to take days of paperwork is now handled in hours with their digital platform.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-semibold text-sm">K</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Khun Somchai</div>
                    <div className="text-xs text-gray-500">Export Manager, Thai Agri Co.</div>
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

// ============ CTA SECTION ============
function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to simplify your exports?
        </h2>
        <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
          Join hundreds of Thai exporters who trust OMG Exp for their international shipping needs. Get started in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/site/get-started"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/site/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm"
          >
            Schedule a Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============ PAGE ============
export default function MarketingHomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <HowItWorksSection />
      <WhyChooseUsSection />
      <CTASection />
    </>
  );
}
