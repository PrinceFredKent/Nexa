import { tool, jsonSchema } from 'ai';
import { evaluate } from 'mathjs';

export const calculatorTool = tool({
  description:
    'Evaluates a mathematical expression and returns the result. Use this for any arithmetic, algebra, or numeric calculation.',
  parameters: jsonSchema<{ expression: string }>({
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to evaluate, e.g. "17 * 23" or "sqrt(144) + 5^2"',
      },
    },
    required: ['expression'],
    additionalProperties: false,
  }),
  execute: async ({ expression }) => {
    try {
      const result = evaluate(expression);
      const formatted = typeof result === 'number' ? result.toString() : String(result);
      return { expression, result: formatted, success: true };
    } catch (err) {
      return {
        expression,
        result: null,
        success: false,
        error: err instanceof Error ? err.message : 'Could not evaluate expression',
      };
    }
  },
});
