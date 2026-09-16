import { getUserMemories } from '@/lib/db';

export async function getFormattedUserFacts(): Promise<string[]> {
  try {
    const memories = await getUserMemories();
    return memories.map((m) => `[${m.category.toUpperCase()}] ${m.content}`);
  } catch (err) {
    console.error('[Memory] Failed to load user facts:', err);
    return [];
  }
}
