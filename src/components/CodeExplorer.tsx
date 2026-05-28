import React, { useState, useMemo } from 'react';
import { Folder, File, Download, Copy, Check, Search, Terminal, BookOpen, Settings2 } from 'lucide-react';
import JSZip from 'jszip';
import { repositoryFiles, FlatFile } from '../data/repositoryCode';

export default function CodeExplorer() {
  const [selectedFile, setSelectedFile] = useState<string>('README.md');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Programmatic directory tree generation from flat repository paths
  const directoryTree = useMemo(() => {
    const root: { [key: string]: any } = { type: 'directory', children: {} };

    Object.keys(repositoryFiles).forEach((filePath) => {
      const parts = filePath.split('/');
      let current = root;

      parts.forEach((part, index) => {
        if (!current.children[part]) {
          if (index === parts.length - 1) {
            current.children[part] = {
              type: 'file',
              name: part,
              path: filePath,
            };
          } else {
            current.children[part] = {
              type: 'directory',
              name: part,
              children: {},
            };
          }
        }
        current = current.children[part];
      });
    });

    return root;
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Bundle flat files and trigger standard client-side blob download
  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      const zip = new JSZip();

      Object.entries(repositoryFiles).forEach(([filePath, file]) => {
        zip.file(filePath, file.code);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = 'local-ai-pdf-chat-system-repository.zip';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to packaging code bundle: ', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  // Filtered files list for search results
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return Object.entries(repositoryFiles).filter(([path, file]) => 
      path.toLowerCase().includes(searchQuery.toLowerCase()) || 
      file.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Collapsible Directories state (represented simply)
  const [expandedDirs, setExpandedDirs] = useState<{ [key: string]: boolean }>({
    'backend': true,
    'backend/routes': true,
    'backend/services': true,
    'backend/database': true,
    'backend/utils': true,
    'frontend': true,
    'frontend/src': true,
    'frontend/src/app': true,
  });

  const toggleDirectory = (dirPath: string) => {
    setExpandedDirs(prev => ({ ...prev, [dirPath]: !prev[dirPath] }));
  };

  // Recursive Tree Renderer for Sidebar
  const renderTree = (node: any, currentPath = '') => {
    const sortedKeys = Object.keys(node.children || {}).sort((a, b) => {
      const nodeA = node.children[a];
      const nodeB = node.children[b];
      if (nodeA.type === nodeB.type) return a.localeCompare(b);
      return nodeA.type === 'directory' ? -1 : 1;
    });

    return sortedKeys.map((key) => {
      const child = node.children[key];
      const dirPath = currentPath ? `${currentPath}/${key}` : key;

      if (child.type === 'directory') {
        const isExpanded = expandedDirs[dirPath];
        return (
          <div key={dirPath} className="pl-3.5 select-none font-mono">
            <button
              onClick={() => toggleDirectory(dirPath)}
              className="flex items-center gap-2 text-[11px] py-1 text-slate-400 hover:text-slate-200 w-full text-left"
            >
              <Folder className={`w-3.5 h-3.5 text-cyan-500 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-45'}`} />
              <span className="font-semibold">{key}/</span>
            </button>
            {isExpanded && (
              <div className="border-l border-slate-800 ml-1.5 pl-0.5">
                {renderTree(child, dirPath)}
              </div>
            )}
          </div>
        );
      } else {
        const isSelected = selectedFile === child.path;
        return (
          <button
            key={child.path}
            onClick={() => {
              setSelectedFile(child.path);
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 text-[11px] py-1 pl-3.5 w-full text-left font-mono select-none ${
              isSelected 
                ? 'text-emerald-400 font-semibold border-l border-emerald-400 pl-3'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <File className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{key}</span>
          </button>
        );
      }
    });
  };

  const fileDetail = repositoryFiles[selectedFile];

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-bg-deep font-mono">
      {/* File Tree Sidebar */}
      <div className="w-72 bg-panel-side border-r border-border-dark flex flex-col h-full shrink-0 select-none">
        {/* Actions bar */}
        <div className="p-4 border-b border-border-dark space-y-3 bg-panel-header/90">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Repository tree
            </h2>
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="flex items-center gap-1.5 px-2 py-1 text-[10px] bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded hover:bg-emerald-900 transition-colors cursor-pointer font-mono font-bold"
            >
              <Download className={`w-3.5 h-3.5 ${downloadingZip ? 'animate-bounce' : ''}`} />
              <span>{downloadingZip ? 'PACKING...' : 'ZIP BUNDLE'}</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-650" />
            <input
              type="text"
              placeholder="Search repo files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-bg-deep border border-border-dark rounded font-mono text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80"
            />
          </div>
        </div>

        {/* Dynamic List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {searchQuery.trim() ? (
            <div className="space-y-1 font-mono">
              <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest px-2 mb-2">
                Search Results ({filteredFiles?.length || 0})
              </div>
              {filteredFiles?.map(([filePath, file]) => (
                <button
                  key={filePath}
                  onClick={() => {
                    setSelectedFile(filePath);
                  }}
                  className={`w-full text-left p-1.5 rounded text-[10px] truncate block ${
                    selectedFile === filePath 
                      ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-400' 
                      : 'text-slate-500 hover:bg-[#0d1117] border border-transparent'
                  }`}
                >
                  <div className="font-semibold">{filePath.split('/').pop()}</div>
                  <div className="text-[8px] text-slate-600 truncate">{filePath}</div>
                </button>
              ))}
              {filteredFiles?.length === 0 && (
                <div className="text-center text-[10px] text-slate-600 font-mono py-4">
                  No patterns match query.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {renderTree(directoryTree)}
            </div>
          )}
        </div>
      </div>

      {/* Code Editor Deck */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-deep">
        {/* File Path Header */}
        <div className="p-4 border-b border-border-dark bg-panel-header/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-500 text-[10px] border border-border-dark px-1.5 py-0.5 rounded bg-bg-deep uppercase select-none">
              {fileDetail?.lang || 'TXT'}
            </span>
            <span className="font-mono text-[11px] text-slate-300 tracking-wide select-text">
              {selectedFile}
            </span>
          </div>

          <div className="flex items-center gap-3 select-none">
            {/* File description tag */}
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline truncate max-w-sm italic">
              {fileDetail?.desc}
            </span>
            
            <button
              onClick={() => handleCopyCode(fileDetail?.code || '')}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#11141d] border border-border-dark text-slate-300 hover:text-white rounded hover:border-slate-700 text-[10px] font-mono transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>COPY CODE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 overflow-auto bg-bg-deep tactical-scanline relative p-4 flex">
          {/* Line Numbers column */}
          <div className="font-mono text-slate-700 text-[10px] text-right pr-4 select-none border-r border-[#1a1c23]/60 mr-4 shrink-0 font-medium">
            {(fileDetail?.code || '').split('\n').map((_, index) => (
              <div key={index} className="h-[18px]">
                {index + 1}
              </div>
            ))}
          </div>

          {/* Actual Code block wrapped nicely */}
          <pre className="flex-1 font-mono text-[10.5px] leading-relaxed text-slate-300 overflow-visible whitespace-pre tab-size text-left select-text">
            <code>
              {/* Highlight basic syntax categories simply using local rules safely */}
              {(fileDetail?.code || '').split('\n').map((line, lineIndex) => {
                // Return rendered line with simple simulated color highlights for key terms
                return (
                  <div key={lineIndex} className="h-[18px] hover:bg-[#11141d]/50 px-1 rounded transition-colors whitespace-pre">
                    {line.replace(/\s/g, '\u00A0') === '' ? '\u00A0' : (
                      // Apply highlighted terms nicely using client rules
                      line.split(/(\"|'|==|import|from|class|def|async|await|return|const|export|interface|extends|function|let|use|#)/).map((part, partIndex) => {
                        let style = 'text-slate-300';
                        if (['import', 'from', 'class', 'def', 'async', 'await', 'return', 'const', 'export', 'interface', 'extends', 'function', 'let', 'use'].includes(part)) {
                          style = 'text-cyan-400 font-bold';
                        } else if (part.startsWith('"') || part.startsWith("'")) {
                          style = 'text-emerald-400';
                        } else if (part.startsWith('#')) {
                          style = 'text-slate-500 italic';
                        }
                        return <span key={partIndex} className={style}>{part}</span>;
                      })
                    )}
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
