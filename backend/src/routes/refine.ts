import { Hono } from 'hono';
import { callLLM } from '../lib/llm-client.js';
import { authMiddleware } from '../middleware/auth.js';

const refine = new Hono();

// All routes require authentication
refine.use('*', authMiddleware);

// POST /refine/generate - Generate a prompt from description
refine.post('/generate', async (c) => {
  try {
    const { description, context } = await c.req.json();

    if (!description) {
      return c.json({ error: 'Description is required' }, 400);
    }

    const systemPrompt = `You are an expert prompt engineer. Your task is to create effective prompts for LLMs based on user descriptions.
Create a well-structured prompt that:
1. Is clear and specific
2. Includes relevant context
3. Specifies the expected output format
4. Uses placeholders like {input} for dynamic data

Return ONLY the prompt text, no explanations.`;

    const userMessage = context
      ? `Create a prompt for: ${description}\n\nAdditional context: ${context}`
      : `Create a prompt for: ${description}`;

    const result = await callLLM({
      systemPrompt,
      userPrompts: [userMessage],
      dataItem: '',
      settings: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000
      }
    });

    return c.json({ prompt: result.output });
  } catch (error) {
    console.error('Error generating prompt:', error);
    return c.json({ error: 'Failed to generate prompt' }, 500);
  }
});

// POST /refine/refine - Refine an existing prompt
refine.post('/refine', async (c) => {
  try {
    const { prompt, feedback } = await c.req.json();

    if (!prompt || !feedback) {
      return c.json({ error: 'Prompt and feedback are required' }, 400);
    }

    const systemPrompt = `You are an expert prompt engineer. Your task is to improve prompts based on feedback.
Maintain the original intent while addressing the feedback.
Keep placeholders like {input} and {previous_output} intact.

Return ONLY the improved prompt text, no explanations.`;

    const userMessage = `Original prompt:\n${prompt}\n\nFeedback:\n${feedback}\n\nPlease improve the prompt based on this feedback.`;

    const result = await callLLM({
      systemPrompt,
      userPrompts: [userMessage],
      dataItem: '',
      settings: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000
      }
    });

    return c.json({ prompt: result.output });
  } catch (error) {
    console.error('Error refining prompt:', error);
    return c.json({ error: 'Failed to refine prompt' }, 500);
  }
});

// POST /refine/test - Test a prompt with sample input
refine.post('/test', async (c) => {
  try {
    const { systemPrompt, userPrompt, testInput, settings } = await c.req.json();

    if (!userPrompt) {
      return c.json({ error: 'User prompt is required' }, 400);
    }

    const result = await callLLM({
      systemPrompt: systemPrompt || 'You are a helpful assistant.',
      userPrompts: [userPrompt],
      dataItem: testInput || '',
      settings: settings || {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000
      }
    });

    return c.json({
      output: result.output,
      tokenUsage: result.tokenUsage
    });
  } catch (error) {
    console.error('Error testing prompt:', error);
    return c.json({ error: 'Failed to test prompt' }, 500);
  }
});

export default refine;
