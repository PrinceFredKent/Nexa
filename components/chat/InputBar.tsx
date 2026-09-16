'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface InputBarProps {
  input: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function InputBar({ input, onChange, onSubmit, isLoading }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on initial mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (isLoading || !input.trim()) {
      e.preventDefault();
      return;
    }
    onSubmit(e);
    // Keep focus inside textarea immediately
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border border-white/10 bg-zinc-800 p-2 shadow-lg">
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => {
          onChange(e.target.value);
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Message Nexa... (Enter to send, Shift+Enter for newline)"
        className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none"
        style={{ minHeight: '36px', maxHeight: '200px' }}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Send message"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}
