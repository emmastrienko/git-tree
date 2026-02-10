'use client';

import React, { useState } from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: (props: { onMenuClick: () => void }) => React.ReactNode;
  footer?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, sidebar, header, footer }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-app-bg text-slate-200 overflow-hidden">
      {header?.({ onMenuClick: () => setIsSidebarOpen(!isSidebarOpen) })}
      
      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar Overlay for Mobile */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm transition-all"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Container */}
        <div className={`
          absolute inset-y-0 left-0 z-40 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          w-72 sm:w-80
        `}>
          {sidebar}
        </div>

        <main className="flex-1 relative bg-app-bg overflow-hidden">
          {children}
        </main>
      </div>
      {footer}
    </div>
  );
};