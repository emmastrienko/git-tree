'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Root Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-sm shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 mb-6">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Something went wrong</h1>
        <p className="text-slate-400 mb-8 text-sm">
          A critical error occurred while rendering this page. We&apos;ve been notified and are looking into it.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            Go back home
          </Link>
        </div>
        
        {error.digest && (
          <p className="mt-8 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
