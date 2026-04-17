'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Quotation } from '@/lib/db';

/** Quotation plus optional camelCase overrides from session/enhanced flow */
export type QuotationPreviewData = Quotation & {
  totalFreightCost?: number;
  totalVolumeWeight?: number;
  totalActualWeight?: number;
  chargeableWeight?: number;
  clearanceCost?: number;
  deliveryCost?: number;
};

interface PalletWithQuantity {
  length: number | string;
  width: number | string;
  height: number | string;
  weight: number | string;
  quantity?: number | string;
}

interface ChargeItem {
  name: string;
  description: string;
  amount: number | string;
}

function formatNumber(num: number | string | undefined | null) {
  if (num === undefined || num === null) return '0.00';
  const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsedNum)) return '0.00';
  return parsedNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface QuotationPreviewContentProps {
  quotation: QuotationPreviewData;
  mode: 'staff' | 'public' | 'print';
  /** Public: open signature dialog */
  onSignClick?: () => void;
  signBusy?: boolean;
}

export function QuotationPreviewContent({
  quotation: quotationData,
  mode,
  onSignClick,
  signBusy,
}: QuotationPreviewContentProps) {
  const calculateTotalActualWeight = () => {
    if (!quotationData?.pallets?.length) return 0;
    return quotationData.pallets.reduce((total: number, pallet: PalletWithQuantity) => {
      const weight = typeof pallet.weight === 'number' ? pallet.weight : parseFloat(String(pallet.weight)) || 0;
      const quantity =
        typeof pallet.quantity === 'number' ? pallet.quantity : parseInt(String(pallet.quantity), 10) || 1;
      return total + weight * quantity;
    }, 0);
  };

  const calculateTotalVolumeWeight = () => {
    if (!quotationData?.pallets?.length) return 0;
    return quotationData.pallets.reduce((total: number, pallet: PalletWithQuantity) => {
      const length = typeof pallet.length === 'number' ? pallet.length : parseFloat(String(pallet.length)) || 0;
      const width = typeof pallet.width === 'number' ? pallet.width : parseFloat(String(pallet.width)) || 0;
      const height = typeof pallet.height === 'number' ? pallet.height : parseFloat(String(pallet.height)) || 0;
      const quantity =
        typeof pallet.quantity === 'number' ? pallet.quantity : parseInt(String(pallet.quantity), 10) || 1;
      return total + (length * width * height * quantity) / 6000;
    }, 0);
  };

  const totalActualWeight = quotationData.total_actual_weight ?? quotationData.totalActualWeight ?? calculateTotalActualWeight();
  const totalVolumeWeight = quotationData.total_volume_weight ?? quotationData.totalVolumeWeight ?? calculateTotalVolumeWeight();

  const chargeableWeight =
    quotationData.is_chargeable_weight_manual && quotationData.manual_chargeable_weight
      ? Number(quotationData.manual_chargeable_weight)
      : quotationData.chargeable_weight ??
        quotationData.chargeableWeight ??
        Math.max(totalActualWeight, Math.ceil(totalVolumeWeight));

  const totalFreightCost =
    quotationData.totalFreightCost !== undefined
      ? quotationData.totalFreightCost
      : quotationData.total_freight_cost !== undefined
        ? quotationData.total_freight_cost
        : 0;

  const clearanceCost =
    quotationData.clearanceCost !== undefined
      ? quotationData.clearanceCost
      : quotationData.clearance_cost !== undefined
        ? quotationData.clearance_cost
        : 0;

  const deliveryCost = quotationData.delivery_service_required
    ? quotationData.deliveryCost !== undefined
      ? quotationData.deliveryCost
      : quotationData.delivery_cost !== undefined
        ? quotationData.delivery_cost
        : 3500
    : 0;

  const displayCompanyName =
    quotationData.signed_company_name?.trim() ||
    quotationData.company_name?.trim() ||
    'N/A';

  const hasSignature = Boolean(quotationData.customer_signature?.trim());

  return (
    <Card className="p-8 max-w-4xl mx-auto bg-white shadow-sm print:shadow-none print:border-none print:p-0">
      <CardContent className="p-0">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">QUOTATION</h2>
            <div className="text-sm text-slate-500 mt-1">
              Ref: {quotationData?.quotation_no || quotationData?.id || 'N/A'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-slate-900">OMG Experience</div>
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
                  <td className="py-1">
                    {quotationData?.created_at ? new Date(quotationData.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-medium">Destination:</td>
                  <td className="py-1">{quotationData?.destination || 'N/A'}</td>
                </tr>
                {quotationData?.requested_destination &&
                  (!quotationData.destination || quotationData.destination === 'N/A') && (
                    <tr>
                      <td className="py-1 font-medium text-emerald-700">Requested:</td>
                      <td className="py-1 text-emerald-700 font-medium italic">
                        {quotationData.requested_destination}
                      </td>
                    </tr>
                  )}
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
              {quotationData?.pallets &&
                quotationData.pallets.map((pallet: PalletWithQuantity, index: number) => {
                  const volumeWeight =
                    (Number(pallet.length) * Number(pallet.width) * Number(pallet.height)) / 6000;
                  return (
                    <tr key={index} className="border-b">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2">
                        {pallet.length} × {pallet.width} × {pallet.height}
                      </td>
                      <td className="py-2">{pallet.weight}</td>
                      <td className="py-2">{Math.round(volumeWeight)}</td>
                    </tr>
                  );
                })}
              <tr className="border-b">
                <td colSpan={2} className="py-2 font-medium">
                  Total
                </td>
                <td className="py-2">{totalActualWeight} kg</td>
                <td className="py-2">{Math.ceil(totalVolumeWeight)} kg</td>
              </tr>
              <tr>
                <td colSpan={2} className="py-2 font-medium">
                  Chargeable Weight
                </td>
                <td colSpan={2} className="py-2">
                  {Math.ceil(chargeableWeight)} kg
                </td>
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
              {(clearanceCost || 0) > 0 && (
                <tr className="border-b">
                  <td className="py-2">Clearance Cost</td>
                  <td className="py-2 text-right">{formatNumber(clearanceCost)}</td>
                </tr>
              )}
              {quotationData?.delivery_service_required && (
                <tr className="border-b">
                  <td className="py-2">
                    Delivery Service ({quotationData?.delivery_vehicle_type || 'N/A'})
                  </td>
                  <td className="py-2 text-right">{formatNumber(deliveryCost)}</td>
                </tr>
              )}
              {quotationData?.additional_charges &&
                quotationData.additional_charges.map((charge: ChargeItem, index: number) => (
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

        <div className="mb-8">
          <h3 className="font-semibold bg-gray-100 px-2 py-1 mb-3 uppercase text-sm">PAYMENT INFORMATION</h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>Kindly transfer to the following account:</strong>
            </p>
            <p>
              <strong>Bank:</strong> KASIKORN BANK
            </p>
            <p>
              <strong>Account Name:</strong> บจก. โอ เอ็ม จี เอ็กซ์พีเรียนซ์ สาขาจักรวรรดิ
            </p>
            <p>
              <strong>Account Number:</strong> 051-2-51692-0
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 break-inside-avoid print:break-inside-avoid">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {/* Left — issuer (hardcoded) */}
            <div className="text-center">
              <p className="text-sm text-slate-700 mb-2">Yours sincerely,</p>
              <div className="h-14 flex items-end justify-center">
                <p className="text-3xl text-slate-900 italic leading-none [font-family:var(--font-quotation-signature)]">
                  Shivek Sachdev
                </p>
              </div>
              <div className="border-t border-slate-800 mt-1 mb-2" />
              <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                OMG Experience
              </p>
              <p className="text-xs italic text-slate-600">Authorized Signature</p>
              <p className="text-xs italic text-slate-600">Director</p>
            </div>

            {/* Right — customer acceptance */}
            <div className="text-center">
              <p className="text-sm text-slate-700 mb-2">Quotation Accepted By:</p>
              <div className="h-14 flex items-end justify-center">
                {hasSignature && quotationData.customer_signature ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={quotationData.customer_signature}
                      alt="Customer signature"
                      className="block object-contain object-bottom"
                      style={{ maxHeight: '56px', maxWidth: '240px' }}
                    />
                  </>
                ) : mode === 'public' ? (
                  <Button type="button" size="sm" onClick={onSignClick} disabled={signBusy}>
                    {signBusy ? 'Submitting…' : 'Sign here'}
                  </Button>
                ) : (
                  <span className="text-xs italic text-slate-400">
                    Awaiting customer signature
                  </span>
                )}
              </div>
              <div className="border-t border-slate-800 mt-1 mb-2" />
              <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {displayCompanyName}
              </p>
              <p className="text-xs italic text-slate-600">Authorized Signature / Date</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
