import OpenAI from 'openai';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Initialize the OpenAI client with OpenTyphoon API
const openai = new OpenAI({
  apiKey: process.env.TYPHOON_API_KEY || process.env.NEXT_PUBLIC_TYPHOON_API_KEY || 'sk-WJEte8ZIPyEZTqTY0wGuj5vgkT9SAByiP8jUEBTfBEtjtim8',
  baseURL: 'https://api.opentyphoon.ai/v1',
});

interface DocumentAnalysisResult {
  description: string;
  extractedText?: string;
  documentType?: string;
  keyPoints?: string[];
}

export async function analyzeDocument(
  fileUrl: string,
  fileName: string,
  documentType: string
): Promise<DocumentAnalysisResult> {
  try {
    let extractedText = '';
    
    console.log(`🚀 Analyzing document: ${fileName} from URL: ${fileUrl}`);
    console.log(`📋 Document type: ${documentType}`);
    
    // Check if the file is an image that needs OCR
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
    const isPDF = fileName.toLowerCase().endsWith('.pdf');
    
    console.log(`🔍 File type detection: isImage=${isImage}, isPDF=${isPDF}`);
    
    if (isImage) {
      // For images, use OCR to extract text
      console.log('📸 Processing as image file...');
      extractedText = await extractTextFromImage(fileUrl, fileName);
    } else if (isPDF) {
      // For PDFs, extract text content
      console.log('📄 Processing as PDF file...');
      extractedText = await extractTextFromPDF(fileUrl, fileName);
    } else {
      // For other document types, try to read as text
      console.log('📝 Processing as text document...');
      extractedText = await extractTextFromDocument(fileUrl, fileName);
    }

    console.log(`📊 Extracted text summary:`);
    console.log(`   - Length: ${extractedText.length} characters`);
    console.log(`   - Type: ${typeof extractedText}`);
    console.log(`   - First 200 chars: ${extractedText.substring(0, 200)}`);

    // Check if we got meaningful content or an error message
    const isErrorMessage = extractedText.includes('ไม่สามารถ') || 
                          extractedText.includes('เกิดข้อผิดพลาด') ||
                          extractedText.includes('หมดเวลา') ||
                          extractedText.includes('เสียหาย');

    let description: string;
    
    if (isErrorMessage) {
      // If we got an error message, use it directly as the description
      console.log('⚠️ Error detected in text extraction, using error message as description');
      description = extractedText;
    } else if (extractedText && extractedText.trim().length > 20) {
      // We have meaningful extracted text, generate AI description
      console.log('✅ Meaningful text found, generating AI description...');
      description = await generateDocumentDescription(extractedText, documentType, fileName);
    } else {
      // No meaningful text found, use filename-based analysis as fallback
      console.log('⚠️ No meaningful text extracted, falling back to filename analysis');
      description = analyzePDFFromFilename(fileName);
    }
    
    console.log(`🎯 Final description: ${description}`);
    
    return {
      description,
      extractedText: extractedText.substring(0, 5000), // Store first 5000 chars for debugging
      documentType,
      keyPoints: isErrorMessage ? [] : extractKeyPoints(extractedText)
    };
  } catch (error: unknown) {
    console.error('❌ Error analyzing document:', error);
    
    // Provide detailed error description
    let errorDescription: string;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorDescription = `ไม่สามารถเชื่อมต่อกับระบบเก็บไฟล์เพื่อวิเคราะห์ ${fileName} ได้ - ปัญหาการเชื่อมต่อเครือข่าย`;
    } else if (errorMessage.includes('timeout')) {
      errorDescription = `การวิเคราะห์ ${fileName} หมดเวลา - ไฟล์อาจมีขนาดใหญ่เกินไปหรือซับซ้อน`;
    } else if (errorMessage.includes('memory')) {
      errorDescription = `ไม่สามารถวิเคราะห์ ${fileName} ได้ - หน่วยความจำไม่เพียงพอ`;
    } else if (errorMessage.includes('permission')) {
      errorDescription = `ไม่มีสิทธิ์เข้าถึงไฟล์ ${fileName} ในระบบเก็บข้อมูล`;
    } else {
      errorDescription = `ไม่สามารถวิเคราะห์เนื้อหาเอกสาร ${fileName} ได้ในขณะนี้ - ${errorMessage}`;
    }
    
    return {
      description: errorDescription,
      extractedText: `Error: ${errorMessage}`,
      documentType,
      keyPoints: []
    };
  }
}

async function generateDocumentDescription(
  extractedText: string,
  documentType: string,
  fileName: string
): Promise<string> {
  try {
    // Enhanced prompt focused on extracting key content
    const documentTypeContext = getDocumentTypeContext(documentType);
    
    const response = await openai.chat.completions.create({
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
ชื่อไฟล์: ${fileName}
ประเภทเอกสาร: ${documentType}
บริบทเอกสาร: ${documentTypeContext}
เนื้อหาที่พบ: ${extractedText.substring(0, 4000)}

สรุปใจความสำคัญของเอกสาร ไม่ใช่อธิบายว่าเอกสารคืออะไร แต่สรุปเนื้อหาที่สำคัญที่พบในเอกสาร

หากไม่พบเนื้อหาเอกสารจริง ให้ระบุว่า "ไม่สามารถอ่านเนื้อหาเอกสารได้" แทนการสมมติ`
        }
      ],
      max_tokens: 300,
      temperature: 0.2
    });

    return response.choices[0].message.content || `ไม่สามารถสกัดใจความสำคัญจากเอกสาร ${fileName} ได้`;
  } catch (error) {
    console.error('Error generating description:', error);
    return `ไม่สามารถวิเคราะห์เนื้อหาเอกสาร ${fileName} ได้ในขณะนี้`;
  }
}

function getDocumentTypeContext(documentType: string): string {
  const contexts: Record<string, string> = {
    'tk-32': 'ใบอนุญาตส่งออกเคมีภัณฑ์ตามพระราชบัญญัติวัตถุอันตราย',
    'tk-11': 'ใบแจ้งการส่งออกสินค้าควบคุม',
    'tk-10': 'ใบอนุญาตส่งออกสินค้าประเภทที่ต้องขออนุญาต',
    'invoice': 'ใบกำกับสินค้าเชิงพาณิชย์ระบุมูลค่าและรายการสินค้า',
    'packing-list': 'รายการบรรจุภัณฑ์ระบุน้ำหนักและขนาด',
    'certificate': 'หนังสือรับรองคุณภาพหรือมาตรฐานสินค้า',
    'permit': 'ใบอนุญาตต่างๆ ที่เกี่ยวข้องกับการส่งออก',
    'customs': 'เอกสารศุลกากรสำหรับการขนส่งข้ามแดน',
    'company-registration': 'เอกสารจดทะเบียนบริษัทสำหรับการค้าระหว่างประเทศ',
    'msds': 'เอกสารข้อมูลความปลอดภัยของวัสดุเคมี'
  };
  
  return contexts[documentType] || 'เอกสารที่เกี่ยวข้องกับการส่งออกหรือนำเข้าสินค้า';
}

async function extractTextFromImage(imageUrl: string, fileName: string): Promise<string> {
  try {
    console.log('🖼️ Processing image with OCR:', fileName);
    console.log('🔗 Image URL:', imageUrl);
    
    // Download the image with timeout
    console.log('📥 Downloading image...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(imageUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch image: ${response.status} ${response.statusText}`);
      return `ไม่สามารถดาวน์โหลดรูปภาพ ${fileName} ได้ (HTTP ${response.status})`;
    }
    
    console.log('✅ Image downloaded successfully');
    console.log('📏 Content length:', response.headers.get('content-length'));
    console.log('📝 Content type:', response.headers.get('content-type'));
    
    // Convert to buffer for OCR processing
    const imageBuffer = await response.arrayBuffer();
    console.log(`💾 Image buffer size: ${imageBuffer.byteLength} bytes`);
    
    if (imageBuffer.byteLength === 0) {
      return `รูปภาพ ${fileName} ไม่มีข้อมูล (ไฟล์เสียหาย)`;
    }
    
    if (imageBuffer.byteLength > 10 * 1024 * 1024) { // 10MB limit
      return `รูปภาพ ${fileName} มีขนาดใหญ่เกินไป (${Math.round(imageBuffer.byteLength / 1024 / 1024)}MB) ไม่สามารถประมวลผลได้`;
    }
    
    // Use Tesseract.js for OCR (client-side compatible)
    console.log('🤖 Starting OCR processing...');
    const Tesseract = await import('tesseract.js');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const worker: any = await Tesseract.createWorker();
    
    try {
      console.log('📚 Loading OCR languages (Thai + English)...');
      await worker.loadLanguage('eng+tha');
      await worker.initialize('eng+tha');
      
      console.log('🔍 Recognizing text...');
      const { data: { text, confidence } } = await worker.recognize(Buffer.from(imageBuffer));
      await worker.terminate();
      
      console.log(`✅ OCR completed with confidence: ${confidence}%`);
      console.log(`📄 Extracted ${text.length} characters from ${fileName}`);
      console.log(`🔤 First 200 chars: ${text.substring(0, 200)}`);
      
      if (!text || text.trim().length < 5) {
        return `รูปภาพ ${fileName} - ไม่พบข้อความที่อ่านได้ (อาจเป็นรูปภาพที่ไม่มีข้อความ หรือคุณภาพต่ำ)`;
      }
      
      if (confidence < 30) {
        return `รูปภาพ ${fileName} - พบข้อความแต่มีความแม่นยำต่ำ (${confidence}%) อาจอ่านไม่ถูกต้อง: ${text.substring(0, 200)}...`;
      }
      
      return text.trim();
      
    } catch (ocrError: unknown) {
      console.error('❌ OCR processing failed:', ocrError);
      await worker.terminate();
      
      const ocrErrorMessage = ocrError instanceof Error ? ocrError.message : 'Unknown OCR error';
      
      // Provide more specific error messages
      if (ocrErrorMessage.includes('timeout')) {
        return `รูปภาพ ${fileName} - การประมวลผล OCR หมดเวลา (ใช้เวลานานเกินไป)`;
      } else if (ocrErrorMessage.includes('memory')) {
        return `รูปภาพ ${fileName} - หน่วยความจำไม่เพียงพอสำหรับการประมวลผล OCR`;
      } else {
        return `รูปภาพ ${fileName} - เกิดข้อผิดพลาดในการประมวลผล OCR: ${ocrErrorMessage}`;
      }
    }
  } catch (error: unknown) {
    console.error('❌ Error processing image:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    // Provide specific error messages based on error type
    if (errorName === 'AbortError') {
      return `รูปภาพ ${fileName} - การดาวน์โหลดหมดเวลา (เกิน 30 วินาที)`;
    } else if (errorMessage.includes('fetch')) {
      return `รูปภาพ ${fileName} - ไม่สามารถเชื่อมต่อกับ Supabase Storage ได้`;
    } else if (errorMessage.includes('network')) {
      return `รูปภาพ ${fileName} - ปัญหาการเชื่อมต่อเครือข่าย`;
    } else {
      return `รูปภาพ ${fileName} - เกิดข้อผิดพลาดในการประมวลผล: ${errorMessage}`;
    }
  }
}

async function extractTextFromPDF(pdfUrl: string, fileName: string): Promise<string> {
  try {
    console.log('📄 Processing PDF:', fileName);
    console.log('🔗 PDF URL:', pdfUrl);
    
    // Download PDF file with timeout
    console.log('📥 Downloading PDF...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for PDFs
    
    const response = await fetch(pdfUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch PDF: ${response.status} ${response.statusText}`);
      return `ไม่สามารถดาวน์โหลด PDF ${fileName} ได้ (HTTP ${response.status})`;
    }
    
    console.log('✅ PDF downloaded successfully');
    console.log('📏 Content length:', response.headers.get('content-length'));
    console.log('📝 Content type:', response.headers.get('content-type'));
    
    const pdfBuffer = await response.arrayBuffer();
    console.log(`💾 PDF buffer size: ${pdfBuffer.byteLength} bytes`);
    
    if (pdfBuffer.byteLength === 0) {
      return `PDF ${fileName} ไม่มีข้อมูล (ไฟล์เสียหาย)`;
    }
    
    if (pdfBuffer.byteLength > 50 * 1024 * 1024) { // 50MB limit for PDFs
      return `PDF ${fileName} มีขนาดใหญ่เกินไป (${Math.round(pdfBuffer.byteLength / 1024 / 1024)}MB) ไม่สามารถประมวลผลได้`;
    }
    
    // Check if it's actually a PDF by checking magic bytes
    const pdfSignature = new Uint8Array(pdfBuffer.slice(0, 4));
    const isPdfFile = pdfSignature[0] === 0x25 && pdfSignature[1] === 0x50 && 
                      pdfSignature[2] === 0x44 && pdfSignature[3] === 0x46; // %PDF
    
    if (!isPdfFile) {
      console.warn('⚠️ File does not appear to be a valid PDF');
      return `ไฟล์ ${fileName} ไม่ใช่ PDF ที่ถูกต้อง (ไฟล์เสียหายหรือประเภทไฟล์ไม่ถูกต้อง)`;
    }
    
    // Save to temporary file for processing
    const tempFilePath = join(tmpdir(), `temp_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    console.log('💾 Saving to temp file:', tempFilePath);
    
    try {
      writeFileSync(tempFilePath, Buffer.from(pdfBuffer));
      console.log('✅ Temp file created successfully');
    } catch (writeError: unknown) {
      const writeErrorMessage = writeError instanceof Error ? writeError.message : 'Unknown write error';
      console.error('❌ Failed to write temp file:', writeError);
      return `ไม่สามารถสร้างไฟล์ชั่วคราวสำหรับ PDF ${fileName} ได้: ${writeErrorMessage}`;
    }
    
    try {
      // Use pdf-text-extract for server-side PDF processing
      console.log('🔍 Extracting text from PDF...');
      const pdfExtract = await import('pdf-text-extract');
      
      const extractedText = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('PDF extraction timeout after 60 seconds'));
        }, 60000);
        
        pdfExtract.default(tempFilePath, (err: Error | null, pages: string[]) => {
          clearTimeout(timeout);
          
          if (err) {
            console.error('❌ PDF extraction error:', err);
            reject(err);
          } else {
            const fullText = pages.join('\n');
            console.log(`📄 Extracted ${fullText.length} characters from ${pages.length} pages`);
            console.log(`🔤 First 200 chars: ${fullText.substring(0, 200)}`);
            resolve(fullText);
          }
        });
      });
      
      // Clean up temp file
      try {
        unlinkSync(tempFilePath);
        console.log('🗑️ Temp file cleaned up');
      } catch (cleanupError) {
        console.error('⚠️ Failed to clean up temp file:', cleanupError);
      }
      
      console.log(`✅ PDF extraction completed: ${extractedText.length} characters`);
      
      if (extractedText && extractedText.trim().length > 10) {
        // Check if the extracted text seems to contain meaningful content
        const meaningfulChars = extractedText.replace(/\s/g, '').length;
        const ratio = meaningfulChars / extractedText.length;
        
        if (ratio > 0.1) { // At least 10% non-whitespace characters
          return extractedText.trim();
        } else {
          console.log('⚠️ PDF appears to contain mostly whitespace');
          return `PDF ${fileName} - ไฟล์ดูเหมือนจะเป็นเอกสารสแกนที่ไม่มีข้อความ (image-based PDF) ต้องการ OCR`;
        }
      } else {
        // If no meaningful text extracted, provide specific message
        console.log('⚠️ No meaningful text found in PDF, might be image-based');
        return `PDF ${fileName} - เป็นเอกสารแบบรูปภาพ (ไม่มีข้อความที่อ่านได้) ต้องการการแปลงเป็นข้อความด้วย OCR`;
      }
    } catch (extractError: unknown) {
      // Clean up temp file in case of error
      try {
        unlinkSync(tempFilePath);
        console.log('🗑️ Temp file cleaned up after error');
      } catch (cleanupError) {
        console.error('⚠️ Error cleaning up temp file:', cleanupError);
      }
      
      console.error('❌ PDF text extraction failed:', extractError);
      
      const extractErrorMessage = extractError instanceof Error ? extractError.message : 'Unknown extraction error';
      
      // Provide specific error messages
      if (extractErrorMessage.includes('timeout')) {
        return `PDF ${fileName} - การประมวลผลหมดเวลา (ไฟล์ใหญ่หรือซับซ้อนเกินไป)`;
      } else if (extractErrorMessage.includes('encrypted') || extractErrorMessage.includes('password')) {
        return `PDF ${fileName} - เอกสารมีการป้องกันด้วยรหัสผ่าน ไม่สามารถอ่านได้`;
      } else if (extractErrorMessage.includes('corrupted') || extractErrorMessage.includes('invalid')) {
        return `PDF ${fileName} - ไฟล์เสียหายหรือไม่ถูกต้อง`;
      } else {
        return `PDF ${fileName} - เกิดข้อผิดพลาดในการสกัดข้อความ: ${extractErrorMessage}`;
      }
    }
  } catch (error: unknown) {
    console.error('❌ Error extracting PDF text:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    // Provide specific error messages based on error type
    if (errorName === 'AbortError') {
      return `PDF ${fileName} - การดาวน์โหลดหมดเวลา (เกิน 45 วินาที)`;
    } else if (errorMessage.includes('fetch')) {
      return `PDF ${fileName} - ไม่สามารถเชื่อมต่อกับ Supabase Storage ได้`;
    } else if (errorMessage.includes('network')) {
      return `PDF ${fileName} - ปัญหาการเชื่อมต่อเครือข่าย`;
    } else {
      return `PDF ${fileName} - เกิดข้อผิดพลาดในการประมวลผล: ${errorMessage}`;
    }
  }
}

async function extractTextFromDocument(fileUrl: string, fileName: string): Promise<string> {
  try {
    console.log('Processing text document:', fileName);
    
    // Download document
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log(`Text document extracted ${text.length} characters from ${fileName}`);
    
    return text || `เอกสารข้อความ ${fileName} - ไม่พบเนื้อหา`;
  } catch (error) {
    console.error('Error processing text document:', error);
    return `เอกสาร ${fileName} - ไม่สามารถอ่านเนื้อหาได้`;
  }
}

function analyzePDFFromFilename(fileName: string): string {
  const nameLower = fileName.toLowerCase();
  
  if (nameLower.includes('tk32') || nameLower.includes('tk-32')) {
    return `เอกสารใบอนุญาตส่งออกเคมีภัณฑ์ TK-32 สำหรับบริษัท [ชื่อบริษัท] อนุญาตให้ส่งออกสารเคมี [ชนิดสารเคมี] ปริมาณ [จำนวน] ไปยัง [ประเทศปลายทาง] มีผลถึงวันที่ [วันหมดอายุ] เลขที่อนุญาต [หมายเลขอ้างอิง]`;
  }
  
  if (nameLower.includes('tk11') || nameLower.includes('tk-11')) {
    return `เอกสารใบแจ้งการส่งออกสินค้าควบคุม TK-11 ระบุการส่งออกสินค้า [ชื่อสินค้า] จากบริษัท [ชื่อผู้ส่งออก] ไปยัง [ประเทศปลายทาง] น้ำหนัก [จำนวน] กิโลกรัม วันที่ส่งออก [วันที่] เลขที่แจ้ง [หมายเลขอ้างอิง]`;
  }
  
  if (nameLower.includes('tk10') || nameLower.includes('tk-10')) {
    return `เอกสารใบอนุญาตส่งออกสินค้า TK-10 สำหรับสินค้า [ชื่อสินค้า] ของบริษัท [ชื่อบริษัท] ปลายทาง [ประเทศ/เมือง] มูลค่า [จำนวนเงิน] วันที่อนุญาต [วันที่] ถึงวันที่ [วันหมดอายุ]`;
  }
  
  if (nameLower.includes('invoice')) {
    return `ใบกำกับสินค้าเชิงพาณิชย์จากบริษัท [ชื่อผู้ขาย] ถึง [ชื่อผู้ซื้อ] รายการสินค้า [รายการ] มูลค่าทั้งสิ้น [จำนวนเงิน] เงื่อนไขการชำระเงิน [เงื่อนไข] วันที่ออกใบกำกับ [วันที่]`;
  }
  
  if (nameLower.includes('packing')) {
    return `รายการบรรจุภัณฑ์ระบุสินค้า [รายการสินค้า] จำนวน [จำนวนลัง/ชิ้น] น้ำหนักรวม [น้ำหนัก] กิโลกรัม ขนาด [ขนาด] เซนติเมตร หมายเลขลัง [หมายเลขอ้างอิง] วันที่บรรจุ [วันที่]`;
  }
  
  if (nameLower.includes('company') || nameLower.includes('registration')) {
    return `เอกสารจดทะเบียนบริษัท [ชื่อบริษัท] ประเภทกิจการ [ประเภทธุรกิจ] ทุนจดทะเบียน [จำนวนเงิน] บาท ที่อยู่ [ที่อยู่] เลขทะเบียน [หมายเลขทะเบียน] วันที่จดทะเบียน [วันที่]`;
  }
  
  if (nameLower.includes('msds') || nameLower.includes('safety')) {
    return `เอกสารข้อมูลความปลอดภัยสารเคมี [ชื่อสารเคมี] หมายเลข CAS [หมายเลข] ระดับอันตราย [ระดับ] วิธีการจัดเก็บ [วิธีการ] มาตรการปฐมพยาบาล [มาตรการ] บริษัทผู้ผลิต [ชื่อบริษัท]`;
  }
  
  if (nameLower.includes('import') && nameLower.includes('permit')) {
    return `เอกสารใบอนุญาตนำเข้าสินค้า ระบุสินค้า [ชื่อสินค้า] ปริมาณ [จำนวน] กิโลกรัม บริษัทผู้นำเข้า [ชื่อบริษัท] ประเทศต้นทาง [ประเทศ] เลขที่อนุญาต [หมายเลข] วันที่มีผล [วันที่] ถึงวันที่ [วันหมดอายุ]`;
  }
  
  if (nameLower.includes('po') || nameLower.includes('purchase') || nameLower.includes('order')) {
    return `ใบสั่งซื้อสินค้า PO เลขที่ [หมายเลข PO] จากบริษัท [ชื่อผู้ซื้อ] ถึง [ชื่อผู้ขาย] รายการสินค้า [รายการ] จำนวน [จำนวน] มูลค่า [จำนวนเงิน] กำหนดส่งมอบ [วันที่] เงื่อนไขการชำระเงิน [เงื่อนไข]`;
  }
  
  return `เอกสารการส่งออก/นำเข้า: ${fileName} - กำลังวิเคราะห์เนื้อหาเพื่อสกัดข้อมูลสำคัญ`;
}

function extractKeyPoints(text: string): string[] {
  // Enhanced keyword extraction for export/import documents
  const keywords = [
    'ใบขนสินค้า', 'invoice', 'packing list', 'certificate', 'permit',
    'TK', 'export', 'import', 'customs', 'shipment', 'container',
    'ใบอนุญาต', 'ใบรับรอง', 'ใบกำกับสินค้า', 'ใบแพ็ค', 'ใบขน',
    'เคมีภัณฑ์', 'วัตถุอันตราย', 'สินค้าควบคุม', 'ศุลกากร',
    'MSDS', 'Safety Data Sheet', 'Commercial Invoice', 'Bill of Lading'
  ];
  
  const foundKeywords = keywords.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return foundKeywords.slice(0, 5); // Return max 5 keywords
}

// Function to update document description in database
export async function updateDocumentDescription(documentId: string, analysisResult: DocumentAnalysisResult) {
  try {
    console.log('📝 updateDocumentDescription called');
    console.log('Document ID:', documentId);
    console.log('Analysis result:', analysisResult);

    const { updateDocumentSubmission } = await import('./db');
    
    console.log('📂 Calling updateDocumentSubmission...');
    const result = await updateDocumentSubmission(documentId, {
      description: analysisResult.description
    });
    
    console.log('💾 Database update result:', result);
    console.log(`✅ Updated description for document ${documentId}: ${analysisResult.description}`);
  } catch (error) {
    console.error('❌ Error updating document description:', error);
    throw error; // Re-throw to surface the error
  }
}

// Batch process existing documents
export async function processExistingDocuments() {
  try {
    const { getDocumentSubmissions } = await import('./db');
    
    const documents = await getDocumentSubmissions();
    const documentsWithoutDescription = documents.filter(doc => !doc.description);
    
    console.log(`Processing ${documentsWithoutDescription.length} documents without descriptions`);
    
    for (const doc of documentsWithoutDescription) {
      if (doc.file_url && doc.file_name) {
        const analysisResult = await analyzeDocument(
          doc.file_url,
          doc.file_name,
          doc.document_type
        );
        
        await updateDocumentDescription(doc.id, analysisResult);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Finished processing existing documents');
  } catch (error) {
    console.error('Error processing existing documents:', error);
  }
} 