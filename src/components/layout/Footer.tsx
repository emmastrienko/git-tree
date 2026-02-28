import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="py-4 border-t border-white/5 bg-[#020617] text-slate-500 shrink-0 z-20">
      <div className="max-w-[1800px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-[9px] font-medium tracking-wider uppercase opacity-50">
          &copy; 2026 Emma Strienko &bull; Built for Git Topology Visualization
        </div>
        
        <nav className="flex items-center gap-6 text-[9px] font-bold tracking-widest uppercase">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">App</Link>
          <a 
            href="https://github.com/emmastrienko/git-tree" 
            target="_blank" 
            rel="noreferrer" 
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
};
