import { NextRequest } from 'next/server';
import { z } from 'zod';
import { CoreMessage } from 'ai';
import { runAgent } from '@/lib/agent/core';
import { saveMessages, getSessionMessages, updateSessionTitle, listSessions } from '@/lib/db';
import { getFormattedUserFacts } from '@/lib/memory/facts';
import { Message } from '@/lib/types';

const requestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  sessionId: z.string().optional().default('default'),
  userContext: z
    .object({
      userName: z.string().optional(),
      userLocation: z.string().optional(),
      userTimezone: z.string().optional(),
      currentTime: z.string().optional(),
      coordinates: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
        })
        .optional(),
      userFacts: z.array(z.string()).optional(),
    })
    .optional(),
  config: z
    .object({
      provider: z.enum(['google', 'openai', 'groq']).optional(),
      model: z.string().optional(),
      temperature: z.number().optional(),
      maxSteps: z.number().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request', issues: parsed.error.issues }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, sessionId, userContext = {}, config } = parsed.data;

  // Retrieve stored long-term user facts and memories
  const persistentFacts = await getFormattedUserFacts();
  const mergedFacts = Array.from(new Set([...persistentFacts, ...(userContext.userFacts || [])]));

  const dynamicContext = {
    ...userContext,
    userFacts: mergedFacts,
  };

  const incomingCoreMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  })) as CoreMessage[];

  const lastUserMsg = messages[messages.length - 1];

  try {
    const result = runAgent({
      messages: incomingCoreMessages,
      userContext: dynamicContext,
      config,
      onFinish: async ({ text }) => {
        try {
          const userMsgToSave: Message = {
            id: lastUserMsg?.id || `msg_u_${Date.now()}`,
            role: 'user',
            content: lastUserMsg?.content || '',
            createdAt: new Date().toISOString(),
          };

          const assistantMsgToSave: Message = {
            id: `msg_a_${Date.now()}`,
            role: 'assistant',
            content: text,
            createdAt: new Date().toISOString(),
          };

          await saveMessages(sessionId, [userMsgToSave, assistantMsgToSave]);

          // Auto-generate title for new sessions if needed
          const sessions = await listSessions();
          const current = sessions.find((s) => s.id === sessionId);
          if (current && (current.title === 'New Conversation' || current.title === 'Conversation')) {
            const autoTitle =
              lastUserMsg.content.slice(0, 32).trim() + (lastUserMsg.content.length > 32 ? '...' : '');
            if (autoTitle) {
              await updateSessionTitle(sessionId, autoTitle);
            }
          }
        } catch (err) {
          console.error('[Agent Memory Save Error]', err);
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error('[Agent Route Error]', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Agent error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
