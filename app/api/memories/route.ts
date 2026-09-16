import { NextRequest, NextResponse } from 'next/server';
import { getUserMemories, addUserMemory, deleteUserMemory } from '@/lib/db';
import { z } from 'zod';

const addMemorySchema = z.object({
  content: z.string().min(1),
  category: z.enum(['preference', 'personal', 'work', 'instruction', 'general']).optional().default('general'),
});

export async function GET() {
  try {
    const memories = await getUserMemories();
    return NextResponse.json({ memories });
  } catch (err) {
    console.error('[API Memories GET]', err);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = addMemorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const memory = await addUserMemory(parsed.data.content, parsed.data.category);
    return NextResponse.json({ memory });
  } catch (err) {
    console.error('[API Memories POST]', err);
    return NextResponse.json({ error: 'Failed to save memory' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing memory id' }, { status: 400 });
    }
    await deleteUserMemory(id);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('[API Memories DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
