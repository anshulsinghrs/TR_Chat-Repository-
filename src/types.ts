export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
  language?: string;
  description?: string;
}

export interface NetworkNode {
  id: string;
  name: string;
  ip: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'server';
  status: 'active' | 'idle' | 'disconnected';
  lastPing: string;
  rxSpeed: number; // KB/s
  txSpeed: number; // KB/s
}

export interface DBChunk {
  id: string;
  index: number;
  text: string;
  score: number;
  documentName: string;
  vector: number[];
}

export interface Citation {
  chunkIndex: number;
  documentName: string;
  text: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  latency?: number; // ms
  tokensPerSec?: number;
  chunksRetrieved?: number;
  citations?: Citation[];
  rawLog?: string;
}

export interface PDFDocument {
  id: string;
  name: string;
  size: number;
  uploadTime: string;
  chunkCount: number;
  status: 'processing' | 'ready' | 'failed';
  text: string;
}

export type AIModelId = 'llama3' | 'qwen2.5' | 'mistral';

export interface AIModel {
  id: AIModelId;
  name: string;
  size: string;
  parameters: string;
  type: string;
  description: string;
  color: string;
  terminalCommand: string;
}
