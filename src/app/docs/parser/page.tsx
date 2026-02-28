'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MainLayout } from '@/components/layout/MainLayout';
import { Code2, ArrowLeft } from 'lucide-react';

export default function ParserDocs() {
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
                <Code2 size={24} />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">
                Heuristic <br />
                <span className="text-slate-500 font-medium italic">Reconstruction.</span>
              </h1>
            </div>

            <article className="prose prose-invert max-w-none prose-p:text-slate-400 prose-p:leading-relaxed prose-h2:text-white prose-h2:tracking-tight prose-code:text-indigo-400 prose-code:bg-indigo-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono">
              <p className="text-xl text-slate-400 font-light leading-relaxed mb-12">
                Standard Git APIs provide a flat list of branches and commit SHAs. To build a spatial tree, we must reconstruct hierarchical parent-child relationships through heuristic analysis.
              </p>

              <h2>The Core Challenge</h2>
              <p>
                A standard repository log doesn&apos;t explicitly define which branch was "forked" from where. It only knows that Branch A and Branch B share a common ancestor. Our engine must infer this topology by analyzing commit histories and comparison metrics.
              </p>

              <h2>Scoring Engine Logic</h2>
              <p>
                For every pair of branches, we calculate a "Parent Likelihood Score" based on:
              </p>
              <ul>
                <li><strong>Ahead/Behind Metrics:</strong> A branch with 0 behind and X ahead is likely a direct child of its comparison target.</li>
                <li><strong>Common Ancestor Proximity:</strong> The number of shared commits before the divergence point.</li>
                <li><strong>Branch Creation Delta:</strong> Comparing commit timestamps to identify the temporal sequence of branch divergence.</li>
              </ul>

              <h2>Optimization: Async Compute</h2>
              <p>
                Reconstructing a tree with 100+ branches is computationally expensive. We offload the parsing logic to a Web Worker (<code>tree-parser.worker.ts</code>), ensuring that the UI remains responsive at a consistent 120Hz refresh rate.
              </p>

              <h2>Why It Matters</h2>
              <p>
                By inferring this structure, we move beyond the linear log and provide a mental model that reflects how the code actually evolved—highlighting divergence and merge patterns that are often hidden in text-based tools.
              </p>
            </article>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
