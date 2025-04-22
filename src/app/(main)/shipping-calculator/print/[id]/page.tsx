'use client';

import { useState, useEffect } from 'react';
import { getQuotationById } from '@/lib/db';
import { useParams } from 'next/navigation';

export default function PrintQuotationPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotation() {
      try {
        // Try to get from the database
        const quotation = await getQuotationById(id);
        if (quotation) {
          console.log("Loaded quotation data:", JSON.stringify(quotation, null, 2)); // Detailed logging
          setData(quotation);
        } else {
          console.error('Quotation not found');
        }
      } catch (error) {
        console.error('Error fetching quotation:', error);
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

  // Calculate actual weight
  const getTotalActualWeight = (): number => {
    if (!data?.pallets?.length) return 0;
    
    // Check if we already have the value in the data
    if (typeof data.total_actual_weight === 'number' && data.total_actual_weight > 0) 
      return data.total_actual_weight;
    if (typeof data.totalActualWeight === 'number' && data.totalActualWeight > 0) 
      return data.totalActualWeight;
    
    // Otherwise calculate from pallets
    return data.pallets.reduce((total: number, pallet: any) => {
      const weight = typeof pallet.weight === 'number' ? pallet.weight : parseFloat(pallet.weight) || 0;
      const quantity = typeof pallet.quantity === 'number' ? pallet.quantity : parseInt(pallet.quantity) || 1;
      return total + (weight * quantity);
    }, 0);
  };

  // Calculate volume weight
  const getTotalVolumeWeight = (): number => {
    if (!data?.pallets?.length) return 0;
    
    // Check if we already have the value in the data
    if (typeof data.total_volume_weight === 'number' && data.total_volume_weight > 0) 
      return data.total_volume_weight;
    if (typeof data.totalVolumeWeight === 'number' && data.totalVolumeWeight > 0) 
      return data.totalVolumeWeight;
    
    // Otherwise calculate from pallets
    return data.pallets.reduce((total: number, pallet: any) => {
      const length = typeof pallet.length === 'number' ? pallet.length : parseFloat(pallet.length) || 0;
      const width = typeof pallet.width === 'number' ? pallet.width : parseFloat(pallet.width) || 0;
      const height = typeof pallet.height === 'number' ? pallet.height : parseFloat(pallet.height) || 0;
      const quantity = typeof pallet.quantity === 'number' ? pallet.quantity : parseInt(pallet.quantity) || 1;
      
      return total + calculateVolumeWeight(width, length, height, quantity);
    }, 0);
  };

  // Calculate chargeable weight (max of volume weight and actual weight)
  const getChargeableWeight = (): number => {
    // Check if we already have the value in the data
    if (typeof data?.chargeable_weight === 'number' && data?.chargeable_weight > 0) 
      return data.chargeable_weight;
    if (typeof data?.chargeableWeight === 'number' && data?.chargeableWeight > 0) 
      return data.chargeableWeight;
    
    // Otherwise calculate it
    const totalActualWeight = getTotalActualWeight();
    const totalVolumeWeight = getTotalVolumeWeight();
    return Math.max(totalActualWeight, totalVolumeWeight);
  };

  // Format number with commas
  const formatNumber = (num: number | string | undefined | null) => {
    if (num === undefined || num === null) return "0.00";
    const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(parsedNum)) return "0.00";
    return parsedNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate total cost
  const calculateTotalCost = (): number => {
    // First check if total cost is directly stored in data
    if (typeof data?.total_cost === 'number' && data.total_cost > 0) {
      return data.total_cost;
    }
    if (typeof data?.totalCost === 'number' && data.totalCost > 0) {
      return data.totalCost;
    }
    
    // If not available, calculate from components
    const fc: number = calculateFreightCost();
    const cc: number = calculateClearanceCost();
    const dc: number = calculateDeliveryCost();
    const ac: number = calculateAdditionalCharges();
    
    return fc + cc + dc + ac;
  };

  // Calculate the freight cost
  const calculateFreightCost = (): number => {
    // If freight cost is directly available, use it
    if (typeof data?.total_freight_cost === 'number' && data.total_freight_cost > 0) return data.total_freight_cost;
    if (typeof data?.totalFreightCost === 'number' && data.totalFreightCost > 0) return data.totalFreightCost;
    
    // If we have the total cost, distribute it appropriately
    const total = typeof data?.total_cost === 'number' ? data.total_cost : 
                  typeof data?.totalCost === 'number' ? data.totalCost : 0;
    
    if (total > 0) {
      // If we have a total cost but no freight cost, estimate freight as 75% of total
      // This is a reasonable distribution for most shipping quotations
      return Math.round(total * 0.75);
    }
    
    // Otherwise estimate based on weight
    const chargeableWt = data?.chargeable_weight || data?.chargeableWeight || getChargeableWeight();
    return Math.round(chargeableWt * 150); // Default rate of 150 THB per kg if nothing else works
  };

  // Calculate the clearance cost 
  const calculateClearanceCost = (): number => {
    // If clearance cost is directly available, use it
    if (typeof data?.clearance_cost === 'number' && data.clearance_cost > 0) return data.clearance_cost;
    if (typeof data?.clearanceCost === 'number' && data.clearanceCost > 0) return data.clearanceCost;
    
    // If we have the total cost, distribute it appropriately
    const total = typeof data?.total_cost === 'number' ? data.total_cost : 
                  typeof data?.totalCost === 'number' ? data.totalCost : 0;
                  
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
    if (!data?.delivery_service_required && !data?.deliveryServiceRequired) return 0;
    
    // If delivery cost is directly available, use it
    if (typeof data?.delivery_cost === 'number' && data.delivery_cost > 0) return data.delivery_cost;
    if (typeof data?.deliveryCost === 'number' && data.deliveryCost > 0) return data.deliveryCost;
    
    // If we have the total cost, distribute it appropriately
    const total = typeof data?.total_cost === 'number' ? data.total_cost : 
                  typeof data?.totalCost === 'number' ? data.totalCost : 0;
                  
    if (total > 0) {
      // Estimate delivery as roughly 15% of total if we have total but no breakdown
      return Math.round(total * 0.15);
    }
    
    // Otherwise calculate based on vehicle type
    const vehicleType = data?.delivery_vehicle_type || data?.deliveryVehicleType || '4wheel';
    return vehicleType === '4wheel' ? 3500 : 9500;
  };

  // Calculate total additional charges
  const calculateAdditionalCharges = (): number => {
    const charges = data?.additional_charges || data?.additionalCharges || [];
    return charges.reduce((total: number, charge: any) => {
      return total + (typeof charge.amount === 'number' ? charge.amount : parseFloat(charge.amount) || 0);
    }, 0);
  };
  
  // Get current date for quotation if not provided
  const getQuotationDate = () => {
    // Use existing date if available
    if (data?.date) return data.date;
    if (data?.created_at) {
      const date = new Date(data.created_at);
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

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Quotation not found</div>
      </div>
    );
  }
  
  // Get all the calculated values
  const actualWeight = getTotalActualWeight();
  const volumeWeight = getTotalVolumeWeight();
  const chargeableWeight = data?.chargeable_weight || data?.chargeableWeight || getChargeableWeight();
  const freightCost = calculateFreightCost();
  const clearanceCost = calculateClearanceCost();
  const deliveryCost = calculateDeliveryCost();
  const additionalCharges = calculateAdditionalCharges();
  const totalCost = calculateTotalCost();

  return (
    <div className="p-8 max-w-5xl mx-auto bg-white min-h-screen print:shadow-none print:border-none">
      {/* Header with company and reference info */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">QUOTATION</h1>
          <p className="text-sm text-slate-500">Ref: {data?.id || 'N/A'}</p>
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
                <td className="py-1">{data?.company_name || 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Contact Person:</td>
                <td className="py-1">{data?.contact_person || 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Contract No:</td>
                <td className="py-1">{data?.contract_no || 'N/A'}</td>
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
                <td className="py-1">{getQuotationDate()}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Destination:</td>
                <td className="py-1">{data?.destination || 'N/A'}</td>
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
            {data?.pallets && data.pallets.length > 0 ? (
              data.pallets.map((pallet: any, index: number) => {
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
            {(data?.delivery_service_required || data?.deliveryServiceRequired) && (
              <tr className="border-b">
                <td className="py-2">Delivery Service ({data?.delivery_vehicle_type || data?.deliveryVehicleType || 'N/A'})</td>
                <td className="py-2 text-right">{formatNumber(deliveryCost)}</td>
              </tr>
            )}
            
            {(data?.additional_charges || data?.additionalCharges) && (data?.additional_charges?.length > 0 || data?.additionalCharges?.length > 0) ? (
              (data?.additional_charges || data?.additionalCharges).map((charge: any, index: number) => (
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
      {data?.notes && (
        <div className="mb-8">
          <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-3 uppercase text-sm">NOTES</h3>
          <div className="text-sm">{data.notes}</div>
        </div>
      )}
    </div>
  );
} 