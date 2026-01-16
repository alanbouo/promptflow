/**
 * Test script for n8n connectivity
 * Run with: npx ts-node src/lib/test-n8n.ts
 */

import { testN8nConnectivity, processSingle } from './n8n-client.js';

async function runTest() {
  console.log('Testing n8n connectivity...');
  
  const isConnected = await testN8nConnectivity();
  console.log(`n8n connectivity test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
  
  if (isConnected) {
    console.log('\nTrying to send a test request to n8n...');
    
    try {
      const result = await processSingle({
        jobId: 'test-job-' + Date.now(),
        systemPrompt: 'You are a helpful assistant.',
        userPrompts: ['Say hello to {input}'],
        settings: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 100
        },
        dataItem: 'World'
      });
      
      console.log('\nTest request result:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.status === 'success') {
        console.log('\n✅ n8n integration test PASSED!');
      } else {
        console.log('\n❌ n8n integration test FAILED. Check the error message above.');
      }
    } catch (error) {
      console.error('\n❌ Error sending test request:', error);
      console.log('\nMake sure you have:');
      console.log('1. n8n running and accessible at the URL specified in .env');
      console.log('2. Created a workflow in n8n with a webhook trigger at /process-single');
      console.log('3. Activated the workflow in n8n');
    }
  } else {
    console.log('\nMake sure n8n is running and accessible at:', process.env.N8N_WEBHOOK_URL);
  }
}

runTest().catch(console.error);
