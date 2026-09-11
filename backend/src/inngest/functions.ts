import { NonRetriableError } from 'inngest';
import { inngest } from './client.js';
import prisma from '../lib/db.js';
import { processWithChaining, LLMSettings } from '../lib/llm-client.js';

interface JobResult {
  input: string;
  intermediates?: string[];
  finalOutput: string;
  tokenUsage: { prompt: number; completion: number };
  status: 'success' | 'error';
  error?: string;
}

interface ProcessJobRequestedEvent {
  data: {
    jobId: string;
    inputData: string[];
    userPrompts: string[];
    systemPrompt: string;
    settings: LLMSettings;
    templateName: string;
    isBatch: boolean;
  };
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

export const processJob = inngest.createFunction(
  { id: 'process-job' },
  { event: 'job/process.requested' },
  async ({ event, step }: { event: ProcessJobRequestedEvent; step: any }) => {
    const { jobId, inputData, userPrompts, systemPrompt, settings, templateName, isBatch } = event.data;

    if (!inputData.length) {
      throw new NonRetriableError('inputData is empty');
    }

    // Not used for single-item jobs, but harmless.
    void isBatch;

    const results: JobResult[] = [];
    let totalTokens = 0;

    try {
      for (let i = 0; i < inputData.length; i++) {
        const dataItem = inputData[i];

        try {
          const llmResult = await step.run(`process-item-${i}`, () =>
            processWithChaining(systemPrompt, userPrompts, dataItem, settings)
          );

          results.push({
            input: dataItem,
            intermediates: llmResult.intermediates,
            finalOutput: llmResult.finalOutput,
            tokenUsage: llmResult.tokenUsage,
            status: 'success',
          });

          totalTokens += llmResult.tokenUsage.prompt + llmResult.tokenUsage.completion;
        } catch (itemError) {
          // step.run has already exhausted Inngest's automatic retries for
          // this item - record it as a failed item and keep processing the rest.
          results.push({
            input: dataItem,
            finalOutput: '',
            tokenUsage: { prompt: 0, completion: 0 },
            status: 'error',
            error: itemError instanceof Error ? itemError.message : 'Unknown error',
          });
        }
      }

      await step.run('finalize-job', async () => {
        const firstSuccess = results.find((r) => r.status === 'success');
        const outputSummary = generateOutputSummary(firstSuccess?.finalOutput || '');
        const jobName = templateName
          ? `${templateName}: ${outputSummary}`
          : outputSummary || `Job ${jobId.slice(0, 8)}`;
        const hasErrors = results.some((r) => r.status === 'error');

        await prisma.job.update({
          where: { id: jobId },
          data: {
            name: jobName,
            status: hasErrors ? 'failed' : 'completed',
            results: JSON.stringify(results),
            tokenUsage: totalTokens,
            completedAt: new Date(),
          },
        });
      });
    } catch (fatalError) {
      // Only reached if a step's retries are exhausted on something other than
      // a single item's LLM call (e.g. the finalize-job DB write itself).
      await step.run('mark-job-failed', () =>
        prisma.job.update({
          where: { id: jobId },
          data: { status: 'failed', completedAt: new Date() },
        })
      );
      throw fatalError;
    }

    return { jobId, itemCount: results.length, totalTokens };
  }
);

export const functions = [processJob];
