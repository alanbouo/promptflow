import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '../../../../lib/llm-client';

interface Example {
  input: string;
  output: string;
}

interface GenerateRequest {
  useCase: string;
  examples: Example[];
}

const GENERATE_SYSTEM_PROMPT = `You are an expert prompt engineer. Your task is to create effective system and user prompts based on a use case description and optional examples.

You must respond with a valid JSON object containing exactly two fields:
- "systemPrompt": A clear, specific system prompt that sets the AI's role, tone, and constraints
- "userPrompt": A user prompt template that uses {input} as a placeholder for the data

Guidelines for creating prompts:
1. System prompts should be specific about the AI's role, expertise, and output format
2. User prompts should clearly instruct what to do with the {input} data
3. Include any formatting requirements mentioned in the use case
4. If examples are provided, incorporate their patterns into the prompts
5. Keep prompts concise but comprehensive

Respond ONLY with the JSON object, no additional text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateRequest;
    
    if (!body.useCase?.trim()) {
      return NextResponse.json(
        { error: 'Use case description is required' },
        { status: 400 }
      );
    }

    // Build the user message with use case and examples
    let userMessage = `Use Case Description:\n${body.useCase}\n`;
    
    if (body.examples && body.examples.length > 0) {
      const validExamples = body.examples.filter(e => e.input?.trim() || e.output?.trim());
      if (validExamples.length > 0) {
        userMessage += '\nExamples:\n';
        validExamples.forEach((example, index) => {
          userMessage += `\nExample ${index + 1}:\n`;
          if (example.input?.trim()) {
            userMessage += `Input: ${example.input}\n`;
          }
          if (example.output?.trim()) {
            userMessage += `Expected Output: ${example.output}\n`;
          }
        });
      }
    }

    userMessage += '\nGenerate the system prompt and user prompt as a JSON object.';

    // Call LLM to generate prompts
    const response = await callLLM({
      systemPrompt: GENERATE_SYSTEM_PROMPT,
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
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = response.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', response.output);
      return NextResponse.json(
        { error: 'Failed to parse generated prompts' },
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
    console.error('Error generating prompts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate prompts' },
      { status: 500 }
    );
  }
}
