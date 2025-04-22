'use client';

import { useState /*, useEffect */ } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadFile } from '@/lib/storage';
import { createDocumentSubmission } from '@/lib/db';
import { Upload, Check, AlertCircle, X } from 'lucide-react';

// กำหนดประเภทเอกสารที่อนุญาตให้อัปโหลด
const ALLOWED_DOCUMENT_TYPES = [
  { id: 'invoice', name: 'Invoice' },
  { id: 'packing-list', name: 'Packing List' },
  { id: 'bill-of-lading', name: 'Bill of Lading' },
  { id: 'certificate-of-origin', name: 'Certificate of Origin' },
  { id: 'insurance', name: 'Insurance Certificate' },
  { id: 'customs-declaration', name: 'Customs Declaration' },
  { id: 'other', name: 'Other Document' },
];

// กำหนดประเภทไฟล์ที่อนุญาตให้อัปโหลด
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// กำหนดขนาดไฟล์สูงสุดที่อนุญาตให้อัปโหลด (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function DocumentUploadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const quotationId = params.id as string;
  const companyName = searchParams.get('company') || 'Unknown Company';
  const destination = searchParams.get('destination') || 'Unknown Destination';

  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    name: string;
    type: string;
    uploadTime: string;
  }>>([]);

  // ตรวจสอบความถูกต้องของไฟล์ที่อัปโหลด
  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, Word, Excel, or image files.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 10MB.');
      return false;
    }

    setError(null);
    return true;
  };

  // จัดการการเปลี่ยนแปลงของไฟล์ที่เลือก
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
        e.target.value = '';
      }
    }
  };

  // จัดการการอัปโหลดไฟล์
  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      setError('Please select a document type and a file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // สร้างพาธไฟล์ใน storage
      const filePath = `${quotationId}/${selectedDocType}/${Date.now()}-${selectedFile.name}`;
      
      // อัปโหลดไฟล์ไปยัง Supabase Storage
      const fileUrl = await uploadFile('documents', filePath, selectedFile);

      if (!fileUrl) {
        throw new Error('Failed to upload file.');
      }

      // บันทึกข้อมูลการอัปโหลดลงในฐานข้อมูล
      const docType = ALLOWED_DOCUMENT_TYPES.find(type => type.id === selectedDocType)?.name || selectedDocType;
      
      const submission = {
        quotation_id: quotationId,
        company_name: companyName,
        document_type: docType,
        file_name: selectedFile.name,
        file_url: fileUrl,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        notes: notes,
        status: 'submitted'
      };

      const result = await createDocumentSubmission(submission);

      if (!result) {
        throw new Error('Failed to save submission record.');
      }

      // เพิ่มไฟล์ที่อัปโหลดเรียบร้อยแล้วเข้าไปในรายการ
      setUploadedFiles(prev => [
        ...prev,
        {
          id: result.id,
          name: selectedFile.name,
          type: docType,
          uploadTime: new Date().toLocaleString()
        }
      ]);

      // รีเซ็ตฟอร์ม
      setSelectedFile(null);
      setSelectedDocType('');
      setNotes('');
      setSuccess(true);

      // ล้างค่า input file
      const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // ซ่อนข้อความแจ้งเตือนสำเร็จหลังจาก 5 วินาที
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-2xl">Document Upload</CardTitle>
          <CardDescription>
            Upload required documents for quotation <span className="font-semibold">{quotationId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-lg font-medium">
              <h2>Company Information</h2>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Company Name:</span>
                <span className="font-medium">{companyName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Destination:</span>
                <span className="font-medium">{destination}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Quotation ID:</span>
                <span className="font-medium">{quotationId}</span>
              </div>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-3">Uploaded Documents</h2>
              <div className="bg-gray-50 rounded-md p-3">
                <ul className="divide-y">
                  {uploadedFiles.map((file) => (
                    <li key={file.id} className="py-2 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-sm text-gray-500">{file.type} • {file.uploadTime}</div>
                      </div>
                      <Check className="h-5 w-5 text-green-500" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="docType">Document Type</Label>
              <select
                id="docType"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
              >
                <option value="">Select document type</option>
                {ALLOWED_DOCUMENT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="fileUpload">Upload File</Label>
              <Input
                id="fileUpload"
                type="file"
                className="mt-1"
                onChange={handleFileChange}
                accept={ALLOWED_FILE_TYPES.join(',')}
              />
              <p className="mt-1 text-sm text-gray-500">
                Accepted formats: PDF, Word, Excel, JPEG, PNG. Max size: 10MB
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
                placeholder="Add any additional information about this document"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start space-x-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-green-700">Document uploaded successfully!</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <X className="h-4 w-4 mr-2" />
            Clear Form
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !selectedDocType}>
            {isUploading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 