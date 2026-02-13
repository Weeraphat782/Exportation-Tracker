'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  Globe, 
  Menu, 
  X, 
  Plane, 
  FileCheck, 
  ChevronDown,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/site" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-tight tracking-tight">CantrakExport</span>
              <span className="text-[10px] text-emerald-600 font-medium -mt-0.5">Global Logistics Solutions</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/site" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors">
              Home
            </Link>
            
            {/* Services Dropdown */}
            <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors">
                Services <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link href="/site/services/air-freight" className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                      <Plane className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Air Freight</div>
                      <div className="text-xs text-gray-500">Express & standard</div>
                    </div>
                  </Link>
                  <Link href="/site/services/customs-documents" className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Customs & Documents</div>
                      <div className="text-xs text-gray-500">Clearance & compliance</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link href="/site/about" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors">
              About Us
            </Link>
            <Link href="/site/contact" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors">
              Contact
            </Link>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/site/login" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">
              Sign In
            </Link>
            <Link
              href="/site/register"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            <Link href="/site" className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-emerald-50" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link href="/site/services/air-freight" className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-emerald-50" onClick={() => setMobileOpen(false)}>Air Freight</Link>
            <Link href="/site/services/customs-documents" className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-emerald-50" onClick={() => setMobileOpen(false)}>Customs & Documents</Link>
            <Link href="/site/about" className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-emerald-50" onClick={() => setMobileOpen(false)}>About Us</Link>
            <Link href="/site/contact" className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-emerald-50" onClick={() => setMobileOpen(false)}>Contact</Link>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Link href="/site/login" className="block px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link href="/site/register" className="block px-3 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg text-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">CantrakExport</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your trusted partner for international export logistics. From Thailand to the world — we handle freight, customs, and documentation.
            </p>
            <div className="flex gap-3 pt-2">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer">
                <Mail className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer">
                <Phone className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/site/services/air-freight" className="hover:text-emerald-400 transition-colors">Air Freight</Link></li>
              <li><Link href="/site/services/air-freight" className="hover:text-emerald-400 transition-colors">Express Shipping</Link></li>
              <li><Link href="/site/services/customs-documents" className="hover:text-emerald-400 transition-colors">Customs Clearance</Link></li>
              <li><Link href="/site/services/customs-documents" className="hover:text-emerald-400 transition-colors">Document Management</Link></li>
              <li><Link href="/site/services/air-freight" className="hover:text-emerald-400 transition-colors">Packing & Logistics</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/site/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link href="/site/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
              <li><Link href="/site/login" className="hover:text-emerald-400 transition-colors">Client Portal</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                <span>Bangkok, Thailand</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+66 2-XXX-XXXX</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>info@cantrakexport.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">&copy; 2026 CantrakExport. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-gray-500">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
