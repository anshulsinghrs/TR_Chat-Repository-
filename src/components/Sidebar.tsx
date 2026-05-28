import React from 'react';
import { Terminal, Code, Cpu, ShieldAlert, Wifi, Database, Radio, Laptop, Smartphone, Tablet, ChevronRight } from 'lucide-react';
import { NetworkNode } from '../types';

interface SidebarProps {
  activeTab: 'simulator' | 'explorer' | 'guide';
  setActiveTab: (tab: 'simulator' | 'explorer' | 'guide') => void;
  networkNodes: NetworkNode[];
  dbCount: number;
  uploadedDoc: string | null;
  ollamaStatus: 'connected' | 'error' | 'connecting';
  wifiIP: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  networkNodes,
  dbCount,
  uploadedDoc,
  ollamaStatus,
  wifiIP,
}: SidebarProps) {
  return (
    <aside className="w-80 bg-panel-side border-r border-border-dark flex flex-col h-full overflow-hidden shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-border-dark bg-panel-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-sm rounded animate-pulse" />
            <div className="relative bg-bg-deep border border-cyan-500/40 text-cyan-400 p-2 rounded font-mono font-bold text-xs tracking-widest">
              L-AI
            </div>
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider text-slate-100 font-mono">NEURAL PORTAL / CORE</h1>
            <p className="text-[9px] font-mono text-cyan-400/90 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
              SHARED WIFI NODE
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Modules */}
      <nav className="p-4 space-y-1">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-3">
          Control Modules
        </div>
        
        <button
          onClick={() => setActiveTab('simulator')}
          className={`w-full flex items-center justify-between p-3 rounded transition-all duration-200 group ${
            activeTab === 'simulator'
              ? 'bg-[#11141d] border border-cyan-500/30 text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0d1117] border border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <Terminal className={`w-3.5 h-3.5 ${activeTab === 'simulator' ? 'text-cyan-400 animate-pulse' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="text-[11px] font-mono tracking-wide uppercase">AI Command Center</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={() => setActiveTab('explorer')}
          className={`w-full flex items-center justify-between p-3 rounded transition-all duration-200 group ${
            activeTab === 'explorer'
              ? 'bg-[#11141d] border border-emerald-500/30 text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0d1117] border border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <Code className={`w-3.5 h-3.5 ${activeTab === 'explorer' ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="text-[11px] font-mono tracking-wide uppercase">GitHub Repository</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`w-full flex items-center justify-between p-3 rounded transition-all duration-200 group ${
            activeTab === 'guide'
              ? 'bg-[#11141d] border border-amber-500/30 text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0d1117] border border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <Cpu className={`w-3.5 h-3.5 ${activeTab === 'guide' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="text-[11px] font-mono tracking-wide uppercase">Deploy Manual</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
        </button>
      </nav>

      <span className="border-b border-border-dark my-1 mx-4" />

      {/* Network & Active Node States */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono select-none">
        {/* System Diagnostics */}
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 px-3 flex items-center justify-between">
            <span>Diagnostics statistics</span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
          </div>
          <div className="bg-[#0d1117] p-3 rounded border border-border-dark space-y-2 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">WiFi Host IP:</span>
              <span className="text-cyan-400 font-semibold">{wifiIP}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Port Binding:</span>
              <span className="text-slate-300">0.0.0.0:3000</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Chroma Storage:</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <Database className="w-3 h-3 text-emerald-500" />
                {dbCount > 0 ? `${dbCount} Chunks` : '0 segments'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ollama Runtime:</span>
              <span className={`capitalize font-semibold ${ollamaStatus === 'connected' ? 'text-cyan-400' : 'text-amber-400'}`}>
                {ollamaStatus === 'connected' ? 'Connected' : 'Syncing'}
              </span>
            </div>
            {uploadedDoc && (
              <div className="pt-2 border-t border-border-dark text-[9px] text-slate-400 truncate">
                <span className="text-slate-600 block text-[8px] uppercase font-bold">Session vector context</span>
                📘 {uploadedDoc}
              </div>
            )}
          </div>
        </div>

        {/* Local Network Nodes */}
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 px-3 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
            <span>WiFi clients ({networkNodes.filter(n => n.status === 'active').length})</span>
          </div>
          
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
            {networkNodes.map((node) => {
              const DeviceIcon = node.deviceType === 'server' 
                ? Wifi 
                : node.deviceType === 'desktop' 
                ? Laptop 
                : node.deviceType === 'tablet' 
                ? Tablet 
                : Smartphone;
              return (
                <div 
                  key={node.id} 
                  className={`p-2 rounded border text-[10px] transition-all bg-[#0d1117] ${
                    node.status === 'active' 
                      ? 'border-[#202530] text-slate-300' 
                      : 'border-border-dark text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <DeviceIcon className={`w-3.5 h-3.5 ${node.status === 'active' ? 'text-cyan-400' : 'text-slate-700'}`} />
                      <span className="font-semibold text-slate-200 truncate">{node.name}</span>
                    </div>
                    <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'active' ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`} />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[8px] text-slate-500">
                    <span>{node.ip}</span>
                    {node.status === 'active' && node.txSpeed > 0 && (
                      <span className="text-[8px] text-cyan-400 font-mono">
                        ↑ {node.txSpeed} KB/s
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-border-dark bg-[#0a0c12] text-[10px] font-mono text-slate-600 space-y-1">
        <div className="flex justify-between items-center text-[9px]">
          <span>CPU: {Math.floor(Math.random() * 8) + 12}%</span>
          <span>SYSTEM VRAM: 5.4/8.0 GB</span>
        </div>
        <div className="w-full bg-[#11141d] rounded-full h-1 overflow-hidden">
          <div className="bg-cyan-500 h-full rounded-full animate-pulse" style={{ width: '45%' }} />
        </div>
        <div className="text-[8px] text-center pt-1 text-slate-700">
          PROD PORTAL • SECURE OFFLINE BRIDGE
        </div>
      </div>
    </aside>
  );
}
