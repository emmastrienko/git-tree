'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MainLayout } from '@/components/layout/MainLayout';
import { Layers, ArrowLeft } from 'lucide-react';

export default function TopologyDocs() {
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
                <Layers size={24} />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">
                3D <br />
                <span className="text-slate-500 font-medium italic">Spatial Topology.</span>
              </h1>
            </div>

            <article className="prose prose-invert max-w-none prose-p:text-slate-400 prose-p:leading-relaxed prose-h2:text-white prose-h2:tracking-tight prose-code:text-indigo-400 prose-code:bg-indigo-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono">
              <p className="text-xl text-slate-400 font-light leading-relaxed mb-12">
                Visualization is the cornerstone of structural clarity. Our engine maps repository history onto a 3D coordinate system, ensuring branch separation through mathematical distribution.
              </p>

              <h2>The Spatial Projection Engine</h2>
              <p>
                Unlike 2D visualizations that suffer from branch "overlap" as the tree scales, our 3D engine uses a specialized distribution model to ensure spatial clarity.
              </p>

              <h2>Golden Angle Distribution</h2>
              <p>
                To prevent branches from "clumping" together in 3D space, we utilize the <strong>Golden Angle</strong> (~137.5 degrees). When a parent node has multiple children, they are projected along a spherical spiral. This ensures:
              </p>
              <ul>
                <li><strong>Maximum Separation:</strong> Each branch is placed in a unique spatial vector.</li>
                <li><strong>Predictable Scaling:</strong> The tree maintains clarity even with hundreds of concurrent branches.</li>
                <li><strong>Symmetry:</strong> The structure naturally expands in an organic, flower-like pattern (phyllotaxis).</li>
              </ul>

              <h2>120Hz Interactive Rendering</h2>
              <p>
                Using Three.js, we render the topology with hardware-accelerated buffers. Each node is a high-performance mesh, and camera controls are optimized for panning and zooming within complex scenes.
              </p>

              <h2>Why 3D?</h2>
              <p>
                3D depth provides an extra dimension to encode data—such as branch age (Z-axis depth) or commit intensity. It transforms the repository from a list of files into an "environment" that can be explored.
              </p>
            </article>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
