import React, { useState } from 'react';
import { ResourceClass, FilterDefinition, HttpRequest, ExecutionTrace } from '../types/jersey';
import { executeJerseyPipeline } from '../services/jerseyEngine';
import { CodeViewer } from './CodeViewer';
import { 
  Terminal, 
  Send, 
  Layers, 
  Zap, 
  Plus, 
  Trash2, 
  Check, 
  ShieldCheck, 
  ArrowRight,
  Code2,
  Cpu,
  Clock
} from 'lucide-react';

interface ClientStudioViewProps {
  resources: ResourceClass[];
  filters: FilterDefinition[];
  onOpenAiMentor: (contextCode?: string, topic?: string) => void;
}

export const ClientStudioView: React.FC<ClientStudioViewProps> = ({
  resources,
  filters,
  onOpenAiMentor
}) => {
  const [baseUri, setBaseUri] = useState('http://localhost:8080/api');
  const [pathSegment, setPathSegment] = useState('products');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [invocationMode, setInvocationMode] = useState<'sync' | 'async' | 'reactive'>('sync');
  const [mediaType, setMediaType] = useState('MediaType.APPLICATION_JSON');
  const [queryParams, setQueryParams] = useState<{ key: string; value: string }[]>([
    { key: 'category', value: 'electronics' },
    { key: 'minPrice', value: '50' }
  ]);
  const [clientFilters, setClientFilters] = useState<{ name: string; type: string; enabled: boolean }[]>([
    { name: 'BearerAuthClientFilter ("token-xyz")', type: 'ClientRequestFilter', enabled: true },
    { name: 'LatencyMetricsClientFilter', type: 'ClientResponseFilter', enabled: true }
  ]);
  const [requestPayload, setRequestPayload] = useState('{\n  "name": "Wireless Charging Pad",\n  "category": "electronics",\n  "price": 49.99,\n  "stock": 100\n}');
  
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [clientLogs, setClientLogs] = useState<string[]>([]);

  // Real-time generated Java Jersey Client code
  const generateJavaClientCode = () => {
    let qpChain = queryParams
      .filter(q => q.key.trim())
      .map(q => `\n    .queryParam("${q.key}", "${q.value}")`)
      .join('');

    let clientConfigCode = `// 1. Initialize Client & Configuration
ClientConfig config = new ClientConfig();`;

    if (clientFilters.some(f => f.enabled)) {
      clientFilters.filter(f => f.enabled).forEach(f => {
        if (f.name.includes('BearerAuth')) {
          clientConfigCode += `\nconfig.register(new BearerAuthClientFilter("token-xyz"));`;
        } else {
          clientConfigCode += `\nconfig.register(new LatencyMetricsClientFilter());`;
        }
      });
    }

    clientConfigCode += `\nClient client = ClientBuilder.newClient(config);`;

    let targetCode = `// 2. Build Fluent WebTarget
WebTarget target = client.target("${baseUri}")
    .path("${pathSegment}")${qpChain};`;

    let invocationCode = '';
    if (invocationMode === 'sync') {
      if (httpMethod === 'GET') {
        invocationCode = `// 3. Synchronous Invocation
Response response = target.request(${mediaType})
    .header("User-Agent", "JerseyClient/3.1")
    .get();

if (response.getStatus() == 200) {
    List<Product> products = response.readEntity(new GenericType<List<Product>>() {});
    System.out.println("Received: " + products.size() + " items");
} else {
    System.err.println("Request failed with status: " + response.getStatus());
}`;
      } else if (httpMethod === 'POST') {
        invocationCode = `// 3. Synchronous POST with Entity
Product newProduct = new Product("Wireless Charging Pad", "electronics", 49.99);
Response response = target.request(${mediaType})
    .post(Entity.json(newProduct));

URI location = response.getLocation();
System.out.println("Created at: " + location);`;
      } else {
        invocationCode = `// 3. Synchronous ${httpMethod} Invocation
Response response = target.request(${mediaType}).${httpMethod.toLowerCase()}();`;
      }
    } else if (invocationMode === 'async') {
      invocationCode = `// 3. Asynchronous Non-Blocking Invocation Callback
target.request(${mediaType}).async().get(new InvocationCallback<Response>() {
    @Override
    public void completed(Response response) {
        System.out.println("Async response received: HTTP " + response.getStatus());
    }

    @Override
    public void failed(Throwable throwable) {
        throwable.printStackTrace();
    }
});`;
    } else {
      invocationCode = `// 3. Reactive CompletionStage / RxClient
CompletionStage<Response> stage = target.request(${mediaType})
    .rx()
    .get();

stage.thenAccept(response -> {
    System.out.println("Reactive response status: " + response.getStatus());
}).exceptionally(ex -> {
    System.err.println("Reactive error: " + ex.getMessage());
    return null;
});`;
    }

    return `package com.example.jersey.client;

import jakarta.ws.rs.client.*;
import jakarta.ws.rs.core.*;
import org.glassfish.jersey.client.ClientConfig;
import java.net.URI;
import java.util.List;
import java.util.concurrent.CompletionStage;

public class JerseyEnterpriseClientRunner {

    public static void main(String[] args) {
${clientConfigCode}

${targetCode}

${invocationCode}

        // Always close client to release connection pool
        client.close();
    }
}`;
  };

  const handleExecuteClient = () => {
    const qpRecord: Record<string, string> = {};
    queryParams.forEach(q => {
      if (q.key.trim()) qpRecord[q.key.trim()] = q.value.trim();
    });

    const queryString = new URLSearchParams(qpRecord).toString();
    const fullPath = `/${pathSegment.replace(/^\//, '')}`;
    const url = `${baseUri.replace(/\/$/, '')}${fullPath}${queryString ? `?${queryString}` : ''}`;

    const headers: Record<string, string> = {
      'Accept': mediaType.includes('JSON') ? 'application/json' : 'application/xml',
      'User-Agent': 'JerseyClient/3.1.5 (Jakarta REST Client)'
    };

    if (clientFilters.some(f => f.enabled && f.name.includes('BearerAuth'))) {
      headers['Authorization'] = 'Bearer admin-jwt-token-9988';
    }

    const req: HttpRequest = {
      method: httpMethod,
      url,
      path: `/api/${pathSegment.replace(/^\//, '')}`,
      headers,
      queryParams: qpRecord,
      body: httpMethod === 'POST' || httpMethod === 'PUT' ? requestPayload : undefined
    };

    const logs: string[] = [
      `ClientBuilder initialized with ${clientFilters.filter(f => f.enabled).length} ClientFilters`,
      `WebTarget resolved target URL: ${url}`,
      `Executing ${invocationMode.toUpperCase()} invocation -> ${httpMethod} ${mediaType}`
    ];

    const result = executeJerseyPipeline(req, resources, filters);
    logs.push(`Client received HTTP ${result.response.status} ${result.response.statusText} in ${result.response.executionTimeMs}ms`);

    setClientLogs(logs);
    setTrace(result);
  };

  const handleAddQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '' }]);
  };

  const handleRemoveQueryParam = (idx: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== idx));
  };

  const handleToggleFilter = (idx: number) => {
    const updated = [...clientFilters];
    updated[idx].enabled = !updated[idx].enabled;
    setClientFilters(updated);
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-stone-100 flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <span>Jersey Client API Studio & WebTarget Builder</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Visually assemble type-safe Jersey Client HTTP invocations with WebTarget chaining, ClientRequestFilters, and async/reactive Rx execution.
          </p>
        </div>

        <button
          onClick={() => onOpenAiMentor(generateJavaClientCode(), 'Jersey Client API')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs border border-amber-500/40 shrink-0"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Explain Client Code</span>
        </button>
      </div>

      {/* Grid: Visual Configuration Workbench | Java Client Code Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left: Configuration Form (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col space-y-4">
          <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                WebTarget & Invocation Settings
              </span>
            </div>

            {/* Target Path & Method */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-400 block mb-1">Base Target URI</label>
                <input
                  type="text"
                  value={baseUri}
                  onChange={(e) => setBaseUri(e.target.value)}
                  className="w-full bg-stone-950 text-stone-200 font-mono text-xs px-3 py-2 rounded-lg border border-stone-800 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-400 block mb-1">.path(...) Segment</label>
                  <input
                    type="text"
                    value={pathSegment}
                    onChange={(e) => setPathSegment(e.target.value)}
                    placeholder="products"
                    className="w-full bg-stone-950 text-stone-200 font-mono text-xs px-3 py-2 rounded-lg border border-stone-800 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-400 block mb-1">HTTP Verb</label>
                  <select
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value as any)}
                    className="w-full bg-stone-950 text-amber-400 font-mono font-bold text-xs px-3 py-2 rounded-lg border border-stone-800 focus:border-amber-500 outline-none"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Invocation Mode Selector */}
            <div className="space-y-1.5 pt-2 border-t border-stone-800">
              <label className="text-[11px] font-semibold text-stone-400 block">Invocation Strategy</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sync', label: 'Synchronous', desc: 'target.request().get()' },
                  { id: 'async', label: 'Async Callback', desc: 'InvocationCallback<T>' },
                  { id: 'reactive', label: 'Reactive Rx', desc: 'target.request().rx()' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setInvocationMode(mode.id as any)}
                    className={`p-2 rounded-lg border text-left flex flex-col transition-all ${
                      invocationMode === mode.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span className="text-xs font-bold">{mode.label}</span>
                    <span className="text-[9px] text-stone-500 truncate">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Query Parameters */}
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-semibold">.queryParam(...) Builder:</span>
                <button
                  onClick={handleAddQueryParam}
                  className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 text-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Param</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {queryParams.map((qp, qIdx) => (
                  <div key={qIdx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="key"
                      value={qp.key}
                      onChange={(e) => {
                        const updated = [...queryParams];
                        updated[qIdx].key = e.target.value;
                        setQueryParams(updated);
                      }}
                      className="w-1/2 bg-stone-950 text-stone-200 font-mono text-xs px-2.5 py-1 rounded border border-stone-800 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={qp.value}
                      onChange={(e) => {
                        const updated = [...queryParams];
                        updated[qIdx].value = e.target.value;
                        setQueryParams(updated);
                      }}
                      className="w-1/2 bg-stone-950 text-stone-200 font-mono text-xs px-2.5 py-1 rounded border border-stone-800 outline-none"
                    />
                    <button
                      onClick={() => handleRemoveQueryParam(qIdx)}
                      className="text-stone-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Registered Client Filters */}
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <span className="text-[11px] font-semibold text-stone-400 block">Registered Client Filters</span>
              <div className="space-y-1.5">
                {clientFilters.map((cf, cIdx) => (
                  <div
                    key={cIdx}
                    onClick={() => handleToggleFilter(cIdx)}
                    className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer text-xs transition-all ${
                      cf.enabled
                        ? 'bg-stone-950 border-emerald-800/80 text-emerald-300'
                        : 'bg-stone-950/60 border-stone-800 text-stone-500'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className={`w-3.5 h-3.5 ${cf.enabled ? 'text-emerald-400' : 'text-stone-600'}`} />
                      <span className="font-mono text-[11px]">{cf.name}</span>
                    </div>
                    <span className="text-[10px] font-bold">
                      {cf.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleExecuteClient}
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-all shadow-md active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Execute Jersey Client Invocation</span>
            </button>
          </div>
        </div>

        {/* Right: Generated Java Client Code & Live Execution Output (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col space-y-4">
          
          {/* Java Client Code Viewer */}
          <div className="flex-1">
            <CodeViewer
              code={generateJavaClientCode()}
              title="JerseyEnterpriseClientRunner.java"
              language="java"
              maxHeight="320px"
            />
          </div>

          {/* Client Execution Diagnostic Terminal */}
          {trace && (
            <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 shadow-xl font-mono text-xs flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-stone-200">Client Runtime Execution Terminal</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  trace.response.status === 200 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                }`}>
                  HTTP {trace.response.status} ({trace.response.executionTimeMs} ms)
                </span>
              </div>

              {/* Client Logs */}
              <div className="space-y-1 text-stone-400 text-[11px]">
                {clientLogs.map((log, lIdx) => (
                  <div key={lIdx} className="flex items-center space-x-2">
                    <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>

              {/* Server Received Entity Output */}
              <div className="pt-2 border-t border-stone-800/80">
                <span className="text-stone-500 text-[10px] uppercase font-semibold block mb-1">
                  Deserialized Response Entity:
                </span>
                <pre className="p-3 bg-stone-900 rounded border border-stone-800 text-stone-200 overflow-auto max-h-44 text-[11px]">
                  {trace.response.rawBodyText || '(Empty Entity)'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
