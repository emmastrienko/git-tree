'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MainLayout } from '@/components/layout/MainLayout';
import { MoveRight, Code2, Share2, Layers } from 'lucide-react';

export default function DocsPage() {
  const topics = [
    {
      title: "Heuristic Parser",
      slug: "parser",
      icon: <Code2 size={24} />,
      desc: "How we reconstruct branch-parent relationships from flat Git comparisons."
    },
    {
      title: "3D Topology",
      slug: "topology",
      icon: <Layers size={24} />,
      desc: "Using Golden Angle distribution and spatial projection for clear visualizations."
    },
    {
      title: "Synchronization Engine",
      slug: "sync",
      icon: <Share2 size={24} />,
      desc: "Our high-performance pipeline for batched GraphQL and REST metadata intake."
    }
  ];

  return (
    <MainLayout
      header={() => <Header minimal />}
      footer={<Footer />}
      scrollable
    >
      <div className="bg-[#020617] text-white selection:bg-indigo-500/30 min-h-screen">
        <section className="max-w-[1200px] mx-auto px-8 md:px-16 pt-40 pb-20">
          <div className="space-y-6 max-w-2xl">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none">
              Technical <br />
              <span className="text-slate-500 font-medium italic">Specifications.</span>
            </h1>
            <p className="text-xl text-slate-400 font-light leading-relaxed">
              Explore the engineering and mathematics that power the Git Tree Visualizer. 
              From heuristic parsing to spatial projection.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-32">
            {topics.map((topic) => (
              <Link 
                key={topic.slug}
                href={`/docs/${topic.slug}`}
                className="group p-10 bg-white/[0.02] border border-white/5 rounded-[32px] hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition-transform">
                  {topic.icon}
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">{topic.title}</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  {topic.desc}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 group-hover:text-white transition-colors">
                  Read Specification <MoveRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
