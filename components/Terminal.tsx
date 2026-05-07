import React, { useEffect, useRef } from 'react';
import { AgentAction } from '../types';

interface TerminalProps {
  logs: string[];
  currentAction: AgentAction;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, currentAction, isMinimized, onToggleMinimize }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isMinimized]);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 shadow-2xl flex flex-col h-full font-mono text-xs sm:text-sm overflow-hidden">
      <div 
        className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 cursor-pointer hover:bg-slate-750 transition-colors"
        onClick={onToggleMinimize}
      >
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-slate-400 font-bold text-xs tracking-wider uppercase flex items-center gap-2">
            agent_runtime.exe
            <span className={`transition-transform duration-300 ${isMinimized ? 'rotate-180' : ''}`}>
                ▼
            </span>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-hide text-slate-300" ref={scrollRef}>
            {logs.map((log, i) => (
            <div key={i} className="break-words">
                <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
            </div>
            ))}
            {currentAction.type !== 'IDLE' && (
            <div className="text-primary-500 animate-pulse">
                &gt; {currentAction.type}: {currentAction.details}<span className="terminal-cursor"></span>
            </div>
            )}
        </div>
      )}
    </div>
  );
};