import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/db';
import { JobResult } from '../../../../../lib/types/job';

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

// POST /api/jobs/[id]/callback - n8n callback to update job
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    
    // Validate the request body
    if (!body || !Array.isArray(body.results)) {
      return NextResponse.json(
        { error: 'Invalid callback payload' },
        { status: 400 }
      );
    }
    
    // Find the job with template info
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        template: {
          select: { name: true }
        }
      }
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Parse the results from n8n
    const results: JobResult[] = body.results;
    
    // Calculate total token usage
    const tokenUsage = results.reduce((total, result) => {
      return total + (result.tokenUsage?.prompt || 0) + (result.tokenUsage?.completion || 0);
    }, 0);
    
    // Check if all items are processed
    const inputData = JSON.parse(job.inputData as string);
    const isCompleted = results.length === inputData.length;
    
    // Determine the job status
    const hasErrors = results.some(result => result.status === 'error');
    const status = isCompleted ? (hasErrors ? 'failed' : 'completed') : 'running';
    
    // Generate job name when completed
    let jobName = job.name;
    if (isCompleted && !job.name && results.length > 0) {
      const templateName = job.template?.name || '';
      const firstOutput = results[0]?.finalOutput || '';
      const outputSummary = generateOutputSummary(firstOutput);
      jobName = templateName 
        ? `${templateName}: ${outputSummary}`
        : outputSummary || `Job ${jobId.slice(0, 8)}`;
    }
    
    // Update the job
    await prisma.job.update({
      where: { id: jobId },
      data: {
        name: jobName,
        status,
        results: JSON.stringify(results),
        tokenUsage,
        completedAt: isCompleted ? new Date() : undefined,
        n8nExecutionId: body.executionId || job.n8nExecutionId
      }
    });
    
    return NextResponse.json({
      message: 'Job updated successfully',
      status,
      itemsProcessed: results.length,
      itemsTotal: inputData.length
    });
  } catch (error) {
    console.error('Error updating job via callback:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}
