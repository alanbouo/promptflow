import { Hono } from 'hono';
import prisma from '../lib/db.js';
import { authMiddleware } from '../middleware/auth.js';

const templates = new Hono();

// All routes require authentication
templates.use('*', authMiddleware);

// GET /templates - List user's templates
templates.get('/', async (c) => {
  try {
    const user = c.get('user');

    const templateList = await prisma.template.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the templates to match the expected format
    const formattedTemplates = templateList.map((template) => ({
      id: template.id,
      name: template.name,
      systemPrompt: template.systemPrompt,
      userPrompts: JSON.parse(template.userPrompts),
      settings: JSON.parse(template.settings),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString()
    }));

    return c.json(formattedTemplates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return c.json({ error: 'Failed to fetch templates' }, 500);
  }
});

// POST /templates - Create a new template
templates.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // Validate required fields
    if (!body.name || !body.systemPrompt || !body.userPrompts || !body.settings) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create the template
    const template = await prisma.template.create({
      data: {
        name: body.name,
        systemPrompt: body.systemPrompt,
        userPrompts: JSON.stringify(body.userPrompts),
        settings: JSON.stringify(body.settings),
        userId: user.id
      }
    });

    // Return the created template with formatted data
    return c.json({
      id: template.id,
      name: template.name,
      systemPrompt: template.systemPrompt,
      userPrompts: JSON.parse(template.userPrompts),
      settings: JSON.parse(template.settings),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString()
    }, 201);
  } catch (error) {
    console.error('Error creating template:', error);
    return c.json({ error: 'Failed to create template' }, 500);
  }
});

// GET /templates/:id - Get a specific template
templates.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    return c.json({
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
    return c.json({ error: 'Failed to fetch template' }, 500);
  }
});

// PUT /templates/:id - Update a template
templates.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();

    // Check ownership
    const existing = await prisma.template.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return c.json({ error: 'Template not found' }, 404);
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        systemPrompt: body.systemPrompt ?? existing.systemPrompt,
        userPrompts: body.userPrompts ? JSON.stringify(body.userPrompts) : existing.userPrompts,
        settings: body.settings ? JSON.stringify(body.settings) : existing.settings
      }
    });

    return c.json({
      id: template.id,
      name: template.name,
      systemPrompt: template.systemPrompt,
      userPrompts: JSON.parse(template.userPrompts),
      settings: JSON.parse(template.settings),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return c.json({ error: 'Failed to update template' }, 500);
  }
});

// DELETE /templates/:id - Delete a template
templates.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    // Check ownership
    const existing = await prisma.template.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return c.json({ error: 'Template not found' }, 404);
    }

    await prisma.template.delete({
      where: { id }
    });

    return c.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return c.json({ error: 'Failed to delete template' }, 500);
  }
});

export default templates;
