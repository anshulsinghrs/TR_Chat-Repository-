import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import InteractivePlayground from './components/InteractivePlayground';
import CodeExplorer from './components/CodeExplorer';
import SetupGuide from './components/SetupGuide';
import { NetworkNode, AIModelId } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'explorer' | 'guide'>('simulator');
  const [activeModel, setActiveModel] = useState<AIModelId>('llama3');
  
  // Real Full-stack Connection States
  const [wifiIP, setWifiIP] = useState<string>('192.168.1.45');
  const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'error' | 'connecting'>('connecting');
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [dbCount, setDbCount] = useState<number>(0);
  const [uploadedDoc, setUploadedDoc] = useState<string | null>(null);
  const [uploadedText, setUploadedText] = useState<string>('');

  // Fetch telemetry from Express API endpoints
  useEffect(() => {
    async function loadStats() {
      try {
        const hRes = await fetch('/api/health');
        if (hRes.ok) {
          const hData = await hRes.json();
          setWifiIP(hData.localIp);
          setOllamaStatus('connected');
        } else {
          setOllamaStatus('error');
        }
      } catch (err) {
        setOllamaStatus('error');
      }

      try {
        const nRes = await fetch('/api/network/nodes');
        if (nRes.ok) {
          const nData = await nRes.json();
          setNetworkNodes(nData);
        }
      } catch (err) {
        console.warn('Network stats polling failed: ', err);
      }
    }

    loadStats();
    // Refresh node telemetries periodically
    const interval = setInterval(loadStats, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleIndexCompleted = (chunksCount: number, docName: string) => {
    setDbCount(prev => prev + chunksCount);
    setUploadedDoc(docName);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-deep font-mono text-slate-300 select-none">
      
      {/* 2-Column Responsive UI (Sidebar Telemetry Monitors + Active Workspaces) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        networkNodes={networkNodes}
        dbCount={dbCount}
        uploadedDoc={uploadedDoc}
        ollamaStatus={ollamaStatus}
        wifiIP={wifiIP}
      />

      {/* Primary Module Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-bg-deep professional-polish-grid relative">
        
        {/* Module Title Header and Wireless status bar */}
        <div className="px-6 h-14 border-b border-border-dark bg-panel-header shrink-0 flex items-center justify-between select-none z-10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse"></div>
            <div>
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5 leading-none">
                OLLAMA-CORE // NEURAL INTERFACE
              </div>
              <h2 className="text-[11px] font-bold text-slate-400 font-mono tracking-wide uppercase leading-none mt-1">
                SYSTEM PORTAL / {activeTab === 'simulator' 
                  ? 'Local Network RAG Arena' 
                  : activeTab === 'explorer' 
                  ? 'GitHub Production Source Browser' 
                  : 'Operational Deploy Manual'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-[10px]">
            <div className="flex flex-col items-end">
              <span className="text-slate-500 text-[8px] uppercase tracking-wider">Access Node Link</span>
              <span className="text-cyan-400 font-bold">{wifiIP}:3000</span>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="flex flex-col items-end">
              <span className="text-slate-500 text-[8px] uppercase tracking-wider">Telemetry State</span>
              <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                ONLINE // STABLE
              </span>
            </div>
          </div>
        </div>

        {/* Tab Components Router */}
        <div className="flex-1 overflow-hidden relative flex flex-col z-10">
          {activeTab === 'simulator' && (
            <InteractivePlayground
              onIndexCompleted={handleIndexCompleted}
              activeModel={activeModel}
              setActiveModel={setActiveModel}
              uploadedText={uploadedText}
              setUploadedText={setUploadedText}
              uploadedDocName={uploadedDoc}
              setUploadedDocName={setUploadedDoc}
            />
          )}

          {activeTab === 'explorer' && (
            <CodeExplorer />
          )}

          {activeTab === 'guide' && (
            <SetupGuide />
          )}
        </div>

        {/* Professional Polish System Footer */}
        <footer className="h-8 border-t border-border-dark bg-panel-header px-6 shrink-0 flex items-center justify-between text-[9px] text-slate-500 uppercase tracking-widest font-mono z-10">
          <div>Ollama Runtime v0.3.14 // Python 3.12 // Persistent ChromaDB</div>
          <div>Memory: 14.2GB / 32GB • VRAM: 7.8GB • Local Network Sandbox</div>
        </footer>

      </main>
    </div>
  );
}
