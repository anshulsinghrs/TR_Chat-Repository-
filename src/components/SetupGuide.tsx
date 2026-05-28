import React, { useState } from 'react';
import { Terminal, Copy, Check, Info, Server, Shield, Radio, Code2, Link, Book } from 'lucide-react';

export default function SetupGuide() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const steps = [
    {
      title: 'Ollama Weight Download instructions',
      desc: 'On your local system hosting the system vectors, you must have Ollama loaded and running. Run these background pulls inside your system command prompt or terminal:',
      code: `# Start pulling local model weights\nollama pull llama3\nollama pull nomic-embed-text\nollama pull qwen2.5\nollama pull mistral`,
      id: 'step-ollama'
    },
    {
      title: 'Deploy and launch via Automate scripts',
      desc: 'To easily automate IP interface configuration, build frontend node clients, compile backend endpoints, and launch containers, write a executable bash file and double-click or run:',
      code: `chmod +x startup.sh\n./startup.sh`,
      id: 'step-exec'
    },
    {
      title: 'Docker Compose orchestration triggers',
      desc: 'To spin up databases, vector services, and node containers altogether inside background docker networks under 0.0.0.0, use compose:',
      code: `docker compose up --build -d`,
      id: 'step-docker'
    },
    {
      title: 'Direct bare metal launch rules',
      desc: 'If running locally on bare-metal environments rather than isolated docker containers, set up virtual environments and start them separately:',
      code: `# 1. Backend server setup\ncd backend\npython -m venv venv\nsource venv/bin/activate  # venv\\Scripts\\activate on Windows\npip install -r requirements.txt\npython main.py\n\n# 2. Frontend application setup\ncd ../frontend\nnpm install\nnpm run dev`,
      id: 'step-manual'
    }
  ];

  return (
    <div className="flex-1 bg-transparent p-6 overflow-y-auto text-left select-text font-sans relative">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Hub Header */}
        <div className="border-b border-border-dark pb-5">
          <div className="flex items-center gap-2 text-cyan-500 font-mono text-[10px] uppercase tracking-widest mb-1.5 font-bold">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Tactical Deploy Manual</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight uppercase">
            Local WiFi PDF Chat Deploy Console
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Configure local host nodes, share vector pipelines across your workspace WiFi router, and manage persistent ChromaDB contexts effortlessly.
          </p>
        </div>

        {/* Warning Notification Box */}
        <div className="bg-cyan-950/10 border border-cyan-500/20 p-4 rounded flex gap-3 text-cyan-400 font-mono text-xs leading-relaxed max-w-4xl">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <span className="font-bold block text-cyan-300 uppercase">Cross-Device Ingress Rules</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              To allow other clients (phones, computers, tables) on the same WiFi network router to query documents, you must start the backend server on <code className="text-cyan-300 font-bold">0.0.0.0</code> and provide your actual wireless IP address rather than <code className="text-cyan-300">localhost</code> in the frontend client configuration.
            </p>
          </div>
        </div>

        {/* Steps loop */}
        <div className="space-y-6 select-none">
          {steps.map((st, i) => (
            <div key={st.id} className="space-y-2 max-w-4xl">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-[#0d1117] border border-border-dark text-slate-400 text-[10px] font-mono flex items-center justify-center font-bold">
                  {i+1}
                </span>
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                  {st.title}
                </h3>
              </div>
              
              <p className="text-[11px] text-slate-500 ml-7 select-text">
                {st.desc}
              </p>

              <div className="ml-7 bg-[#0d1117] border border-border-dark rounded relative font-mono text-[10px] text-emerald-400 select-text">
                <button
                  onClick={() => handleCopy(st.code, st.id)}
                  className="absolute top-2.5 right-2.5 p-1 bg-bg-deep/70 border border-border-dark hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded cursor-pointer leading-none"
                >
                  {copiedText === st.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed text-left font-mono">
                  {st.code}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* API Endpoint specifications reference table */}
        <div className="border-t border-border-dark pt-6 space-y-4 max-w-4xl">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide">
              API endpoints reference specs
            </h3>
          </div>

          <div className="bg-[#0d1117] rounded border border-border-dark overflow-hidden font-mono text-[10px]">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-3 bg-[#0a0c12] p-2.5 border-b border-border-dark font-bold text-slate-450 text-left">
              <div className="col-span-3">METHOD / ENDPOINT</div>
              <div className="col-span-4">PAYLOAD SCHEMA</div>
              <div className="col-span-5">FUNCTION OUTCOME</div>
            </div>
            {/* Row 1 */}
            <div className="grid grid-cols-12 gap-3 p-3 border-b border-border-dark/40 text-left items-center bg-[#07090f]/30">
              <div className="col-span-3">
                <span className="bg-emerald-950/60 border border-emerald-900/30 text-emerald-400 font-bold px-1.5 py-0.5 rounded text-[8.5px] mr-1.5 font-mono">POST</span>
                <code className="text-slate-300 font-mono">/api/upload</code>
              </div>
              <div className="col-span-4 text-slate-500 italic font-mono">
                FormData: (session_id, file)
              </div>
              <div className="col-span-5 text-slate-400 font-sans text-[11px]">
                Extracts PDF texts, segment overlaps, and registers vectors in ChromaDB.
              </div>
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-12 gap-3 p-3 border-b border-border-dark/40 text-left items-center bg-[#07090f]/30">
              <div className="col-span-3">
                <span className="bg-emerald-950/60 border border-emerald-900/30 text-emerald-400 font-bold px-1.5 py-0.5 rounded text-[8.5px] mr-1.5 font-mono">POST</span>
                <code className="text-slate-300 font-mono">/api/chat</code>
              </div>
              <div className="col-span-4 text-slate-500 font-mono">
                <code className="text-[9px] text-slate-500">{"{messages, session_id, model}"}</code>
              </div>
              <div className="col-span-5 text-slate-400 font-sans text-[11px]">
                Answers query with context-aware references matching relevant document slices.
              </div>
            </div>
            {/* Row 3 */}
            <div className="grid grid-cols-12 gap-3 p-3 text-left items-center bg-[#07090f]/30">
              <div className="col-span-3">
                <span className="bg-cyan-950/60 border border-cyan-900/30 text-cyan-400 font-bold px-1.5 py-0.5 rounded text-[8.5px] mr-1.5 font-mono">GET</span>
                <code className="text-slate-300 font-mono">/api/health</code>
              </div>
              <div className="col-span-4 text-slate-500 italic font-mono">
                None (Request Heartbeat)
              </div>
              <div className="col-span-5 text-slate-400 font-sans text-[11px]">
                Returns connection health of system components and lists local tags.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
