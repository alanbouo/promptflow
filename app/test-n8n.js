/**
 * Simple n8n connectivity test
 * Run with: node test-n8n.js
 */

// Set the n8n webhook URL - replace with your actual n8n URL if different
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook";

async function testN8nConnectivity() {
  console.log(`Testing n8n connectivity to: ${N8N_WEBHOOK_URL}`);
  
  try {
    // Try to fetch the n8n webhook URL to see if it's reachable
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'HEAD',
    });
    
    if (response.ok) {
      console.log('✅ n8n server is reachable!');
      return true;
    } else {
      console.log(`❌ n8n server returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to n8n:', error.message);
    return false;
  }
}

async function testSingleProcessing() {
  console.log('\nTesting n8n webhook processing...');
  
  try {
    // Try to send a test request to the process-single webhook
    const response = await fetch(`${N8N_WEBHOOK_URL}/process-single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ Successfully sent test request to n8n webhook!');
      console.log('Response:', JSON.stringify(result, null, 2));
      return true;
    } else {
      console.log(`❌ n8n webhook returned status: ${response.status}`);
      const text = await response.text();
      console.log('Response:', text);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending test request to n8n webhook:', error.message);
    return false;
  }
}

async function runTests() {
  const isConnected = await testN8nConnectivity();
  
  if (isConnected) {
    await testSingleProcessing();
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Make sure you have created a workflow in n8n with a webhook trigger at /process-single');
  console.log('2. Make sure you have activated the workflow in n8n');
  console.log('3. If the test failed, check the n8n logs for more information');
}

runTests().catch(console.error);
