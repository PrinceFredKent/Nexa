import { streamText, CoreMessage, smoothStream } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { tools } from './tools/index';
import { buildSystemPrompt } from './prompts/system';
import { DynamicUserContext, AgentConfig } from '@/lib/types';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '',
});

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
});

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY ?? '',
});

export interface RunAgentOptions {
  messages: CoreMessage[];
  userContext?: DynamicUserContext;
  config?: Partial<AgentConfig>;
  onFinish?: (event: { text: string }) => Promise<void> | void;
}

function getActiveModel(config?: Partial<AgentConfig>) {
  const provider =
    config?.provider ||
    process.env.LLM_PROVIDER ||
    (process.env.GROQ_API_KEY ? 'groq' : process.env.OPENAI_API_KEY ? 'openai' : 'google');

  if (provider === 'groq' && process.env.GROQ_API_KEY) {
    return groq(config?.model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b');
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return openai(config?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini');
  }

  const modelName = config?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return google(modelName);
}

export function runAgent({ messages, userContext, config, onFinish }: RunAgentOptions) {
  const systemPrompt = buildSystemPrompt(userContext);
  const model = getActiveModel(config);

  return streamText({
    model,
    system: systemPrompt,
    messages,
    tools,
    maxSteps: config?.maxSteps ?? 6,
    temperature: config?.temperature ?? 0.7,
    experimental_transform: smoothStream({
      chunking: 'word',
      delayInMs: 15,
    }),
    onFinish: async ({ text }) => {
      if (onFinish) {
        await onFinish({ text });
      }
    },
    onError: ({ error }) => {
      console.error('[Nexa Agent Error]', error);
    },
  });
}
