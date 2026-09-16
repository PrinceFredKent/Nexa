'use client';

import { useState, useEffect } from 'react';
import {
  X,
  User,
  Brain,
  CheckSquare,
  Cpu,
  MapPin,
  Clock,
  Navigation,
  Loader2,
  Trash2,
  Plus,
  Check,
  Sparkles,
} from 'lucide-react';
import { DynamicUserContext, UserMemory, Note } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userContext: DynamicUserContext;
  onUpdateProfile: (name: string, location?: string) => void;
  isLocating: boolean;
  onRequestLiveLocation: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  userContext,
  onUpdateProfile,
  isLocating,
  onRequestLiveLocation,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'memory' | 'notes' | 'model'>('profile');

  // Profile form state
  const [name, setName] = useState(userContext.userName || 'Patrick');
  const [location, setLocation] = useState(userContext.userLocation || 'Kampala, Uganda');
  const [profileSaved, setProfileSaved] = useState(false);

  // Memories state
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<UserMemory['category']>('general');

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteIsTodo, setNewNoteIsTodo] = useState(true);

  // Model settings state
  const [provider, setProvider] = useState<'google' | 'openai' | 'groq'>('google');
  const [temperature, setTemperature] = useState(0.7);

  useEffect(() => {
    if (userContext.userName) setName(userContext.userName);
    if (userContext.userLocation) setLocation(userContext.userLocation);
  }, [userContext]);

  // Load memories & notes when opened
  useEffect(() => {
    if (!isOpen) return;

    const fetchMemories = async () => {
      setIsLoadingMemories(true);
      try {
        const res = await fetch('/api/memories');
        if (res.ok) {
          const data = await res.json();
          setMemories(data.memories || []);
        }
      } catch (err) {
        console.error('Failed to load memories', err);
      } finally {
        setIsLoadingMemories(false);
      }
    };

    const fetchNotes = async () => {
      setIsLoadingNotes(true);
      try {
        const res = await fetch('/api/notes');
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes || []);
        }
      } catch (err) {
        console.error('Failed to load notes', err);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    fetchMemories();
    fetchNotes();
  }, [isOpen]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(name, location);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMemoryText.trim(), category: newMemoryCategory }),
      });
      if (res.ok) {
        const data = await res.json();
        setMemories((prev) => [data.memory, ...prev]);
        setNewMemoryText('');
      }
    } catch (err) {
      console.error('Failed to save memory', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/memories?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete memory', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
          isTodo: newNoteIsTodo,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNewNoteTitle('');
        setNewNoteContent('');
      }
    } catch (err) {
      console.error('Failed to add note', err);
    }
  };

  const handleToggleNoteTodo = async (id: string, completed: boolean) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => prev.map((n) => (n.id === id ? data.note : n)));
      }
    } catch (err) {
      console.error('Failed to update note', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="flex flex-col h-[85vh] max-h-[640px] w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900 text-zinc-100 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-semibold text-zinc-100">Nexa Settings & Memory Hub</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 bg-zinc-950/40 px-6">
          {[
            { id: 'profile', label: 'Dynamic Context & Profile', icon: User },
            { id: 'memory', label: 'Learned Memories', icon: Brain },
            { id: 'notes', label: 'Executive Notes', icon: CheckSquare },
            { id: 'model', label: 'Intelligence Model', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DYNAMIC CONTEXT & PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Live Dynamic Context
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Time: <strong>{userContext.currentTime || 'Dynamic'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Location: <strong>{userContext.userLocation}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono">TZ:</span>
                    <span>{userContext.userTimezone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onRequestLiveLocation}
                      disabled={isLocating}
                      className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-200 border border-white/10 transition-colors"
                    >
                      {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
                      <span>Auto-detect GPS Location</span>
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">User Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
                    placeholder="Patrick"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Default Location / City (Dynamic Grounding)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
                    placeholder="Kampala, Uganda"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-zinc-500">
                    Nexa uses this to ground search queries and local context automatically.
                  </span>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-medium text-white transition-colors"
                  >
                    {profileSaved ? <Check className="h-3.5 w-3.5" /> : null}
                    <span>{profileSaved ? 'Saved' : 'Save Profile'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: LEARNED MEMORIES */}
          {activeTab === 'memory' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Facts and personal instructions Nexa has learned across conversations. Nexa automatically includes these in every prompt.
              </p>

              <form onSubmit={handleAddMemory} className="flex gap-2">
                <input
                  type="text"
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="Add a new preference or fact (e.g., 'Patrick prefers bullet points')..."
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
                />
                <select
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value as UserMemory['category'])}
                  className="rounded-xl border border-white/10 bg-zinc-800 px-2 text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="general">General</option>
                  <option value="preference">Preference</option>
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="instruction">Instruction</option>
                </select>
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-medium text-white transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </form>

              <div className="space-y-2 mt-3">
                {isLoadingMemories ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  </div>
                ) : memories.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    No memories recorded yet. Ask Nexa to remember something in chat!
                  </div>
                ) : (
                  memories.map((mem) => (
                    <div
                      key={mem.id}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-800/60 px-3.5 py-2.5 text-xs text-zinc-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-zinc-700/60 text-zinc-400">
                          {mem.category}
                        </span>
                        <span>{mem.content}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EXECUTIVE NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Action items, todos, and executive notes stored by Nexa.
              </p>

              <form onSubmit={handleAddNote} className="space-y-2 rounded-xl bg-zinc-800/40 p-3 border border-white/5">
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Task or note title..."
                  className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNoteIsTodo}
                      onChange={(e) => setNewNoteIsTodo(e.target.checked)}
                      className="rounded-sm bg-zinc-800"
                    />
                    <span>Action Item / Todo</span>
                  </label>
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {isLoadingNotes ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    No notes or tasks created yet.
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-800/60 px-3.5 py-2.5 text-xs text-zinc-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {note.isTodo && (
                          <input
                            type="checkbox"
                            checked={note.completed}
                            onChange={(e) => handleToggleNoteTodo(note.id, e.target.checked)}
                            className="rounded-sm bg-zinc-700"
                          />
                        )}
                        <div className="min-w-0">
                          <p className={`font-medium ${note.completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                            {note.title}
                          </p>
                          {note.content && <p className="text-[11px] text-zinc-400 truncate">{note.content}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors shrink-0 ml-2"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MODEL & INTELLIGENCE */}
          {activeTab === 'model' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Default Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'google', name: 'Google Gemini', desc: 'Gemini 2.5 Flash / Pro' },
                    { id: 'openai', name: 'OpenAI', desc: 'GPT-4o / Mini' },
                    { id: 'groq', name: 'Groq', desc: 'Llama 3.3 / Fast inference' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id as typeof provider)}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-colors ${
                        provider === p.id
                          ? 'border-blue-500 bg-blue-500/10 text-zinc-100'
                          : 'border-white/5 bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="font-semibold text-xs text-zinc-200">{p.name}</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Temperature (Creativity vs. Precision)</span>
                  <span className="font-mono">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-3 text-xs text-zinc-500">
                Provider keys are loaded securely from server environment variables (<code>.env.local</code>).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
