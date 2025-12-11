import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

interface UploadErrorDetail {
  name: string | 'unknown'; // Allow 'unknown' for files that might not have a name from formData
  error: string;
}

// API Route to handle shipment photo uploads
export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server configuration error: Supabase client not initialized.' },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('shipmentPhoto') as File[];
    const quotationId = formData.get('quotationId') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided.' }, { status: 400 });
    }
    if (!quotationId) {
      return NextResponse.json({ error: 'Missing quotationId.' }, { status: 400 });
    }

    const bucket = 'shipment-photos';
    const uploadedPhotoUrls: string[] = [];
    const uploadErrors: UploadErrorDetail[] = [];

    for (const file of files) {
      if (!file.name || !file.type) {
        console.warn('[API - upload-shipment-photo] Skipping an invalid file entry:', file);
        uploadErrors.push({ name: 'unknown', error: 'Invalid file entry in form data.'});
        continue;
      }
      // Create a unique filename for storage to avoid collisions
      const fileExtension = file.name.split('.').pop() || 'png'; // Default to png if no extension
      const uniqueFileName = `${randomUUID()}.${fileExtension}`;
      const filePath = `${quotationId}/${uniqueFileName}`; // Store under quotationId folder

      // 1. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false, // Avoid accidental overwrites
        });

      if (uploadError) {
        console.error(`Supabase Storage Upload Error for file ${file.name}:`, uploadError);
        uploadErrors.push({ name: file.name, error: uploadError.message });
        continue;
      }

      if (!uploadData || !uploadData.path) {
        console.error(`Supabase Storage Upload for file ${file.name} did not return a path.`);
        uploadErrors.push({ name: file.name, error: 'Upload succeeded but no path returned from storage.' });
        continue;
      }

      // 2. Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);
      
      const shipmentPhotoUrl = urlData.publicUrl;

      if (!shipmentPhotoUrl) {
        console.error(`[API - upload-shipment-photo] ERROR: Could not get public URL for shipment photo: ${uploadData.path} (File: ${file.name})`);
        await supabase.storage.from(bucket).remove([uploadData.path]);
        uploadErrors.push({ name: file.name, error: 'Storage upload succeeded but failed to get public URL.' });
        continue;
      }
      uploadedPhotoUrls.push(shipmentPhotoUrl);
      console.log(`[API - upload-shipment-photo] File ${file.name} uploaded. Public URL: ${shipmentPhotoUrl}`);
    }

    if (uploadedPhotoUrls.length === 0 && files.length > 0) {
      return NextResponse.json(
        { error: 'All file uploads failed.', details: uploadErrors },
        { status: 500 }
      );
    }
    
    // 3. Update the quotation record in the database with all URLs
    console.log(`[API - upload-shipment-photo] Attempting to update quotation ID: ${quotationId} with ${uploadedPhotoUrls.length} photo URLs.`);

    // ---> START: Detailed Quotation ID Check <--- 
    const receivedQuotationIdFromFormData = formData.get('quotationId') as string | null;
    console.log('----------------------------------------------------');
    console.log('[API RAW CHECK] quotationId from formData:', receivedQuotationIdFromFormData);
    console.log(`[API RAW CHECK] Type of receivedQuotationIdFromFormData: ${typeof receivedQuotationIdFromFormData}`);
    if (receivedQuotationIdFromFormData) {
        console.log(`[API RAW CHECK] Length of receivedQuotationIdFromFormData: ${receivedQuotationIdFromFormData.length}`);
        // Example of a known good ID, replace if yours is different for testing
        const knownGoodId = "c3fcce1c-a281-404b-b612-0d84651fb374"; 
        console.log(`[API RAW CHECK] Does it match known good ID? (${knownGoodId} === receivedQuotationIdFromFormData): ${knownGoodId === receivedQuotationIdFromFormData}`);
        for (let i = 0; i < receivedQuotationIdFromFormData.length; i++) {
            console.log(`[API RAW CHECK] Char at ${i}: '${receivedQuotationIdFromFormData[i]}' (Code: ${receivedQuotationIdFromFormData.charCodeAt(i)})`);
        }
    }
    console.log('----------------------------------------------------');
    // ---> END: Detailed Quotation ID Check <--- 

    // Ensure shipment_photo_url is an array for the DB update
    const { data: updateResult, error: dbError } = await supabase 
      .from('quotations') 
      .update({
        shipment_photo_url: uploadedPhotoUrls, // Pass the array of URLs
        shipment_photo_uploaded_at: new Date().toISOString(), 
      })
      .eq('id', quotationId) 
      .select(); 

    console.log('[API - upload-shipment-photo] DB Update Result:', updateResult);
    console.log('[API - upload-shipment-photo] DB Update Error:', dbError);

    if (dbError) {
      console.error('[API - upload-shipment-photo] ERROR: Supabase DB Update Error (Quotations - Shipment Photo):', dbError);
      // Log the error, but consider if the file should be deleted or if a retry mechanism is needed.
      // For now, we'll return an error but the file remains in storage.
      return NextResponse.json(
        { error: `Database update failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Add a check if the update actually affected any row
    if (!updateResult || updateResult.length === 0) {
      console.warn(`[API - upload-shipment-photo] WARN: DB update for quotation ID ${quotationId} did not affect any rows. Verify quotation ID exists and RLS if enabled.`);
      // Decide if this should be an error or not. For now, let it proceed if no dbError.
    }

    // Success
    console.log(`[API - upload-shipment-photo] Successfully processed ${uploadedPhotoUrls.length} of ${files.length} files.`);
    return NextResponse.json({ 
      success: true, 
      message: `Successfully uploaded ${uploadedPhotoUrls.length} of ${files.length} shipment photos and updated quotation.`,
      photoUrls: uploadedPhotoUrls, // Return all successfully uploaded URLs
      errors: uploadErrors.length > 0 ? uploadErrors : undefined
    });

  } catch (error) {
    console.error('API Route Error (upload-shipment-photo):', error);
    if (error instanceof SyntaxError && error.message.includes('Unexpected end of JSON input')){
         return NextResponse.json({ error: 'Invalid or empty request body.' }, { status: 400 });
    }
    // Check if error is an instance of Error to safely access message property
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 