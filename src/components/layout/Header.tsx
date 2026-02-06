import { GitGraph } from 'lucide-react';

export const Header = () => {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0 z-20 bg-app-bg">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <GitGraph className="text-indigo-500" size={22} />
          <h1 className="font-bold tracking-tight text-lg">Git Tree</h1>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
          <button className="px-3 py-1 rounded-md text-xs font-medium bg-indigo-600 text-white transition-all">
            Branches
          </button>
          <button className="px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-all">
            Pull Requests
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <input 
          type="text" 
          placeholder="owner/repo"
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-1.5 text-sm focus:outline-none focus:border-indigo-500/50 w-64 transition-all"
        />
        <button className="bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors">
          Fetch
        </button>
      </div>
    </header>
  );
};