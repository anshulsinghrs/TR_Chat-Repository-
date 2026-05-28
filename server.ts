import express from "express";
import path from "path";
import dns from "dns";
import os from "os";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI SDK safely
// Accessible in server-side context only
const ai_key = process.env.GEMINI_API_KEY || "";
let aiClient: GoogleGenAI | null = null;
if (ai_key) {
  aiClient = new GoogleGenAI({
    apiKey: ai_key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

app.use(express.json({ limit: '20mb' }));

// Helper to estimate a dynamic local interface network IP
function getLocalWiFiIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (netList) {
      for (const net of netList) {
        // Find IPv4 and non-internal or wireless interfaces
        if (net.family === 'IPv4' && !net.internal) {
          if (name.includes('wi-fi') || name.includes('wlan') || name.includes('en') || name.includes('eth')) {
            return net.address;
          }
        }
      }
    }
  }
  return "192.168.1.45"; // High fidelity fallback typical router address
}

// API Routes FIRST
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    host: "0.0.0.0",
    localIp: getLocalWiFiIP(),
    port: PORT,
    chromadb: "online",
    ollama: "connected",
    activeModels: ["llama3", "qwen2.5", "mistral"]
  });
});

// Dynamic Local Network Client Nodes Simulation
app.get("/api/network/nodes", (req, res) => {
  const wifiIPPrefix = getLocalWiFiIP().substring(0, getLocalWiFiIP().lastIndexOf("."));
  res.json([
    {
      id: "node-1",
      name: "Tactical Console Hub (This Host)",
      ip: getLocalWiFiIP(),
      deviceType: "server",
      status: "active",
      lastPing: new Date().toISOString(),
      rxSpeed: Math.floor(Math.random() * 200) + 150,
      txSpeed: Math.floor(Math.random() * 200) + 150,
    },
    {
      id: "node-2",
      name: "Commander Tablet (Wireless)",
      ip: `${wifiIPPrefix}.12`,
      deviceType: "tablet",
      status: "active",
      lastPing: new Date(Date.now() - 2000).toISOString(),
      rxSpeed: Math.floor(Math.random() * 40) + 10,
      txSpeed: Math.floor(Math.random() * 300) + 400,
    },
    {
      id: "node-3",
      name: "Field operative iPhone 15",
      ip: `${wifiIPPrefix}.87`,
      deviceType: "mobile",
      status: "active",
      lastPing: new Date(Date.now() - 5000).toISOString(),
      rxSpeed: Math.floor(Math.random() * 50) + 20,
      txSpeed: Math.floor(Math.random() * 15) + 5,
    },
    {
      id: "node-4",
      name: "Dev laptop (Ubuntu)",
      ip: `${wifiIPPrefix}.44`,
      deviceType: "desktop",
      status: "idle",
      lastPing: new Date(Date.now() - 120000).toISOString(),
      rxSpeed: 0,
      txSpeed: 0,
    }
  ]);
});

// AI Simulation Chat routing proxying to Gemini
app.post("/api/chat", async (req, res) => {
  const { messages, documentText, documentName = "ParsedDocument.pdf", model = "llama3", temperature = 0.5 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  // Define response schemas or instruction to trick Gemini to talk like LLaMA / Qwen / Mistral
  const modelInstructionMap: { [key: string]: string } = {
    llama3: "You are LLaMA 3 (8B Instruct model) by Meta AI running on an offline local Ollama server. Speak with clear, punchy, structure-first, technical responses.",
    "qwen2.5": "You are Qwen 2.5 (14B Instruct model) built by Alibaba Cloud running on a local GPU server. Speak with elegant, complete, highly analytical logic and structured code.",
    mistral: "You are Mistral (7B v0.3 Instruct model) by Mistral AI. Speak with direct, conversational, extremely friendly yet highly detailed responses."
  };

  const modelInstruction = modelInstructionMap[model] || modelInstructionMap.llama3;

  // Simulate context segmentation and similarity scores for ChromaDB
  const hasDocuments = documentText && documentText.trim().length > 0;
  const segments: Array<{ text: string; chunkIndex: number; score: number }> = [];

  if (hasDocuments) {
    // Dynamically split document text to mock matching vectors
    const paragraphs = documentText.split("\n").filter((p: string) => p.trim().length > 20);
    const mockQueries = [messages[messages.length - 1].content.toLowerCase()];
    
    // Simple mock matches
    paragraphs.forEach((p: string, idx: number) => {
      let containsKeyword = false;
      for (const q of mockQueries) {
        if (p.toLowerCase().includes(q) || q.split(" ").some((w: string) => w.length > 4 && p.toLowerCase().includes(w))) {
          containsKeyword = true;
        }
      }
      
      if (containsKeyword || idx === 0 || idx === Math.floor(paragraphs.length / 2)) {
        segments.push({
          text: p.substring(0, 450),
          chunkIndex: idx,
          score: containsKeyword ? Number((0.85 + Math.random() * 0.1).toFixed(4)) : Number((0.65 + Math.random() * 0.15).toFixed(4))
        });
      }
    });

    // Make sure we have at least 1 context if documents uploaded
    if (segments.length === 0 && paragraphs.length > 0) {
      segments.push({
        text: paragraphs[0].substring(0, 450),
        chunkIndex: 0,
        score: Number((0.72 + Math.random() * 0.1).toFixed(4))
      });
    }
  }

  // Sort by score desc, take top 3
  const activeSegments = segments.sort((a, b) => b.score - a.score).slice(0, 3);

  // System instructions for RAG
  let systemContext = `${modelInstruction}\n\n`;
  if (hasDocuments) {
    systemContext += `You are answering questions based on the uploaded PDF document: "${documentName}".\n`;
    systemContext += `Here are the top semantic segments retrieved from the local ChromaDB vector index:\n\n`;
    activeSegments.forEach((seg, i) => {
      systemContext += `[Source ${i + 1} : ${documentName} (Chunk index ${seg.chunkIndex}) (Similarity: ${seg.score})]\n`;
      systemContext += `${seg.text}\n\n`;
    });
    systemContext += `\nINSTRUCTIONS:\n`;
    systemContext += `1. Support your answer using information in [Source 1], [Source 2], or [Source 3].\n`;
    systemContext += `2. You MUST cite your source inside the text using brackets like [Source 1] next to claims.\n`;
    systemContext += `3. If the answer cannot be found in the document, use your general knowledge, but state clearly that this detail is not extracted from the PDF.\n`;
  } else {
    systemContext += `No PDF context has been indexed yet. Answer general requests directly. Advise the user that they can upload a PDF document anytime for real-time RAG context searches.`;
  }

  // If Gemini Client is missing, return friendly offline error
  if (!aiClient) {
    return res.json({
      role: "assistant",
      content: `[Ollama System Terminal Error] Offline Mode active. Google Gemini API Key is missing or unconfigured in the AI Studio Settings secrets panel. Please attach GEMINI_API_KEY to start interacting with the local RAG simulation.`,
      citations: [],
      latency: 45,
      tokensPerSec: 0,
      rawLog: `SYSTEM_ALERT: GEMINI_API_KEY NOT DEFINED IN SERVER DOTENV\nFALLING BACK TO LOCAL DEMO CONTEXT`
    });
  }

  try {
    // Generate simulated model answer
    const chatPrompt = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n");
    
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatPrompt,
      config: {
        systemInstruction: systemContext,
        temperature: temperature,
      }
    });

    const answer = response.text || "Unable to formulate a response.";
    const totalCitations = activeSegments.map((seg, i) => ({
      chunkIndex: seg.chunkIndex,
      documentName,
      text: seg.text,
      score: seg.score
    }));

    // Calculate simulated telemetry
    const wordCount = answer.split(" ").length;
    const tokens = Math.floor(wordCount * 1.33);
    const speed = Math.floor(Math.random() * 20) + (model === 'llama3' ? 42 : model === 'qwen2.5' ? 28 : 55);
    const computedLatency = Math.floor((tokens / speed) * 1000) + 200;

    res.json({
      role: "assistant",
      content: answer,
      citations: totalCitations,
      latency: computedLatency,
      tokensPerSec: speed,
      rawLog: `[Ollama server: ${model}] Connected on interface 0.0.0.0:11434\n[Vector Search] Query: "${messages[messages.length-1].content.substring(0,40)}..."\n[Vector Search] Query vectors successfully compared with ChromaDB indexes...\n[ChromaDB] Retrieved ${totalCitations.length} chunks. Index comparison completed.\n[LLM Ingress] Initiating model response decoding. Temperature: ${temperature}`
    });

  } catch (error: any) {
    console.error("Gemini server proxy issue: ", error);
    res.status(500).json({ error: "Gemini server proxy issue: " + error.message });
  }
});

// Serve Vite or Static files depending on mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Local AI Hub Portal Server] ONLINE and running on http://localhost:${PORT}`);
    console.log(`[Telemetry Service] Local Router Interface bound to http://${getLocalWiFiIP()}:${PORT}`);
  });
}

startServer();
