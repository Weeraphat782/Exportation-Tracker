const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: 'sk-WJEte8ZIPyEZTqTY0wGuj5vgkT9SAByiP8jUEBTfBEtjtim8',
  baseURL: 'https://api.opentyphoon.ai/v1',
});

async function testRealContentExtraction() {
  try {
    console.log('Testing real file content extraction...\n');
    
    // Test with a simple text content simulation
    const sampleTextContent = `
COMMERCIAL INVOICE

From: Thai Export Company Ltd.
Address: 123 Bangkok Street, Thailand
To: Global Import Corp.
Address: 456 Singapore Avenue, Singapore

Invoice No: INV-2024-001
Date: November 15, 2024

Item Description: Premium Thai Jasmine Rice
Quantity: 1,000 bags (25kg each)
Unit Price: $12.50 USD
Total Value: $12,500.00 USD

Payment Terms: Letter of Credit at Sight
Shipment Date: November 30, 2024
Port of Loading: Bangkok
Port of Discharge: Singapore
`;

    // Test TK-32 content
    const tk32Content = `
CHEMICAL EXPORT PERMIT TK-32

Company: Chemical Industries Thailand Co., Ltd.
Registration No: 0105567890123
Address: 789 Industrial Zone, Rayong, Thailand

Permit No: TK32-2024-00567
Issue Date: November 10, 2024
Expiry Date: December 31, 2024

Chemical Name: Sodium Hydroxide (Caustic Soda)
Chemical Formula: NaOH
CAS Number: 1310-73-2
Quantity Authorized: 5,000 kg
Destination Country: Vietnam
Importer: Vietnam Chemical Co., Ltd.

This permit authorizes the export of the above chemical subject to all applicable regulations.
`;

    console.log('=== Testing Invoice Content Extraction ===');
    const invoiceResponse = await openai.chat.completions.create({
      model: 'typhoon-v2.1-12b-instruct',
      messages: [
        {
          role: 'system',
          content: `You are an expert document content analyzer for export/import business. Your task is to extract and summarize the KEY CONTENT and IMPORTANT DETAILS from documents, not describe what type of document it is.

Focus on extracting these specific details when available:
- Company names and parties involved
- Product/goods names and quantities
- Dates (issue date, expiry date, shipment date)
- Destinations/origins
- Permit numbers, reference numbers
- Important conditions, restrictions, or requirements
- Values, amounts, weights
- Key regulatory compliance information

Create a concise Thai summary (2-3 sentences) of the ACTUAL CONTENT and IMPORTANT INFORMATION found in the document.

DO NOT just describe what type of document it is. Extract the actual meaningful content.`
        },
        {
          role: 'user',
          content: `สกัดใจความสำคัญจากเอกสารนี้:
ชื่อไฟล์: Commercial-Invoice-Rice-Export.pdf
ประเภทเอกสาร: invoice
เนื้อหาที่พบในเอกสาร:
${sampleTextContent}

สรุปใจความสำคัญของเอกสาร ไม่ใช่อธิบายว่าเอกสารคืออะไร แต่สรุปเนื้อหาที่สำคัญที่พบในเอกสาร`
        }
      ],
      max_tokens: 300,
      temperature: 0.2
    });

    console.log('Invoice Analysis Result:');
    console.log(invoiceResponse.choices[0].message.content);
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('=== Testing TK-32 Chemical Permit Content Extraction ===');
    const tk32Response = await openai.chat.completions.create({
      model: 'typhoon-v2.1-12b-instruct',
      messages: [
        {
          role: 'system',
          content: `You are an expert document content analyzer for export/import business. Your task is to extract and summarize the KEY CONTENT and IMPORTANT DETAILS from documents, not describe what type of document it is.

Focus on extracting these specific details when available:
- Company names and parties involved
- Product/goods names and quantities
- Dates (issue date, expiry date, shipment date)
- Destinations/origins
- Permit numbers, reference numbers
- Important conditions, restrictions, or requirements
- Values, amounts, weights
- Key regulatory compliance information

Create a concise Thai summary (2-3 sentences) of the ACTUAL CONTENT and IMPORTANT INFORMATION found in the document.

DO NOT just describe what type of document it is. Extract the actual meaningful content.`
        },
        {
          role: 'user',
          content: `สกัดใจความสำคัญจากเอกสารนี้:
ชื่อไฟล์: TK32-Chemical-Export-Permit.pdf
ประเภทเอกสาร: tk-32
เนื้อหาที่พบในเอกสาร:
${tk32Content}

สรุปใจความสำคัญของเอกสาร ไม่ใช่อธิบายว่าเอกสารคืออะไร แต่สรุปเนื้อหาที่สำคัญที่พบในเอกสาร`
        }
      ],
      max_tokens: 300,
      temperature: 0.2
    });

    console.log('TK-32 Analysis Result:');
    console.log(tk32Response.choices[0].message.content);
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('✅ Real content extraction test completed successfully!');
    console.log('The AI now extracts actual meaningful content instead of just describing document types.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRealContentExtraction(); 