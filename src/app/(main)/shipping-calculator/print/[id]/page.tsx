'use client';

import { useState, useEffect } from 'react';
import { getQuotationById, Quotation } from '@/lib/db';
import { useParams } from 'next/navigation';
import { calculateVolumeWeight } from '@/lib/calculators';

export default function PrintQuotationPage() {
  const params = useParams();
  const id = params.id as string;
  const [quotationData, setQuotationData] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuotation() {
      try {
        // Try to get from the database
        const quotation = await getQuotationById(id);
        if (quotation) {
          console.log("Loaded quotation data:", JSON.stringify(quotation, null, 2)); // Detailed logging
          setQuotationData(quotation);
        } else {
          console.error('Quotation not found');
        }
      } catch (error: unknown) {
        console.error('Error fetching quotation:', error);
        setError("Error fetching quotation. Please try again later.");
      } finally {
        setLoading(false);
        // Auto-trigger print when data is loaded
        setTimeout(() => {
          window.print();
        }, 500);
      }
    }

    if (id) {
      fetchQuotation();
    }
  }, [id]);

  // Calculate volume weight
  const calculateVolumeWeight = (width: number, length: number, height: number, quantity: number) => {
    // Calculate volume in cubic centimeters
    const volumeCm3 = length * width * height * quantity;
    // Calculate volume weight by dividing by 6000 (industry standard)
    return volumeCm3 / 6000;
  };

  // Calculate total actual weight - Use type from Quotation.pallets
  const getTotalActualWeight = (pallets: Quotation['pallets'] | null | undefined): number => { 
    if (!pallets) return 0;
    // Ensure pallet has weight and quantity before using
    return pallets.reduce((sum, p) => sum + ((p?.weight || 0) * (p?.quantity || 1)), 0);
  };

  // Calculate total volume weight - Use type from Quotation.pallets
  const getTotalVolumeWeight = (pallets: Quotation['pallets'] | null | undefined): number => { 
    if (!pallets) return 0;
    // Ensure pallet has dimensions and quantity
    const totalVolumeCm3 = pallets.reduce((sum, p) => sum + ((p?.length || 0) * (p?.width || 0) * (p?.height || 0) * (p?.quantity || 1)), 0);
    return totalVolumeCm3 / 6000; // Assuming standard divisor
  };

  // Calculate chargeable weight - Use type from Quotation.pallets
  const getChargeableWeight = (pallets: Quotation['pallets'] | null | undefined): number => { 
    const actual = getTotalActualWeight(pallets);
    const volume = getTotalVolumeWeight(pallets);
    return Math.max(actual, volume);
  };

  // Format number with commas
  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0.00';
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate total cost
  const calculateTotalCost = (data: Quotation | null): number => {
    if (!data) return 0;
    const freight = data.total_freight_cost || 0;
    const clearance = data.clearance_cost || 0;
    const delivery = data.delivery_cost || 0;
    // Calculate sum of additional charges if the field exists
    const additional = data.additional_charges?.reduce((sum: number, charge: { amount: number }) => sum + charge.amount, 0) || 0;
    return freight + clearance + delivery + additional;
  };

  // Calculate the freight cost
  const calculateFreightCost = (): number => {
    // If freight cost is directly available, use it
    if (quotationData?.total_freight_cost && quotationData.total_freight_cost > 0) return quotationData.total_freight_cost;
    
    // If we have the total cost, distribute it appropriately
    const total = quotationData?.total_cost && quotationData.total_cost > 0 ? quotationData.total_cost : 0;
    
    if (total > 0) {
      // If we have a total cost but no freight cost, estimate freight as 75% of total
      // This is a reasonable distribution for most shipping quotations
      return Math.round(total * 0.75);
    }
    
    // Otherwise estimate based on weight
    const chargeableWt = quotationData?.chargeable_weight || getChargeableWeight(quotationData?.pallets);
    return Math.round(chargeableWt * 150); // Default rate of 150 THB per kg if nothing else works
  };

  // Calculate the clearance cost
  const calculateClearanceCost = (): number => {
    // If clearance cost is directly available, use it
    if (quotationData?.clearance_cost && quotationData.clearance_cost > 0) return quotationData.clearance_cost;
    
    // If we have the total cost, distribute it appropriately
    const total = quotationData?.total_cost && quotationData.total_cost > 0 ? quotationData.total_cost : 0;
                  
    if (total > 0) {
      // Estimate clearance as roughly 10% of total if we have total but no breakdown
      return Math.round(total * 0.10);
    }
    
    // Otherwise use standard clearance cost
    return 5350;
  };

  // Calculate the delivery cost
  const calculateDeliveryCost = (): number => {
    // If delivery is not required, return 0
    if (!quotationData?.delivery_service_required) return 0;
    
    // If delivery cost is directly available, use it
    if (quotationData?.delivery_cost && quotationData.delivery_cost > 0) return quotationData.delivery_cost;
    
    // If we have the total cost, distribute it appropriately
    const total = quotationData?.total_cost && quotationData.total_cost > 0 ? quotationData.total_cost : 0;
                  
    if (total > 0) {
      // Estimate delivery as roughly 15% of total if we have total but no breakdown
      return Math.round(total * 0.15);
    }
    
    // Otherwise calculate based on vehicle type
    const vehicleType = quotationData?.delivery_vehicle_type || '4wheel';
    return vehicleType === '4wheel' ? 3500 : 9500;
  };

  // Calculate total additional charges
  const calculateAdditionalCharges = (): number => {
    const charges = quotationData?.additional_charges || [];
    return charges.reduce((total: number, charge: any) => {
      return total + (typeof charge.amount === 'number' ? charge.amount : parseFloat(charge.amount) || 0);
    }, 0);
  };
  
  // Get current date for quotation if not provided
  const getQuotationDate = () => {
    // Use created_at if available, as there's no separate 'date' field in Quotation
    if (quotationData?.created_at) {
      const date = new Date(quotationData.created_at);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
    
    // Otherwise use current date
    const now = new Date();
    return `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-lg">Loading quotation data...</div>
      </div>
    );
  }

  if (!quotationData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error || 'Quotation not found'}</div>
      </div>
    );
  }
  
  // Get all the calculated values
  const actualWeight = getTotalActualWeight(quotationData?.pallets);
  const volumeWeight = getTotalVolumeWeight(quotationData?.pallets);
  const chargeableWeight = quotationData?.chargeable_weight || getChargeableWeight(quotationData?.pallets);
  const freightCost = calculateFreightCost();
  const clearanceCost = calculateClearanceCost();
  const deliveryCost = calculateDeliveryCost();
  const additionalCharges = calculateAdditionalCharges();
  const totalCost = calculateTotalCost(quotationData);

  return (
    <div className="p-8 max-w-5xl mx-auto bg-white min-h-screen print:shadow-none print:border-none">
      {/* Header with company and reference info */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">QUOTATION</h1>
          <p className="text-sm text-slate-500">Ref: {quotationData?.id || 'N/A'}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-slate-900">OMG Experiences</div>
          <div className="text-sm text-slate-500">
            10/12-13 Convent Road, Silom, Bangrak,<br />
            Bangkok 10500
          </div>
        </div>
      </div>

      {/* Client and Shipping Information */}
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
          <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-3 uppercase text-sm">SHIPMENT DETAILS</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-medium">Quotation Date:</td>
                <td className="py-1">{getQuotationDate()}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Destination:</td>
                <td className="py-1">{quotationData?.destination || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pallet Information */}
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
            {quotationData?.pallets && quotationData.pallets.length > 0 ? (
              quotationData.pallets.map((pallet: any, index: number) => {
                const volumeWeight = calculateVolumeWeight(
                  parseFloat(pallet.width) || 0, 
                  parseFloat(pallet.length) || 0, 
                  parseFloat(pallet.height) || 0, 
                  parseInt(pallet.quantity) || 1
                );
                return (
                  <tr key={index} className="border-b">
                    <td className="py-2">{index + 1}</td>
                    <td className="py-2">{pallet.length || 0} × {pallet.width || 0} × {pallet.height || 0}</td>
                    <td className="py-2">{parseFloat(pallet.weight) || 0}</td>
                    <td className="py-2">{Math.round(volumeWeight)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-2 text-center text-gray-500 italic">No pallet information available.</td>
              </tr>
            )}
            <tr className="border-b">
              <td colSpan={2} className="py-2 font-medium">Total</td>
              <td className="py-2">{formatNumber(actualWeight)} kg</td>
              <td className="py-2">{formatNumber(volumeWeight)} kg</td>
            </tr>
            <tr>
              <td colSpan={2} className="py-2 font-medium">Chargeable Weight</td>
              <td colSpan={2} className="py-2">{formatNumber(chargeableWeight)} kg</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Services & Charges */}
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
              <td className="py-2 text-right">{formatNumber(freightCost)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Clearance Cost</td>
              <td className="py-2 text-right">{formatNumber(clearanceCost)}</td>
            </tr>
            {(quotationData?.delivery_service_required) && (
              <tr className="border-b">
                <td className="py-2">Delivery Service ({quotationData?.delivery_vehicle_type || 'N/A'})</td>
                <td className="py-2 text-right">{formatNumber(deliveryCost)}</td>
              </tr>
            )}
            
            {(quotationData?.additional_charges) && (quotationData?.additional_charges?.length > 0) ? (
              (quotationData?.additional_charges).map((charge: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-2">Additional: {charge.description || 'Additional Charge'}</td>
                  <td className="py-2 text-right">{formatNumber(charge.amount || 0)}</td>
                </tr>
              ))
            ) : null}
            
            <tr className="font-bold">
              <td className="py-2">Total Cost</td>
              <td className="py-2 text-right">{formatNumber(totalCost)} THB</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes - simplified to match the image */}
      {quotationData?.notes && (
        <div className="mb-8">
          <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-3 uppercase text-sm">NOTES</h3>
          <div className="text-sm">{quotationData.notes}</div>
        </div>
      )}
    </div>
  );
} 