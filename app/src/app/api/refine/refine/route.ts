import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '../../../../lib/llm-client';

interface Example {
  input: string;
  output: string;
}

interface RefineRequest {
  currentSystemPrompt: string;
  currentUserPrompt: string;
  testInput: string;
  testOutput: string;
  feedback: string;
  useCase: string;
  examples: Example[];
}

const REFINE_SYSTEM_PROMPT = `You are an expert prompt engineer. Your task is to refine existing prompts based on user feedback.

You will receive:
1. The current system prompt and user prompt
2. A test input and the output it produced
3. User feedback about what's wrong or what should be different
4. The original use case description and examples (for context)

Your job is to modify the prompts to address the feedback while maintaining the original intent.

You must respond with a valid JSON object containing exactly two fields:
- "systemPrompt": The refined system prompt
- "userPrompt": The refined user prompt (must include {input} placeholder)

Guidelines:
1. Make targeted changes based on the specific feedback
2. Don't completely rewrite prompts unless necessary
3. Preserve what's working well
4. Add constraints or clarifications to address the issues
5. If the output format is wrong, be more explicit about format requirements
6. If the tone is wrong, adjust the system prompt's role description

Respond ONLY with the JSON object, no additional text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RefineRequest;
    
    if (!body.currentSystemPrompt?.trim() || !body.currentUserPrompt?.trim()) {
      return NextResponse.json(
        { error: 'Current prompts are required' },
        { status: 400 }
      );
    }

    if (!body.feedback?.trim()) {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 }
      );
    }

    // Build the refinement request
    let userMessage = `Current System Prompt:
${body.currentSystemPrompt}

Current User Prompt:
${body.currentUserPrompt}

Test Input:
${body.testInput || '(not provided)'}

Actual Output:
${body.testOutput || '(not provided)'}

User Feedback:
${body.feedback}

Original Use Case:
${body.useCase || '(not provided)'}`;

    if (body.examples && body.examples.length > 0) {
      const validExamples = body.examples.filter(e => e.input?.trim() || e.output?.trim());
      if (validExamples.length > 0) {
        userMessage += '\n\nOriginal Examples:';
        validExamples.forEach((example, index) => {
          userMessage += `\n\nExample ${index + 1}:`;
          if (example.input?.trim()) {
            userMessage += `\nInput: ${example.input}`;
          }
          if (example.output?.trim()) {
            userMessage += `\nExpected Output: ${example.output}`;
          }
        });
      }
    }

    userMessage += '\n\nPlease refine the prompts based on the feedback. Return as JSON.';

    // Call LLM to refine prompts
    const response = await callLLM({
      systemPrompt: REFINE_SYSTEM_PROMPT,
      userPrompts: [userMessage],
      dataItem: '',
      settings: {
        provider: process.env.DEFAULT_LLM_PROVIDER || 'xai',
        model: process.env.DEFAULT_LLM_MODEL || 'grok-4-1-fast-reasoning',
        temperature: 0.7,
        maxTokens: 2000
      }
    });

    // Parse the JSON response
    let parsedResponse;
    try {
      const jsonMatch = response.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', response.output);
      return NextResponse.json(
        { error: 'Failed to parse refined prompts' },
        { status: 500 }
      );
    }

    if (!parsedResponse.systemPrompt || !parsedResponse.userPrompt) {
      return NextResponse.json(
        { error: 'Invalid response format from LLM' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      systemPrompt: parsedResponse.systemPrompt,
      userPrompt: parsedResponse.userPrompt
    });

  } catch (error) {
    console.error('Error refining prompts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refine prompts' },
      { status: 500 }
    );
  }
}
