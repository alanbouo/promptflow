import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../../lib/db';
import { authOptions } from '../../../../lib/auth';

// GET /api/templates/[id] - Get a single template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const template = await prisma.template.findUnique({
      where: { id: params.id }
    });
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Verify user owns this template
    if (template.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Return the template with formatted data
    return NextResponse.json({
      id: template.id,
      name: template.name,
      systemPrompt: template.systemPrompt,
      userPrompts: JSON.parse(template.userPrompts),
      settings: JSON.parse(template.settings),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // First check if template exists and user owns it
    const template = await prisma.template.findUnique({
      where: { id: params.id }
    });
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Verify user owns this template
    if (template.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    await prisma.template.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({
      message: 'Template deleted successfully',
      id: params.id
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
