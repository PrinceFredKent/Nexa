'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageBubble } from './MessageBubble';
import { InputBar } from './InputBar';
import { Sparkles, Bot, ShieldAlert } from 'lucide-react';
import { DynamicUserContext } from '@/lib/types';

interface ChatWindowProps {
  sessionId: string;
  userContext: DynamicUserContext;
  onSessionUpdated?: () => void;
}

export function ChatWindow({ sessionId, userContext, onSessionUpdated }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
  } = useChat({
    id: sessionId,
    api: '/api/agent',
    body: {
      sessionId,
      userContext,
    },
    onFinish: () => {
      if (onSessionUpdated) {
        onSessionUpdated();
      }
    },
    onError: (err) => console.error('[ChatWindow Error]', err),
  });

  // Fetch initial history for selected session
  useEffect(() => {
    let cancelled = false;

    const loadSessionMessages = async () => {
      try {
        const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages)) {
            setMessages(
              data.messages.map((m: { id: string; role: string; content: string; toolInvocations?: unknown[] }) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
                toolInvocations: m.toolInvocations as any,
              }))
            );
          }
        }
      } catch (err) {
        console.error('[ChatWindow] Failed to load session messages:', err);
      }
    };

    loadSessionMessages();

    return () => {
      cancelled = true;
    };
  }, [sessionId, setMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30">
                <Sparkles className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">
                  Good {getGreetingTime()}, {userContext.userName || 'Fred'}
                </h2>
                <p className="mt-1 text-sm text-zinc-400 max-w-md">
                  Nexa is your neural executive assistant with real-time web search, notes, live weather, and persistent memory.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full max-w-lg">
                {[
                  'What is the current weather in Kampala?',
                  'Summarize top tech & AI news today',
                  'Remember that I prefer concise summaries in bullet points',
                  'Create a todo: Review product roadmap tomorrow',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      handleInputChange({
                        target: { value: prompt },
                      } as React.ChangeEvent<HTMLInputElement>);
                    }}
                    className="rounded-xl border border-white/5 bg-zinc-800/70 p-3 text-xs text-zinc-300 hover:bg-zinc-800 hover:border-white/10 hover:text-white transition-all text-left group"
                  >
                    <span className="group-hover:text-blue-400 transition-colors">→</span> {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || `msg_${index}`}
              message={message}
              isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
            />
          ))}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error.message ?? 'An error occurred while running the agent. Please try again.'}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="border-t border-white/5 bg-zinc-950/80 backdrop-blur px-4 py-4 shrink-0">
        <div className="mx-auto max-w-3xl">
          <InputBar
            input={input}
            onChange={(v) =>
              handleInputChange({ target: { value: v } } as React.ChangeEvent<HTMLInputElement>)
            }
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 px-1">
            <span>
              Grounding: <strong className="text-zinc-400">{userContext.userLocation}</strong>
            </span>
            <span>
              Time: <strong className="text-zinc-400">{userContext.currentTime || 'Live'}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreetingTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
