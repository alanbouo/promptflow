import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '../../../../lib/llm-client';

interface TestRequest {
  systemPrompt: string;
  userPrompt: string;
  testInput: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TestRequest;
    
    if (!body.systemPrompt?.trim()) {
      return NextResponse.json(
        { error: 'System prompt is required' },
        { status: 400 }
      );
    }

    if (!body.userPrompt?.trim()) {
      return NextResponse.json(
        { error: 'User prompt is required' },
        { status: 400 }
      );
    }

    if (!body.testInput?.trim()) {
      return NextResponse.json(
        { error: 'Test input is required' },
        { status: 400 }
      );
    }

    // Replace {input} placeholder with actual test input
    const userMessage = body.userPrompt.replace(/\{input\}/g, body.testInput);

    // Call LLM with the prompts
    const response = await callLLM({
      systemPrompt: body.systemPrompt,
      userPrompts: [userMessage],
      dataItem: '',
      settings: {
        provider: process.env.DEFAULT_LLM_PROVIDER || 'xai',
        model: process.env.DEFAULT_LLM_MODEL || 'grok-4-1-fast-reasoning',
        temperature: 0.7,
        maxTokens: 4000
      }
    });

    return NextResponse.json({
      output: response.output,
      tokenUsage: response.tokenUsage
    });

  } catch (error) {
    console.error('Error testing prompts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to test prompts' },
      { status: 500 }
    );
  }
}
