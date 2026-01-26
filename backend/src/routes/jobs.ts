import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/db.js';
import { processWithChaining } from '../lib/llm-client.js';
import { authMiddleware } from '../middleware/auth.js';

const jobs = new Hono();

// All routes require authentication
jobs.use('*', authMiddleware);

interface JobResult {
  input: string;
  intermediates?: string[];
  finalOutput: string;
  tokenUsage: { prompt: number; completion: number };
  status: 'success' | 'error';
  error?: string;
}

// Generate a short summary from output text
function generateOutputSummary(output: string): string {
  if (!output) return '';
  const cleaned = output
    .replace(/[#*`_~\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= 40) return cleaned;
  const truncated = cleaned.slice(0, 40);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

// GET /jobs - List user's jobs
jobs.get('/', async (c) => {
  try {
    const user = c.get('user');

    const jobList = await prisma.job.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        status: true,
        inputData: true,
        results: true,
        tokenUsage: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        template: {
          select: {
            name: true
          }
        }
      }
    });

    // Transform the jobs to include summary information
    const jobSummaries = jobList.map(job => {
      const results = job.results ? JSON.parse(job.results as string) : [];
      const inputData = JSON.parse(job.inputData as string);

      return {
        id: job.id,
        name: job.name,
        templateName: job.template?.name,
        status: job.status,
        itemsTotal: inputData.length,
        itemsCompleted: results.length,
        tokenUsage: job.tokenUsage,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt
      };
    });

    return c.json(jobSummaries);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return c.json({ error: 'Failed to fetch jobs' }, 500);
  }
});

// POST /jobs - Create a new job
jobs.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // Validate required fields
    if (!body.config || !body.inputData) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Generate a unique ID for the job
    const jobId = uuidv4();

    // Prepare job data
    const jobData = {
      id: jobId,
      status: 'pending',
      templateId: body.templateId || null,
      userId: user.id,
      config: JSON.stringify(body.config),
      inputData: JSON.stringify(body.inputData),
      tokenUsage: 0,
      createdAt: new Date()
    };

    // Create the job in the database
    const job = await prisma.job.create({
      data: jobData
    });

    // Determine if this is a batch or single job
    const isBatch = body.config.settings.batchProcessing && body.inputData.length > 1;

    // Update job status to running
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'running',
        startedAt: new Date()
      }
    });

    // Get template name for job naming
    let templateName = '';
    if (body.templateId) {
      const template = await prisma.template.findUnique({
        where: { id: body.templateId },
        select: { name: true }
      });
      templateName = template?.name || '';
    }

    // Process the job using direct LLM calls
    const userPromptContents = body.config.userPrompts.map((p: { content: string }) => p.content);
    const settings = {
      provider: body.config.settings.provider,
      model: body.config.settings.model,
      temperature: body.config.settings.temperature,
      maxTokens: body.config.settings.maxTokens
    };

    // Process asynchronously (don't await)
    processJobAsync(jobId, body.inputData, userPromptContents, body.config.systemPrompt, settings, templateName, isBatch);

    // Return the created job
    return c.json({
      id: job.id,
      status: 'running',
      message: isBatch ? 'Batch job started' : 'Single job processing'
    }, 201);
  } catch (error) {
    console.error('Error creating job:', error);
    return c.json({ error: 'Failed to create job' }, 500);
  }
});

// Async job processing function
async function processJobAsync(
  jobId: string,
  inputData: string[],
  userPrompts: string[],
  systemPrompt: string,
  settings: { provider: string; model: string; temperature: number; maxTokens: number },
  templateName: string,
  isBatch: boolean
) {
  try {
    if (isBatch) {
      const results: JobResult[] = [];
      let totalTokens = 0;

      for (const dataItem of inputData) {
        try {
          const llmResult = await processWithChaining(
            systemPrompt,
            userPrompts,
            dataItem,
            settings
          );

          results.push({
            input: dataItem,
            intermediates: llmResult.intermediates,
            finalOutput: llmResult.finalOutput,
            tokenUsage: llmResult.tokenUsage,
            status: 'success'
          });

          totalTokens += llmResult.tokenUsage.prompt + llmResult.tokenUsage.completion;
        } catch (itemError) {
          results.push({
            input: dataItem,
            finalOutput: '',
            tokenUsage: { prompt: 0, completion: 0 },
            status: 'error',
            error: itemError instanceof Error ? itemError.message : 'Unknown error'
          });
        }
      }

      const firstSuccess = results.find(r => r.status === 'success');
      const outputSummary = generateOutputSummary(firstSuccess?.finalOutput || '');
      const jobName = templateName
        ? `${templateName}: ${outputSummary}`
        : outputSummary || `Job ${jobId.slice(0, 8)}`;

      const hasErrors = results.some(r => r.status === 'error');

      await prisma.job.update({
        where: { id: jobId },
        data: {
          name: jobName,
          status: hasErrors ? 'failed' : 'completed',
          results: JSON.stringify(results),
          tokenUsage: totalTokens,
          completedAt: new Date()
        }
      });
    } else {
      const llmResult = await processWithChaining(
        systemPrompt,
        userPrompts,
        inputData[0],
        settings
      );

      const result: JobResult = {
        input: inputData[0],
        intermediates: llmResult.intermediates,
        finalOutput: llmResult.finalOutput,
        tokenUsage: llmResult.tokenUsage,
        status: 'success'
      };

      const outputSummary = generateOutputSummary(result.finalOutput);
      const jobName = templateName
        ? `${templateName}: ${outputSummary}`
        : outputSummary || `Job ${jobId.slice(0, 8)}`;

      await prisma.job.update({
        where: { id: jobId },
        data: {
          name: jobName,
          status: 'completed',
          results: JSON.stringify([result]),
          tokenUsage: result.tokenUsage.prompt + result.tokenUsage.completion,
          completedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Job processing error:', error);
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        completedAt: new Date()
      }
    });
  }
}

// GET /jobs/:id - Get a specific job
jobs.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const job = await prisma.job.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        template: {
          select: {
            name: true
          }
        }
      }
    });

    if (!job) {
      return c.json({ error: 'Job not found' }, 404);
    }

    return c.json({
      id: job.id,
      name: job.name,
      status: job.status,
      templateName: job.template?.name,
      config: JSON.parse(job.config),
      inputData: JSON.parse(job.inputData),
      results: job.results ? JSON.parse(job.results) : null,
      tokenUsage: job.tokenUsage,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return c.json({ error: 'Failed to fetch job' }, 500);
  }
});

// DELETE /jobs/:id - Cancel/delete a job
jobs.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const existing = await prisma.job.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return c.json({ error: 'Job not found' }, 404);
    }

    // If running, mark as cancelled; otherwise delete
    if (existing.status === 'running' || existing.status === 'pending') {
      await prisma.job.update({
        where: { id },
        data: { status: 'cancelled', completedAt: new Date() }
      });
      return c.json({ message: 'Job cancelled' });
    } else {
      await prisma.job.delete({ where: { id } });
      return c.json({ message: 'Job deleted' });
    }
  } catch (error) {
    console.error('Error deleting job:', error);
    return c.json({ error: 'Failed to delete job' }, 500);
  }
});

export default jobs;
