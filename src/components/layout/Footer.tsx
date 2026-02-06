export const Footer = () => {
  return (
    <footer className="h-10 border-t border-border bg-panel-bg flex items-center justify-between px-6 shrink-0 text-[10px] font-medium text-slate-600 z-20">
      <div>
        &copy; {new Date().getFullYear()} Emma Strienko
      </div>
      <div className="uppercase tracking-tighter">
        All rights reserved
      </div>
    </footer>
  );
};
