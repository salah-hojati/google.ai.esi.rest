import React, { useState, useEffect } from 'react';
import { ResourceClass, FilterDefinition } from './types/jersey';
import { INITIAL_RESOURCES, INITIAL_FILTERS } from './data/sampleResources';
import { PRACTICE_CHALLENGES } from './data/practiceChallenges';
import { Navbar, ActiveTabType } from './components/Navbar';
import { SandboxView } from './components/SandboxView';
import { PracticeLabsView } from './components/PracticeLabsView';
import { ClientStudioView } from './components/ClientStudioView';
import { HandbookView } from './components/HandbookView';
import { AiMentorModal } from './components/AiMentorModal';
import { ProjectExportModal } from './components/ProjectExportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('sandbox');
  const [resources, setResources] = useState<ResourceClass[]>(INITIAL_RESOURCES);
  const [filters, setFilters] = useState<FilterDefinition[]>(INITIAL_FILTERS);

  // AI Mentor state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiContextCode, setAiContextCode] = useState<string | undefined>(undefined);
  const [aiTopic, setAiTopic] = useState<string | undefined>(undefined);

  // Project Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Completed Labs count
  const [completedLabsCount, setCompletedLabsCount] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jersey_completed_labs');
      if (saved) {
        const set = new Set(JSON.parse(saved));
        setCompletedLabsCount(set.size);
      }
    } catch {}
  }, [activeTab]);

  const handleToggleFilter = (filterId: string) => {
    setFilters(prev =>
      prev.map(f => (f.id === filterId ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const handleOpenAiMentor = (code?: string, topic?: string) => {
    setAiContextCode(code);
    setAiTopic(topic);
    setIsAiModalOpen(true);
  };

  const handleNavigateToSandbox = (path?: string) => {
    setActiveTab('sandbox');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAiMentor={() => handleOpenAiMentor()}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        completedLabsCount={completedLabsCount}
        totalLabsCount={PRACTICE_CHALLENGES.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'sandbox' && (
          <SandboxView
            resources={resources}
            filters={filters}
            onToggleFilter={handleToggleFilter}
            onOpenAiMentor={handleOpenAiMentor}
          />
        )}

        {activeTab === 'labs' && (
          <PracticeLabsView
            onOpenAiMentor={handleOpenAiMentor}
          />
        )}

        {activeTab === 'client' && (
          <ClientStudioView
            resources={resources}
            filters={filters}
            onOpenAiMentor={handleOpenAiMentor}
          />
        )}

        {activeTab === 'handbook' && (
          <HandbookView
            onOpenAiMentor={handleOpenAiMentor}
            onNavigateToSandbox={handleNavigateToSandbox}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900 bg-stone-950 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Jersey REST Practice Studio — Java EE & Jakarta EE Mastery Platform</span>
          <span>Supports JAX-RS 2.1 (Java EE 8) & JAX-RS 3.1 (Jakarta EE 10)</span>
        </div>
      </footer>

      {/* AI Mentor Chat Modal */}
      <AiMentorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialCode={aiContextCode}
        initialTopic={aiTopic}
      />

      {/* Project Export Dialog */}
      <ProjectExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        resources={resources}
        filters={filters}
      />
    </div>
  );
}
