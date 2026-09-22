import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ScrollText, 
  Terminal, 
  Layers, 
  Rocket, 
  CheckCircle2, 
  Shield, 
  Server, 
  Zap, 
  ExternalLink,
  Code2,
  Database,
  Cpu
} from 'lucide-react';
import { WelcomeStudio } from './components/WelcomeStudio';
import { LogsSimulator } from './components/LogsSimulator';
import { CommandsSimulator } from './components/CommandsSimulator';
import { FileExplorer } from './components/FileExplorer';
import { DeploymentGuide } from './components/DeploymentGuide';

export default function App() {
  const [activeTab, setActiveTab] = useState<'welcome' | 'logs' | 'commands' | 'explorer' | 'deploy'>('welcome');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header / Brand Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide">Discord Bot Master</h1>
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Node.js & Discord.js v14
                </span>
              </div>
              <p className="text-xs text-slate-400">
                مشروع بوت مستقل كامل • نظام Welcome Cards • سجلات 15+ حدث • أوامر Moderation • معمارية Levels • جاهز لـ Render
              </p>
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono flex items-center gap-1.5">
              <Database className="w-3 h-3 text-indigo-400" />
              Modular DB
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-400" />
              No Admin Req.
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono flex items-center gap-1.5">
              <Server className="w-3 h-3 text-cyan-400" />
              Render Ready
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none" aria-label="Tabs">
            {[
              { id: 'welcome', label: 'استوديو بطاقات الترحيب', icon: Sparkles },
              { id: 'logs', label: 'سجلات الأحداث (15+ Logs)', icon: ScrollText },
              { id: 'commands', label: 'أوامر الإشراف والـ Slash', icon: Terminal },
              { id: 'explorer', label: 'مستكشف الكود والملفات', icon: Layers },
              { id: 'deploy', label: 'دليل النشر (GitHub & Render)', icon: Rocket }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'welcome' && <WelcomeStudio />}
        {activeTab === 'logs' && <LogsSimulator />}
        {activeTab === 'commands' && <CommandsSimulator />}
        {activeTab === 'explorer' && <FileExplorer />}
        {activeTab === 'deploy' && <DeploymentGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>مشروع ديسكورد بوت مستقل • Node.js & Discord.js v14 • جميع الملفات مدمجة ومجهزة للإنتاج</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Render Web Service Port 3000</span>
            <span>•</span>
            <span>Zero Secrets in Git</span>
            <span>•</span>
            <span>Modular Repository</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
