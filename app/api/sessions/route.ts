import { NextRequest, NextResponse } from 'next/server';
import { listSessions, createSession } from '@/lib/db';
import { z } from 'zod';

const createSessionSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional().default('New Conversation'),
});

export async function GET() {
  try {
    const sessions = await listSessions();
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('[API Sessions GET]', err);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const id = parsed.data.id || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const session = await createSession(id, parsed.data.title);
    return NextResponse.json({ session });
  } catch (err) {
    console.error('[API Sessions POST]', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
