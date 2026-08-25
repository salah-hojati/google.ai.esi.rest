import React from 'react';
import { 
  Server, 
  Terminal, 
  Trophy, 
  BookOpen, 
  Download, 
  Sparkles, 
  RotateCcw,
  Zap,
  Coffee
} from 'lucide-react';

export type ActiveTabType = 'sandbox' | 'labs' | 'client' | 'handbook';

interface NavbarProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  onOpenAiMentor: () => void;
  onOpenExportModal: () => void;
  completedLabsCount: number;
  totalLabsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiMentor,
  onOpenExportModal,
  completedLabsCount,
  totalLabsCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-950/40 border border-amber-400/40">
              <Coffee className="w-5 h-5 text-stone-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base text-stone-100 tracking-tight">
                  Jersey REST Studio
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Java EE / Jakarta EE
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                Interactive JAX-RS practice arena: Endpoints, Filters, Interceptors & Client API
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Sandbox & Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('labs')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'labs'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Practice Labs</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'labs' ? 'bg-stone-900 text-amber-400' : 'bg-stone-800 text-stone-300'
              }`}>
                {completedLabsCount}/{totalLabsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('client')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'client'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Client Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('handbook')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'handbook'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Handbook</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenExportModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
              title="Export real Maven project .zip"
            >
              <Download className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Export Maven Project</span>
            </button>

            <button
              onClick={onOpenAiMentor}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>AI Tutor</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-stone-800">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium ${
              activeTab === 'sandbox' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Sandbox</span>
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium ${
              activeTab === 'labs' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            <Trophy className="w-3 h-3" />
            <span>Labs ({completedLabsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium ${
              activeTab === 'client' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Client</span>
          </button>
          <button
            onClick={() => setActiveTab('handbook')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium ${
              activeTab === 'handbook' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Handbook</span>
          </button>
        </div>
      </div>
    </header>
  );
};
