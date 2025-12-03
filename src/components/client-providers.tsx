'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { useEffect, useState } from 'react';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // useEffect chỉ chạy trên client, vì vậy bây giờ chúng ta có thể hiển thị UI một cách an toàn
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Trả về null hoặc một spinner tải trang
    return null;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
