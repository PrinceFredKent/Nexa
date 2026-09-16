import { tool, jsonSchema } from 'ai';

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
}

export const webSearchTool = tool({
  description:
    'Searches the web for up-to-date information. Use this for current events, facts you might not know, prices, news, or anything that may have changed after your training cutoff.',
  parameters: jsonSchema<{ query: string }>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query. Be specific and descriptive for best results.',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  execute: async ({ query }) => {
    const maxResults = 3;
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return { error: 'Web search is not configured (missing TAVILY_API_KEY)', results: [] };
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: maxResults,
          search_depth: 'basic',
          include_answer: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Search API returned ' + response.status);
      }

      const data: TavilyResponse = await response.json();

      return {
        query,
        answer: data.answer ?? null,
        results: data.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content.slice(0, 400),
        })),
      };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Search failed',
        results: [],
      };
    }
  },
});
