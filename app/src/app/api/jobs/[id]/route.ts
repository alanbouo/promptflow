import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../../lib/db';
import { authOptions } from '../../../../lib/auth';

// GET /api/jobs/[id] - Get a single job
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
    
    const job = await prisma.job.findUnique({
      where: { id: params.id }
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Verify user owns this job
    if (job.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse JSON fields
    const parsedJob = {
      ...job,
      config: JSON.parse(job.config as string),
      inputData: JSON.parse(job.inputData as string),
      results: job.results ? JSON.parse(job.results as string) : [],
      logs: job.logs ? JSON.parse(job.logs as string) : []
    };
    
    return NextResponse.json(parsedJob);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Cancel a job
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
    
    const job = await prisma.job.findUnique({
      where: { id: params.id }
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Verify user owns this job
    if (job.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Only allow cancellation of pending or running jobs
    if (job.status !== 'pending' && job.status !== 'running') {
      return NextResponse.json(
        { error: 'Cannot cancel a job that is not pending or running' },
        { status: 400 }
      );
    }
    
    // If job has an n8n execution ID, we should cancel it in n8n
    // This would require an additional n8n client method to cancel executions
    // For now, we'll just mark it as cancelled in our database
    
    await prisma.job.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
        completedAt: new Date()
      }
    });
    
    return NextResponse.json({
      message: 'Job cancelled successfully',
      id: params.id
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}
