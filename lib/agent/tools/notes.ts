import { tool, jsonSchema } from 'ai';
import { addNote, getNotes, updateNote, deleteNote } from '@/lib/db';

interface NotesParams {
  action: 'create' | 'list' | 'update' | 'complete' | 'delete';
  title?: string;
  content?: string;
  tags?: string[];
  isTodo?: boolean;
  noteId?: string;
  completed?: boolean;
}

export const notesTool = tool({
  description:
    'Manage executive notes, action items, and todos for the user. Use this to create, list, update, complete, or delete personal notes and tasks.',
  parameters: jsonSchema<NotesParams>({
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'list', 'update', 'complete', 'delete'],
        description: 'Action to perform',
      },
      title: {
        type: 'string',
        description: 'Title of the note or task (required for "create")',
      },
      content: {
        type: 'string',
        description: 'Details / content of the note',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags or labels (e.g. ["urgent", "work"])',
      },
      isTodo: {
        type: 'boolean',
        description: 'Whether this is a todo/task item (default true)',
      },
      noteId: {
        type: 'string',
        description: 'ID of the note to update, complete, or delete',
      },
      completed: {
        type: 'boolean',
        description: 'Completion status when updating or completing a task',
      },
    },
    required: ['action'],
    additionalProperties: false,
  }),
  execute: async ({ action, title, content, tags, isTodo = true, noteId, completed }) => {
    try {
      if (action === 'create') {
        if (!title || title.trim().length === 0) {
          return { error: 'Title is required to create a note or task.' };
        }
        const created = await addNote({
          title: title.trim(),
          content: content || '',
          tags: tags || [],
          isTodo,
        });
        return {
          success: true,
          message: `Created ${isTodo ? 'task' : 'note'}: "${created.title}"`,
          note: created,
        };
      }

      if (action === 'list') {
        const notes = await getNotes();
        return {
          success: true,
          count: notes.length,
          notes,
        };
      }

      if (action === 'complete') {
        if (!noteId) {
          return { error: 'noteId is required to complete a task.' };
        }
        const updated = await updateNote(noteId, { completed: completed ?? true });
        if (!updated) return { error: `Note ${noteId} not found.` };
        return {
          success: true,
          message: `Marked task "${updated.title}" as ${updated.completed ? 'completed' : 'pending'}.`,
          note: updated,
        };
      }

      if (action === 'update') {
        if (!noteId) {
          return { error: 'noteId is required to update a note.' };
        }
        const updated = await updateNote(noteId, {
          title,
          content,
          tags,
          isTodo,
          completed,
        });
        if (!updated) return { error: `Note ${noteId} not found.` };
        return {
          success: true,
          message: `Updated note "${updated.title}".`,
          note: updated,
        };
      }

      if (action === 'delete') {
        if (!noteId) {
          return { error: 'noteId is required to delete a note.' };
        }
        await deleteNote(noteId);
        return {
          success: true,
          message: `Deleted note with ID ${noteId}.`,
        };
      }

      return { error: 'Invalid action.' };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Failed to execute notes action',
      };
    }
  },
});
