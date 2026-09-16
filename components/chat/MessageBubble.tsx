'use client';

import ReactMarkdown from 'react-markdown';
import { Sparkles, Bot, User } from 'lucide-react';
import type { Message } from 'ai';
import { ToolCallCard } from './ToolCallCard';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const hasContent = Boolean(message.content && message.content.trim().length > 0);
  const toolInvocations = message.toolInvocations || [];

  return (
    <div className={`flex w-full gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Tool Invocations */}
        {toolInvocations.length > 0 && (
          <div className="w-full space-y-1 mb-1">
            {toolInvocations.map((inv) => {
              const invRecord = inv as unknown as { args?: Record<string, unknown>; result?: unknown };
              return (
                <ToolCallCard
                  key={inv.toolCallId}
                  toolName={inv.toolName}
                  args={invRecord.args || {}}
                  result={invRecord.result}
                  state={inv.state}
                />
              );
            })}
          </div>
        )}

        {hasContent ? (
          <div
            className={
              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed ' +
              (isUser
                ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                : 'bg-zinc-800/90 text-zinc-100 rounded-bl-xs border border-white/5')
            }
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none text-zinc-200">
                <ReactMarkdown>{message.content}</ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block h-3.5 w-1.5 ml-1 align-middle bg-blue-400 animate-pulse rounded-xs" />
                )}
              </div>
            )}
          </div>
        ) : (
          toolInvocations.length === 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-zinc-800/60 px-4 py-2 text-xs text-zinc-400 border border-white/5">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-400" />
              <span className="animate-pulse">Thinking & evaluating...</span>
            </div>
          )
        )}
      </div>

      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 border border-white/10 text-zinc-400">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
