import { NextRequest, NextResponse } from 'next/server';
import { getNotes, addNote, updateNote, deleteNote } from '@/lib/db';
import { z } from 'zod';

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  isTodo: z.boolean().optional().default(false),
});

const updateNoteSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isTodo: z.boolean().optional(),
  completed: z.boolean().optional(),
});

export async function GET() {
  try {
    const notes = await getNotes();
    return NextResponse.json({ notes });
  } catch (err) {
    console.error('[API Notes GET]', err);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
    }
    const note = await addNote(parsed.data);
    return NextResponse.json({ note });
  } catch (err) {
    console.error('[API Notes POST]', err);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
    }
    const { id, ...updates } = parsed.data;
    const note = await updateNote(id, updates);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json({ note });
  } catch (err) {
    console.error('[API Notes PATCH]', err);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing note id' }, { status: 400 });
    }
    await deleteNote(id);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('[API Notes DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
