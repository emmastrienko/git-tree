'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MainLayout } from '@/components/layout/MainLayout';
import { MoveRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <MainLayout
      header={() => <Header minimal />}
      footer={<Footer />}
      scrollable
    >
      <div className="bg-[#020617] text-white selection:bg-indigo-500/30">
        
        {/* Editorial Hero */}
        <section className="relative max-w-[1600px] mx-auto min-h-[70vh] flex flex-col lg:flex-row items-center px-8 md:px-16 gap-12 lg:gap-24 pt-40 pb-20">
          <div className="flex-1 space-y-12">
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.85]">
              Structural <br />
              <span className="text-slate-500 font-medium italic">Clarity.</span>
            </h1>
            
            <div className="flex flex-col md:flex-row gap-16">
              <p className="flex-[1.2] text-xl text-slate-400 leading-relaxed font-light">
                Git Tree was built to move beyond the constraints of linear version control history. 
                We transform abstract commit sequences into intuitive, spatial models that reveal the 
                organic evolution of your codebase.
              </p>
              <div className="flex-1 hidden md:block" />
            </div>
          </div>
        </section>

        {/* Narrative Flow */}
        <section className="max-w-7xl mx-auto px-8 md:px-16 py-40 border-t border-white/5">
          <div className="space-y-64">
            
            <div className="flex flex-col lg:flex-row gap-20 items-start group">
              <div className="w-32 pt-2 text-[10px] font-mono text-slate-700 tracking-[0.4em] uppercase font-bold">
                [01] / Intent
              </div>
              <div className="flex-1 space-y-10">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none text-white group-hover:text-indigo-400 transition-colors">
                  Beyond the Log.
                </h2>
                <p className="text-slate-500 text-lg font-light leading-relaxed max-w-2xl">
                  Standard version control treats history as a flat sequence. But repositories 
                  are divergent, branching structures. We map these relationships into a 
                  3D coordinate system that reveals the true architecture of your project.
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-20 items-start group">
              <div className="w-32 pt-2 text-[10px] font-mono text-slate-700 tracking-[0.4em] uppercase font-bold">
                [02] / Scale
              </div>
              <div className="flex-1 space-y-10">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none text-white group-hover:text-indigo-400 transition-colors">
                  Spatial Context.
                </h2>
                <p className="text-slate-500 text-lg font-light leading-relaxed max-w-2xl">
                  When a project grows to hundreds of branches, tracking divergence becomes 
                  a mental burden. By projecting your topology in space, we provide an 
                  immediate visual summary that highlights merging patterns and orphaned 
                  features instantly.
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-20 items-start group">
              <div className="w-32 pt-2 text-[10px] font-mono text-slate-700 tracking-[0.4em] uppercase font-bold">
                [03] / Privacy
              </div>
              <div className="flex-1 space-y-10">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none text-white group-hover:text-indigo-400 transition-colors">
                  Data Sovereignty.
                </h2>
                <p className="text-slate-500 text-lg font-light leading-relaxed max-w-2xl">
                  Built with a minimalist architecture that respects your code. All processing 
                  happens within your local session. We don&apos;t store your credentials, 
                  your metadata, or your history. The map exists only while you are looking at it.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Action Entry */}
        <section className="max-w-7xl mx-auto px-8 md:px-16 pb-40">
          <div className="border-t border-white/10 pt-32 pb-20 text-center space-y-12">
            <h2 className="text-5xl md:text-8xl font-bold tracking-tighter leading-none">
              Ready to map <br /> <span className="text-slate-500 font-medium italic">your tree?</span>
            </h2>
            
            <div className="flex justify-center pt-8">
              <Link 
                href="/dashboard"
                className="bg-white text-black hover:bg-slate-100 px-16 py-6 rounded-2xl font-bold text-xs tracking-[0.3em] uppercase transition-all shadow-2xl active:scale-95 flex items-center gap-6 group"
              >
                Access Dashboard <MoveRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            
            <div className="pt-24 flex justify-center items-center gap-10 text-[9px] font-mono text-slate-800 uppercase tracking-[0.5em] select-none pointer-events-none">
              <span>EST. MMXXVI</span>
              <span className="w-1 h-1 bg-slate-900 rounded-full" />
              <span>Structural Intelligence</span>
              <span className="w-1 h-1 bg-slate-900 rounded-full" />
              <span>Browser Native</span>
            </div>
          </div>
        </section>

      </div>
    </MainLayout>
  );
}
