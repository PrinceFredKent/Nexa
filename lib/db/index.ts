import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { readLocalStore, writeLocalStore } from './localStore';
import { Session, Message, UserMemory, Note } from '@/lib/types';

// ==========================================
// SESSIONS
// ==========================================

export async function listSessions(): Promise<Session[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }
    console.warn('[DB] Supabase listSessions failed, falling back to local store:', error?.message);
  }

  const store = readLocalStore();
  return store.sessions.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function createSession(id: string, title: string = 'New Conversation'): Promise<Session> {
  const now = new Date().toISOString();
  const newSession: Session = { id, title, createdAt: now, updatedAt: now };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    const { error } = await supabase.from('sessions').insert({
      id: newSession.id,
      title: newSession.title,
      created_at: newSession.createdAt,
      updated_at: newSession.updatedAt,
    });
    if (!error) return newSession;
    console.warn('[DB] Supabase createSession failed, falling back:', error.message);
  }

  const store = readLocalStore();
  store.sessions.unshift(newSession);
  writeLocalStore(store);
  return newSession;
}

export async function updateSessionTitle(id: string, title: string): Promise<void> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    await supabase.from('sessions').update({ title, updated_at: now }).eq('id', id);
  }

  const store = readLocalStore();
  const sess = store.sessions.find((s) => s.id === id);
  if (sess) {
    sess.title = title;
    sess.updatedAt = now;
    writeLocalStore(store);
  }
}

export async function deleteSession(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    await supabase.from('sessions').delete().eq('id', id);
  }

  const store = readLocalStore();
  store.sessions = store.sessions.filter((s) => s.id !== id);
  delete store.messages[id];
  writeLocalStore(store);
}

// ==========================================
// MESSAGES
// ==========================================

export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        role: row.role as Message['role'],
        content: row.content,
        toolInvocations: row.tool_invocations || undefined,
        createdAt: row.created_at,
      }));
    }
    console.warn('[DB] Supabase getSessionMessages failed:', error?.message);
  }

  const store = readLocalStore();
  return store.messages[sessionId] || [];
}

export async function saveMessages(sessionId: string, newMessages: Message[]): Promise<void> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    // Ensure session exists
    await supabase
      .from('sessions')
      .upsert({ id: sessionId, updated_at: now }, { onConflict: 'id' });

    const rows = newMessages.map((m) => ({
      id: m.id,
      session_id: sessionId,
      role: m.role,
      content: m.content || '',
      tool_invocations: m.toolInvocations || [],
      created_at: typeof m.createdAt === 'string' ? m.createdAt : (m.createdAt?.toISOString() ?? now),
    }));

    const { error } = await supabase.from('messages').upsert(rows, { onConflict: 'id' });
    if (!error) return;
    console.warn('[DB] Supabase saveMessages failed:', error.message);
  }

  const store = readLocalStore();
  if (!store.sessions.some((s) => s.id === sessionId)) {
    store.sessions.unshift({
      id: sessionId,
      title: newMessages[0]?.content.slice(0, 30) || 'Conversation',
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const s = store.sessions.find((sess) => sess.id === sessionId);
    if (s) s.updatedAt = now;
  }

  const existing = store.messages[sessionId] || [];
  const map = new Map<string, Message>();
  existing.forEach((m) => map.set(m.id, m));
  newMessages.forEach((m) => map.set(m.id, m));

  store.messages[sessionId] = Array.from(map.values());
  writeLocalStore(store);
}

// ==========================================
// USER MEMORIES / FACTS
// ==========================================

export async function getUserMemories(): Promise<UserMemory[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    const { data, error } = await supabase
      .from('user_memories')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        category: row.category,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }
  }

  const store = readLocalStore();
  return store.userMemories || [];
}

export async function addUserMemory(
  content: string,
  category: UserMemory['category'] = 'general'
): Promise<UserMemory> {
  const now = new Date().toISOString();
  const newMemory: UserMemory = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    category,
    content,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    const { error } = await supabase.from('user_memories').insert({
      id: newMemory.id,
      category: newMemory.category,
      content: newMemory.content,
      created_at: newMemory.createdAt,
      updated_at: newMemory.updatedAt,
    });
    if (!error) return newMemory;
  }

  const store = readLocalStore();
  store.userMemories = store.userMemories || [];
  store.userMemories.unshift(newMemory);
  writeLocalStore(store);
  return newMemory;
}

export async function deleteUserMemory(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    await supabase.from('user_memories').delete().eq('id', id);
  }

  const store = readLocalStore();
  store.userMemories = (store.userMemories || []).filter((m) => m.id !== id);
  writeLocalStore(store);
}

// ==========================================
// EXECUTIVE NOTES & TODOS
// ==========================================

export async function getNotes(): Promise<Note[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        tags: row.tags || [],
        isTodo: row.is_todo,
        completed: row.completed,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }
  }

  const store = readLocalStore();
  return store.notes || [];
}

export async function addNote(note: {
  title: string;
  content: string;
  tags?: string[];
  isTodo?: boolean;
}): Promise<Note> {
  const now = new Date().toISOString();
  const newNote: Note = {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: note.title,
    content: note.content,
    tags: note.tags || [],
    isTodo: note.isTodo ?? false,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    const { error } = await supabase.from('notes').insert({
      id: newNote.id,
      title: newNote.title,
      content: newNote.content,
      tags: newNote.tags,
      is_todo: newNote.isTodo,
      completed: newNote.completed,
      created_at: newNote.createdAt,
      updated_at: newNote.updatedAt,
    });
    if (!error) return newNote;
  }

  const store = readLocalStore();
  store.notes = store.notes || [];
  store.notes.unshift(newNote);
  writeLocalStore(store);
  return newNote;
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'isTodo' | 'completed'>>
): Promise<Note | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    const updateData: Record<string, unknown> = { updated_at: now };
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.isTodo !== undefined) updateData.is_todo = updates.isTodo;
    if (updates.completed !== undefined) updateData.completed = updates.completed;

    await supabase.from('notes').update(updateData).eq('id', id);
  }

  const store = readLocalStore();
  const note = (store.notes || []).find((n) => n.id === id);
  if (!note) return null;

  Object.assign(note, updates, { updatedAt: now });
  writeLocalStore(store);
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()!;
    await supabase.from('notes').delete().eq('id', id);
  }

  const store = readLocalStore();
  store.notes = (store.notes || []).filter((n) => n.id !== id);
  writeLocalStore(store);
}
