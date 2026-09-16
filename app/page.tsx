'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { useDynamicContext } from '@/lib/hooks/useDynamicContext';
import { Session } from '@/lib/types';
import { Menu, Sparkles, Settings as SettingsIcon, Plus } from 'lucide-react';

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('default');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    context: userContext,
    isLocating,
    requestLiveLocation,
    updateProfile,
  } = useDynamicContext();

  // Load sessions from API
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        const loaded: Session[] = data.sessions || [];
        setSessions(loaded);
        if (loaded.length > 0 && !loaded.some((s) => s.id === activeSessionId)) {
          setActiveSessionId(loaded[0].id);
        }
      }
    } catch (err) {
      console.error('[Page] Failed to fetch sessions:', err);
    }
  }, [activeSessionId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreateSession = async () => {
    try {
      const newId = `sess_${Date.now()}`;
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId, title: 'New Conversation' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessions((prev) => [data.session, ...prev]);
        setActiveSessionId(data.session.id);
        setIsSidebarOpen(false);
      }
    } catch (err) {
      console.error('[Page] Failed to create session:', err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeSessionId === id) {
          const remaining = sessions.filter((s) => s.id !== id);
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
          } else {
            handleCreateSession();
          }
        }
      }
    } catch (err) {
      console.error('[Page] Failed to delete session:', err);
    }
  };

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-zinc-950">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setIsSidebarOpen(false);
        }}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        userContext={userContext}
        isLocating={isLocating}
        onRequestLiveLocation={requestLiveLocation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-full">
        {/* App Top Bar */}
        <header className="flex h-14 items-center justify-between border-b border-white/5 bg-zinc-950 px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white md:hidden"
              title="Toggle Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-zinc-200">
                {sessions.find((s) => s.id === activeSessionId)?.title || 'NEXA Assistant'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateSession}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors md:hidden"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
              title="Settings & Memory Hub"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Active Chat Conversation */}
        <main className="flex-1 overflow-hidden">
          <ChatWindow
            key={activeSessionId}
            sessionId={activeSessionId}
            userContext={userContext}
            onSessionUpdated={fetchSessions}
          />
        </main>
      </div>

      {/* Settings & Profile Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userContext={userContext}
        onUpdateProfile={updateProfile}
        isLocating={isLocating}
        onRequestLiveLocation={requestLiveLocation}
      />
    </div>
  );
}
