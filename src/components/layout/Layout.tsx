import { ReactNode } from 'react';
import { Header } from './Header';
import { TopLoadingBar } from '@/components/ui/top-loading-bar';
import { PageTransition } from '@/components/ui/page-transition';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopLoadingBar />
      <Header />
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
