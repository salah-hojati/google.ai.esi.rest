import React, { useState } from 'react';
import { HandbookTopic } from '../types/jersey';
import { HANDBOOK_TOPICS } from '../data/jerseyTopics';
import { CodeViewer } from './CodeViewer';
import { 
  BookOpen, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Tag, 
  ExternalLink,
  Code2
} from 'lucide-react';

interface HandbookViewProps {
  onOpenAiMentor: (contextCode?: string, topic?: string) => void;
  onNavigateToSandbox: (path?: string) => void;
}

export const HandbookView: React.FC<HandbookViewProps> = ({
  onOpenAiMentor,
  onNavigateToSandbox
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Core Endpoints', 'Parameters & Context', 'Filters & Interceptors', 'Client API', 'Exceptions & Validation', 'Async & SSE'];

  const filteredTopics = HANDBOOK_TOPICS.filter(t => {
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.annotations.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-stone-100 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>Jersey & JAX-RS Enterprise Architectural Handbook</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Complete guide to annotations, filter request/response chains, interceptors, async SSE streams, and client integrations with production best practices.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search annotations (e.g. @PreMatching)..."
            className="w-full bg-stone-950 text-stone-200 text-xs pl-9 pr-4 py-2 rounded-lg border border-stone-800 focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-stone-700">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTopics.map(topic => (
          <div
            key={topic.id}
            className="rounded-xl border border-stone-800 bg-stone-900 p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-stone-700 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                  {topic.category}
                </span>

                <button
                  onClick={() => onOpenAiMentor(topic.codeExample, topic.title)}
                  className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Deep Dive AI</span>
                </button>
              </div>

              <h3 className="text-base font-bold text-stone-100">
                {topic.title}
              </h3>

              <p className="text-xs text-stone-300 leading-relaxed">
                {topic.summary}
              </p>

              {/* Annotation Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {topic.annotations.map((ann, aIdx) => (
                  <span
                    key={aIdx}
                    className="font-mono text-[11px] px-2 py-0.5 rounded bg-stone-950 text-sky-400 border border-stone-800"
                  >
                    {ann}
                  </span>
                ))}
              </div>

              {/* Code Snippet */}
              <div className="pt-2">
                <CodeViewer
                  code={topic.codeExample}
                  language="java"
                  title="Java EE Example"
                  maxHeight="220px"
                />
              </div>

              {/* Best Practices & Pitfalls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-stone-950/80 rounded-lg border border-stone-800/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Best Practices:</span>
                  </span>
                  {topic.bestPractices.map((bp, bpIdx) => (
                    <p key={bpIdx} className="text-[11px] text-stone-400 pl-2 border-l border-emerald-800/40">
                      {bp}
                    </p>
                  ))}
                </div>

                <div className="p-3 bg-stone-950/80 rounded-lg border border-stone-800/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-rose-400 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Common Pitfalls:</span>
                  </span>
                  {topic.pitfalls.map((pf, pfIdx) => (
                    <p key={pfIdx} className="text-[11px] text-stone-400 pl-2 border-l border-rose-800/40">
                      {pf}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            {topic.liveSandboxPath && (
              <div className="pt-3 border-t border-stone-800/80 flex items-center justify-end">
                <button
                  onClick={() => onNavigateToSandbox(topic.liveSandboxPath)}
                  className="flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  <span>Try in Sandbox</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
