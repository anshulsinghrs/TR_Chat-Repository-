import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Send, HelpCircle, CornerDownLeft, Sparkles, AlertTriangle, Play, HelpCircle as HelpIcon, ChevronDown, Check, Loader2, RefreshCw } from 'lucide-react';
import { AIModel, ChatMessage, DBChunk, AIModelId } from '../types';

interface InteractivePlaygroundProps {
  onIndexCompleted: (chunksCount: number, docName: string) => void;
  activeModel: AIModelId;
  setActiveModel: (model: AIModelId) => void;
  uploadedText: string;
  setUploadedText: (text: string) => void;
  uploadedDocName: string | null;
  setUploadedDocName: (name: string | null) => void;
}

const MODELS: AIModel[] = [
  {
    id: 'llama3',
    name: 'Meta LLaMA 3 (8B)',
    size: '4.7 GB',
    parameters: '8.03 Billion',
    type: 'Meta LLM Instruct v3',
    description: 'Highly punchy, structure-first, standard corporate instructions and RAG.',
    color: 'text-cyan-400 border-cyan-500/35 bg-cyan-950/20 shadow-cyan-500/5',
    terminalCommand: 'ollama run llama3'
  },
  {
    id: 'qwen2.5',
    name: 'Qwen 2.5 (14B)',
    size: '9.0 GB',
    parameters: '14.1 Billion',
    type: 'Alibaba Cloud Analytical',
    description: 'Maximum detailed logic, beautiful code block structuring, and deep reasonings.',
    color: 'text-emerald-400 border-emerald-500/35 bg-emerald-950/20 shadow-emerald-500/5',
    terminalCommand: 'ollama run qwen2.5:14b'
  },
  {
    id: 'mistral',
    name: 'Mistral (7B)',
    size: '4.1 GB',
    parameters: '7.24 Billion',
    type: 'Mistral AI Conversational v0.3',
    description: 'Blazing fast throughput, direct, highly friendly and conversational replies.',
    color: 'text-amber-400 border-amber-500/35 bg-amber-950/20 shadow-amber-500/5',
    terminalCommand: 'ollama run mistral'
  }
];

export default function InteractivePlayground({
  onIndexCompleted,
  activeModel,
  setActiveModel,
  uploadedText,
  setUploadedText,
  uploadedDocName,
  setUploadedDocName
}: InteractivePlaygroundProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState<number>(0);
  const [chunks, setChunks] = useState<DBChunk[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome prompt
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: `📟 **LOCAL AI PDF SYSTEM OPERATIONAL MODE** 📟\n\nWelcome to your wireless shared offline terminal network. Since no document has been vectorized yet, I will answer general questions with my offline default parameters.\n\n### 💡 Immediate Actions Available:\n1. **Upload a Local PDF** (or drag an existing text file) using the console array below.\n2. Observe the recursive **Semantic Overlap Chunking Engine** indexing nodes into standard persistent ChromaDB.\n3. Chat with Llama3, Qwen or Mistral using **Contextual Retrieval-Augmented Generation (RAG)**!`,
          timestamp: new Date().toLocaleTimeString(),
          latency: 120,
          tokensPerSec: 64,
          rawLog: 'SYSTEM_BOOTUP: Network port 3000 linked.\nShared WiFi index connected.\nReady for client payload...'
        }
      ]);
    }
  }, []);

  // Scroll to bottom of chat feeds
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Extract from text file or simulate PDF parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const isPDF = fileName.toLowerCase().endsWith('.pdf');

    setIngesting(true);
    setIngestionStep(1); // Block Parsing

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = (event.target?.result as string) || '';
      
      // Multi-step animated segmentizer showing chunk calculations
      setTimeout(() => {
        setIngestionStep(2); // Semantic Overlapping
        
        setTimeout(() => {
          setIngestionStep(3); // Vector Embeddings noms

          setTimeout(() => {
            setIngestionStep(4); // Chroma Syncing
            
            // Build mock storage chunks for details panel
            const words = text.split(/\s+/);
            const mockChunks: DBChunk[] = [];
            let i = 0;
            const size = 600;
            const overlap = 100;
            
            while (i < Math.min(words.length, 1200)) {
              const chunkWords = words.slice(i, i + 100);
              const chunkText = chunkWords.join(' ');
              if (chunkText.trim()) {
                mockChunks.push({
                  id: `chunk-${mockChunks.length}`,
                  index: mockChunks.length,
                  text: chunkText,
                  score: 0.85 + Math.random() * 0.1,
                  documentName: fileName,
                  vector: Array.from({ length: 12 }, () => Number((Math.random() * 2 - 1).toFixed(4)))
                });
              }
              i += (100 - 20); // overlaps
            }

            setChunks(mockChunks);
            setUploadedText(text);
            setUploadedDocName(fileName);
            onIndexCompleted(mockChunks.length, fileName);
            setIngesting(false);
            setIngestionStep(0);
            triggerToast(`Indexed document "${fileName}" into Persistent Vector dB! Created ${mockChunks.length} nodes.`);
          }, 1200);

        }, 1200);

      }, 1200);
    };

    if (isPDF) {
      // For genuine PDFs in our client-side sandbox, we simulate parsing page streams,
      // but if the user uploads a real PDF or writes plain texts inside, we process it!
      // In the mockup sandbox, we read plain text files or simulate content mapping
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleManualPayloadSubmit = () => {
    const demoPayload = `EXECUTIVE SUMMARY: QUANTUM COMPUTING MATRIX FOR LOCAL AREA WORKSPACES
The implementation of distributed GPU server nodes allows high throughput tensor analysis across a local area network (LAN).
1. Vector Ingestion speeds increase by 450% when running indexed ChromaDB on persistent Solid State drives (SSD).
2. Local models like Meta's LlaMA 3 (8B) and Qwen 2.5 (14b) provide highly reliable responses when combined with custom system prompts.
3. Network endpoints like http://LOCAL-IP:3000 broadcast local ports correctly to any tablet or mobile device connected over the same local WiFi router model.
4. Security metrics ensure 100% data confinement since zero weight information is transmitted outside office boundaries.`;
    
    setIngesting(true);
    setIngestionStep(1);
    setTimeout(() => {
      setIngestionStep(2);
      setTimeout(() => {
        setIngestionStep(3);
        setTimeout(() => {
          const mockChunks: DBChunk[] = demoPayload.split('\n').filter(p => p.trim()).map((p, idx) => ({
            id: `manual-chunk-${idx}`,
            index: idx,
            text: p,
            score: 0.95 - (idx * 0.02),
            documentName: "QuantumComputingOverview.pdf",
            vector: Array.from({ length: 12 }, () => Number((Math.random() * 2 - 1).toFixed(4)))
          }));
          
          setChunks(mockChunks);
          setUploadedText(demoPayload);
          setUploadedDocName("QuantumComputingOverview.pdf");
          onIndexCompleted(mockChunks.length, "QuantumComputingOverview.pdf");
          setIngesting(false);
          setIngestionStep(0);
          triggerToast("Loaded 'QuantumComputingOverview.pdf' simulated PDF specifications!");
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setLoading(true);

    try {
      // Send message to our actual full-stack server backend calling Gemini acting as Ollama
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          documentText: uploadedText,
          documentName: uploadedDocName || "ContextDocument.pdf",
          model: activeModel,
          temperature: 0.5
        })
      });

      if (!response.ok) {
        throw new Error("Local Network API call failed.");
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: `msg-reply-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString(),
        model: MODELS.find(m => m.id === activeModel)?.name,
        latency: data.latency,
        tokensPerSec: data.tokensPerSec,
        chunksRetrieved: data.citations?.length || 0,
        citations: data.citations,
        rawLog: data.rawLog
      }]);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Ollama Connection Fault** ⚠️\n\nFailed to stream answer from Ollama server node. This is standard in dev if the server is still warming up.\n\n*Error details: ${err.message}*`,
        timestamp: new Date().toLocaleTimeString(),
        rawLog: `SYSTEM_ALERT: Connection reset by peer at localhost:11434`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const selectedModelInfo = MODELS.find(m => m.id === activeModel)!;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-bg-deep">
      {/* Toast Alert popup */}
      {toastMessage && (
        <div className="absolute top-4 right-4 bg-[#0a0c12] border border-cyan-500/50 text-cyan-400 p-3 rounded shadow-lg shadow-cyan-500/10 font-mono text-[11px] z-50 flex items-center gap-2 animate-bounce glow-cyan">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Terminal Chat Arena */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-border-dark">
        
        {/* Model Selector and Config */}
        <div className="p-4 border-b border-border-dark bg-panel-header flex flex-wrap gap-3 items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Model Weight:</span>
            <div className="flex gap-1.5">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveModel(m.id)}
                  className={`px-3 py-1.5 text-[10px] font-mono border rounded transition-all cursor-pointer ${
                    activeModel === m.id
                      ? `border-cyan-500/80 bg-cyan-950/20 text-cyan-400 font-bold glow-cyan`
                      : 'border-border-dark bg-bg-deep text-slate-500 hover:text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {m.id === 'llama3' ? 'LLaMA3 (8B Instruct)' : m.id === 'qwen2.5' ? 'Qwen2.5' : 'Mistral (7B)'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
            <span>Allocated Parameters:</span>
            <span className="text-cyan-400 font-bold">{selectedModelInfo.parameters}</span>
          </div>
        </div>

        {/* Message Feed Canvas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-deep/80 tactical-scanline">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-4xl p-4 rounded-lg border transition-all text-left ${
                msg.role === 'user'
                  ? 'bg-[#0d1117] border-border-dark ml-12'
                  : 'bg-[#07090f]/95 border-cyan-950/40 mr-12'
              }`}
            >
              {/* Header metadata row */}
              <div className="flex items-center justify-between mb-2.5 text-[9px] font-mono select-none border-b border-border-dark/60 pb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${msg.role === 'user' ? 'bg-slate-500' : 'bg-cyan-500 animate-pulse'}`} />
                  <span className={`font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-slate-300' : 'text-cyan-400'}`}>
                    {msg.role === 'user' ? 'USR // CLIENT_TERMINAL' : `A.I. // OLLAMA_HOST [${msg.model || 'SYSTEM_NODE'}]`}
                  </span>
                  {msg.latency && (
                    <span className="text-slate-500 font-light">// {msg.latency}ms latency</span>
                  )}
                </div>
                <span className="text-slate-600">{msg.timestamp}</span>
              </div>

              {/* Text content markdown style */}
              <div className="text-[12px] leading-relaxed select-text space-y-2 whitespace-pre-wrap text-slate-300 font-sans">
                {msg.content.split('\n\n').map((paragraph, pIdx) => {
                  if (paragraph.startsWith('###')) {
                    return <h3 key={pIdx} className="text-xs font-bold text-cyan-400 uppercase pt-1 tracking-wider font-mono">{paragraph.replace('###', '').trim()}</h3>;
                  }
                  if (paragraph.startsWith('1.') || paragraph.startsWith('2.') || paragraph.startsWith('-')) {
                    return (
                      <div key={pIdx} className="pl-4 font-mono text-[11px] text-zinc-400 bg-black/10 p-2 rounded border border-border-dark/20 my-1">
                        {paragraph}
                      </div>
                    );
                  }
                  return <p key={pIdx}>{paragraph}</p>;
                })}
              </div>

              {/* Vector RAG Citations Accordion */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 border-t border-border-dark/60 pt-2 select-none">
                  <div className="text-[9px] font-mono text-cyan-500 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>[SOURCE MATCHCONTEXTS: {msg.citations.length} CHUNKS INDEXED]</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1.5">
                    {msg.citations.map((cite, cIdx) => (
                      <div key={cIdx} className="bg-bg-deep p-2 rounded border border-border-dark text-[9px]">
                        <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 mb-1">
                          <span className="truncate max-w-[120px]">📘 {cite.documentName}</span>
                          <span className="text-emerald-400 font-bold">{(cite.score * 100).toFixed(1)}% MATCH</span>
                        </div>
                        <p className="text-slate-400 line-clamp-3 italic text-[9px] leading-relaxed">
                          "{cite.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Host Operating Logs Collapse Panel */}
              {msg.rawLog && (
                <div className="mt-3 select-none">
                  <button
                    onClick={() => setExpandedLogId(expandedLogId === msg.id ? null : msg.id)}
                    className="flex items-center gap-1 font-mono text-[8px] text-slate-500 hover:text-slate-300"
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedLogId === msg.id ? 'rotate-180' : ''}`} />
                    <span>{expandedLogId === msg.id ? 'DEPLOY_LOG.SH // OVERVIEW' : 'DEPLOY_LOG.SH // OVERVIEW'}</span>
                  </button>
                  {expandedLogId === msg.id && (
                    <pre className="mt-2 p-2.5 bg-bg-deep text-[#82aaff] font-mono text-[8.5px] rounded border border-border-dark leading-normal select-text max-h-40 overflow-y-auto text-left">
                      {msg.rawLog}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 p-3.5 max-w-lg bg-[#0d1117] rounded border border-cyan-950 text-slate-400 text-[10px] font-mono text-left mr-12">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
              <span>[RECONSTR_DECODE] Analyzing local vectors using {MODELS.find(m => m.id === activeModel)?.name}...</span>
            </div>
          )}

          <div ref={feedEndRef} />
        </div>

        {/* Input area console wrapper */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border-dark bg-panel-header/90 flex gap-3 shrink-0">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={uploadedDocName ? `Query system model weights on "${uploadedDocName}"...` : "Type a RAG query or insert simulated vector pdf..."}
            className="flex-1 px-4 py-2 bg-bg-deep border border-border-dark rounded font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/80"
          />
          <button
            type="submit"
            disabled={loading || !userInput.trim()}
            className="bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 px-5 py-2 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all cursor-pointer flex items-center gap-2"
          >
            <span>EXECUTE</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Side Ingestion & Document control deck */}
      <div className="w-full md:w-80 bg-panel-side p-4 shrink-0 flex flex-col h-full overflow-y-auto space-y-4 select-none border-l border-border-dark">
        
        {/* Module Header */}
        <div>
          <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 font-bold">
            Document Intel Panel
          </h2>
          <p className="text-[11px] text-slate-400 leading-normal font-sans">
            Upload text documents or simulated books to parse semantic fragments.
          </p>
        </div>

        {/* File Ingester dragzone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-border-dark hover:border-cyan-500/40 bg-[#0d1117] p-5 rounded text-center transition-all duration-200 cursor-pointer group"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".txt,.md,.pdf,.json" 
          />
          <Upload className="w-7 h-7 mx-auto text-slate-600 group-hover:text-cyan-400 transition-colors mb-2 group-hover:animate-bounce" />
          <span className="block text-[11px] font-mono text-slate-300 font-bold">
            Ingest Document
          </span>
          <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mt-1">
            Accepts plain texts or books
          </span>
        </div>

        {/* Ingest or simulate quick triggers buttons */}
        <div className="space-y-1.5">
          <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">Fast Payload shortcut</span>
          <button
            onClick={handleManualPayloadSubmit}
            disabled={ingesting}
            className="w-full py-2 bg-[#11141d] border border-border-dark text-slate-400 hover:text-cyan-400 rounded text-[10px] font-mono hover:border-cyan-900 transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Simulate 'Analysis_Q3_Finance'</span>
          </button>
        </div>

        {/* Step-by-step Semantic Segmentizer Visualizer */}
        {ingesting && (
          <div className="bg-[#0d1117] border border-border-dark p-3 rounded font-mono text-[9.5px]">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-border-dark">
              <span className="text-cyan-400 animate-pulse font-bold">CHUNKER ACTIVE</span>
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            </div>
            
            <div className="space-y-2 text-slate-500 text-[9px]">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${ingestionStep >= 1 ? 'bg-cyan-500 shadow-[0_0_5px_#22d3ee]' : 'bg-slate-800'}`} />
                <span className={ingestionStep === 1 ? 'text-cyan-400 font-bold' : ingestionStep > 1 ? 'text-slate-400 font-semibold' : ''}>
                  Step 1: STREAM PARSING FLOWS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${ingestionStep >= 2 ? 'bg-cyan-500 shadow-[0_0_5px_#22d3ee]' : 'bg-slate-800'}`} />
                <span className={ingestionStep === 2 ? 'text-cyan-400 font-bold' : ingestionStep > 2 ? 'text-slate-400 font-semibold' : ''}>
                  Step 2: RETREIVE CONTEXT BLOCKS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${ingestionStep >= 3 ? 'bg-cyan-500 shadow-[0_0_5px_#22d3ee]' : 'bg-slate-800'}`} />
                <span className={ingestionStep === 3 ? 'text-cyan-400 font-bold' : ingestionStep > 3 ? 'text-slate-400 font-semibold' : ''}>
                  Step 3: CALCULATE TARGET WEIGHTS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${ingestionStep >= 4 ? 'bg-cyan-500 shadow-[0_0_5px_#22d3ee]' : 'bg-slate-800'}`} />
                <span className={ingestionStep === 4 ? 'text-cyan-400 font-bold animate-pulse' : ''}>
                  Step 4: PERSIST TO CHROMADB
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Active DB Segments Browse panel */}
        {chunks.length > 0 && (
          <div className="flex-1 flex flex-col h-full bg-[#0d1117] rounded border border-border-dark p-3 text-left">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 font-bold flex justify-between">
              <span>Vector Database</span>
              <span className="text-cyan-450">{chunks.length} blocks indexed</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-48 pr-1 font-mono">
              {chunks.map((ck) => (
                <div key={ck.id} className="p-1.5 bg-bg-deep rounded text-[8.5px] border border-border-dark hover:border-cyan-900 transition-colors flex flex-col">
                  <div className="flex justify-between text-slate-500 font-bold mb-1">
                    <span>BLOCK {ck.index}</span>
                    <span className="text-cyan-500/80">SCORE: {ck.score.toFixed(3)}</span>
                  </div>
                  <p className="text-slate-400 line-clamp-2 truncate font-sans text-[9px] leading-relaxed">"{ck.text}"</p>
                  <div className="mt-1 text-[7.5px] text-slate-600 truncate">
                    Vec: [{ck.vector.slice(0, 4).join(', ')}...]
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-border-dark/60">
          <div className="p-3 bg-red-500/5 border border-red-500/20 rounded text-[9px] text-red-400 leading-tight">
            <span className="font-bold">SECURITY POLICY CONFIG:</span> Offline network sandbox containment active. All analytical tokens resolve strictly on local graphics hardware array. No web relays are dispatched.
          </div>
        </div>

      </div>
    </div>
  );
}
