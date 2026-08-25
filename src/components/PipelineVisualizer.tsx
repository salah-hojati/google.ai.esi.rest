import React, { useState } from 'react';
import { ExecutionTrace, PipelineStepTrace } from '../types/jersey';
import { 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Server, 
  CornerDownRight,
  Clock,
  Filter,
  FileCode2
} from 'lucide-react';

interface PipelineVisualizerProps {
  trace: ExecutionTrace | null;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ trace }) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  if (!trace) {
    return (
      <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-8 text-center text-stone-400 flex flex-col items-center justify-center">
        <Activity className="w-10 h-10 text-stone-600 mb-3 animate-pulse" />
        <p className="text-sm font-medium text-stone-300">Jersey Lifecycle Pipeline is Idle</p>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          Send a simulated HTTP request above to trace how Jersey processes Pre-Matching filters, routing, security checks, entity interceptors, and response filters.
        </p>
      </div>
    );
  }

  const selectedStep = selectedStepIndex !== null && trace.steps[selectedStepIndex]
    ? trace.steps[selectedStepIndex]
    : trace.steps[trace.steps.length - 1];

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'PRE_MATCHING_FILTER':
        return <Filter className="w-4 h-4 text-purple-400" />;
      case 'RESOURCE_MATCHING':
        return <Layers className="w-4 h-4 text-blue-400" />;
      case 'POST_MATCHING_FILTER':
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      case 'READER_INTERCEPTOR':
      case 'WRITER_INTERCEPTOR':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'RESOURCE_EXECUTION':
        return <Server className="w-4 h-4 text-emerald-400" />;
      case 'RESPONSE_FILTER':
        return <Filter className="w-4 h-4 text-indigo-400" />;
      case 'EXCEPTION_MAPPER':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Activity className="w-4 h-4 text-stone-400" />;
    }
  };

  const getStatusBadge = (status: PipelineStepTrace['status']) => {
    switch (status) {
      case 'passed':
      case 'executed':
        return (
          <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3" />
            <span>Passed</span>
          </span>
        );
      case 'aborted':
        return (
          <span className="inline-flex items-center space-x-1 text-xs text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/60">
            <XCircle className="w-3 h-3" />
            <span>Aborted</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center space-x-1 text-xs text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/60">
            <AlertTriangle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center space-x-1 text-xs text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">
            <CheckCircle2 className="w-3 h-3" />
            <span>Transformed</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900 p-5 shadow-xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-stone-200">Jersey Execution Pipeline Trace</h3>
        </div>
        <div className="flex items-center space-x-3 text-xs text-stone-400">
          <span className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>Total: <strong className="text-stone-200">{trace.response.executionTimeMs} ms</strong></span>
          </span>
          <span className="bg-stone-800 text-stone-300 px-2 py-0.5 rounded text-xs">
            {trace.steps.length} Steps
          </span>
        </div>
      </div>

      {/* Horizontal Interactive Step Pipeline */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-700">
        <div className="flex items-center space-x-2 min-w-max py-1">
          {/* Incoming Request Pill */}
          <div className="px-3 py-2 rounded-lg bg-stone-800/90 border border-stone-700/60 text-xs font-mono flex items-center space-x-2 text-stone-300">
            <span className="font-bold text-amber-400">{trace.request.method}</span>
            <span className="text-stone-400 truncate max-w-[120px]">{trace.request.path}</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />

          {/* Pipeline Step Badges */}
          {trace.steps.map((step, idx) => {
            const isSelected = (selectedStepIndex === null && idx === trace.steps.length - 1) || selectedStepIndex === idx;
            const isAborted = step.status === 'aborted' || step.status === 'error';

            return (
              <React.Fragment key={idx}>
                <button
                  onClick={() => setSelectedStepIndex(idx)}
                  className={`px-3 py-2 rounded-lg border text-xs text-left transition-all flex items-center space-x-2 shrink-0 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/80 text-amber-200 ring-1 ring-amber-500/40 shadow-sm'
                      : isAborted
                      ? 'bg-rose-950/40 border-rose-800/80 text-rose-300 hover:bg-rose-900/40'
                      : 'bg-stone-800/70 border-stone-700/60 text-stone-300 hover:bg-stone-800 hover:border-stone-600'
                  }`}
                >
                  <span className="p-1 rounded bg-stone-900/80 border border-stone-700/50">
                    {getStepIcon(step.step)}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium text-xs truncate max-w-[140px] text-stone-100">
                      {step.componentName}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {step.phase}
                    </span>
                  </div>
                </button>

                {idx < trace.steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}

          <ArrowRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />

          {/* Response Pill */}
          <div className={`px-3 py-2 rounded-lg border text-xs font-mono flex items-center space-x-2 ${
            trace.response.status >= 200 && trace.response.status < 300
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
              : trace.response.status >= 400
              ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
              : 'bg-stone-800 border-stone-700 text-stone-300'
          }`}>
            <span className="font-bold">{trace.response.status}</span>
            <span>{trace.response.statusText}</span>
          </div>
        </div>
      </div>

      {/* Selected Step Detail Inspector Card */}
      {selectedStep && (
        <div className="rounded-lg bg-stone-950 border border-stone-800 p-4 text-xs flex flex-col space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded bg-stone-800 border border-stone-700">
                {getStepIcon(selectedStep.step)}
              </span>
              <div>
                <h4 className="text-sm font-semibold text-stone-100 flex items-center space-x-2">
                  <span>{selectedStep.componentName}</span>
                </h4>
                <p className="text-[11px] text-stone-400">{selectedStep.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(selectedStep.status)}
              <span className="text-stone-400 font-mono text-[11px] bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                {selectedStep.timestampMs} ms
              </span>
            </div>
          </div>

          {/* Logs / Annotations in this step */}
          {selectedStep.logs && selectedStep.logs.length > 0 && (
            <div className="space-y-1 bg-stone-900/90 rounded-md p-2.5 border border-stone-800/70 font-mono text-[11px]">
              <div className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">
                Step Diagnostic Log:
              </div>
              {selectedStep.logs.map((log, lIdx) => (
                <div key={lIdx} className="flex items-start space-x-1.5 text-stone-300">
                  <CornerDownRight className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}

          {/* Matched parameters or details */}
          {selectedStep.details && Object.keys(selectedStep.details).length > 0 && (
            <div className="bg-stone-900/60 p-2.5 rounded border border-stone-800 text-[11px]">
              <span className="text-stone-400 font-semibold block mb-1">Context Injection Details:</span>
              <pre className="text-stone-300 font-mono overflow-auto">
                {JSON.stringify(selectedStep.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
