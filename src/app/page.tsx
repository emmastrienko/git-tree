'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MainLayout } from '@/components/layout/MainLayout';
import { ThreeVisualizer } from '@/features/visualizer/ThreeVisualizer';
import { MOCK_TREE_DATA } from '@/utils/mock-data';
import { ArrowRight, MoveRight } from 'lucide-react';

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Git Tree Visualizer",
    "description": "Visualize GitHub repository branch divergence and merge patterns in immersive 3D.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web-based",
    "author": {
      "@type": "Person",
      "name": "Emma Strienko"
    },
    "screenshot": "https://git-tree-visualizer.vercel.app/opengraph-image",
    "softwareVersion": "0.1.0"
  };

  return (
    <MainLayout
      header={() => <Header minimal />}
      footer={<Footer />}
      scrollable
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-[#020617] text-white selection:bg-indigo-500/30">
        
        {/* Hero Section */}
        <section className="relative max-w-[1600px] mx-auto min-h-[90vh] flex flex-col lg:flex-row items-center px-8 md:px-16 gap-12 lg:gap-24 pt-32 pb-20">
          <div className="flex-1 space-y-16">
            <div className="space-y-8">
              <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.85]">
                Git Tree <br />
                <span className="text-slate-500 font-medium italic">Visualization.</span>
              </h1>
              
              <p className="text-xl text-slate-400 max-w-lg leading-relaxed font-light">
                A specialized engine for the structural mapping of repository histories. 
                Reconstruct branch divergence and merge patterns through immersive 3D topology.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-10">
              <Link 
                href="/dashboard"
                className="bg-white text-black hover:bg-slate-100 px-12 py-6 rounded-2xl font-bold text-xs tracking-widest uppercase transition-all flex items-center gap-4 active:scale-95 shadow-2xl"
              >
                Launch Visualizer <MoveRight size={20} />
              </Link>
              <Link 
                href="/about"
                className="text-slate-500 hover:text-white font-bold text-xs tracking-widest uppercase transition-colors flex items-center gap-2 group"
              >
                Technical Spec <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="flex-[1.4] w-full aspect-square md:aspect-[4/3] lg:aspect-auto lg:h-[75vh] xl:h-[80vh] relative group overflow-hidden">
            <div className="absolute inset-0 bg-indigo-600/5 blur-[120px] rounded-full opacity-20" />
            <div className="relative w-full h-full bg-[#03081c] border border-white/5 rounded-3xl md:rounded-[40px] overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-white/10">
              <div className="absolute top-10 left-10 z-10 pointer-events-none">
                <div className="text-[9px] font-mono font-bold tracking-[0.4em] uppercase text-slate-600 flex items-center gap-3">
                  <span className="w-2 h-px bg-slate-800" />
                  Spatial_Projection_Active
                </div>
              </div>
              <ThreeVisualizer tree={MOCK_TREE_DATA} />
            </div>
          </div>
        </section>

        {/* The Logic Section: Blueprint Style */}
        <section className="max-w-7xl mx-auto px-8 md:px-16 py-20 lg:py-40 border-t border-white/5">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start relative">
            
            <div className="lg:col-span-5 space-y-8 static lg:sticky lg:top-32 z-10 bg-[#020617] pb-10 lg:pb-0">
              <h2 className="text-5xl font-bold tracking-tighter leading-none">The Core <br /> Logic.</h2>
              <p className="text-slate-500 text-lg font-light leading-relaxed max-w-xs">
                How we transform raw history into visual intelligence.
              </p>
              <div className="pt-8 flex gap-12">
                <div className="space-y-1">
                  <div className="text-2xl font-bold tracking-tighter">120Hz</div>
                  <div className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Async Compute</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold tracking-tighter">0ms</div>
                  <div className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Data Latency</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-24 pt-4">
              <div className="relative pl-12 space-y-4 group">
                <div className="absolute left-0 top-2 text-[10px] font-mono text-indigo-500 font-bold tracking-widest">[01]</div>
                <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors uppercase">Resolution</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light max-w-lg">
                  We ingest bulk metadata via GraphQL and batched REST requests, synchronizing up to 100 branches in a single stream for instantaneous structural analysis.
                </p>
              </div>

              <div className="relative pl-12 space-y-4 group">
                <div className="absolute left-0 top-2 text-[10px] font-mono text-indigo-500 font-bold tracking-widest">[02]</div>
                <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors uppercase">Heuristics</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light max-w-lg">
                  Our scoring engine reconstructs parent-child relationships using commit-history arrays and ahead/behind metrics, providing a clear model where metadata is fragmented.
                </p>
              </div>

              <div className="relative pl-12 space-y-4 group">
                <div className="absolute left-0 top-2 text-[10px] font-mono text-indigo-500 font-bold tracking-widest">[03]</div>
                <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors uppercase">Projection</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light max-w-lg">
                  Hierarchical nodes are projected into a 3D coordinate system, using Golden Angle distribution to eliminate branch overlap and ensure spatial clarity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA: Dark & Focused */}
        <section className="max-w-7xl mx-auto px-8 md:px-16 pb-40">
          <div className="bg-white/[0.02] border border-white/10 rounded-[40px] p-16 md:p-32 flex flex-col items-center text-center space-y-12 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/[0.03] blur-[100px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="space-y-6 relative z-10">
              <h2 className="text-5xl md:text-8xl font-bold tracking-tighter leading-none">
                Begin the <br /> Mapping.
              </h2>
              <p className="text-slate-500 text-xl font-light max-w-lg mx-auto leading-relaxed italic">
                Connect your repository to reconstruct its topology in immersive 3D.
              </p>
            </div>
            
            <Link 
              href="/dashboard"
              className="relative z-10 bg-white text-black px-16 py-6 rounded-2xl font-bold text-xs tracking-[0.3em] uppercase hover:bg-slate-200 transition-all shadow-2xl active:scale-95 flex items-center gap-4 group/btn"
            >
              Enter Dashboard <MoveRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
            </Link>
          </div>
        </section>

      </div>
    </MainLayout>
  );
}
