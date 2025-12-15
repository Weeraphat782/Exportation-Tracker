'use client';

import { ReactNode, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ChunkErrorBoundary from '@/components/ChunkErrorBoundary';

export default function AppLayout({ children }: { children: ReactNode }) {
  // Global handler for chunk load errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if it's a chunk loading error
      if (
        event.message.includes('Loading chunk') ||
        event.message.includes('Failed to fetch dynamically imported module') ||
        event.message.includes('ChunkLoadError')
      ) {
        console.log('Chunk load error detected, reloading...');
        // Prevent the error from being logged
        event.preventDefault();
        // Reload the page to get fresh assets
        window.location.reload();
      }
    };

    // Handle unhandled promise rejections for dynamic imports
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Failed to fetch dynamically imported module')
      ) {
        console.log('Chunk load promise rejection, reloading...');
        event.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <MainLayout>
      <ChunkErrorBoundary>
        {children}
      </ChunkErrorBoundary>
    </MainLayout>
  );
}