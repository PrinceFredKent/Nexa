import { tool, jsonSchema } from 'ai';

interface DatetimeParams {
  timezone: string;
}

export const datetimeTool = tool({
  description:
    'Returns the current date, time, day of the week, and timezone. Use this whenever the user asks about time, date, day, or anything time-sensitive.',
  parameters: jsonSchema<DatetimeParams>({
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'IANA timezone name, e.g. "Africa/Kampala" or "America/New_York". Defaults to local timezone.',
      },
    },
    required: ['timezone'],
    additionalProperties: false,
  }),
  execute: async ({ timezone }) => {
    const now = new Date();
    const effectiveTz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Kampala';
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'long',
      timeZone: effectiveTz,
    };

    const formatted = new Intl.DateTimeFormat('en-US', options).format(now);
    return {
      formatted,
      iso: now.toISOString(),
      timestamp: now.getTime(),
      timezone: effectiveTz,
    };
  },
});
