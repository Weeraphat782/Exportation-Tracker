# AI Document Analysis Setup Guide

## Overview
This system integrates OpenTyphoon AI API to automatically generate descriptions for uploaded documents in Thai language, specifically tailored for export/import business processes.

## Prerequisites

1. **API Key**: You need an OpenTyphoon API key
2. **Environment Variables**: Configure the API key in your environment

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the root directory and add:

```env
# OpenTyphoon AI API Configuration
TYPHOON_API_KEY=sk-WJEte8ZIPyEZTqTY0wGuj5vgkT9SAByiP8jUEBTfBEtjtim8

# Supabase Configuration (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Install Required Dependencies

```bash
npm install openai
```

### 3. Database Migration

Run the database migration to add the description column:

```sql
-- Apply the migration
ALTER TABLE document_submissions 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add a comment to the column
COMMENT ON COLUMN document_submissions.description IS 'AI-generated document summary describing the key content and purpose of the document';
```

## Features

### Automatic Description Generation
- **Manual Analysis**: Click the AI robot icon (🤖) next to any document to generate a description
- **Batch Processing**: Use the "Generate AI Descriptions" button to process all documents without descriptions

### AI Capabilities
- **Thai Language**: All descriptions are generated in Thai
- **Export/Import Context**: Descriptions are tailored for logistics and trade documents
- **Document Type Recognition**: Analyzes document types like TK forms, invoices, permits, etc.
- **Key Information Extraction**: Identifies important dates, amounts, and requirements

### Supported Document Types
- PDF documents
- Image files (JPG, PNG, GIF, BMP, WebP)
- Export permits and TK forms
- Commercial invoices
- Packing lists
- Certificates and licenses

## API Usage

### Analyze Single Document
```typescript
const result = await analyzeDocument(
  documentId,
  fileUrl,
  fileName,
  documentType
);
```

### Process All Documents
```typescript
const success = await processAllDocuments();
```

## Example Generated Descriptions

For different document types, the AI generates contextual descriptions:

- **TK Form**: "เอกสารใบอนุญาตส่งออกประเภท TK สำหรับสินค้าเคมี ระบุรายละเอียดปลายทางและปริมาณการส่งออก"
- **Commercial Invoice**: "ใบกำกับสินค้าเพื่อการส่งออก แสดงรายการสินค้า ราคา และเงื่อนไขการชำระเงิน"
- **Packing List**: "รายการบรรจุภัณฑ์ระบุน้ำหนัก ขนาด และจำนวนลังสินค้าส่งออก"

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the API key is correctly set in `.env.local`
   - Check if the API key has sufficient credits

2. **Analysis Fails**
   - Check network connectivity
   - Verify file URLs are accessible
   - Check browser console for error details

3. **No Descriptions Generated**
   - Ensure the description column exists in the database
   - Check API response in browser dev tools

### Error Handling
- Failed analyses show fallback descriptions
- Network errors are logged in the console
- Users see loading states during processing

## API Rate Limits
- Includes 1-second delay between batch processing requests
- Individual document analysis has no delays
- Monitor usage to avoid hitting API limits

## Future Enhancements

1. **OCR Integration**: Full Typhoon OCR implementation for image documents
2. **Enhanced PDF Processing**: Better text extraction from PDFs
3. **Custom Prompts**: Industry-specific description templates
4. **Multilingual Support**: Support for English descriptions alongside Thai 