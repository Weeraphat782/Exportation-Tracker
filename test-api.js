// Simple test to verify the API endpoint works
const fetch = require('node-fetch');

async function testAPI() {
  console.log('Testing POST /api/analyze-document...');
  
  try {
    const response = await fetch('https://exportation-tracker.vercel.app/api/analyze-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: 'test-doc-123',
        fileUrl: 'https://example.com/test.pdf',
        fileName: 'test.pdf',
        documentType: 'invoice'
      }),
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ API is working! Version:', data.version);
    } else {
      console.log('❌ API returned error status');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testAPI(); 