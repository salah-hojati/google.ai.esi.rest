import React, { useState, useEffect } from 'react';
import { 
  ResourceClass, 
  FilterDefinition, 
  HttpRequest, 
  ExecutionTrace, 
  HttpMethod 
} from '../types/jersey';
import { executeJerseyPipeline, resetDatabaseState } from '../services/jerseyEngine';
import { CodeViewer } from './CodeViewer';
import { PipelineVisualizer } from './PipelineVisualizer';
import { 
  Play, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Code2, 
  Send, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Zap,
  SlidersHorizontal,
  FileJson,
  Layers
} from 'lucide-react';

interface SandboxViewProps {
  resources: ResourceClass[];
  filters: FilterDefinition[];
  onToggleFilter: (id: string) => void;
  onOpenAiMentor: (contextCode?: string, topic?: string) => void;
}

const PRESET_REQUESTS: { name: string; method: HttpMethod; path: string; headers: Record<string, string>; body?: string }[] = [
  {
    name: '1. GET All Products (Query Filter & Cache Header)',
    method: 'GET',
    path: '/api/products?category=electronics&minPrice=100',
    headers: { 'Accept': 'application/json' }
  },
  {
    name: '2. GET Single Product by @PathParam ID',
    method: 'GET',
    path: '/api/products/1',
    headers: { 'Accept': 'application/json' }
  },
  {
    name: '3. GET /v1/items (Triggers @PreMatching URI Rewriter)',
    method: 'GET',
    path: '/v1/items',
    headers: { 'Accept': 'application/json' }
  },
  {
    name: '4. POST @Secured Product (Passes with Bearer token)',
    method: 'POST',
    path: '/api/products',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer admin-jwt-token-9988' 
    },
    body: JSON.stringify({
      name: 'Bose QuietComfort Ultra Headphones',
      category: 'electronics',
      price: 429.00,
      stock: 30
    }, null, 2)
  },
  {
    name: '5. POST @Secured Product (Aborts 401 without Token)',
    method: 'POST',
    path: '/api/products',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unauthorized Item',
      price: 199.99
    }, null, 2)
  },
  {
    name: '6. POST with X-Encrypted (Triggers ReaderInterceptor)',
    method: 'POST',
    path: '/api/products',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token-123',
      'X-Encrypted': 'true'
    },
    body: JSON.stringify({
      name: 'Encrypted Hardware Key',
      category: 'electronics',
      price: 89.00,
      stock: 50
    }, null, 2)
  },
  {
    name: '7. GET /api/stream/events (Server-Sent Events SSE)',
    method: 'GET',
    path: '/api/stream/events',
    headers: { 'Accept': 'text/event-stream' }
  },
  {
    name: '8. GET Non-Existent Product (ExceptionMapper 404)',
    method: 'GET',
    path: '/api/products/9999',
    headers: { 'Accept': 'application/json' }
  }
];

export const SandboxView: React.FC<SandboxViewProps> = ({
  resources,
  filters,
  onToggleFilter,
  onOpenAiMentor
}) => {
  // Active selected Java file tab
  const [activeTab, setActiveTab] = useState<string>('product-resource');

  // Request State
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [urlPath, setUrlPath] = useState<string>('/api/products?category=electronics&minPrice=100');
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
    { key: 'Accept', value: 'application/json' },
    { key: 'Authorization', value: 'Bearer admin-jwt-token-9988' }
  ]);
  const [bodyText, setBodyText] = useState<string>('{\n  "name": "Bose QuietComfort Ultra",\n  "category": "electronics",\n  "price": 429.00,\n  "stock": 30\n}');

  // Active Response / Trace State
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers' | 'pipeline'>('pipeline');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Send request execution helper
  const handleSendRequest = () => {
    // Parse query params and clean path
    const urlObj = new URL(urlPath.startsWith('/') ? `http://localhost:8080${urlPath}` : urlPath);
    const path = urlObj.pathname;
    const queryParams: Record<string, string> = {};
    urlObj.searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });

    const headerRecord: Record<string, string> = {};
    headers.forEach(h => {
      if (h.key.trim()) {
        headerRecord[h.key.trim()] = h.value.trim();
      }
    });

    const request: HttpRequest = {
      method,
      url: urlObj.href,
      path,
      headers: headerRecord,
      queryParams,
      body: method !== 'GET' && method !== 'HEAD' ? bodyText : undefined
    };

    const executionResult = executeJerseyPipeline(request, resources, filters);
    setTrace(executionResult);
  };

  // Run initial request on mount
  useEffect(() => {
    handleSendRequest();
  }, []);

  const handleApplyPreset = (preset: typeof PRESET_REQUESTS[0]) => {
    setMethod(preset.method);
    setUrlPath(preset.path);
    const newHeaders = Object.entries(preset.headers).map(([key, value]) => ({ key, value }));
    setHeaders(newHeaders);
    if (preset.body) {
      setBodyText(preset.body);
    }
  };

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };

  const handleResetDb = () => {
    resetDatabaseState();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2000);
    handleSendRequest();
  };

  // Find active source code for Java editor
  const currentResource = resources.find(r => r.id === activeTab);
  const currentFilter = filters.find(f => f.id === activeTab);
  const currentJavaCode = currentResource?.javaSource || currentFilter?.javaSource || '// Select a file tab';
  const currentTitle = currentResource ? `${currentResource.className}.java` : currentFilter ? `${currentFilter.className}.java` : 'Java Source';

  return (
    <div className="flex flex-col space-y-6">
      {/* Top Header Banner & Quick Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-stone-900/90 border border-stone-800 p-4 rounded-xl shadow-md">
        <div>
          <h2 className="text-base font-bold text-stone-100 flex items-center space-x-2">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400">
              <Zap className="w-4 h-4" />
            </span>
            <span>Interactive JAX-RS Sandbox & Filter Lifecycle Tracer</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Simulate real Java EE Jersey request execution through Pre-Matching filters, routing, Reader/Writer interceptors, and ContainerResponseFilters.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={handleResetDb}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs border border-stone-700 transition-colors"
            title="Reset in-memory catalog data"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetSuccess ? 'text-emerald-400 animate-spin' : ''}`} />
            <span>{resetSuccess ? 'Database Reset!' : 'Reset In-Memory DB'}</span>
          </button>

          <button
            onClick={() => onOpenAiMentor(currentJavaCode, currentTitle)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs border border-amber-500/40 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ask Jersey AI Tutor</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left (Java Code & Filter Toggles) | Right (HTTP Client & Response / Visualizer) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Java Code Browser & Filter Management (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col space-y-4">
          
          {/* File Switcher Tabs */}
          <div className="rounded-xl border border-stone-800 bg-stone-900 p-3 shadow-md flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Code2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Java Source Files & Filters</span>
              </span>
            </div>

            {/* Resources Subtabs */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 px-1 uppercase">JAX-RS Resources:</div>
              <div className="flex flex-wrap gap-1.5">
                {resources.map(res => (
                  <button
                    key={res.id}
                    onClick={() => setActiveTab(res.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                      activeTab === res.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                    }`}
                  >
                    {res.className}.java
                  </button>
                ))}
              </div>
            </div>

            {/* Filters Subtabs with Live Toggle */}
            <div className="space-y-1 pt-1 border-t border-stone-800/80">
              <div className="text-[11px] font-semibold text-stone-500 px-1 uppercase flex items-center justify-between">
                <span>Filters & Interceptors:</span>
                <span className="text-[10px] text-stone-500">Toggle enabled/disabled</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filters.map(f => (
                  <div
                    key={f.id}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-mono border transition-all ${
                      activeTab === f.id
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                        : 'bg-stone-800/60 border-stone-800 text-stone-400'
                    }`}
                  >
                    <button
                      onClick={() => setActiveTab(f.id)}
                      className="hover:text-stone-100 truncate max-w-[140px]"
                      title={f.description}
                    >
                      {f.className}.java
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFilter(f.id);
                      }}
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        f.enabled ? 'bg-emerald-500 text-stone-950' : 'bg-stone-700 text-stone-400'
                      }`}
                      title={f.enabled ? 'Filter is ACTIVE (click to disable)' : 'Filter is DISABLED (click to enable)'}
                    >
                      {f.enabled ? '✓' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Java Code Display */}
          <div className="flex-1 min-h-[420px]">
            <CodeViewer
              code={currentJavaCode}
              title={currentTitle}
              language="java"
              maxHeight="540px"
            />
          </div>
        </div>

        {/* Right Column: HTTP Request Builder & Live Response / Pipeline (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col space-y-4">
          
          {/* Quick Presets Dropdown */}
          <div className="rounded-xl border border-stone-800 bg-stone-900 p-3 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-300 flex items-center space-x-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Request Presets:</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_REQUESTS.map((preset, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleApplyPreset(preset)}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700/50 hover:border-stone-600 text-xs text-stone-300 transition-all truncate"
                  title={preset.name}
                >
                  <span className="font-mono font-bold text-amber-400 mr-1.5">[{preset.method}]</span>
                  <span>{preset.name.replace(/^[0-9]+\.\s*/, '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* HTTP Request Builder */}
          <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 shadow-xl flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              {/* Method Selector */}
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className={`font-mono font-bold text-xs px-3 py-2 rounded-lg border outline-none bg-stone-950 transition-colors ${
                  method === 'GET' ? 'text-blue-400 border-blue-800' :
                  method === 'POST' ? 'text-emerald-400 border-emerald-800' :
                  method === 'PUT' ? 'text-amber-400 border-amber-800' :
                  method === 'DELETE' ? 'text-rose-400 border-rose-800' :
                  'text-purple-400 border-purple-800'
                }`}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>

              {/* Path / URI Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={urlPath}
                  onChange={(e) => setUrlPath(e.target.value)}
                  placeholder="/api/products"
                  className="w-full bg-stone-950 text-stone-100 font-mono text-xs px-3 py-2 rounded-lg border border-stone-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendRequest}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-all shadow-md shrink-0 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>

            {/* Request Headers Configuration */}
            <div className="space-y-2 pt-1 border-t border-stone-800">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-semibold">Request Headers ({headers.length}):</span>
                <button
                  onClick={handleAddHeader}
                  className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 text-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Header</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-700">
                {headers.map((hdr, hIdx) => (
                  <div key={hIdx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Header Name"
                      value={hdr.key}
                      onChange={(e) => handleHeaderChange(hIdx, 'key', e.target.value)}
                      className="w-1/3 bg-stone-950 text-stone-200 font-mono text-xs px-2.5 py-1 rounded border border-stone-800 focus:border-stone-600 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Bearer token-xyz)"
                      value={hdr.value}
                      onChange={(e) => handleHeaderChange(hIdx, 'value', e.target.value)}
                      className="flex-1 bg-stone-950 text-stone-200 font-mono text-xs px-2.5 py-1 rounded border border-stone-800 focus:border-stone-600 outline-none"
                    />
                    <button
                      onClick={() => handleRemoveHeader(hIdx)}
                      className="text-stone-500 hover:text-rose-400 p-1"
                      title="Remove header"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Body Editor (for POST/PUT/PATCH) */}
            {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
              <div className="space-y-1 pt-2 border-t border-stone-800">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span className="font-semibold flex items-center space-x-1">
                    <FileJson className="w-3.5 h-3.5 text-stone-500" />
                    <span>JSON Request Body (@Consumes):</span>
                  </span>
                  <button
                    onClick={() => setBodyText('{\n  "name": "Sony Wireless Headphones",\n  "category": "electronics",\n  "price": 299.99,\n  "stock": 15\n}')}
                    className="text-[11px] text-stone-500 hover:text-stone-300"
                  >
                    Sample JSON
                  </button>
                </div>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={4}
                  className="w-full bg-stone-950 text-stone-200 font-mono text-xs p-2.5 rounded-lg border border-stone-800 focus:border-amber-500 outline-none resize-y"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Response & Pipeline Trace Inspector */}
          {trace && (
            <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 shadow-xl flex flex-col space-y-4">
              
              {/* Response Status Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-stone-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                    trace.response.status >= 200 && trace.response.status < 300
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : trace.response.status >= 400
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {trace.response.status} {trace.response.statusText}
                  </span>

                  <span className="text-xs text-stone-400 font-mono">
                    {trace.response.executionTimeMs} ms
                  </span>
                </div>

                {/* Tabs: Pipeline Trace | Body | Headers */}
                <div className="flex items-center space-x-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
                  <button
                    onClick={() => setActiveResponseTab('pipeline')}
                    className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                      activeResponseTab === 'pipeline'
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Pipeline Trace ({trace.steps.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveResponseTab('body')}
                    className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                      activeResponseTab === 'body'
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>Response Body</span>
                  </button>

                  <button
                    onClick={() => setActiveResponseTab('headers')}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      activeResponseTab === 'headers'
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Headers ({Object.keys(trace.response.headers).length})
                  </button>
                </div>
              </div>

              {/* Tab 1: Visual Pipeline */}
              {activeResponseTab === 'pipeline' && (
                <PipelineVisualizer trace={trace} />
              )}

              {/* Tab 2: Response Body */}
              {activeResponseTab === 'body' && (
                <div className="rounded-lg bg-stone-950 p-4 font-mono text-xs overflow-auto max-h-[350px] border border-stone-800">
                  <pre className="text-stone-200 whitespace-pre-wrap">
                    {trace.response.rawBodyText || '(Empty 204 No Content Body)'}
                  </pre>
                </div>
              )}

              {/* Tab 3: Response Headers */}
              {activeResponseTab === 'headers' && (
                <div className="rounded-lg bg-stone-950 p-3 font-mono text-xs overflow-auto max-h-[350px] border border-stone-800 space-y-1.5">
                  {Object.entries(trace.response.headers).map(([key, val]) => (
                    <div key={key} className="flex items-start space-x-2 py-1 border-b border-stone-900">
                      <span className="font-semibold text-amber-400 w-44 shrink-0">{key}:</span>
                      <span className="text-stone-300 break-all">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
