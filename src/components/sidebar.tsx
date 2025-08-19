'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import {
  Building,
  Globe,
  Home,
  Settings,
  Ship,
  BarChart,
  Mail,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="pb-12 w-64 bg-slate-50 border-r border-slate-100 h-screen sticky top-0">
      <div className="py-4 px-6">
        <h1 className="text-xl font-bold">Exportation Tracker</h1>
      </div>
      
      <nav className="px-2 space-y-2">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
            pathname === "/dashboard" ? "bg-slate-100 text-primary" : "text-slate-500"
          )}
        >
          <Home className="h-5 w-5" />
          Dashboard
        </Link>
        <Link
          href="/shipping-calculator"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
            pathname.includes("/shipping-calculator") ? "bg-slate-100 text-primary" : "text-slate-500"
          )}
        >
          <Ship className="h-5 w-5" />
          Shipping Calculator
        </Link>
        
        <Link
          href="/email-booking"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
            pathname.includes("/email-booking") ? "bg-slate-100 text-primary" : "text-slate-500"
          )}
        >
          <Mail className="h-5 w-5" />
          Email Booking
        </Link>
        
        <Separator className="my-4" />
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Settings</h2>
        
        <Link
          href="/settings/companies"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
            pathname.includes("/settings/companies") ? "bg-slate-100 text-primary" : "text-slate-500"
          )}
        >
          <Building className="h-5 w-5" />
          Companies
        </Link>
        
        <Link
          href="/settings/destinations"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
            pathname.includes("/settings/destinations") ? "bg-slate-100 text-primary" : "text-slate-500"
          )}
        >
          <Globe className="h-5 w-5" />
          Destinations
        </Link>
        
        <Link
          href="/settings/freight-rates"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
            pathname.includes("/settings/freight-rates") ? "bg-slate-100 text-primary" : "text-slate-500"
          )}
        >
          <BarChart className="h-5 w-5" />
          Freight Rates
        </Link>
        
        <Link
          href="/settings/delivery-services"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
            pathname.includes("/settings/delivery-services") ? "bg-slate-100 text-primary" : "text-slate-500"
          )}
        >
          <Settings className="h-5 w-5" />
          Delivery Services
        </Link>
      </nav>
    </aside>
  );
} 