import React, { useState } from 'react';
import { 
  Folder, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  FileJson, 
  FileText,
  Package,
  Layers
} from 'lucide-react';
import JSZip from 'jszip';
import { BOT_FILES, BotFile } from '../data/botFiles';

export const FileExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<BotFile>(BOT_FILES[4]); // index.js by default
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const filteredFiles = BOT_FILES.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.includes(searchQuery)
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all files into the zip
      BOT_FILES.forEach(file => {
        zip.file(file.path, file.content);
      });

      // Generate zip package
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'discord-bot-master.zip';
      link.click();
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.json')) return <FileJson className="w-4 h-4 text-amber-400" />;
    if (fileName.endsWith('.js') || fileName.endsWith('.ts')) return <FileCode className="w-4 h-4 text-indigo-400" />;
    if (fileName.endsWith('.md')) return <FileText className="w-4 h-4 text-emerald-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            مستكشف الملفات والكود المصدري (Source Code Inspector)
          </div>
          <h2 className="text-xl font-bold text-white">تصفح ملفات المشروع بالكامل وهيكلية الكود</h2>
          <p className="text-slate-400 text-sm mt-1">
            جميع الملفات منظمة وفق معمارية معيارية قابلة للتوسع ومجهزة للرفع المباشر إلى GitHub وRender.
          </p>
        </div>

        <button
          id="export-zip-btn"
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          {isZipping ? 'جاري تحضير الملفات...' : 'تحميل المشروع بالكامل (ZIP)'}
        </button>
      </div>

      {/* Grid: File Tree + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Files List */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="بحث في ملفات البوت..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1 font-mono text-xs">
            {filteredFiles.map(file => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-right p-2.5 rounded-xl transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950/40 border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getFileIcon(file.name)}
                    <span className="truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Inspector */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* File Top Bar */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon(selectedFile.name)}
              <span className="font-mono text-sm font-bold text-white">{selectedFile.path}</span>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الكود</span>
                </>
              )}
            </button>
          </div>

          {/* File Description Tag */}
          <div className="bg-indigo-950/30 border-b border-indigo-900/30 px-5 py-2 text-xs text-indigo-300">
            ℹ️ {selectedFile.description}
          </div>

          {/* Code Viewer Container */}
          <div className="p-5 overflow-x-auto max-h-[540px] overflow-y-auto">
            <pre className="text-xs font-mono leading-relaxed text-slate-300">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
