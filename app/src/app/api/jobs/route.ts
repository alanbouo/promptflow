import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../../lib/db';
import { processSingle, processBatch } from '../../../lib/n8n-client';
import { CreateJobRequest, JobStatus } from '../../../lib/types/job';
import { authOptions } from '../../../lib/auth';

// Generate a short summary from output text (first ~50 chars, cleaned up)
function generateOutputSummary(output: string): string {
  if (!output) return '';
  // Remove markdown, extra whitespace, and truncate
  const cleaned = output
    .replace(/[#*`_~\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= 40) return cleaned;
  // Find a good break point
  const truncated = cleaned.slice(0, 40);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

// GET /api/jobs - List user's jobs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const jobs = await prisma.job.findMany({
      where: {
        userId: session.user.id
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
    const jobSummaries = jobs.map(job => {
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
    
    return NextResponse.json(jobSummaries);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json() as CreateJobRequest;
    
    // Validate required fields
    if (!body.config || !body.inputData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID for the job
    const jobId = uuidv4();
    
    // Prepare job data
    const jobData = {
      id: jobId,
      status: 'pending' as JobStatus,
      templateId: body.templateId || null,
      userId: session.user.id,
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
    
    // Process the job using n8n
    if (isBatch) {
      // For batch processing
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/${jobId}/callback`;
      
      await processBatch({
        jobId,
        systemPrompt: body.config.systemPrompt,
        userPrompts: body.config.userPrompts.map(p => p.content),
        settings: {
          provider: body.config.settings.provider,
          model: body.config.settings.model,
          temperature: body.config.settings.temperature,
          maxTokens: body.config.settings.maxTokens
        },
        dataItems: body.inputData,
        batchSize: body.config.settings.concurrentRequests,
        callbackUrl
      });
    } else {
      // For single processing
      const result = await processSingle({
        jobId,
        systemPrompt: body.config.systemPrompt,
        userPrompts: body.config.userPrompts.map(p => p.content),
        settings: {
          provider: body.config.settings.provider,
          model: body.config.settings.model,
          temperature: body.config.settings.temperature,
          maxTokens: body.config.settings.maxTokens
        },
        dataItem: body.inputData[0]
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
      
      // Generate job name from template + output summary
      const outputSummary = generateOutputSummary(result.finalOutput);
      const jobName = templateName 
        ? `${templateName}: ${outputSummary}`
        : outputSummary || `Job ${jobId.slice(0, 8)}`;
      
      // Update job with result
      await prisma.job.update({
        where: { id: jobId },
        data: {
          name: jobName,
          status: result.status === 'success' ? 'completed' : 'failed',
          results: JSON.stringify([result]),
          tokenUsage: result.tokenUsage.prompt + result.tokenUsage.completion,
          completedAt: new Date()
        }
      });
    }
    
    // Return the created job
    return NextResponse.json({
      id: job.id,
      status: 'running',
      message: isBatch ? 'Batch job started' : 'Single job processed'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
