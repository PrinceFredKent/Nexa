import { CoreMessage } from 'ai';
import { getSessionMessages, saveMessages, deleteSession } from '@/lib/db';
import { Message } from '@/lib/types';

const MAX_MESSAGES = 40; // keep last 40 messages in context

export async function getHistory(sessionId: string): Promise<CoreMessage[]> {
  const dbMessages = await getSessionMessages(sessionId);
  return dbMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

export async function appendMessages(sessionId: string, messages: CoreMessage[]): Promise<void> {
  const formatted: Message[] = messages.map((m) => ({
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    role: m.role as Message['role'],
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    createdAt: new Date().toISOString(),
  }));

  await saveMessages(sessionId, formatted);
}

export async function clearHistory(sessionId: string): Promise<void> {
  await deleteSession(sessionId);
}
