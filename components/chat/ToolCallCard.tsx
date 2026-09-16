'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Wrench,
  CheckCircle,
  Loader2,
  Calendar,
  Calculator,
  Search,
  Brain,
  CheckSquare,
  Globe,
  CloudSun,
} from 'lucide-react';

interface ToolCallCardProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  state: 'partial-call' | 'call' | 'result';
}

const TOOL_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  get_current_datetime: { label: 'Date & Time', icon: Calendar },
  calculate: { label: 'Calculator', icon: Calculator },
  web_search: { label: 'Web Search', icon: Search },
  manage_memory: { label: 'Memory Retention', icon: Brain },
  manage_notes: { label: 'Executive Notes', icon: CheckSquare },
  read_url: { label: 'Webpage Reader', icon: Globe },
  get_weather: { label: 'Live Weather', icon: CloudSun },
};

export function ToolCallCard({ toolName, args, result, state }: ToolCallCardProps) {
  const [open, setOpen] = useState(state !== 'result');
  const meta = TOOL_META[toolName] || { label: toolName, icon: Wrench };
  const Icon = meta.icon;
  const isDone = state === 'result';

  return (
    <div className="my-2 rounded-xl border border-white/10 bg-zinc-900/90 text-sm overflow-hidden shadow-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/5 transition-colors"
      >
        {isDone ? (
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <Loader2 className="h-4 w-4 text-blue-400 shrink-0 animate-spin" />
        )}
        <Icon className="h-4 w-4 text-zinc-400 shrink-0" />
        <span className="font-medium text-xs text-zinc-200">{meta.label}</span>
        <span className="ml-auto text-zinc-500">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/5 px-3.5 py-2.5 space-y-2 bg-black/20 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-1">Input</p>
            <pre className="text-zinc-300 font-mono text-[11px] whitespace-pre-wrap break-all bg-zinc-950/60 p-2 rounded-lg border border-white/5">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
          {result !== undefined && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-1">Output</p>
              <pre className="text-zinc-300 font-mono text-[11px] whitespace-pre-wrap break-all bg-zinc-950/60 p-2 rounded-lg border border-white/5 max-h-48 overflow-y-auto">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
