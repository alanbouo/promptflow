import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/db';

// GET /api/templates - List all templates
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform the templates to match the expected format
    const formattedTemplates = templates.map((template: {
      id: string;
      name: string;
      systemPrompt: string;
      userPrompts: string;
      settings: string;
      createdAt: Date;
      updatedAt: Date;
    }) => ({
      id: template.id,
      name: template.name,
      systemPrompt: template.systemPrompt,
      userPrompts: JSON.parse(template.userPrompts),
      settings: JSON.parse(template.settings),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString()
    }));
    
    return NextResponse.json(formattedTemplates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.systemPrompt || !body.userPrompts || !body.settings) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create the template
    const template = await prisma.template.create({
      data: {
        name: body.name,
        systemPrompt: body.systemPrompt,
        userPrompts: JSON.stringify(body.userPrompts),
        settings: JSON.stringify(body.settings)
      }
    });
    
    // Return the created template with formatted data
    return NextResponse.json({
      id: template.id,
      name: template.name,
      systemPrompt: template.systemPrompt,
      userPrompts: JSON.parse(template.userPrompts),
      settings: JSON.parse(template.settings),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
