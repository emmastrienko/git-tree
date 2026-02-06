export const Sidebar = () => {
  return (
    <aside className="w-80 border-r border-border bg-panel-bg flex flex-col shrink-0 z-10">
      <div className="p-4 flex flex-col gap-4">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Repository Items
        </h2>
        <div className="flex flex-col gap-1">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className="h-8 border-b border-white/5 flex items-center text-xs text-slate-600"
            >
              Placeholder Item {i}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};