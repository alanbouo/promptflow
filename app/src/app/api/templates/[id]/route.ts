import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/db';

// GET /api/templates/[id] - Get a single template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: params.id }
    });
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
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
    const template = await prisma.template.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({
      message: 'Template deleted successfully',
      id: template.id
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    
    // Check if the error is due to template not found
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
