const OpenAI = require('openai');

// Initialize the client with your API key and the OpenTyphoon base URL
const openai = new OpenAI({
  apiKey: 'sk-WJEte8ZIPyEZTqTY0wGuj5vgkT9SAByiP8jUEBTfBEtjtim8',
  baseURL: 'https://api.opentyphoon.ai/v1',
});

async function testContentExtraction() {
  try {
    console.log('Testing AI content extraction...\n');
    
    // Test case 1: TK-32 chemical export permit
    const tk32Content = `
เอกสารใบอนุญาตส่งออกเคมีภัณฑ์ TK-32 สำหรับบริษัท บริษัท เคมีไทย จำกัด อนุญาตให้ส่งออกสารเคมี โซเดียมไฮดรอกไซด์ ปริมาณ 2,500 กิโลกรัม ไปยัง เวียดนาม มีผลถึงวันที่ 30 ธันวาคม 2024 เลขที่อนุญาต TK32-2024-00123
`;

    // Test case 2: Invoice content
    const invoiceContent = `
ใบกำกับสินค้าเชิงพาณิชย์จากบริษัท ไทยเอ็กซ์ปอร์ต จำกัด ถึง ABC Trading Co., Ltd สิงคโปร์ รายการสินค้า ข้าวหอมมะลิ 1,000 ถุง มูลค่าทั้งสิ้น 50,000 USD เงื่อนไขการชำระเงิน L/C at sight วันที่ออกใบกำกับ 15 พฤศจิกายน 2024
`;

    const response1 = await openai.chat.completions.create({
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
เนื้อหาที่พบ: ${tk32Content}

สรุปใจความสำคัญของเอกสาร ไม่ใช่อธิบายว่าเอกสารคืออะไร แต่สรุปเนื้อหาที่สำคัญที่พบในเอกสาร`
        }
      ],
      max_tokens: 300,
      temperature: 0.2
    });

    console.log('TK-32 Document Analysis:');
    console.log(response1.choices[0].message.content);
    console.log('\n---\n');

    const response2 = await openai.chat.completions.create({
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
เนื้อหาที่พบ: ${invoiceContent}

สรุปใจความสำคัญของเอกสาร ไม่ใช่อธิบายว่าเอกสารคืออะไร แต่สรุปเนื้อหาที่สำคัญที่พบในเอกสาร`
        }
      ],
      max_tokens: 300,
      temperature: 0.2
    });

    console.log('Invoice Document Analysis:');
    console.log(response2.choices[0].message.content);

  } catch (error) {
    console.error('Error testing AI:', error);
  }
}

testContentExtraction(); 