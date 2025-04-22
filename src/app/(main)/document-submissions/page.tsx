'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, CheckCircle, XCircle } from 'lucide-react';
import { getDocumentSubmissions, updateDocumentSubmission } from '@/lib/db';
import { formatFileSize } from '@/lib/storage';
import Image from 'next/image';

// นิยามประเภทข้อมูลสำหรับ Document Submission
interface DocumentSubmission {
  id: string;
  quotation_id: string;
  company_name: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
  status?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export default function DocumentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // โหลดข้อมูลเอกสารเมื่อโหลดหน้า
  useEffect(() => {
    async function loadSubmissions() {
      try {
        setLoading(true);
        const data = await getDocumentSubmissions();
        setSubmissions(data);
      } catch (error) {
        console.error('Error loading document submissions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSubmissions();
  }, []);

  // ฟังก์ชันสำหรับเปิดโมดัลดูรายละเอียด
  const handleViewDetails = (submission: DocumentSubmission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  // ฟังก์ชันสำหรับปิดโมดัล
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  // ฟังก์ชันสำหรับดาวน์โหลดไฟล์
  const handleDownload = (url: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ฟังก์ชันสำหรับอัปเดตสถานะ
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const result = await updateDocumentSubmission(id, {
        status,
        reviewed_at: new Date().toISOString(),
        // ในสถานการณ์จริง คุณจะใช้ ID ผู้ใช้ปัจจุบันที่นี่
        reviewed_by: 'current-user-id'
      });

      if (result) {
        // อัปเดตรายการ submissions
        setSubmissions(submissions.map(sub => 
          sub.id === id ? { ...sub, status, reviewed_at: new Date().toISOString() } : sub
        ));
        
        if (selectedSubmission && selectedSubmission.id === id) {
          setSelectedSubmission({ ...selectedSubmission, status, reviewed_at: new Date().toISOString() });
        }
      }
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  };

  // ฟังก์ชันสำหรับสร้าง badge สถานะ
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'reviewed':
        return <Badge variant="secondary">Reviewed</Badge>;
      case 'submitted':
      default:
        return <Badge variant="outline">Submitted</Badge>;
    }
  };

  // ฟังก์ชันสำหรับฟอร์แมตเวลา
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Document Submissions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Documents</CardTitle>
          <CardDescription>Review and manage documents submitted by customers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse">Loading submissions...</div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-medium">No document submissions yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                Documents submitted by customers will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Quotation ID</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                      <TableCell>{submission.company_name}</TableCell>
                      <TableCell>{submission.quotation_id}</TableCell>
                      <TableCell>{submission.document_type}</TableCell>
                      <TableCell className="max-w-xs truncate" title={submission.file_name}>
                        {submission.file_name}
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleViewDetails(submission)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDownload(submission.file_url, submission.file_name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for document details */}
      {isModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">Document Details</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={handleCloseModal}
                >
                  &times;
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Company</h3>
                    <p>{selectedSubmission.company_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Quotation ID</h3>
                    <p>{selectedSubmission.quotation_id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Document Type</h3>
                    <p>{selectedSubmission.document_type}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Submitted At</h3>
                    <p>{formatDate(selectedSubmission.submitted_at)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p>{getStatusBadge(selectedSubmission.status)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">File Size</h3>
                    <p>{selectedSubmission.file_size ? formatFileSize(selectedSubmission.file_size) : 'Unknown'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">File Name</h3>
                  <p>{selectedSubmission.file_name}</p>
                </div>
                
                {selectedSubmission.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Document Preview</h3>
                  <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[200px] relative">
                    {selectedSubmission.mime_type?.startsWith('image/') ? (
                      <Image
                        src={selectedSubmission.file_url}
                        alt={selectedSubmission.file_name}
                        fill
                        style={{ objectFit: 'contain' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-500 mb-2">Preview not available</p>
                        <Button
                          variant="outline"
                          onClick={() => handleDownload(selectedSubmission.file_url, selectedSubmission.file_name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6 pt-4 border-t">
                <Button variant="outline" onClick={handleCloseModal}>
                  Close
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateStatus(selectedSubmission.id, 'rejected')}
                    disabled={selectedSubmission.status === 'rejected'}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleUpdateStatus(selectedSubmission.id, 'approved')}
                    disabled={selectedSubmission.status === 'approved'}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 