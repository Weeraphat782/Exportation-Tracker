'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, FileText } from 'lucide-react';
import { getQuotations, Quotation, updateQuotation } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface BookingData {
  quotationId: string;
  airline: string;
  numberOfPieces: string;
  consignee: string;
  routing: string;
}

export default function BookingPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [bookingData, setBookingData] = useState<BookingData>({
    quotationId: '',
    airline: '',
    numberOfPieces: '',
    consignee: '',
    routing: ''
  });
  const [generatedEmail, setGeneratedEmail] = useState('');

  // Load quotations
  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return;
      }
      
      const data = await getQuotations(user.id);
      
      // Filter quotations that have been accepted or completed
      const availableQuotations = data.filter(q => 
        q.status === 'accepted' || q.status === 'docs_uploaded' || q.status === 'completed'
      );
      
      setQuotations(availableQuotations);
    } catch (error) {
      console.error('Error loading quotations:', error);
      toast.error('Failed to load quotations');
    }
  };

  // Handle quotation selection
  const handleQuotationSelect = (quotationId: string) => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (quotation) {
      setSelectedQuotation(quotation);
      setBookingData(prev => ({
        ...prev,
        quotationId
      }));
    }
  };

  // Get maximum pallet dimension
  const getMaxPalletDimension = (pallets: Array<{
    length: number | string;
    width: number | string;
    height: number | string;
    weight: number | string;
    quantity: number | string;
  }>) => {
    if (!pallets || pallets.length === 0) return 'N/A';
    
    let maxLength = 0, maxWidth = 0, maxHeight = 0;
    
    pallets.forEach(pallet => {
      const length = Number(pallet.length) || 0;
      const width = Number(pallet.width) || 0;
      const height = Number(pallet.height) || 0;
      
      if (length > maxLength) maxLength = length;
      if (width > maxWidth) maxWidth = width;
      if (height > maxHeight) maxHeight = height;
    });
    
    return `${maxLength} × ${maxWidth} × ${maxHeight} cm`;
  };

  // Generate email content
  const generateEmail = () => {
    if (!selectedQuotation) {
      toast.error('Please select a quotation first');
      return;
    }

    const netWeight = selectedQuotation.total_actual_weight || 0;
    const maxDimension = getMaxPalletDimension(selectedQuotation.pallets);
    const destination = selectedQuotation.destination || 'N/A';
    const shipper = selectedQuotation.company_name || 'N/A';

    const emailContent = `Dear Khun Montri,

I would like to book the following shipment:

Product: Dried Cannabis Flower
Destination: ${destination}
Net Weight: ${netWeight} KG
Airline: ${bookingData.airline || '__________________'}
Pick-up from BKK (location and date TBC)
Prefer shipment date: as soon as possible

Please see attached all documents krub.

MAWB: TBC
DESCRIPTION OF CONTENTS, INCLUDING MODEL/MANUFACTURER: Dried Cannabis Flower
WEIGHT: ${netWeight} KG
NUMBER OF PIECE: ${bookingData.numberOfPieces || '__________________'}
PALLET DIMENSION: ${maxDimension}
ORIGIN: Bangkok
DESTINATION: ${destination}
SHIPPER: ${shipper}
CONSIGNEE: ${bookingData.consignee || '__________________'}
ROUTING: ${bookingData.routing || '__________________'}`;

    setGeneratedEmail(emailContent);
  };

  // Copy email to clipboard
  const copyToClipboard = async () => {
    if (!generatedEmail) {
      toast.error('Please generate email first');
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedEmail);
      
      // Update quotation status to 'Booked' after successful copy
      if (selectedQuotation) {
        const result = await updateQuotation(selectedQuotation.id, {
          status: 'Booked',
          booked_at: new Date().toISOString()
        });
        
        if (result) {
          // Update local state
          setSelectedQuotation(prev => prev ? { ...prev, status: 'Booked' } : null);
          setQuotations(prev => 
            prev.map(q => 
              q.id === selectedQuotation.id 
                ? { ...q, status: 'Booked' } 
                : q
            )
          );
          
          toast.success('Email copied and booking status updated!', {
            description: 'Quotation marked as booked'
          });
        } else {
          toast.success('Email copied to clipboard!');
          toast.warning('Failed to update booking status');
        }
      } else {
        toast.success('Email copied to clipboard!');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Booking Email Generator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Quotation Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Quotation</CardTitle>
              <CardDescription>
                Choose a quotation to generate the booking email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quotation">Quotation</Label>
                <Select value={bookingData.quotationId} onValueChange={handleQuotationSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a quotation" />
                  </SelectTrigger>
                  <SelectContent>
                    {quotations.map((quotation) => (
                      <SelectItem key={quotation.id} value={quotation.id}>
                        {quotation.company_name} - {quotation.destination} 
                        ({quotation.id.substring(0, 8)}...)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedQuotation && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Quotation Details:</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Company:</strong> {selectedQuotation.company_name}</p>
                    <p><strong>Destination:</strong> {selectedQuotation.destination}</p>
                    <p><strong>Net Weight:</strong> {selectedQuotation.total_actual_weight || 0} KG</p>
                    <p><strong>Max Pallet Dimension:</strong> {getMaxPalletDimension(selectedQuotation.pallets)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Input Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Fill in the information that changes for each booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="airline">Airline</Label>
                <Input
                  id="airline"
                  placeholder="e.g., Thai Airways, Singapore Airlines"
                  value={bookingData.airline}
                  onChange={(e) => setBookingData(prev => ({ ...prev, airline: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="pieces">Number of Pieces</Label>
                <Input
                  id="pieces"
                  placeholder="e.g., 3 pallets 34 boxes"
                  value={bookingData.numberOfPieces}
                  onChange={(e) => setBookingData(prev => ({ ...prev, numberOfPieces: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="consignee">Consignee</Label>
                <Input
                  id="consignee"
                  placeholder="e.g., Pharmaserv AG"
                  value={bookingData.consignee}
                  onChange={(e) => setBookingData(prev => ({ ...prev, consignee: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="routing">Routing</Label>
                <Input
                  id="routing"
                  placeholder="e.g., BKK-ZRH (Direct)"
                  value={bookingData.routing}
                  onChange={(e) => setBookingData(prev => ({ ...prev, routing: e.target.value }))}
                />
              </div>

              <Button 
                onClick={generateEmail} 
                className="w-full"
                disabled={!selectedQuotation}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Email
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Generated Email */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Generated Email</CardTitle>
              <CardDescription>
                Copy and paste this email for your booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedEmail ? (
                <div className="space-y-4">
                  <Textarea
                    value={generatedEmail}
                    readOnly
                    className="min-h-[500px] font-mono text-sm whitespace-pre"
                    style={{ fontFamily: 'Courier New, Monaco, Consolas, "Liberation Mono", "Lucida Console", monospace' }}
                  />
                  <Button onClick={copyToClipboard} className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a quotation and fill in the details, then click &quot;Generate Email&quot; to see the booking email template.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 