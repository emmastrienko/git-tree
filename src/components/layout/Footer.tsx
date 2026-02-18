import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="py-6 border-t border-white/5 bg-[#020617] text-slate-500 shrink-0 z-20">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-[10px] font-medium tracking-wider uppercase">
          &copy; {new Date().getFullYear()} Emma Strienko &bull; Built for Git Topology Visualization
        </div>
        
        <nav className="flex items-center gap-8 text-[10px] font-bold tracking-widest uppercase">
          <Link href="/" className="hover:text-indigo-400 transition-colors">Home</Link>
          <Link href="/about" className="hover:text-indigo-400 transition-colors">About</Link>
          <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">App</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">GitHub</a>
        </nav>
      </div>
    </footer>
  );
};
