import { NextResponse } from 'next/server';

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET endpoint to process all existing documents without descriptions
export async function GET() {
  try {
    const headers = { ...corsHeaders };
    
    console.log('🔄 Starting batch document processing...');
    const { processExistingDocuments } = await import('@/lib/ai-document-processor');
    
    // Process existing documents in the background
    processExistingDocuments().catch(error => {
      console.error('Background processing error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Started processing existing documents in the background'
    }, { headers });

  } catch (error) {
    console.error('Error starting document processing:', error);
    const headers = { ...corsHeaders };
    
    return NextResponse.json(
      { 
        error: 'Failed to start document processing', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500, headers }
    );
  }
} 