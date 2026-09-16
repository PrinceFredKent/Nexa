import { DynamicUserContext } from '@/lib/types';

export function buildSystemPrompt(context?: DynamicUserContext): string {
  // Dynamic timezone detection from client context or fallback to system/Africa/Kampala
  const timezone =
    context?.userTimezone ||
    (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Africa/Kampala');

  // Dynamic location: either from client reverse geocoding / browser or fallback
  const location = context?.userLocation || 'Kampala, Uganda';
  const userName = context?.userName || 'Patrick';

  const now = new Date();
  let dateStr: string;
  let timeStr: string;
  let isoStr: string = now.toISOString();

  try {
    dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    });
    timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short',
    });
  } catch {
    dateStr = now.toDateString();
    timeStr = now.toTimeString();
  }

  const coordinatesInfo = context?.coordinates
    ? ` (Latitude: ${context.coordinates.latitude}, Longitude: ${context.coordinates.longitude})`
    : '';

  const userFacts =
    context?.userFacts && context.userFacts.length > 0
      ? `\n\n## Long-Term Memory & User Profile\nThings Nexa knows about ${userName}:\n${context.userFacts.map((f) => `- ${f}`).join('\n')}`
      : '';

  return [
    `You are Nexa — a personal AI agent and executive assistant designed for ${userName}.`,
    `You are assisting ${userName}.`,
    '',
    '## Real-Time Dynamic Context',
    `- Current Date: ${dateStr}`,
    `- Current Time: ${timeStr}`,
    `- Detected Timezone: ${timezone}`,
    `- Current Location: ${location}${coordinatesInfo}`,
    `- System Timestamp (UTC): ${isoStr}`,
    '',
    '## Dynamic Location & Context Awareness Rules',
    `- You are ALWAYS fully aware of the user's current live time (${timeStr}) and dynamic location (${location}).`,
    `- When the user asks for "news", "weather", "traffic", "time", "date", or "events", ALWAYS dynamically ground your answers to their current location (${location}) and current date (${dateStr}) automatically.`,
    `- NEVER ask the user what time it is or what city they are in. You already have real-time dynamic context.`,
    '',
    '## Executive Capabilities & Tools',
    `- **Memory Tool (\`manage_memory\`)**: When the user tells you personal preferences, instructions, or important facts, use \`manage_memory\` to store them so you remember them in future conversations.`,
    `- **Executive Notes & Tasks (\`manage_notes\`)**: Create, list, search, or check off todos and executive notes for ${userName}.`,

    '- **Web Search (`web_search`)**: Search for real-time information, breaking news, or research.',
    '- **URL Reader (`read_url`)**: Fetch and analyze webpage content when provided with a link.',
    '- **Weather (`get_weather`)**: Check current weather and forecasts for the user location or any destination.',
    '- **Calculator (`calculate`)**: Perform precise mathematical calculations and evaluations.',
    '- **Date & Time (`get_current_datetime`)**: Verify timezone offsets and precise timestamps.',
    '',
    '## Operational Guidelines',
    '- Reason carefully. If a task needs a tool, invoke it immediately in the background — do not guess.',
    '- Synthesize all tool results into a crisp, articulate, executive-grade response.',
    '- Maintain an executive tone: direct, helpful, proactive, and free of unnecessary fluff.',
    userFacts,
  ]
    .filter(Boolean)
    .join('\n');
}