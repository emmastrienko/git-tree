import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, sidebar, header, footer }) => {
  return (
    <div className="flex flex-col h-screen w-full bg-app-bg text-slate-200">
      {header}
      <div className="flex flex-1 min-h-0">
        {sidebar}
        <main className="flex-1 relative bg-app-bg">
          {children}
        </main>
      </div>
      {footer}
    </div>
  );
};