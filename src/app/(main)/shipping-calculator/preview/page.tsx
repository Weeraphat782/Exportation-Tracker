'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Printer, FileText, Save, Edit } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { Quotation, updateQuotation, getCompanies, getDestinations, saveQuotation, NewQuotationData } from '@/lib/db';
import Link from 'next/link';

// Currency formatter
const formatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 2
});

// Add a function to format numbers consistently
const formatNumber = (num: number | string | undefined | null) => {
  if (num === undefined || num === null) return "0.00";
  const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsedNum)) return "0.00";
  return parsedNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function QuotationPreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quotationData, setQuotationData] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const quotationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get the quotation data from sessionStorage
    try {
      const storedData = sessionStorage.getItem('quotationData');
      if (storedData) {
        setQuotationData(JSON.parse(storedData));
      } else {
        // Fallback to mock data if no data in sessionStorage
        const mockQuotation: Quotation & { quotation_id: string; client: { name: string }, destination: { country: string, port: string | null }, delivery_service: { name: string } | null } = {
          id: 'mock-id',
          user_id: 'mock-user',
          quotation_id: 'QTO-MOCK',
          client: { name: 'Mock Client Inc.' },
          destination_id: 'dest-1',
          freight_cost: 1200,
          clearance_cost: 150,
          delivery_cost: 80,
          currency: 'USD',
          total_cost: 1430,
          pallets: [
            { id: 'p1', quotation_id: 'mock-id', length: 120, width: 100, height: 80, weight: 500, quantity: 1 }, 
            { id: 'p2', quotation_id: 'mock-id', length: 100, width: 80, height: 60, weight: 300, quantity: 2 }, 
          ],
          additional_charges: [
            { id: 'ac1', quotation_id: 'mock-id', name: 'Handling', description: 'Special handling fee', amount: 50 },
            { id: 'ac2', quotation_id: 'mock-id', name: 'Insurance', description: 'Transport insurance', amount: 30 },
          ],
          notes: 'This is a mock quotation for preview purposes.',
          status: 'sent',
        };
        setQuotationData(mockQuotation);
      }
    } catch (error) {
      console.error('Error retrieving quotation data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch data needed for the quotation
    const fetchData = async () => {
      try {
        // Fetch destinations and companies if needed for the preview
        const destinationsData = await getDestinations();
        const companiesData = await getCompanies();
        
        // Set destinations and companies with null checks
        if (destinationsData) setDestinations(destinationsData);
        if (companiesData) setCompanies(companiesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAsPdf = () => {
    // ใช้วิธีเดียวกับการพิมพ์ปกติซึ่งจะรักษารูปแบบได้สมบูรณ์
    window.print();
  };

  const editQuotation = () => {
    if (!quotationData || !quotationData.id) return;
    // Store data in sessionStorage before navigating to edit page
    sessionStorage.setItem('quotationDataForEdit', JSON.stringify(quotationData));
    router.push(`/shipping-calculator/new?id=${quotationData.id}`);
  };

  const submitQuotation = async () => {
    if (!quotationData) return;
    
    setIsSubmitting(true);
    try {
      // Calculate total costs if they don't exist
      const totalFreightCost = quotationData.total_freight_cost || 
                              (quotationData.total_cost * 0.75); // 75% of total
      
      const clearanceCost = quotationData.clearance_cost || 5350;
      
      const deliveryCost = quotationData.delivery_service_required ? 
                          (quotationData.delivery_cost || 3500) : 0;
      
      // Calculate weights
      const calculateTotalActualWeight = () => {
        if (!quotationData?.pallets?.length) return 0;
        
        return quotationData.pallets.reduce((total, pallet) => {
          const weight = typeof pallet.weight === 'number' ? pallet.weight : parseFloat(pallet.weight) || 0;
          const quantity = typeof pallet.quantity === 'number' ? pallet.quantity : parseInt(pallet.quantity) || 1;
          return total + (weight * quantity);
        }, 0);
      };

      const calculateTotalVolumeWeight = () => {
        if (!quotationData?.pallets?.length) return 0;
        
        return quotationData.pallets.reduce((total, pallet) => {
          const length = typeof pallet.length === 'number' ? pallet.length : parseFloat(pallet.length) || 0;
          const width = typeof pallet.width === 'number' ? pallet.width : parseFloat(pallet.width) || 0;
          const height = typeof pallet.height === 'number' ? pallet.height : parseFloat(pallet.height) || 0;
          const quantity = typeof pallet.quantity === 'number' ? pallet.quantity : parseInt(pallet.quantity) || 1;
          
          return total + ((length * width * height * quantity) / 6000);
        }, 0);
      };

      const totalActualWeight = quotationData.total_actual_weight || calculateTotalActualWeight();
      const totalVolumeWeight = quotationData.total_volume_weight || calculateTotalVolumeWeight();
      const chargeableWeight = quotationData.chargeable_weight || Math.max(totalActualWeight, totalVolumeWeight);
      
      if (quotationData.id) {
        // Create a clean update object (removing fields that shouldn't be updated)
        const updateData: Partial<Omit<Quotation, 'id' | 'created_at' | 'user_id'>> = {
          company_id: quotationData.company_id,
          contact_person: quotationData.contact_person,
          contract_no: quotationData.contract_no,
          destination_id: quotationData.destination_id,
          pallets: quotationData.pallets || [],
          delivery_service_required: quotationData.delivery_service_required,
          delivery_vehicle_type: quotationData.delivery_vehicle_type,
          additional_charges: quotationData.additional_charges || [],
          notes: quotationData.notes,
          
          // Save all cost breakdown fields explicitly
          total_cost: quotationData.total_cost,
          total_freight_cost: totalFreightCost,
          clearance_cost: clearanceCost,
          delivery_cost: deliveryCost,
          
          // Also save weight calculations
          total_actual_weight: totalActualWeight,
          total_volume_weight: totalVolumeWeight,
          chargeable_weight: chargeableWeight,
          
          status: 'sent' as const,
          company_name: quotationData.company_name,
          destination: quotationData.destination
        };

        // Important: do not send id, created_at, or user_id in updates
        console.log("Updating quotation with ID:", quotationData.id);
        
        // Update the existing quotation
        const savedQuotation = await updateQuotation(quotationData.id, updateData);
        
        if (!savedQuotation) {
          throw new Error('Failed to update quotation in database');
        }
        
        console.log("Quotation updated successfully:", savedQuotation);
        
        // Store updated data and navigate to print
        sessionStorage.setItem('quotationDataForPrint', JSON.stringify(savedQuotation));
        
        toast.success('Quotation submitted successfully!', {
          description: 'You can print the quotation now.'
        });
        
        router.push(`/shipping-calculator/print/${quotationData.id}`);
      } else {
        // Create new quotation data
        const newQuotationData: NewQuotationData = {
          user_id: quotationData.user_id,
          company_id: quotationData.company_id,
          contact_person: quotationData.contact_person,
          contract_no: quotationData.contract_no,
          destination_id: quotationData.destination_id,
          pallets: quotationData.pallets || [],
          delivery_service_required: quotationData.delivery_service_required,
          delivery_vehicle_type: quotationData.delivery_vehicle_type,
          additional_charges: quotationData.additional_charges || [],
          notes: quotationData.notes,
          total_cost: quotationData.total_cost,
          status: 'sent',
          total_freight_cost: totalFreightCost,
          clearance_cost: clearanceCost,
          delivery_cost: deliveryCost,
          total_actual_weight: totalActualWeight,
          total_volume_weight: totalVolumeWeight,
          chargeable_weight: chargeableWeight,
          company_name: quotationData.company_name,
          destination: quotationData.destination
        };
        
        // Save as a new quotation
        const savedQuotation = await saveQuotation(newQuotationData);
        
        if (savedQuotation && savedQuotation.id) {
          // Store saved data and navigate to print
          sessionStorage.setItem('quotationDataForPrint', JSON.stringify(savedQuotation)); 
          
          toast.success('Quotation submitted successfully!', {
            description: 'You can print the quotation now.'
          });
          
          router.push(`/shipping-calculator/print/${savedQuotation.id}`);
        } else {
          throw new Error('Failed to save new quotation');
        }
      }
    } catch (error: any) {
      console.error('Error submitting quotation:', error);
      toast.error('Failed to submit the quotation', { 
        description: error.message || 'Database error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Loading quotation data...</div>
      </div>
    );
  }

  if (!quotationData) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-red-600">Failed to load quotation data.</p>
        <Link href="/shipping-calculator">
          <Button variant="outline">
             <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </Link>
      </div>
    );
  }

  // Check if quotation is already submitted
  const isSubmitted = quotationData.status === 'sent';
  
  // Calculate values before rendering
  const totalFreightCost = quotationData.total_freight_cost || 
                          (quotationData.total_cost * 0.75); // 75% of total
  
  const clearanceCost = quotationData.clearance_cost || 5350;
  
  const deliveryCost = quotationData.delivery_service_required ? 
                      (quotationData.delivery_cost || 3500) : 0;

  // Calculate weights
  const calculateTotalActualWeight = () => {
    if (!quotationData?.pallets?.length) return 0;
    
    return quotationData.pallets.reduce((total, pallet) => {
      const weight = typeof pallet.weight === 'number' ? pallet.weight : parseFloat(pallet.weight) || 0;
      const quantity = typeof pallet.quantity === 'number' ? pallet.quantity : parseInt(pallet.quantity) || 1;
      return total + (weight * quantity);
    }, 0);
  };

  const calculateTotalVolumeWeight = () => {
    if (!quotationData?.pallets?.length) return 0;
    
    return quotationData.pallets.reduce((total, pallet) => {
      const length = typeof pallet.length === 'number' ? pallet.length : parseFloat(pallet.length) || 0;
      const width = typeof pallet.width === 'number' ? pallet.width : parseFloat(pallet.width) || 0;
      const height = typeof pallet.height === 'number' ? pallet.height : parseFloat(pallet.height) || 0;
      const quantity = typeof pallet.quantity === 'number' ? pallet.quantity : parseInt(pallet.quantity) || 1;
      
      return total + ((length * width * height * quantity) / 6000);
    }, 0);
  };

  const totalActualWeight = quotationData.total_actual_weight || calculateTotalActualWeight();
  const totalVolumeWeight = quotationData.total_volume_weight || calculateTotalVolumeWeight();
  const chargeableWeight = quotationData.chargeable_weight || Math.max(totalActualWeight, totalVolumeWeight);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/shipping-calculator">
            <Button variant="outline" size="icon" className="print:hidden">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Quotation Preview</h1>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Ready to Submit</span>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link href="/shipping-calculator">
            <Button variant="outline" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Main Page
            </Button>
          </Link>
          <Button onClick={handleSaveAsPdf}>
            <FileText className="h-4 w-4 mr-2" />
            Save as PDF
          </Button>
        </div>
      </div>

      <div ref={quotationRef} id="quotation-content">
        <Card className="p-8 max-w-4xl mx-auto bg-white shadow-sm print:shadow-none print:border-none print:p-0">
          <CardContent className="p-0">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">QUOTATION</h2>
                <div className="text-sm text-slate-500 mt-1">Ref: {quotationData?.id || 'N/A'}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-900">OMG Experiences</div>
                <div className="text-sm text-slate-500 mt-1">
                  10/12-13 Convent Road, Silom, Bangrak,
                  <br />
                  Bangkok 10500
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-3 uppercase text-sm">CLIENT INFORMATION</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 font-medium">Company:</td>
                      <td className="py-1">{quotationData?.company_name || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Contact Person:</td>
                      <td className="py-1">{quotationData?.contact_person || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Contract No:</td>
                      <td className="py-1">{quotationData?.contract_no || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-3 uppercase text-sm">SHIPPING DETAILS</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 font-medium">Quotation Date:</td>
                      <td className="py-1">{quotationData?.created_at ? new Date(quotationData.created_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Destination:</td>
                      <td className="py-1">{quotationData?.destination || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-3 uppercase text-sm">PALLET INFORMATION</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">#</th>
                    <th className="py-2 text-left">Dimensions (L×W×H cm)</th>
                    <th className="py-2 text-left">Actual Weight (kg)</th>
                    <th className="py-2 text-left">Volume Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationData?.pallets && quotationData.pallets.map((pallet, index) => {
                    const volumeWeight = ((pallet.length * pallet.width * pallet.height) / 6000);
                    return (
                      <tr key={index} className="border-b">
                        <td className="py-2">{index + 1}</td>
                        <td className="py-2">{pallet.length} × {pallet.width} × {pallet.height}</td>
                        <td className="py-2">{pallet.weight}</td>
                        <td className="py-2">{Math.round(volumeWeight)}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-b">
                    <td colSpan={2} className="py-2 font-medium">Total</td>
                    <td className="py-2">{totalActualWeight} kg</td>
                    <td className="py-2">{totalVolumeWeight} kg</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="py-2 font-medium">Chargeable Weight</td>
                    <td colSpan={2} className="py-2">{chargeableWeight} kg</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-3 uppercase text-sm">SERVICES & CHARGES</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Description</th>
                    <th className="py-2 text-right">Amount (THB)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Freight Cost</td>
                    <td className="py-2 text-right">{formatNumber(totalFreightCost)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Clearance Cost</td>
                    <td className="py-2 text-right">{formatNumber(clearanceCost)}</td>
                  </tr>
                  {quotationData?.delivery_service_required && (
                    <tr className="border-b">
                      <td className="py-2">Delivery Service ({quotationData?.delivery_vehicle_type || 'N/A'})</td>
                      <td className="py-2 text-right">{formatNumber(deliveryCost)}</td>
                    </tr>
                  )}
                  
                  {quotationData?.additional_charges && quotationData.additional_charges.map((charge, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">Additional: {charge.description}</td>
                      <td className="py-2 text-right">{formatNumber(charge.amount)}</td>
                    </tr>
                  ))}
                  
                  <tr className="font-bold">
                    <td className="py-2">Total Cost</td>
                    <td className="py-2 text-right">{formatNumber(quotationData?.total_cost || 0)} THB</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {quotationData?.notes && (
              <div className="mb-8">
                <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-3 uppercase text-sm">NOTES</h3>
                <div className="text-sm">{quotationData.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end mt-6 print:hidden">
        <div className="flex gap-2">
          {!isSubmitted && (
            <>
              <Button 
                onClick={editQuotation}
                variant="outline"
                className="h-9"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          )}
          <Button 
            onClick={submitQuotation}
            className="h-9 bg-green-600 hover:bg-green-700"
            disabled={isSubmitting || isSubmitted}
          >
            {isSubmitting ? 'Submitting...' : isSubmitted ? 'Submitted' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
} 