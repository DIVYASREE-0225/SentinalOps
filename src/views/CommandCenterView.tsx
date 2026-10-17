import React, { useState } from 'react';
import { Terminal, Send, Sparkles, CornerDownLeft, RefreshCw, Cpu } from 'lucide-react';
import { api } from '../utils/api';

interface CommandCenterViewProps {
  isDark: boolean;
}

interface Message {
  id: string;
  sender: 'USER' | 'AGENT';
  text: string;
  timestamp: string;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({ isDark }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'AGENT',
      text: 'SentinelOps Autonomous AI Operations Engine initialized.\nReady to answer diagnostic queries, explain root causes, calculate financial impact, or compare recovery strategies.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'Why is the database query slow on orders table?',
    'Calculate the measured business impact of active incident',
    'Compare deployment rollback vs horizontal scaling',
    'Find similar historical incidents in vector archive',
    'Explain the primary root cause hypothesis and confidence',
    'Verify current system telemetry against SLA baseline',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await api.queryCommandCenter(query);
      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        sender: 'AGENT',
        text: response,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'AGENT',
          text: `Error processing query: ${e.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <span>Natural Language Copilot</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-1">
            Autonomous Operations Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Execute ad-hoc reliability investigations, query live PostgreSQL execution plans, and compare remediation trade-offs powered by Gemini 3.8.
          </p>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-slate-400 shrink-0">Suggested:</span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className={`px-3 py-1.5 rounded-lg border text-xs text-left transition-colors whitespace-nowrap shrink-0 ${
              isDark
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Terminal Dialogue Canvas */}
      <div className={`rounded-xl border flex flex-col h-[520px] ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-400">
                <span className="font-semibold">{m.sender === 'USER' ? 'Staff SRE' : 'SentinelOps Engine'}</span>
                <span>·</span>
                <span>{m.timestamp}</span>
              </div>
              <div
                className={`p-3.5 rounded-xl max-w-3xl text-xs whitespace-pre-wrap leading-relaxed ${
                  m.sender === 'USER'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : isDark
                    ? 'bg-slate-950 text-slate-200 border border-slate-800 font-mono rounded-tl-none text-[11px]'
                    : 'bg-slate-50 text-slate-800 border border-slate-200 font-mono rounded-tl-none text-[11px]'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Querying PostgreSQL schema & synthesizing reasoning...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask SentinelOps: e.g. Why did checkout latency spike? Or compare rollback vs scaling..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`flex-1 px-4 py-2.5 rounded-lg border text-xs transition-colors ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
