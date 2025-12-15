'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Check if it's a ChunkLoadError
    if (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch dynamically imported module')
    ) {
      // Force reload to get fresh assets
      console.log('ChunkLoadError detected, reloading page...');
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">กำลังโหลดเวอร์ชันใหม่...</h2>
            <p className="text-muted-foreground mb-4">
              พบการอัปเดตใหม่ กรุณารอสักครู่
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              รีเฟรชหน้า
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;

