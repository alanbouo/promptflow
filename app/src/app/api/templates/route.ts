import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/db';
import { authOptions } from '../../../lib/auth';

// GET /api/templates - List user's templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const templates = await prisma.template.findMany({
      where: {
        userId: session.user.id
      },
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
      userId: string;
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
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
        settings: JSON.stringify(body.settings),
        userId: session.user.id
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
