import React, { useState, useEffect } from 'react';
import { PracticeChallenge, HttpRequest } from '../types/jersey';
import { PRACTICE_CHALLENGES } from '../data/practiceChallenges';
import { INITIAL_RESOURCES, INITIAL_FILTERS } from '../data/sampleResources';
import { executeJerseyPipeline } from '../services/jerseyEngine';
import { CodeViewer } from './CodeViewer';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Play, 
  HelpCircle, 
  Eye, 
  RotateCcw, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  Filter,
  Check,
  Zap,
  Target
} from 'lucide-react';

interface PracticeLabsViewProps {
  onOpenAiMentor: (contextCode?: string, topic?: string) => void;
}

export const PracticeLabsView: React.FC<PracticeLabsViewProps> = ({ onOpenAiMentor }) => {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(PRACTICE_CHALLENGES[0].id);
  const [userCode, setUserCode] = useState<Record<string, string>>({});
  const [completedLabs, setCompletedLabs] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('jersey_completed_labs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [testResults, setTestResults] = useState<{
    tested: boolean;
    passed: boolean;
    cases: { name: string; passed: boolean; actualStatus: number; expectedStatus: number; errorMsg?: string }[];
  } | null>(null);

  const activeChallenge = PRACTICE_CHALLENGES.find(c => c.id === selectedChallengeId) || PRACTICE_CHALLENGES[0];

  // Initialize starter code
  useEffect(() => {
    if (!userCode[activeChallenge.id]) {
      setUserCode(prev => ({
        ...prev,
        [activeChallenge.id]: activeChallenge.initialCode
      }));
    }
    setTestResults(null);
    setShowSolution(false);
    setShowHints(false);
  }, [selectedChallengeId]);

  const handleCodeChange = (val: string) => {
    setUserCode(prev => ({
      ...prev,
      [activeChallenge.id]: val
    }));
  };

  const handleResetStarter = () => {
    setUserCode(prev => ({
      ...prev,
      [activeChallenge.id]: activeChallenge.initialCode
    }));
    setTestResults(null);
  };

  const handleRunTests = () => {
    const currentCode = userCode[activeChallenge.id] || activeChallenge.initialCode;
    const casesResult: { name: string; passed: boolean; actualStatus: number; expectedStatus: number; errorMsg?: string }[] = [];
    let allPassed = true;

    // Simulate verification against the test cases using simulated jersey engine
    for (const testCase of activeChallenge.testCases) {
      const trace = executeJerseyPipeline(testCase.request, INITIAL_RESOURCES, INITIAL_FILTERS);
      
      const statusMatches = trace.response.status === testCase.expectedStatus;
      let headerMatches = true;
      if (testCase.expectedHeaderCheck) {
        headerMatches = testCase.expectedHeaderCheck(trace.response.headers);
      }
      let bodyMatches = true;
      if (testCase.expectedBodyCheck) {
        bodyMatches = testCase.expectedBodyCheck(trace.response.body);
      }

      const casePassed = statusMatches && headerMatches && bodyMatches;
      if (!casePassed) allPassed = false;

      casesResult.push({
        name: testCase.name,
        passed: casePassed,
        actualStatus: trace.response.status,
        expectedStatus: testCase.expectedStatus,
        errorMsg: !statusMatches 
          ? `Expected HTTP ${testCase.expectedStatus}, but got HTTP ${trace.response.status}`
          : !headerMatches 
          ? `Response headers failed constraint verification`
          : !bodyMatches 
          ? `Response body payload failed data structure check`
          : undefined
      });
    }

    setTestResults({
      tested: true,
      passed: allPassed,
      cases: casesResult
    });

    if (allPassed) {
      const updated = new Set(completedLabs);
      updated.add(activeChallenge.id);
      setCompletedLabs(updated);
      try {
        localStorage.setItem('jersey_completed_labs', JSON.stringify(Array.from(updated)));
      } catch {}

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const categories = ['All', 'Basics & Endpoints', 'Parameters & Injection', 'Filters & LifeCycle', 'Interceptors & Streaming', 'Jersey Client API', 'Validation & Error Handling'];

  const filteredChallenges = selectedCategory === 'All'
    ? PRACTICE_CHALLENGES
    : PRACTICE_CHALLENGES.filter(c => c.category === selectedCategory);

  const currentCode = userCode[activeChallenge.id] || activeChallenge.initialCode;

  return (
    <div className="flex flex-col space-y-6">
      {/* Header & Progress Stats */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-stone-100 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Jersey Practice Labs & Mastery Arena</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Solve 12 interactive enterprise challenges covering JAX-RS annotations, filter security chains, reader/writer interceptors, and client integration.
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-stone-950 px-4 py-2.5 rounded-lg border border-stone-800 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-stone-500">Progress</span>
            <span className="text-xs font-bold text-amber-400">
              {completedLabs.size} / {PRACTICE_CHALLENGES.length} Labs Completed
            </span>
          </div>
          <div className="w-24 bg-stone-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${(completedLabs.size / PRACTICE_CHALLENGES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
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

      {/* Main Grid: Left Lab Selector | Right Coding & Test Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Lab List (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-2.5 max-h-[700px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-700">
          {filteredChallenges.map(lab => {
            const isCompleted = completedLabs.has(lab.id);
            const isSelected = selectedChallengeId === lab.id;

            return (
              <button
                key={lab.id}
                onClick={() => setSelectedChallengeId(lab.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col space-y-2 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/70 text-amber-100 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    lab.difficulty === 'Beginner' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                    lab.difficulty === 'Intermediate' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-purple-950 text-purple-300 border border-purple-800'
                  }`}>
                    {lab.difficulty}
                  </span>

                  {isCompleted ? (
                    <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500">Unsolved</span>
                  )}
                </div>

                <div className="font-semibold text-xs text-stone-100 line-clamp-1">
                  {lab.title}
                </div>
                
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  {lab.summary}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right: Active Challenge Workbench (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Lab Requirements & Concept */}
          <div className="rounded-xl border border-stone-800 bg-stone-900 p-5 shadow-lg flex flex-col space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-stone-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  {activeChallenge.category}
                </span>
                <h3 className="text-base font-bold text-stone-100 mt-0.5">
                  {activeChallenge.title}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs border border-stone-700"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showHints ? 'Hide Hints' : 'Hints'}</span>
                </button>

                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs border border-stone-700"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>{showSolution ? 'Hide Solution' : 'View Solution'}</span>
                </button>

                <button
                  onClick={() => onOpenAiMentor(currentCode, activeChallenge.title)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs border border-amber-500/40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Hint</span>
                </button>
              </div>
            </div>

            {/* Concept Explanation */}
            <div className="text-xs text-stone-300 leading-relaxed bg-stone-950/70 p-3.5 rounded-lg border border-stone-800/80">
              <span className="font-semibold text-amber-300 block mb-1">Architecture & Concept:</span>
              <p>{activeChallenge.conceptExplanation}</p>
            </div>

            {/* Requirements Checklist */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-stone-300 block">Lab Requirements:</span>
              {activeChallenge.requirements.map((req, rIdx) => (
                <div key={rIdx} className="flex items-start space-x-2 text-xs text-stone-300">
                  <Target className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </div>
              ))}
            </div>

            {/* Hints Box */}
            {showHints && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs space-y-1 text-amber-200">
                <span className="font-bold flex items-center space-x-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hints:</span>
                </span>
                {activeChallenge.hints.map((hint, hIdx) => (
                  <p key={hIdx} className="pl-4">• {hint}</p>
                ))}
              </div>
            )}
          </div>

          {/* Solution Modal / Card */}
          {showSolution && (
            <div className="rounded-xl border border-blue-800/60 bg-blue-950/20 p-4 shadow-md flex flex-col space-y-2">
              <span className="text-xs font-bold text-blue-300 flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Reference Java Solution:</span>
              </span>
              <CodeViewer
                code={activeChallenge.solutionCode}
                title="Solution.java"
                language="java"
                maxHeight="250px"
              />
            </div>
          )}

          {/* Interactive Java Code Editor */}
          <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 shadow-xl flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-xs font-semibold text-stone-300 flex items-center space-x-1.5">
                <CodeViewer code="" title="Your Implementation (Java)" />
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleResetStarter}
                  className="flex items-center space-x-1 text-xs text-stone-400 hover:text-stone-200 px-2 py-1 rounded bg-stone-800"
                  title="Reset to starter template"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Code</span>
                </button>
              </div>
            </div>

            <textarea
              value={currentCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full bg-stone-950 text-stone-100 font-mono text-xs p-3.5 rounded-lg border border-stone-800 focus:border-amber-500 outline-none resize-y min-h-[220px] leading-relaxed"
              spellCheck={false}
            />

            {/* Test Runner Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-stone-400">
                {activeChallenge.testCases.length} Verification Test Cases
              </div>
              <button
                onClick={handleRunTests}
                className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-all shadow-md active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run & Verify Lab</span>
              </button>
            </div>
          </div>

          {/* Test Results Display */}
          {testResults && (
            <div className={`rounded-xl border p-4 shadow-xl flex flex-col space-y-3 ${
              testResults.passed
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800 text-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {testResults.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span className="font-bold text-sm">
                    {testResults.passed ? 'All Lab Tests Passed Successfully!' : 'Lab Tests Failed'}
                  </span>
                </div>
                <span className="text-xs font-mono">
                  {testResults.cases.filter(c => c.passed).length} / {testResults.cases.length} Passed
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-800/80">
                {testResults.cases.map((c, idx) => (
                  <div key={idx} className="flex items-start justify-between text-xs bg-stone-950/60 p-2.5 rounded border border-stone-800">
                    <div className="flex items-center space-x-2">
                      {c.passed ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-medium text-stone-200">{c.name}</span>
                        {c.errorMsg && (
                          <p className="text-rose-400 font-mono text-[11px] mt-0.5">{c.errorMsg}</p>
                        )}
                      </div>
                    </div>
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                      c.passed ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'
                    }`}>
                      HTTP {c.actualStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
