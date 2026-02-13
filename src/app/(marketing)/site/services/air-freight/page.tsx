'use client';

import Link from 'next/link';
import {
  Plane, ArrowRight, CheckCircle2, Package, Scale, Ruler,
  MapPin, Truck,
  Calculator, Zap, BarChart3, ArrowLeft
} from 'lucide-react';

// ============ HERO ============
function AirFreightHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sky-900 via-sky-800 to-blue-900 py-20 lg:py-28">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/site" className="inline-flex items-center gap-2 text-sky-300 hover:text-white text-sm font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full">
              <Plane className="w-4 h-4 text-sky-400" />
              <span className="text-sky-300 text-sm font-medium">Air Freight Services</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Fast, reliable{' '}
              <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                air cargo
              </span>{' '}
              from Thailand to the world
            </h1>

            <p className="text-lg text-sky-100/80 leading-relaxed max-w-lg">
              From factory to destination airport — with automated weight calculations, competitive chargeable weight pricing, and real-time shipment tracking throughout the journey.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/site/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-sky-700 transition-all shadow-lg"
              >
                Get a Quote <ArrowRight className="w-4 h-4" />
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
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-xs text-sky-300">Destinations</div>
              </div>
              <div className="w-px h-10 bg-sky-700" />
              <div>
                <div className="text-2xl font-bold text-white">2-5</div>
                <div className="text-xs text-sky-300">Days Transit</div>
              </div>
              <div className="w-px h-10 bg-sky-700" />
              <div>
                <div className="text-2xl font-bold text-white">99%</div>
                <div className="text-xs text-sky-300">On-time Rate</div>
              </div>
            </div>
          </div>

          {/* Animated Plane Visual */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 rounded-full blur-3xl" />
              <div className="relative w-64 h-64 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center">
                <Plane className="w-24 h-24 text-sky-400" />
              </div>
              {/* Floating destination tags */}
              <div className="absolute -top-4 right-0 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 text-xs text-white font-medium">
                <MapPin className="w-3 h-3 inline mr-1" /> Switzerland
              </div>
              <div className="absolute top-1/2 -right-16 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 text-xs text-white font-medium">
                <MapPin className="w-3 h-3 inline mr-1" /> Australia
              </div>
              <div className="absolute -bottom-4 right-4 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 text-xs text-white font-medium">
                <MapPin className="w-3 h-3 inline mr-1" /> Czech Republic
              </div>
              <div className="absolute top-1/3 -left-12 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 text-xs text-white font-medium">
                <MapPin className="w-3 h-3 inline mr-1" /> Portugal
              </div>
              <div className="absolute bottom-1/3 -left-8 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 text-xs text-white font-medium">
                <MapPin className="w-3 h-3 inline mr-1" /> Macedonia
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ SERVICE OPTIONS ============
function ServiceOptions() {
  const options = [
    {
      icon: Plane,
      title: 'Standard Air Freight',
      desc: 'Our standard air cargo service for general shipments. The system automatically calculates Chargeable Weight for accurate, transparent pricing.',
      features: [
        'Delivered within 3-5 business days',
        'Automatic weight calculation (Actual vs Volume)',
        'Pricing based on destination Freight Rate',
        'Multiple pallets per shipment supported',
      ],
      badge: 'Most Popular',
      badgeColor: 'bg-sky-100 text-sky-700',
    },
    {
      icon: Zap,
      title: 'Express Air Freight',
      desc: 'Priority service for time-critical cargo. Includes dedicated handling, guaranteed space, and expedited customs clearance.',
      features: [
        'Delivered within 1-3 business days',
        'Priority handling throughout the process',
        'Dedicated booking & space guarantee',
        'Fast-track customs clearance',
      ],
      badge: 'Fastest',
      badgeColor: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-700 text-sm font-medium rounded-full mb-4">
            <Package className="w-4 h-4" /> Service Options
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Choose the service that fits <span className="text-sky-600">your business</span>
          </h2>
          <p className="text-gray-500 text-lg">
            Both Standard and Express use the same transparent pricing system — based on Chargeable Weight and destination Freight Rate.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {options.map((opt, i) => (
            <div key={i} className="relative bg-white rounded-2xl border-2 border-gray-100 hover:border-sky-200 p-8 transition-all hover:shadow-xl group">
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${opt.badgeColor}`}>
                  {opt.badge}
                </span>
              </div>

              <div className="w-14 h-14 bg-sky-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <opt.icon className="w-7 h-7 text-sky-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">{opt.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{opt.desc}</p>

              <div className="space-y-3">
                {opt.features.map((f, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{f}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/site/register"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition-all w-full justify-center"
              >
                Request Quote <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ HOW PRICING WORKS ============
function PricingSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full mb-4">
            <Calculator className="w-4 h-4" /> Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Pricing based on <span className="text-emerald-600">Chargeable Weight</span>
          </h2>
          <p className="text-gray-500 text-lg">
            Our system automatically calculates pricing from your cargo dimensions and actual weight — fully transparent with no hidden charges.
          </p>
        </div>

        {/* Pricing Formula Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Step 1: Volume Weight */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                <Ruler className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="text-xs text-sky-600 font-semibold">STEP 1</div>
                <h3 className="font-bold text-gray-900">Volume Weight</h3>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Calculate volumetric weight from pallet dimensions (length x width x height).
            </p>
            <div className="bg-sky-50 rounded-xl p-4 text-center">
              <div className="text-sm text-sky-700 font-mono font-bold">
                L × W × H (cm)
              </div>
              <div className="text-2xl text-sky-600 font-bold my-1">÷ 6,000</div>
              <div className="text-sm text-sky-700 font-mono font-bold">
                = Volume Weight (kg)
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Example:</div>
              <div className="text-sm text-gray-700 font-medium">
                100 × 100 × 120 cm = <span className="text-sky-600">200 kg (Volume)</span>
              </div>
            </div>
          </div>

          {/* Step 2: Chargeable Weight */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-emerald-600 font-semibold">STEP 2</div>
                <h3 className="font-bold text-gray-900">Chargeable Weight</h3>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Compare actual weight against volume weight — whichever is greater becomes the chargeable weight.
            </p>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <div className="text-sm text-emerald-700 font-bold mb-2">
                MAX( Actual Weight, Volume Weight )
              </div>
              <div className="text-lg text-emerald-600 font-bold">
                = Chargeable Weight
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Example:</div>
              <div className="text-sm text-gray-700 font-medium">
                Actual: 150 kg vs Volume: 200 kg
              </div>
              <div className="text-sm text-emerald-600 font-semibold">
                Chargeable = 200 kg
              </div>
            </div>
          </div>

          {/* Step 3: Total Cost */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <div className="text-xs text-violet-600 font-semibold">STEP 3</div>
                <h3 className="font-bold text-gray-900">Total Cost</h3>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Multiply chargeable weight by the destination rate per kg, then add clearance and delivery fees.
            </p>
            <div className="bg-violet-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-violet-700">Freight Cost</span>
                <span className="text-violet-600 font-mono font-bold">CW × Rate/kg</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-violet-700">Clearance Cost</span>
                <span className="text-violet-600 font-mono font-bold">+ Customs fee</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-violet-700">Delivery</span>
                <span className="text-violet-600 font-mono font-bold">+ Pickup fee</span>
              </div>
              <div className="border-t border-violet-200 pt-2 flex items-center justify-between text-sm font-bold">
                <span className="text-violet-800">Total</span>
                <span className="text-violet-600">= Grand Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pallet Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Supports all pallet sizes</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Our system handles multiple pallets per shipment with individual quantity settings, giving you accurate pricing every time.
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Dimensions (L × W × H)', detail: 'Enter in cm — used to calculate Volume Weight' },
                  { label: 'Actual Weight', detail: 'Enter in kg — compared against Volume Weight' },
                  { label: 'Quantity', detail: 'Set quantity for same-sized pallets — no need to duplicate' },
                  { label: 'Custom Rate (Optional)', detail: 'Override the default rate per kg for specific pallets' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pallet mockup */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="text-xs text-gray-500 font-semibold mb-3 uppercase">Sample Pallets in a Quote</div>
              <div className="space-y-3">
                {[
                  { no: 1, dims: '100 × 120 × 150 cm', actual: '180 kg', volume: '300 kg', cw: '300 kg', qty: 2 },
                  { no: 2, dims: '80 × 80 × 100 cm', actual: '120 kg', volume: '106.7 kg', cw: '120 kg', qty: 1 },
                  { no: 3, dims: '60 × 60 × 80 cm', actual: '50 kg', volume: '48 kg', cw: '50 kg', qty: 3 },
                ].map((p) => (
                  <div key={p.no} className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">Pallet #{p.no}</span>
                      <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium">× {p.qty}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-500">Dims: <span className="text-gray-700 font-medium">{p.dims}</span></div>
                      <div className="text-gray-500">Actual: <span className="text-gray-700 font-medium">{p.actual}</span></div>
                      <div className="text-gray-500">Volume: <span className="text-gray-700 font-medium">{p.volume}</span></div>
                      <div className="text-gray-500">CW: <span className="text-sky-600 font-bold">{p.cw}</span></div>
                    </div>
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

// ============ DELIVERY OPTIONS ============
function DeliverySection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 text-sm font-medium rounded-full mb-4">
            <Truck className="w-4 h-4" /> Delivery Service
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Door-to-airport <span className="text-amber-600">pickup service</span>
          </h2>
          <p className="text-gray-500 text-lg">
            We pick up cargo directly from your factory or warehouse and deliver it to the airport.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border-2 border-gray-100 hover:border-amber-200 p-8 transition-all hover:shadow-lg text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Truck className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">4-Wheel Truck</h3>
            <p className="text-sm text-gray-500 mb-4">Ideal for small to medium shipments</p>
            <div className="text-3xl font-bold text-amber-600 mb-1">฿3,500</div>
            <div className="text-xs text-gray-400">per trip</div>
            <div className="mt-4 space-y-2 text-left">
              {['Pickup from factory/warehouse', 'Delivery to Suvarnabhumi Airport', 'Suitable for 1-3 pallets'].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {f}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-100 hover:border-amber-200 p-8 transition-all hover:shadow-lg text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Truck className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">6-Wheel Truck</h3>
            <p className="text-sm text-gray-500 mb-4">Ideal for large or bulk shipments</p>
            <div className="text-3xl font-bold text-amber-600 mb-1">฿6,500</div>
            <div className="text-xs text-gray-400">per trip</div>
            <div className="mt-4 space-y-2 text-left">
              {['Pickup from factory/warehouse', 'Delivery to Suvarnabhumi Airport', 'Suitable for 4+ pallets'].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ CTA ============
function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to ship by air?
        </h2>
        <p className="text-sky-100 text-lg mb-8 max-w-2xl mx-auto">
          Create a free account — our team will prepare a quotation within 24 hours with fully transparent Chargeable Weight pricing.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/site/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-sky-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-lg"
          >
            Sign Up Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/site/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
          >
            Request a Quote
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============ PAGE ============
export default function AirFreightPage() {
  return (
    <>
      <AirFreightHero />
      <ServiceOptions />
      <PricingSection />
      <DeliverySection />
      <CTASection />
    </>
  );
}
