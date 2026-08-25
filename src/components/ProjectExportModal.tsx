import React, { useState } from 'react';
import { ResourceClass, FilterDefinition } from '../types/jersey';
import { generateJerseyMavenZip, ProjectExportOptions } from '../services/projectExport';
import { 
  X, 
  Download, 
  FileArchive, 
  Check, 
  Layers, 
  Server, 
  Terminal, 
  Loader2,
  FolderGit2
} from 'lucide-react';

interface ProjectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: ResourceClass[];
  filters: FilterDefinition[];
}

export const ProjectExportModal: React.FC<ProjectExportModalProps> = ({
  isOpen,
  onClose,
  resources,
  filters
}) => {
  const [edition, setEdition] = useState<'jakarta' | 'javax'>('jakarta');
  const [server, setServer] = useState<'grizzly' | 'tomcat' | 'payara'>('grizzly');
  const [includeTests, setIncludeTests] = useState(true);
  const [includeClient, setIncludeClient] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const options: ProjectExportOptions = {
        edition,
        server,
        includeTests,
        includeClient
      };

      const zipBlob = await generateJerseyMavenZip(resources, filters, options);
      
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `jersey-practice-app-${edition}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setDownloadCompleted(true);
      setTimeout(() => setDownloadCompleted(false), 3000);
    } catch (err) {
      console.error('Failed to export project zip:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <FolderGit2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-stone-100">Export Complete Java EE / Jakarta Maven Project</h3>
              <p className="text-[11px] text-stone-400">Generate a runnable standalone Maven workspace with Jersey, Grizzly, and JUnit 5</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Body */}
        <div className="p-5 space-y-5 text-xs">
          
          {/* Specification Version Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-200 block">
              Java EE / Jakarta EE Specification:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEdition('jakarta')}
                className={`p-3 rounded-xl border text-left flex flex-col space-y-1 transition-all ${
                  edition === 'jakarta'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Jakarta EE 10 / 11</span>
                  {edition === 'jakarta' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[11px] text-stone-400 font-mono">jakarta.ws.rs.*</span>
                <span className="text-[10px] text-stone-500">Jersey 3.1.x, Java 17+</span>
              </button>

              <button
                type="button"
                onClick={() => setEdition('javax')}
                className={`p-3 rounded-xl border text-left flex flex-col space-y-1 transition-all ${
                  edition === 'javax'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Java EE 8 (Legacy)</span>
                  {edition === 'javax' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[11px] text-stone-400 font-mono">javax.ws.rs.*</span>
                <span className="text-[10px] text-stone-500">Jersey 2.39.x, Java 8/11</span>
              </button>
            </div>
          </div>

          {/* Runtime Container Engine */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-200 block">
              Server HTTP Container:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'grizzly', name: 'Embedded Grizzly', desc: 'Fast standalone runner' },
                { id: 'tomcat', name: 'Tomcat WAR', desc: 'Servlet Container' },
                { id: 'payara', name: 'Payara / GlassFish', desc: 'Full EE Application Server' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServer(s.id as any)}
                  className={`p-2.5 rounded-lg border text-left flex flex-col space-y-0.5 transition-all ${
                    server === s.id
                      ? 'bg-stone-800 border-amber-500/80 text-amber-200'
                      : 'bg-stone-950 border-stone-800 text-stone-400'
                  }`}
                >
                  <span className="font-bold text-xs text-stone-200">{s.name}</span>
                  <span className="text-[10px] text-stone-500">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Checkbox Inclusions */}
          <div className="space-y-2 pt-2 border-t border-stone-800">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTests}
                onChange={(e) => setIncludeTests(e.target.checked)}
                className="w-4 h-4 rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="font-semibold text-stone-200">Include Automated JerseyTest Test Suite</span>
                <p className="text-[10px] text-stone-400">JUnit 5 + JerseyTest framework for integration verification</p>
              </div>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeClient}
                onChange={(e) => setIncludeClient(e.target.checked)}
                className="w-4 h-4 rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="font-semibold text-stone-200">Include Standalone Jersey Client API Runner</span>
                <p className="text-[10px] text-stone-400">Pre-configured WebTarget client class with filters</p>
              </div>
            </label>
          </div>

          {/* Quick Terminal Run Instructions Preview */}
          <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 font-mono text-[11px] text-stone-400 space-y-1">
            <span className="text-stone-500 uppercase text-[10px] font-bold block">Run Instructions after download:</span>
            <p className="text-stone-200">$ unzip jersey-practice-app-{edition}.zip</p>
            <p className="text-stone-200">$ cd jersey-practice-app && mvn clean compile exec:java</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            {resources.length} Resources, {filters.length} Filters & Interceptors included
          </span>

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : downloadCompleted ? (
              <Check className="w-4 h-4 text-stone-950" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExporting ? 'Generating ZIP...' : downloadCompleted ? 'Downloaded!' : 'Download Maven ZIP'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
