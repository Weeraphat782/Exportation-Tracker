'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

const Breadcrumb = () => {
  const pathname = usePathname();

  const getBreadcrumbItems = () => {
    if (!pathname) return [];
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, index) => ({
      label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
      href: '/' + parts.slice(0, index + 1).join('/'),
      isLast: index === parts.length - 1
    }));
  };

  const items = getBreadcrumbItems();

  if (items.length === 0) return null;

  return (
    <nav className="flex items-center text-sm text-gray-500 mb-4">
      <Link href="/dashboard" className="flex items-center hover:text-gray-700 transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          {item.isLast ? (
            <span className="text-gray-800 font-medium">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-gray-700 transition-colors">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb;

