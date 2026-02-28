'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MainLayout } from '@/components/layout/MainLayout';
import { Share2, ArrowLeft } from 'lucide-react';

export default function SyncDocs() {
  return (
    <MainLayout header={() => <Header minimal />} footer={<Footer />} scrollable>
      <div className="bg-[#020617] text-white selection:bg-indigo-500/30 min-h-screen">
        <section className="max-w-[800px] mx-auto px-8 md:px-16 pt-40 pb-20">
          <Link 
            href="/docs"
            className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-12 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Documentation
          </Link>
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Share2 size={24} />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">
                Synchronization <br />
                <span className="text-slate-500 font-medium italic">Engine.</span>
              </h1>
            </div>

            <article className="prose prose-invert max-w-none prose-p:text-slate-400 prose-p:leading-relaxed prose-h2:text-white prose-h2:tracking-tight prose-code:text-indigo-400 prose-code:bg-indigo-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono">
              <p className="text-xl text-slate-400 font-light leading-relaxed mb-12">
                Handling massive metadata requests without hitting rate limits or blocking the UI requires a sophisticated synchronization strategy.
              </p>

              <h2>Batched GraphQL Intake</h2>
              <p>
                Standard REST calls are "chatty" and often return redundant data. We use <strong>GraphQL</strong> to request exactly what we need—branch references, SHAs, and author metadata—in a single, compressed request.
              </p>

              <h2>Incremental Stream Synchronization</h2>
              <p>
                For large repositories (1000+ branches), we utilize an <strong>incremental synchronization engine</strong>. Instead of waiting for the entire history to load, we stream data in batches:
              </p>
              <ul>
                <li><strong>First Pass:</strong> Fetch the default branch and immediate children.</li>
                <li><strong>Secondary Pass:</strong> Background-fetch comparison metrics (Ahead/Behind) for the remaining branches.</li>
                <li><strong>UI Updates:</strong> The 3D tree "grows" in real-time as new data is synced from the GitHub API.</li>
              </ul>

              <h2>Batching Strategy (CHUNK_SIZE)</h2>
              <p>
                To respect GitHub&apos;s API limits, we batch branch comparisons in chunks of 15. This balance ensures that we utilize the API efficiently while keeping the synchronization state predictable.
              </p>

              <h2>Data Sovereignty</h2>
              <p>
                All synchronization occurs within the client session. We use transient states and session storage, ensuring that no repository metadata is ever stored on our servers. The map exists only while you are looking at it.
              </p>
            </article>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
