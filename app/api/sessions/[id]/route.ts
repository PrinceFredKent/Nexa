import { NextRequest, NextResponse } from 'next/server';
import { getSessionMessages, deleteSession, updateSessionTitle } from '@/lib/db';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const messages = await getSessionMessages(id);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[API Session GET]', err);
    return NextResponse.json({ error: 'Failed to fetch session messages' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteSession(id);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('[API Session DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}

const patchSchema = z.object({
  title: z.string().min(1),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
    }
    await updateSessionTitle(id, parsed.data.title);
    return NextResponse.json({ success: true, id, title: parsed.data.title });
  } catch (err) {
    console.error('[API Session PATCH]', err);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
