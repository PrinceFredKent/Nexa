import { tool, jsonSchema } from 'ai';
import { addUserMemory, getUserMemories, deleteUserMemory } from '@/lib/db';
import { UserMemory } from '@/lib/types';

interface MemoryParams {
  action: 'save' | 'list' | 'delete';
  content?: string;
  category?: 'preference' | 'personal' | 'work' | 'instruction' | 'general';
  memoryId?: string;
}

export const memoryTool = tool({
  description:
    'Manage long-term user memories and profile facts. Use this to remember personal preferences, important facts, instructions, or work context about the user so Nexa remembers them across all future sessions.',
  parameters: jsonSchema<MemoryParams>({
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['save', 'list', 'delete'],
        description: 'Action to perform with memory (save, list, delete)',
      },
      content: {
        type: 'string',
        description: 'The fact or preference to remember (required when action is "save")',
      },
      category: {
        type: 'string',
        enum: ['preference', 'personal', 'work', 'instruction', 'general'],
        description: 'Category of the memory (defaults to "general")',
      },
      memoryId: {
        type: 'string',
        description: 'The memory ID to delete (required when action is "delete")',
      },
    },
    required: ['action'],
    additionalProperties: false,
  }),
  execute: async ({ action, content, category = 'general', memoryId }) => {
    try {
      if (action === 'save') {
        if (!content || content.trim().length === 0) {
          return { error: 'Content is required to save a memory.' };
        }
        const saved = await addUserMemory(content.trim(), category as UserMemory['category']);
        return {
          success: true,
          message: `Saved to long-term memory: "${saved.content}"`,
          memory: saved,
        };
      }

      if (action === 'list') {
        const memories = await getUserMemories();
        return {
          success: true,
          count: memories.length,
          memories: memories.map((m) => ({
            id: m.id,
            category: m.category,
            content: m.content,
            date: m.createdAt,
          })),
        };
      }

      if (action === 'delete') {
        if (!memoryId) {
          return { error: 'memoryId is required to delete a memory.' };
        }
        await deleteUserMemory(memoryId);
        return {
          success: true,
          message: `Deleted memory with ID ${memoryId}.`,
        };
      }

      return { error: 'Invalid action.' };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Failed to execute memory action',
      };
    }
  },
});
