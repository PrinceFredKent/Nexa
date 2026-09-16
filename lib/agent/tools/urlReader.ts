import { tool } from 'ai';
import { z } from 'zod';

export const urlReaderTool = tool({
  description:
    'Fetch and read the text content of a webpage or article given its URL. Use this when the user asks to analyze, summarize, or extract data from a specific website link.',
  parameters: z.object({
    url: z.string().url().describe('The full HTTP/HTTPS URL of the webpage to read'),
  }),
  execute: async ({ url }) => {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NexaAgent/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { error: `Failed to fetch URL: HTTP ${response.status} ${response.statusText}` };
      }

      const html = await response.text();

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'No title found';

      // Clean HTML: remove scripts, styles, svg, and tags
      let cleanText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, ' ')
        .trim();

      // Limit length to ~12000 chars (~2500 words)
      if (cleanText.length > 12000) {
        cleanText = cleanText.substring(0, 12000) + '... [Content truncated for length]';
      }

      return {
        url,
        title,
        content: cleanText || 'No readable text content extracted.',
      };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Error reading URL content',
      };
    }
  },
});
