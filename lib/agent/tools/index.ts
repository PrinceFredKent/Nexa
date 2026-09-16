import { datetimeTool } from './datetime';
import { calculatorTool } from './calculator';
import { webSearchTool } from './webSearch';
import { memoryTool } from './memoryTool';
import { notesTool } from './notes';
import { urlReaderTool } from './urlReader';
import { weatherTool } from './weather';

export const tools = {
  get_current_datetime: datetimeTool,
  calculate: calculatorTool,
  web_search: webSearchTool,
  manage_memory: memoryTool,
  manage_notes: notesTool,
  read_url: urlReaderTool,
  get_weather: weatherTool,
} as const;

export type ToolName = keyof typeof tools;
