'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle, 
  Clock, 
  Plane,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  getQuotationsForAWB, 
  getConfirmedAWBs, 
  updateQuotationWithAWB,
  Quotation 
} from '@/lib/db';
import { uploadFile } from '@/lib/storage';

export default function AWBManagementPage() {
  const [pendingQuotations, setPendingQuotations] = useState<Quotation[]>([]);
  const [confirmedAWBs, setConfirmedAWBs] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [awbFile, setAwbFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString; 
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return;
      }
      
      const [pendingData, confirmedData] = await Promise.all([
        getQuotationsForAWB(user.id),
        getConfirmedAWBs(user.id)
      ]);
      
      setPendingQuotations(pendingData || []);
      setConfirmedAWBs(confirmedData || []);
    } catch (error) {
      console.error('Error loading AWB data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setAwbFile(file || null);
    setUploadError(null);
  };

  // Handle AWB upload
  const handleAWBUpload = async () => {
    if (!awbFile || !selectedQuotation) {
      setUploadError('Please select an AWB file');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(awbFile.type)) {
      setUploadError('Only PDF and image files are supported');
      return;
    }

    // Validate file size (max 10MB)
    if (awbFile.size > 10 * 1024 * 1024) {
      setUploadError('File size must not exceed 10MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Generate unique filename
      const fileExtension = awbFile.name.split('.').pop();
      const fileName = `awb_${selectedQuotation.id}_${Date.now()}.${fileExtension}`;
      
      // Upload file to storage
      const uploadResult = await uploadFile('documents', `awb/${fileName}`, awbFile);
      
      if (!uploadResult) {
        throw new Error('Upload failed');
      }

      // Update quotation with AWB info
      const updatedQuotation = await updateQuotationWithAWB(
        selectedQuotation.id,
        uploadResult,
        awbFile.name
      );

      if (!updatedQuotation) {
        throw new Error('Failed to update quotation with AWB info');
      }

      // Refresh data
      await loadData();
      
      // Reset form and close modal
      setAwbFile(null);
      setSelectedQuotation(null);
      setIsUploadModalOpen(false);
      
    } catch (error) {
      console.error('Error uploading AWB:', error);
      setUploadError(error instanceof Error ? error.message : 'An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  // Open upload modal
  const openUploadModal = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsUploadModalOpen(true);
    setAwbFile(null);
    setUploadError(null);
  };

  // Close upload modal
  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedQuotation(null);
    setAwbFile(null);
    setUploadError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Airway Bills Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage AWB (Air Waybill) documents for booked shipments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Plane className="h-4 w-4 mr-1" />
            AWB System
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="relative">
            <Clock className="h-4 w-4 mr-2" />
            Pending AWB Upload
            {pendingQuotations.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {pendingQuotations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmed AWBs ({confirmedAWBs.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending AWBs Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-500" />
                Pending AWB Documents
              </CardTitle>
              <CardDescription>
                Booked shipments waiting for AWB documents from airlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingQuotations.length === 0 ? (
                <div className="text-center py-12">
                  <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    No Pending AWBs
                  </h3>
                  <p className="text-gray-500">
                    No shipments are currently waiting for AWB documents
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking Date</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingQuotations.map((quotation) => (
                        <TableRow key={quotation.id}>
                          <TableCell>{formatDate(quotation.booked_at)}</TableCell>
                          <TableCell className="font-medium">
                            {quotation.company_name}
                          </TableCell>
                          <TableCell>{quotation.destination}</TableCell>
                          <TableCell>{formatCurrency(quotation.total_cost)}</TableCell>
                          <TableCell>
                            {quotation.chargeable_weight ? 
                              `${quotation.chargeable_weight} kg` : 'Not specified'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => openUploadModal(quotation)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload AWB
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Confirmed AWBs Tab */}
        <TabsContent value="confirmed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Confirmed AWBs
              </CardTitle>
              <CardDescription>
                Shipments with confirmed AWB documents ready for transportation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {confirmedAWBs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    No Confirmed AWBs
                  </h3>
                  <p className="text-gray-500">
                    Confirmed AWBs will appear here once uploaded
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Confirmation Date</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>AWB File</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {confirmedAWBs.map((quotation) => (
                        <TableRow key={quotation.id}>
                          <TableCell>{formatDate(quotation.awb_confirmed_at)}</TableCell>
                          <TableCell className="font-medium">
                            {quotation.company_name}
                          </TableCell>
                          <TableCell>{quotation.destination}</TableCell>
                          <TableCell>{formatCurrency(quotation.total_cost)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="text-sm truncate max-w-[150px]">
                                {quotation.awb_file_name || 'AWB Document'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {quotation.awb_file_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => quotation.awb_file_url && window.open(quotation.awb_file_url, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              )}
                              {quotation.awb_file_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (quotation.awb_file_url) {
                                      const link = document.createElement('a');
                                      link.href = quotation.awb_file_url;
                                      link.download = quotation.awb_file_name || 'awb-document';
                                      link.click();
                                    }
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              )}
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
        </TabsContent>
      </Tabs>

      {/* AWB Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={closeUploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2 text-blue-500" />
              Upload AWB Document
            </DialogTitle>
            <DialogDescription>
              Upload Air Waybill document for: <br />
              <strong>{selectedQuotation?.company_name}</strong> → {selectedQuotation?.destination}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="awb-file">Select AWB File</Label>
              <Input
                id="awb-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={uploading}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported files: PDF, JPG, PNG (max 10MB)
              </p>
            </div>

            {awbFile && (
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm font-medium">{awbFile.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {(awbFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}

            {uploadError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                  <span className="text-sm text-red-700">{uploadError}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeUploadModal} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleAWBUpload} 
              disabled={!awbFile || uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload AWB
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 