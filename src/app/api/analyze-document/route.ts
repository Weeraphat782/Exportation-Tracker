import { NextRequest, NextResponse } from 'next/server';

// Add CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Add a simple GET endpoint for testing
export async function GET() {
  try {
    const headers = { ...corsHeaders };
    
    console.log('🔄 GET request to analyze-document endpoint');
    console.log('Environment check:');
    console.log('- TYPHOON_API_KEY exists:', !!process.env.TYPHOON_API_KEY);
    console.log('- NEXT_PUBLIC_TYPHOON_API_KEY exists:', !!process.env.NEXT_PUBLIC_TYPHOON_API_KEY);
    
    return NextResponse.json({
      success: true,
      message: 'Analyze document API is working',
      version: '2024-05-29-v2', // Added version for cache busting
      environment: {
        hasTyphoonKey: !!process.env.TYPHOON_API_KEY,
        hasPublicTyphoonKey: !!process.env.NEXT_PUBLIC_TYPHOON_API_KEY,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    }, { headers });

  } catch (error) {
    console.error('Error in GET endpoint:', error);
    const headers = { ...corsHeaders };
    
    return NextResponse.json(
      { 
        error: 'GET endpoint failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers to response
    const headers = { ...corsHeaders };

    console.log('=== ANALYZE DOCUMENT API POST v2 ===');
    console.log('Environment check:');
    console.log('- TYPHOON_API_KEY exists:', !!process.env.TYPHOON_API_KEY);
    console.log('- NEXT_PUBLIC_TYPHOON_API_KEY exists:', !!process.env.NEXT_PUBLIC_TYPHOON_API_KEY);
    
    // Parse request body with error handling
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', success: false },
        { status: 400, headers }
      );
    }

    const { documentId, fileUrl, fileName, documentType } = requestData;

    console.log('Document ID:', documentId);
    console.log('File URL:', fileUrl);
    console.log('File Name:', fileName);
    console.log('Document Type:', documentType);

    if (!documentId || !fileUrl || !fileName || !documentType) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: documentId, fileUrl, fileName, documentType', success: false },
        { status: 400, headers }
      );
    }

    // Import and call the AI processing function
    console.log('📥 Importing AI processor...');
    const { analyzeDocument, updateDocumentDescription } = await import('@/lib/ai-document-processor');

    // Analyze the document using AI
    console.log('🤖 Starting AI analysis...');
    const analysisResult = await analyzeDocument(fileUrl, fileName, documentType);
    console.log('✅ AI analysis completed:', analysisResult.description);

    // Update the document in the database with the generated description
    console.log('💾 Updating database...');
    await updateDocumentDescription(documentId, analysisResult);
    console.log('✅ Database updated successfully');

    return NextResponse.json({
      success: true,
      description: analysisResult.description,
      keyPoints: analysisResult.keyPoints,
      message: 'Document analyzed and description updated successfully',
      version: '2024-05-29-v2'
    }, { headers });

  } catch (error) {
    console.error('❌ Error in analyze-document API POST:', error);
    const headers = { ...corsHeaders };
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze document', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        version: '2024-05-29-v2'
      },
      { status: 500, headers }
    );
  }
} 