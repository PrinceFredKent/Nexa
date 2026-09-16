export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolInvocations?: ToolInvocation[];
  createdAt?: string | Date;
}

export interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  args: Record<string, unknown>;
  result?: unknown;
  state: 'partial-call' | 'call' | 'result';
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMemory {
  id: string;
  category: 'preference' | 'personal' | 'work' | 'instruction' | 'general';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isTodo: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicUserContext {
  userName?: string;
  userLocation?: string;
  userTimezone?: string;
  currentTime?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  userFacts?: string[];
}

export interface AgentConfig {
  provider: 'google' | 'openai' | 'groq';
  model: string;
  maxSteps: number;
  temperature: number;
}

export const DEFAULT_CONFIG: AgentConfig = {
  provider: 'google',
  model: 'gemini-2.5-flash',
  maxSteps: 6,
  temperature: 0.7,
};

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}
