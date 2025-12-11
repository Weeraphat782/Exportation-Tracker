import { uploadFile } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

// Define the document types matching the ones in your application
const DOCUMENT_TYPES = [
  { id: 'company-registration', name: 'Company Registration' },
  { id: 'company-declaration', name: 'Company Declaration' },
  { id: 'id-card-copy', name: 'ID Card Copy' },
  { id: 'import-permit', name: 'Import Permit' },
  { id: 'tk-10', name: 'TK 10' },
  { id: 'tk-11', name: 'TK 11' },
  { id: 'tk-31', name: 'TK 31' },
  { id: 'tk-32', name: 'TK 32' },
  { id: 'purchase-order', name: 'Purchase Order' },
  { id: 'msds', name: 'MSDS' },
  { id: 'commercial-invoice', name: 'Commercial Invoice' },
  { id: 'packing-list', name: 'Packing List' },
  { id: 'additional-file', name: 'Additional File' },
];

// Directory where your template PDFs are stored
const TEMPLATES_DIR = path.join(process.cwd(), 'templates');

async function uploadTemplates() {
  console.log('Starting template upload process...');
  
  // Make sure the templates directory exists
  if (!fs.existsSync(TEMPLATES_DIR)) {
    console.error(`Templates directory not found: ${TEMPLATES_DIR}`);
    console.log('Please create this directory and add your template PDFs');
    console.log('File names should match the document type IDs (e.g., company-registration.pdf)');
    return;
  }
  
  for (const docType of DOCUMENT_TYPES) {
    const fileName = `${docType.id}.pdf`;
    const filePath = path.join(TEMPLATES_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`Template not found for ${docType.name} (${fileName}). Skipping...`);
      continue;
    }
    
    try {
      // Read the file
      const fileBuffer = fs.readFileSync(filePath);
      const file = new File([fileBuffer], fileName, { type: 'application/pdf' });
      
      // Upload to Supabase Storage
      const storagePath = `templates/${docType.id}/${fileName}`;
      const fileUrl = await uploadFile('templates', storagePath, file);
      
      if (!fileUrl) {
        console.error(`Failed to upload template for ${docType.name}`);
        continue;
      }
      
      console.log(`Uploaded ${docType.name} template to ${fileUrl}`);
      
      // Insert or update in document_templates table
      const { error: templateError } = await supabase
        .from('document_templates')
        .upsert({
          document_type_id: docType.id,
          document_name: docType.name,
          file_url: fileUrl,
          file_name: fileName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'document_type_id'
        })
        .select();
      
      if (templateError) {
        console.error(`Error inserting template record for ${docType.name}:`, templateError);
      } else {
        console.log(`Database record updated for ${docType.name}`);
      }
      
      // Create or update the setting in the database
      const settingData = {
        category: 'document_template',
        settings_key: docType.id,
        settings_value: {
          file_name: file.name,
          file_url: fileUrl,
          uploaded_at: new Date().toISOString()
        }
      };
      
      const { error: dbError } = await supabase
        .from('settings')
        .upsert({
          category: 'document_template',
          settings_key: docType.id,
          settings_value: settingData.settings_value,
          user_id: 'SYSTEM' // Or the actual user ID if available
        }, {
          onConflict: 'category, settings_key'
        });
      
      if (dbError) {
        console.error(`Error upserting setting for ${docType.name}:`, dbError);
      } else {
        console.log(`Setting record updated for ${docType.name}`);
      }
      
    } catch (err) {
      console.error(`Error processing template for ${docType.name}:`, err);
    }
  }
  
  console.log('Template upload process completed');
}

// Run the upload function
uploadTemplates().catch(err => {
  console.error('Error in uploadTemplates script:', err);
}); 