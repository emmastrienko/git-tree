'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <MainLayout
      header={<Header />}
      sidebar={<Sidebar />}
      footer={<Footer />}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-slate-600 font-medium">
          Tree visualization will be rendered here
        </div>
      </div>
    </MainLayout>
  );
}