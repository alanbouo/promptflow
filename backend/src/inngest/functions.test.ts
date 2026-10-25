import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProcessJobHandler, type ProcessJobDeps } from './functions.js';

type FakeJob = { status: string; name?: string; results?: string; tokenUsage?: number; completedAt?: Date };

const llmOutput = (text: string) => ({
  finalOutput: text,
  intermediates: [],
  tokenUsage: { prompt: 1, completion: 1 },
});

// In-memory stand-in for the three Prisma calls process-job makes.
function setup(initialStatus: string, onLlmCall: (call: number, job: FakeJob) => void = () => {}) {
  const job: FakeJob = { status: initialStatus };
  let llmCalls = 0;
  let failNextUpdate = false;

  const prisma = {
    job: {
      findUnique: async () => ({ status: job.status }),
      update: async ({ data }: { data: Partial<FakeJob> }) => {
        if (failNextUpdate) throw new Error('db down');
        Object.assign(job, data);
        return job;
      },
      updateMany: async ({ where, data }: { where: { status?: { not: string } }; data: Partial<FakeJob> }) => {
        if (where.status?.not === job.status) return { count: 0 };
        Object.assign(job, data);
        return { count: 1 };
      },
    },
  } as unknown as ProcessJobDeps['prisma'];

  const processWithChaining = (async () => {
    llmCalls++;
    onLlmCall(llmCalls, job);
    return llmOutput(`out-${llmCalls}`);
  }) as unknown as ProcessJobDeps['processWithChaining'];

  const handler = createProcessJobHandler({ prisma, processWithChaining });
  const step = { run: async (_name: string, fn: () => unknown) => fn() };
  const run = (items: string[]) =>
    handler({
      event: {
        data: {
          jobId: 'job-1',
          inputData: items,
          userPrompts: ['{input}'],
          systemPrompt: '',
          settings: { provider: 'openai', model: 'm', temperature: 0, maxTokens: 10 },
          templateName: '',
          isBatch: true,
        },
      },
      step,
    });

  return { job, run, llmCalls: () => llmCalls, failNextUpdate: () => (failNextUpdate = true) };
}

test('a job that is never cancelled still completes', async () => {
  const t = setup('running');
  await t.run(['a', 'b', 'c']);
  assert.equal(t.llmCalls(), 3);
  assert.equal(t.job.status, 'completed');
  assert.equal(JSON.parse(t.job.results!).length, 3);
});

test('cancelling mid-batch stops further LLM calls and keeps the cancelled status', async () => {
  // The cancel lands while item 2 (call 2) is being processed.
  const t = setup('running', (call, job) => {
    if (call === 2) job.status = 'cancelled';
  });
  await t.run(['a', 'b', 'c', 'd']);

  assert.equal(t.llmCalls(), 2, 'items 3 and 4 must not reach the LLM');
  assert.equal(t.job.status, 'cancelled');
  assert.equal(JSON.parse(t.job.results!).length, 2, 'work done before the cancel is kept');
  assert.equal(t.job.tokenUsage, 4);
});

test('a job cancelled before it starts makes no LLM call', async () => {
  const t = setup('cancelled');
  await t.run(['a', 'b']);
  assert.equal(t.llmCalls(), 0);
  assert.equal(t.job.status, 'cancelled');
  assert.deepEqual(JSON.parse(t.job.results!), []);
});

test('a cancel that lands during the last item is not overwritten by completion', async () => {
  const t = setup('running', (call, job) => {
    if (call === 2) job.status = 'cancelled';
  });
  await t.run(['a', 'b']);
  assert.equal(t.llmCalls(), 2);
  assert.equal(t.job.status, 'cancelled');
});

test('a fatal error does not overwrite a cancelled job with failed', async () => {
  const t = setup('cancelled');
  t.failNextUpdate();
  await assert.rejects(t.run(['a']), /db down/);
  assert.equal(t.job.status, 'cancelled');
});
