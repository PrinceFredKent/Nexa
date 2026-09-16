'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Settings,
  MapPin,
  Clock,
  Navigation,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Session, DynamicUserContext } from '@/lib/types';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  userContext: DynamicUserContext;
  isLocating: boolean;
  onRequestLiveLocation: () => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  userContext,
  isLocating,
  onRequestLiveLocation,
  onOpenSettings,
  isOpen,
}: SidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-zinc-950 border-r border-white/5 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30">
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
          <span className="font-bold text-sm tracking-wider text-zinc-100">NEXA</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-zinc-800 text-zinc-400">v2.0</span>
        </div>

        <button
          onClick={onCreateSession}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors shadow-xs"
          title="Start a new chat session"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Dynamic Context Status Bar */}
      <div className="px-3 py-2.5 border-b border-white/5 bg-zinc-900/40 text-[11px] space-y-1">
        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="truncate" title={userContext.userLocation}>
              {userContext.userLocation || 'Detecting location...'}
            </span>
          </div>
          <button
            onClick={onRequestLiveLocation}
            disabled={isLocating}
            className="p-1 hover:text-white transition-colors text-zinc-400 rounded-md hover:bg-white/5"
            title="Auto-detect live location"
          >
            {isLocating ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
            ) : (
              <Navigation className="h-3 w-3" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-500">
          <Clock className="h-3 w-3 text-blue-400 shrink-0" />
          <span>{userContext.currentTime || 'Real-time sync'}</span>
          <span className="text-zinc-600 font-mono">({userContext.userTimezone?.split('/')[1] || 'Local'})</span>
        </div>
      </div>

      {/* Session Threads List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="px-2 pb-1.5 text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
          Conversations
        </div>

        {sessions.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-zinc-600">
            No previous conversations. Start one!
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onMouseEnter={() => setHoveredSession(session.id)}
                onMouseLeave={() => setHoveredSession(null)}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-300 font-medium border border-blue-500/20'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-6">
                  <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                  <span className="truncate">{session.title}</span>
                </div>

                {(hoveredSession === session.id || isActive) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete conversation "${session.title}"?`)) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="absolute right-2 p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Profile & Settings Trigger */}
      <div className="border-t border-white/5 p-3 bg-zinc-950">
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-medium text-xs">
              {userContext.userName ? userContext.userName.charAt(0).toUpperCase() : 'F'}
            </div>
            <div className="text-left">
              <p className="font-medium text-zinc-200">{userContext.userName || 'Fred'}</p>
              <p className="text-[10px] text-zinc-500">Executive Profile</p>
            </div>
          </div>
          <Settings className="h-4 w-4 text-zinc-400 hover:text-zinc-200 transition-colors" />
        </button>
      </div>
    </aside>
  );
}
