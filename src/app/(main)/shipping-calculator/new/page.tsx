'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, FormProvider, useFieldArray, useFormContext, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Trash, Minus } from 'lucide-react';
import { 
    calculateVolumeWeight,
    // getTotalVolumeWeight, // Removed unused import
    // getTotalActualWeight, // Removed unused import
    // getChargeableWeight as calculateChargeableWeightForPallet // Removed unused import
} from '@/lib/calculators';
import { useRouter, useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import {
  getDestinations,
  getFreightRates,
  getCompanies,
  saveQuotation as dbSaveQuotation,
  updateQuotation as dbUpdateQuotation,
  getQuotationById as dbGetQuotationById,
  Destination,
  FreightRate,
  Company,
  Quotation,
  NewQuotationData
} from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
// import Link from 'next/link'; // Removed unused import

// --- Pallet Schema ---
const palletSchema = z.object({
  length: z.number().min(0, { message: 'Must be 0 or positive' }),
  width: z.number().min(0, { message: 'Must be 0 or positive' }),
  height: z.number().min(0, { message: 'Must be 0 or positive' }),
  weight: z.number().min(0, { message: 'Must be 0 or positive' }),
  quantity: z.number().int().min(1, { message: 'Quantity must be at least 1' }),
});

// --- Additional Charge Schema ---
const additionalChargeSchema = z.object({
    name: z.string().min(1, { message: 'Charge name is required' }),
    description: z.string().min(1, { message: 'Description is required' }),
    amount: z.number().min(0, { message: 'Amount must be 0 or greater' }),
});

// --- Quotation Form Schema ---
// Ensure this schema matches the QuotationFormValues type below
// Fields managed by useForm defaults don't need .optional() or .default() here
const quotationFormSchema = z.object({
  companyId: z.string().min(1, { message: 'Company is required' }),
  customerName: z.string().min(1, { message: 'Customer name is required' }),
  contactPerson: z.string().min(1, { message: 'Contact person is required' }),
  contractNo: z.string().optional(), // Still optional
  destinationId: z.string().min(1, { message: 'Destination is required' }),
  pallets: z.array(palletSchema).min(1, { message: 'At least one pallet is required' }),
  deliveryServiceRequired: z.boolean(), // Default handled by useForm
  deliveryVehicleType: z.enum(['4wheel', '6wheel']), // Default handled by useForm
  clearanceCost: z.number().min(0, { message: 'Clearance cost must be 0 or greater' }).optional(), // Added clearance cost field
  additionalCharges: z.array(additionalChargeSchema), // Default handled by useForm
  notes: z.string().optional(), // Still optional
});

// Define the type based on the schema
type QuotationFormValues = z.infer<typeof quotationFormSchema>;

// Add type definitions near other interfaces
interface PalletType {
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity?: number;
  id?: string; // Make id optional since it's not used in existing code
}

interface AdditionalChargeType {
  description: string;
  amount: number;
  id?: string; // Make id optional since it's not used in existing code
}

// Add this helper function after existing utility functions
const formatNumber = (num: number) => {
  if (Math.floor(num) === num) {
    return num.toFixed(0);
  }
  return num.toFixed(2);
};

// --- Helper Function: Calculate single pallet cost ---
function calculateSinglePalletFreightCost(
    pallet: { length?: number; width?: number; height?: number; weight?: number },
    destinationId: string | undefined,
    freightRates: FreightRate[]
): { volumeWeight: number; actualWeight: number; chargeableWeight: number; freightCost: number; applicableRate: FreightRate | null } {
    const length = pallet.length ?? 0;
    const width = pallet.width ?? 0;
    const height = pallet.height ?? 0;
    const actualWeight = pallet.weight ?? 0;

    // Calculate volume weight regardless of whether destinationId is provided
    const volumeWeight = calculateVolumeWeight(length, width, height);
    const chargeableWeight = Math.max(volumeWeight, actualWeight);

    // Only look up rate if destinationId is provided
    const getApplicableRateFromDb = (destId: string | undefined, weight: number): FreightRate | null => {
        if (!destId) return null;
        const applicableRates = freightRates.filter(
            (rate) =>
                rate.destination_id === destId &&
                (rate.min_weight === null || (typeof rate.min_weight === 'number' && weight >= rate.min_weight)) &&
                (rate.max_weight === null || (typeof rate.max_weight === 'number' && weight <= rate.max_weight))
        );
        return applicableRates.length > 0 ? applicableRates[0] : null;
    };

    const applicableRate = getApplicableRateFromDb(destinationId, chargeableWeight);
    const rateValue = applicableRate?.base_rate ?? 0;
    const freightCost = Math.round(chargeableWeight * rateValue);

    return { volumeWeight, actualWeight, chargeableWeight, freightCost, applicableRate };
}

// --- Helper Component for Pallet Input ---
const PalletItem = ({ 
    index, 
    removePallet,
    destinationId,
    freightRates,
}: { 
    index: number; 
    removePallet: (index: number) => void;
    destinationId: string | undefined;
    freightRates: FreightRate[];
}) => {
    const { control, watch } = useFormContext<QuotationFormValues>();
    const pallet = watch(`pallets.${index}`);
    
    // Calculate these values directly to ensure they update immediately when pallet dimensions change
    const length = pallet.length || 0;
    const width = pallet.width || 0;
    const height = pallet.height || 0;
    const weight = pallet.weight || 0;
    
    // Calculate volume weight directly - this will update whenever any dimension changes
    const volumeWeight = React.useMemo(() => {
        return calculateVolumeWeight(length, width, height);
    }, [length, width, height]);
    
    const chargeableWeight = React.useMemo(() => {
        return Math.max(volumeWeight, weight);
    }, [volumeWeight, weight]);
    
    // Only calculate freight cost if destination is selected
    const { applicableRate, freightCost } = React.useMemo(() => {
        if (!destinationId) return { applicableRate: null, freightCost: 0 };
        
        const getApplicableRateFromDb = (destId: string, weight: number): FreightRate | null => {
            const applicableRates = freightRates.filter(
                (rate) =>
                    rate.destination_id === destId &&
                    (rate.min_weight === null || (typeof rate.min_weight === 'number' && weight >= rate.min_weight)) &&
                    (rate.max_weight === null || (typeof rate.max_weight === 'number' && weight <= rate.max_weight))
            );
            return applicableRates.length > 0 ? applicableRates[0] : null;
        };
        
        const foundRate = getApplicableRateFromDb(destinationId, chargeableWeight);
        const rateValue = foundRate?.base_rate ?? 0;
        const cost = Math.round(chargeableWeight * rateValue);
        
        return { applicableRate: foundRate, freightCost: cost };
    }, [chargeableWeight, destinationId, freightRates]);
    
    // Total cost for this item
    const totalItemCost = React.useMemo(() => {
        return freightCost;
    }, [freightCost]);

    // Format the display values to show integers without decimal places
    const displayVolumeWeight = formatNumber(volumeWeight);
    const displayChargeableWeight = formatNumber(chargeableWeight);

    return (
        <div className="border rounded-md p-4 my-2 bg-gray-50 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <div className="font-semibold text-md">Pallet {index + 1}</div>
                <Button 
                    type="button" 
                    variant="ghost"
                    size="sm" 
                    onClick={() => removePallet(index)}
                    className="text-red-600 hover:bg-red-100 px-2 py-1 h-auto"
                    disabled={watch('pallets')?.length <= 1}
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <FormField
                    control={control}
                    name={`pallets.${index}.length`}
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs">Length (cm)</FormLabel>
                        <FormControl>
                        <Input 
                            {...field} 
                            type="number" 
                            placeholder="0" 
                            value={field.value || ''} 
                            onChange={(e) => {
                                // Update field value
                                field.onChange(parseFloat(e.target.value) || 0);
                            }}
                            className="h-9"
                        />
                        </FormControl>
                    </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name={`pallets.${index}.width`}
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs">Width (cm)</FormLabel>
                        <FormControl>
                            <Input 
                                {...field} 
                                type="number" 
                                placeholder="0" 
                                value={field.value || ''} 
                                onChange={(e) => {
                                    // Update field value
                                    field.onChange(parseFloat(e.target.value) || 0);
                                }}
                                className="h-9"
                            />
                        </FormControl>
                    </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name={`pallets.${index}.height`}
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs">Height (cm)</FormLabel>
                        <FormControl>
                            <Input 
                                {...field} 
                                type="number" 
                                placeholder="0" 
                                value={field.value || ''} 
                                onChange={(e) => {
                                    // Update field value
                                    field.onChange(parseFloat(e.target.value) || 0);
                                }}
                                className="h-9"
                            />
                        </FormControl>
                    </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name={`pallets.${index}.weight`}
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs">Weight (kg)</FormLabel>
                        <FormControl>
                            <Input 
                                {...field} 
                                type="number" 
                                placeholder="0" 
                                value={field.value || ''} 
                                onChange={(e) => {
                                    // Update field value
                                    field.onChange(parseFloat(e.target.value) || 0);
                                }}
                                className="h-9"
                            />
                        </FormControl>
                    </FormItem>
                    )}
                />
            </div>

            <div className="text-xs space-y-1 mt-2 p-2 border-t border-dashed">
                <p>Volume Wt: <span className="font-medium">{displayVolumeWeight} kg</span></p>
                <p>Chargeable Wt: <span className="font-medium">{displayChargeableWeight} kg</span></p>
                <p>Applicable Rate: <span className="font-medium">{applicableRate ? `${applicableRate.base_rate.toFixed(2)} THB/kg` : 'N/A'}</span></p>
                <p>Freight Cost: <span className="font-medium">{freightCost.toFixed(2)} THB</span></p>
                <p className="font-semibold">Item Total: <span className="font-bold">{totalItemCost.toFixed(2)} THB</span></p>
            </div>
        </div>
    );
};

// --- Additional Charge Item ---
const AdditionalChargeItem = ({
    index,
    removeCharge
}: {
    index: number;
    removeCharge: (index: number) => void;
}) => {
    const { control, trigger } = useFormContext<QuotationFormValues>();

    return (
        <div className="flex items-end gap-2 mb-2">
            <FormField
                control={control}
                name={`additionalCharges.${index}.name`}
                render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormLabel className="text-xs">Name</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g., Handling Fee" className="h-9"/>
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name={`additionalCharges.${index}.description`}
                render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormLabel className="text-xs">Description</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g., Handling Fee" className="h-9"/>
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name={`additionalCharges.${index}.amount`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs">Amount (THB)</FormLabel>
                        <FormControl>
                            <Input 
                                {...field} 
                                type="number" 
                                placeholder="0.00" 
                                value={field.value || ''} 
                                onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                    // Force recalculation immediately after amount changes
                                    setTimeout(() => trigger(), 0);
                                }} 
                                className="h-9 w-28"
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCharge(index)}
                className="text-red-600 hover:bg-red-100 h-9 w-9"
            >
                <Minus className="h-4 w-4" />
            </Button>
        </div>
    );
};

// --- Type for Calculation Results ---
interface CalculationResult {
    totalVolume: number;
    totalWeight: number;
    totalVolumeWeight: number;
    totalActualWeight: number;
    totalChargeableWeight: number;
    totalFreightCost: number;
    clearanceCost: number;
    deliveryCost: number;
    subTotal: number;
    totalAdditionalCharges: number;
    finalTotalCost: number;
}

// Add this function before the NewQuotationPage component
function calculateTotalFreightCost(
  pallets: PalletType[] = [], 
  additionalCharges: AdditionalChargeType[] = [],
  options: { clearanceCost?: number; deliveryRequired?: boolean; deliveryType?: string; deliveryRates?: Record<string, number>; destinationId?: string; freightRates?: FreightRate[] } = {}
): CalculationResult {
  // Calculate total volume (in cubic centimeters)
  const totalVolumeCm3 = pallets.reduce((acc, pallet) => {
    const volume = (pallet.length * pallet.width * pallet.height * (pallet.quantity || 1));
    return acc + volume;
  }, 0);

  // Calculate total weight
  const totalWeight = pallets.reduce((acc, pallet) => {
    return acc + (pallet.weight * (pallet.quantity || 1));
  }, 0);

  // Calculate volume weight using the same formula as in PalletItem (divide by 6000 instead of volume * 167)
  // This ensures consistency between individual pallet calculations and total calculations
  const totalVolumeWeight = totalVolumeCm3 / 6000;
  
  // Round the values to integers if they are close to whole numbers
  const roundedTotalVolumeWeight = Math.abs(totalVolumeWeight - Math.round(totalVolumeWeight)) < 0.01 
    ? Math.round(totalVolumeWeight) 
    : totalVolumeWeight;
  
  // Get the chargeable weight (max of volume weight or actual weight)
  const totalChargeableWeight = Math.max(roundedTotalVolumeWeight, totalWeight);

  // Calculate freight cost for each pallet using the proper rates and sum them
  let totalFreightCost = 0;
  
  // If we have freight rates and destination, calculate properly
  if (options.freightRates && options.freightRates.length > 0 && options.destinationId) {
    // Sum up individual pallet freight costs
    totalFreightCost = pallets.reduce((acc, pallet) => {
      const { freightCost } = calculateSinglePalletFreightCost(pallet, options.destinationId, options.freightRates || []);
      return acc + freightCost;
    }, 0);
  } else {
    // Fallback calculation if proper rates aren't available
    totalFreightCost = totalChargeableWeight * 50; // Example rate per kg
  }
  
      // Use provided clearance cost or default to 0 (no clearance cost)
    const clearanceCost = options.clearanceCost || 0;
  
  // Calculate delivery cost based on settings
  let deliveryCost = 0;
  if (options.deliveryRequired) {
    // Only apply delivery cost if delivery is required
    if (options.deliveryType && options.deliveryRates && options.deliveryRates[options.deliveryType]) {
      // Use the specific rate for the selected vehicle type
      deliveryCost = options.deliveryRates[options.deliveryType];
    } else {
      // Fallback default if rates aren't provided
      deliveryCost = 3000;
    }
  } // If deliveryRequired is false, deliveryCost remains 0
  
  // Calculate subtotal (before additional charges)
  const subTotal = totalFreightCost + clearanceCost + deliveryCost;
  
  // Calculate total additional charges
  const totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
  
  // Calculate final total cost
  const finalTotalCost = subTotal + totalAdditionalCharges;

  // Return all fields needed for the interface
  return {
    totalVolume: totalVolumeCm3 / 1000000, // Convert to cubic meters for display
    totalWeight,
    totalVolumeWeight: roundedTotalVolumeWeight, // Use the rounded value
    totalActualWeight: totalWeight, // Aliasing for backward compatibility
    totalChargeableWeight,
    totalFreightCost,
    clearanceCost,
    deliveryCost,
    subTotal,
    totalAdditionalCharges,
    finalTotalCost
  };
}

// --- Main Page Component ---
function ShippingCalculatorPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const quotationId = searchParams.get('id');
    const isEditMode = !!quotationId;

    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [freightRates, setFreightRates] = useState<FreightRate[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

    // Update the useEffect for recalculating costs to prevent infinite loops
    const [lastCalculatedValues, setLastCalculatedValues] = useState<{
        pallets: PalletType[],
        additionalCharges: AdditionalChargeType[],
        destinationId?: string
    }>({
        pallets: [],
        additionalCharges: [],
        destinationId: undefined
    });

    // --- React Hook Form Setup ---
    const form = useForm<QuotationFormValues>({
        resolver: zodResolver(quotationFormSchema),
        defaultValues: {
            companyId: '',
            customerName: '',
            contactPerson: '',
            contractNo: '',
            destinationId: '',
            pallets: [{ length: 0, width: 0, height: 0, weight: 0, quantity: 1 }],
            deliveryServiceRequired: false,
            deliveryVehicleType: '4wheel',
            clearanceCost: 5350, // Default clearance cost, can be modified or set to 0
            additionalCharges: [{ name: '', description: '', amount: 0 }],
            notes: '',
        },
        mode: 'onChange',
    });

    // Destructure methods and formState
    const { 
        control, 
        handleSubmit, 
        getValues, 
        watch, 
        reset, 
        trigger, // Added trigger for manual validation
        formState: { errors, isValid /*, isDirty*/ } 
    } = form; 

    // Field Arrays
    const { fields: palletFields, append: appendPallet, remove: removePallet } = useFieldArray({
        control: control,
        name: "pallets",
    });

    const { fields: chargeFields, append: appendCharge, remove: removeCharge } = useFieldArray({
        control: control,
        name: "additionalCharges",
    });

    // Watch relevant fields for recalculation
    const watchedDestinationId = watch('destinationId');
    const watchedDeliveryRequired = watch('deliveryServiceRequired');
    const watchedDeliveryVehicle = watch('deliveryVehicleType');

    // --- Fetch Initial Data (Runs once on mount) ---
    useEffect(() => {
        const fetchData = async () => {
            console.log("Effect 1: Fetching initial data...");
            setIsLoading(true); // Start loading
            try {
                // 1. Get User
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);
                    console.log("Effect 1: User ID set:", user.id);
                } else {
                    throw new Error("User not logged in.");
                }

                // 2. Fetch other data concurrently
                const [destinationsData, freightRatesData, companiesData] = await Promise.all([
                    getDestinations(),
                    getFreightRates(),
                    getCompanies()
                ]);

                // 3. Set state for fetched data
                if (destinationsData) {
                    setDestinations(destinationsData);
                    console.log("Effect 1: Destinations loaded:", destinationsData.length);
                } else {
                    toast.error("Failed to load destinations.");
                }
                if (freightRatesData) {
                    setFreightRates(freightRatesData);
                    console.log("Effect 1: Freight rates loaded:", freightRatesData.length);
                } else {
                    toast.error("Failed to load freight rates.");
                }
                if (companiesData) {
                    setCompanies(companiesData);
                    console.log("Effect 1: Companies loaded:", companiesData.length);
                } else {
                    toast.error("Failed to load companies.");
                }

                 // 4. Finish loading only after all fetches and state sets are done
                 console.log("Effect 1: All data fetched, setting isLoading to false.");
                 setIsLoading(false);

            } catch (error: unknown) {
                console.error('Error fetching initial data:', error);
                // Type check for error message
                const message = error instanceof Error ? error.message : "Failed to load required data.";
                toast.error("Initialization Error", { description: message });
                if (error instanceof Error && error.message === "User not logged in.") {
                    router.push('/login');
                }
                // Keep loading true or set an error state if fetching fails critically
                // setIsLoading(false); // Or potentially set an error flag instead
            }
        };

        fetchData();
        // Run only once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Set Form Values (Runs after data is loaded or when ID changes) ---
    useEffect(() => {
        // Only run if initial data loading is complete
        if (isLoading) {
            console.log("Effect 2: Waiting for initial data...");
            return;
        }

        console.log(`Effect 2: Running. Mode: ${isEditMode ? 'Edit' : 'New'}, ID: ${quotationId}`);

        const setFormDefaults = async () => {
            try {
                if (isEditMode && quotationId && userId) {
                    console.log(`Effect 2: Fetching existing quotation ${quotationId}`);
                    const existingQuotation = await dbGetQuotationById(quotationId);
                    
                    if (existingQuotation && existingQuotation.user_id === userId) {
                        console.log("Effect 2: Existing quotation found, resetting form.");
                        // Use more specific type if possible, otherwise suppress error
                        // Assuming dbGetQuotationById returns Quotation | null
                        const typedExistingQuotation = existingQuotation as Quotation;
                        reset({
                            companyId: typedExistingQuotation.company_id || '',
                            customerName: typedExistingQuotation.customer_name || '',
                            contactPerson: typedExistingQuotation.contact_person || '',
                            contractNo: typedExistingQuotation.contract_no || '',
                            destinationId: typedExistingQuotation.destination_id || '',
                            pallets: Array.isArray(typedExistingQuotation.pallets) && typedExistingQuotation.pallets.length > 0
                                ? typedExistingQuotation.pallets.map(p => ({
                                    length: Number(p.length) || 0,
                                    width: Number(p.width) || 0,
                                    height: Number(p.height) || 0,
                                    weight: Number(p.weight) || 0,
                                    quantity: Number(p.quantity) || 1
                                  }))
                                : [{ length: 0, width: 0, height: 0, weight: 0, quantity: 1 }],
                            deliveryServiceRequired: typedExistingQuotation.delivery_service_required ?? false,
                            deliveryVehicleType: typedExistingQuotation.delivery_vehicle_type || '4wheel',
                            clearanceCost: Number(typedExistingQuotation.clearance_cost) || 0, // Load clearance cost from DB
                            additionalCharges: Array.isArray(typedExistingQuotation.additional_charges)
                                ? typedExistingQuotation.additional_charges.map(c => ({
                                    name: c.name || '',
                                    description: c.description || '',
                                    amount: Number(c.amount) || 0
                                  }))
                                : [{ name: '', description: '', amount: 0 }],
                            notes: typedExistingQuotation.notes || '',
                        });
                    } else {
                        console.log("Effect 2: Quotation not found or access denied, redirecting.");
                        toast.error("Quotation not found or access denied.");
                        router.push('/shipping-calculator');
                    }
                } else {
                    console.log("Effect 2: New quotation mode, resetting to blank defaults.");
                    reset({
                        companyId: '',
                        customerName: '',
                        contactPerson: '',
                        contractNo: '',
                        destinationId: '',
                        pallets: [{ length: 0, width: 0, height: 0, weight: 0, quantity: 1 }],
                        deliveryServiceRequired: false,
                        deliveryVehicleType: '4wheel',
                        clearanceCost: 5350, // Default clearance cost
                        additionalCharges: [{ name: '', description: '', amount: 0 }],
                        notes: '',
                    });
                }
            } catch (error: unknown) {
                 // Use unknown and check type
                 console.error('Error setting form defaults:', error);
                 const errorMessage = error instanceof Error ? error.message : "Could not set default values for the form.";
                 toast.error("Form Setup Error", { description: errorMessage });
            }
        };

        setFormDefaults();

    // Depend on isLoading, isEditMode, quotationId, and potentially userId if needed for fetching
    // Crucially, DO NOT depend on reset, companies, destinations here to avoid loops
    }, [isLoading, isEditMode, quotationId, userId, router, reset]); // Add reset dependency

    // --- Delivery Rates ---
    // Wrap deliveryRates in useMemo
    const deliveryRates = React.useMemo(() => ({
        '4wheel': 3500,
        '6wheel': 6500
    }), []);

    // --- Recalculate Costs ---
    useEffect(() => {
        const subscription = watch((value, { name /*, type*/ }) => {
            // Skip if still loading initial data
            if (isLoading) return;
            
            const formValues = value as QuotationFormValues;
            const { pallets, additionalCharges, destinationId, deliveryServiceRequired, deliveryVehicleType, clearanceCost } = formValues;
            
            // Skip if missing basic required values
            if (!pallets?.length) return;
            
            // Always force calculation when pallet fields change
            const isPalletChange = name && name.startsWith('pallets');
            
            // For complete calculation including costs, we need a destination
            if (!destinationId) {
                console.log("Skipping total cost calculation - no destination selected");
                return;
            }
            
            // Skip if nothing relevant has changed and it's not a direct pallet change
            if (
                !isPalletChange && 
                JSON.stringify(pallets) === JSON.stringify(lastCalculatedValues.pallets) &&
                JSON.stringify(additionalCharges) === JSON.stringify(lastCalculatedValues.additionalCharges) &&
                destinationId === lastCalculatedValues.destinationId &&
                deliveryServiceRequired === watchedDeliveryRequired &&
                deliveryVehicleType === watchedDeliveryVehicle
            ) {
                return;
            }
            
            // If we reach here, calculate costs - even for the first pallet
            console.log("Recalculating costs due to field change:", name);
            
            // Update last calculated values
            setLastCalculatedValues({
                pallets: pallets || [],
                additionalCharges: additionalCharges || [],
                destinationId
            });
            
            // Calculate total costs
            const calculationResult = calculateTotalFreightCost(
                pallets || [],
                additionalCharges || [],
                { 
                    clearanceCost: clearanceCost || 0, // Use form value or 0 if undefined
                    deliveryRequired: deliveryServiceRequired, 
                    deliveryType: deliveryVehicleType,
                    deliveryRates: deliveryRates,
                    destinationId: destinationId,
                    freightRates: freightRates
                }
            );
            
            // Set calculation result
            setCalculationResult(calculationResult);
        });
        
        return () => subscription.unsubscribe();
    // Add deliveryRates to dependency array (it's memoized now)
    }, [watch, isLoading, lastCalculatedValues, watchedDeliveryRequired, watchedDeliveryVehicle, deliveryRates, freightRates]);

    // --- Generate Data for DB --- 
    // This function now creates the full data object required for insertion
    // based on the updated NewQuotationData type (which matches the Quotation interface minus id/created_at)
    const generateQuotationDataForDB = (formData: QuotationFormValues): NewQuotationData | null => {
        if (!userId || !calculationResult) {
            console.error("Cannot generate quotation data: missing user ID or calculation results");
            return null;
        }
        
        // Find company and destination names for snapshot
        const selectedCompany = companies.find(c => c.id === formData.companyId);
        const selectedDestination = destinations.find(d => d.id === formData.destinationId);

        // Remove explicit type definitions and conversion
        const convertedPallets = formData.pallets;
        const convertedAdditionalCharges = formData.additionalCharges;

        // Construct the full data object matching NewQuotationData with snake_case field names
        const dataForDB: NewQuotationData = {
            user_id: userId,
            company_id: formData.companyId,
            customer_name: formData.customerName,
            contact_person: formData.contactPerson,
            contract_no: formData.contractNo || null,
            destination_id: formData.destinationId,
            pallets: convertedPallets,
            delivery_service_required: formData.deliveryServiceRequired,
            delivery_vehicle_type: formData.deliveryVehicleType,
            additional_charges: convertedAdditionalCharges,
            notes: formData.notes || null,
            total_cost: calculationResult.finalTotalCost,
            total_freight_cost: calculationResult.totalFreightCost,
            clearance_cost: calculationResult.clearanceCost,
            delivery_cost: calculationResult.deliveryCost,
            total_volume_weight: calculationResult.totalVolumeWeight,
            total_actual_weight: calculationResult.totalActualWeight,
            chargeable_weight: calculationResult.totalChargeableWeight,
            status: 'sent',
            company_name: selectedCompany?.name || formData.companyId,
            destination: selectedDestination 
                ? `${selectedDestination.country}${selectedDestination.port ? `, ${selectedDestination.port}` : ''}` 
                : formData.destinationId
        };
        return dataForDB;
    };

    // --- Save/Update Quotation Logic ---
    const handleSave = async () => {
        try {
            // First validate the form
            const isValidSave = await trigger(); // Manually trigger validation
            if (!isValidSave) {
                toast.error("Validation Error", { description: "Please check the form for errors before saving." });
                return;
            }

            setIsSaving(true);
            const loadingToastId = toast.loading(isEditMode ? "Updating Quotation..." : "Saving Quotation...");

            // Check prerequisites
            if (!userId) {
                toast.error("Authentication Error", { 
                    id: loadingToastId,
                    description: "User not logged in. Please log in and try again." 
                });
                return;
            }
            
            if (!calculationResult) {
                toast.error("Calculation Error", { 
                    id: loadingToastId,
                    description: "Calculation results are missing. Please ensure all required fields are filled." 
                });
                return;
            }

            const formData = getValues();
            
            // Log form values to help debug
            console.log("Form values being saved:", formData);
            console.log("Calculation results:", calculationResult);
            
            // Use the updated function to get the full data object
            const quotationDataForDB = generateQuotationDataForDB(formData);

            if (!quotationDataForDB) {
                toast.error("Data Preparation Error", {
                    id: loadingToastId,
                    description: "Failed to generate data for saving. Please check console for details."
                });
                return;
            }

            let savedQuotation: Quotation | null = null;
            
            if (isEditMode && quotationId) {
                // Prepare update data - Omit fields not meant for update
                const { 
                    /* user_id: ignoredUserId, */
                    /* company_name: ignoredCompName, */
                    /* destination: ignoredDestName, */
                    ...updateDataForDB 
                } = quotationDataForDB;

                // Pass the rest of the data for update
                savedQuotation = await dbUpdateQuotation(quotationId, updateDataForDB); 
                
                if (!savedQuotation) {
                    throw new Error("Failed to update quotation. The database operation returned null.");
                }
            } else {
                // Save new quotation using the full data object
                try {
                    savedQuotation = await dbSaveQuotation(quotationDataForDB);
                    
                    if (!savedQuotation) {
                        throw new Error("Failed to save quotation. The database operation returned null.");
                    }
                } catch (saveError: unknown) {
                    // Handle specific save errors
                    console.error("Save quotation error details:", saveError);
                    throw new Error(saveError instanceof Error ? saveError.message : "Database save operation failed");
                }
            }

            // Success path
            toast.success(isEditMode ? "Quotation Updated" : "Quotation Saved", {
                id: loadingToastId,
                description: `Quotation ${savedQuotation.id} saved.`, // Clearer message
                action: {
                    label: "View List",
                    onClick: () => router.push('/shipping-calculator'), 
                },
            });
            
            // Prepare quotation data for preview
            const previewData = {
                ...savedQuotation,
                // Add calculation results that might not be in the DB record
                totalVolumeWeight: calculationResult.totalVolumeWeight,
                totalActualWeight: calculationResult.totalActualWeight,
                chargeableWeight: calculationResult.totalChargeableWeight,
                totalFreightCost: calculationResult.totalFreightCost,
                clearanceCost: calculationResult.clearanceCost,
                deliveryCost: calculationResult.deliveryCost,
                totalAdditionalCharges: calculationResult.totalAdditionalCharges,
                // Ensure we have good conversion between snake_case and camelCase
                companyName: savedQuotation.company_name,
                deliveryVehicleType: savedQuotation.delivery_vehicle_type,
                deliveryServiceRequired: savedQuotation.delivery_service_required,
                additionalCharges: savedQuotation.additional_charges,
                contactPerson: savedQuotation.contact_person,
                freightRate: (calculationResult.totalFreightCost / calculationResult.totalChargeableWeight) || 0
            };
            
            // Store in sessionStorage for preview
            sessionStorage.setItem('quotationData', JSON.stringify(previewData));
            
            // Navigate to preview
            router.push(`/shipping-calculator/preview?id=${savedQuotation.id}`);
            
        } catch (error: unknown) {
            console.error('Error saving quotation:', error);
            
            // Get a more descriptive error message if possible
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
            
            // Show a toast with the error
            toast.error(isEditMode ? "Update Failed" : "Save Failed", {
                description: errorMessage,
            });
        } finally {
            setIsSaving(false);
        }
    };

    // --- Form Submission Handler (for Enter key - generally unused due to buttons) ---
    const onSubmit: SubmitHandler<QuotationFormValues> = (data) => {
        console.log("Form submitted via Enter key (not recommended):", data);
        // Add type assertion for data if needed, though SubmitHandler should match
        // const typedData = data as QuotationFormValues;
        toast.info("Submit Action", { description: "Please use the 'Submit Quotation' button."}) 
    };

    // --- Loading State --- (Simplify back to just isLoading)
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-gray-600">Loading Calculator Data...</p>
            </div>
        );
    }
        
    // --- Render Form ---
    return (
        <FormProvider {...form} key={quotationId || 'new'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Button type="button" variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-semibold">{isEditMode ? 'Edit Quotation' : 'New Quotation'}</h1>
                    <div className="w-20"></div> {/* Spacer */}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Customer & Destination */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-lg">Customer & Destination</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={control} 
                                name="companyId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select company" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {companies.map((company) => (
                                                    <SelectItem key={company.id} value={company.id}>
                                                        {company.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.companyId && <p className="text-red-500 text-xs mt-1">{errors.companyId.message}</p>}
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="customerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter customer name" {...field} />
                                        </FormControl>
                                        {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="contactPerson"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Person *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., John Doe" {...field} />
                                        </FormControl>
                                        {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson.message}</p>}
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="contractNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contract No (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., C12345" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="destinationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Destination *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select destination" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {destinations.map((dest) => (
                                                    <SelectItem key={dest.id} value={dest.id}>
                                                        {`${dest.country}${dest.port ? `, ${dest.port}` : ''}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.destinationId && <p className="text-red-500 text-xs mt-1">{errors.destinationId.message}</p>}
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Column 2: Pallet Details */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Shipment Details (Pallets)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {palletFields.map((field, index) => (
                                <PalletItem 
                                    key={field.id} 
                                    index={index} 
                                    removePallet={removePallet}
                                    destinationId={watchedDestinationId} 
                                    freightRates={freightRates} 
                                />
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => appendPallet({ length: 0, width: 0, height: 0, weight: 0, quantity: 1 })}
                                className="mt-3 w-full flex items-center justify-center gap-1"
                            >
                                <Plus className="h-4 w-4" /> Add Pallet
                            </Button>
                            {errors.pallets?.root && <p className="text-red-500 text-xs mt-1">{errors.pallets.root.message}</p>}
                            {/* Check message type before displaying */}
                            {errors.pallets?.message && typeof errors.pallets.message === 'string' && <p className="text-red-500 text-xs mt-1">{errors.pallets.message}</p>}

                            {/* Display Total Weights */}
                            {calculationResult && (
                                <div className="mt-4 p-3 bg-gray-100 rounded text-sm space-y-1 border">
                                    <p>Total Volume Weight: <span className="font-semibold">{formatNumber(calculationResult.totalVolumeWeight)} kg</span></p>
                                    <p>Total Actual Weight: <span className="font-semibold">{formatNumber(calculationResult.totalActualWeight)} kg</span></p>
                                    <p className="font-bold">Aggregate Chargeable Wt: <span className="font-semibold">{formatNumber(calculationResult.totalChargeableWeight)} kg</span></p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Row 2 / Column 3 Equivalent: Services & Costs */}
                    <Card className="md:col-span-3">
                        <CardHeader>
                            <CardTitle className="text-lg">Additional Services & Costs</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left side: Services, Charges, Notes */}
                            <div className="space-y-4">
                                <h3 className="font-medium mb-2">Services</h3>
                                <FormField
                                    control={control}
                                    name="deliveryServiceRequired"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm bg-white">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    id="deliveryServiceRequired" 
                                                />
                                            </FormControl>
                                            <label htmlFor="deliveryServiceRequired" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Delivery Service Required?
                                            </label>
                                        </FormItem>
                                    )}
                                />
                                {watchedDeliveryRequired && (
                                    <FormField
                                        control={control}
                                        name="deliveryVehicleType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Delivery Vehicle Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select vehicle type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="4wheel">4-Wheel Truck ({deliveryRates['4wheel']} THB)</SelectItem>
                                                        <SelectItem value="6wheel">6-Wheel Truck ({deliveryRates['6wheel']} THB)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                )}
                                
                                {/* Clearance Cost Section */}
                                <div className="space-y-2 pt-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium mb-1">Clearance Cost</h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const currentValue = getValues('clearanceCost');
                                                if (currentValue && currentValue > 0) {
                                                    reset({ ...getValues(), clearanceCost: 0 });
                                                } else {
                                                    reset({ ...getValues(), clearanceCost: 5350 });
                                                }
                                            }}
                                        >
                                            {getValues('clearanceCost') && getValues('clearanceCost')! > 0 ? 'Remove' : 'Add Default'}
                                        </Button>
                                    </div>
                                    <FormField
                                        control={control}
                                        name="clearanceCost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Clearance Cost (THB)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="Enter clearance cost (0 for no clearance)"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        value={field.value || ''}
                                                    />
                                                </FormControl>
                                                {errors.clearanceCost && (
                                                    <p className="text-sm text-red-600">{errors.clearanceCost.message}</p>
                                                )}
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                <div className="space-y-2 pt-4">
                                    <h3 className="font-medium mb-1">Additional Charges</h3>
                                    {chargeFields.map((field, index) => (
                                        <AdditionalChargeItem key={field.id} index={index} removeCharge={removeCharge} />
                                    ))}
                                    {chargeFields.length === 0 && <p className="text-xs text-gray-500 italic">No additional charges added.</p>}
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => appendCharge({ name: '', description: '', amount: 0 })}
                                        className="mt-2 w-full flex items-center justify-center gap-1 text-xs"
                                    >
                                        <Plus className="h-3 w-3" /> Add Charge
                                    </Button>
                                </div>
                                <FormField
                                    control={control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem className="mt-4">
                                            <FormLabel>Notes (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Add any relevant notes here..." {...field} rows={3} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Right side: Cost Summary */}
                            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200 h-fit sticky top-4">
                                <h3 className="font-semibold text-lg mb-3 text-blue-800">Cost Summary (THB)</h3>
                                {calculationResult ? (
                                    <>
                                        <div className="flex justify-between text-sm"><span>Freight Cost:</span> <span className="font-medium">{calculationResult.totalFreightCost.toFixed(2)}</span></div>
                                        {calculationResult.clearanceCost > 0 && (
                                            <div className="flex justify-between text-sm"><span>Clearance Cost:</span> <span className="font-medium">{calculationResult.clearanceCost.toFixed(2)}</span></div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span>Delivery Cost:</span> 
                                            <span className="font-medium">
                                                {watchedDeliveryRequired ? calculationResult.deliveryCost.toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                        <Separator className="my-2"/>
                                        <div className="flex justify-between font-medium text-sm"><span>Subtotal:</span> <span>{calculationResult.subTotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-sm"><span>Additional Charges:</span> <span className="font-medium">{calculationResult.totalAdditionalCharges.toFixed(2)}</span></div>
                                        <Separator className="my-2 border-blue-300"/>
                                        <div className="flex justify-between text-xl font-bold text-blue-900">
                                            <span>Total Cost:</span>
                                            <span>{calculationResult.finalTotalCost.toFixed(2)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-center text-sm">Calculating costs...</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Buttons */}
                <CardFooter className="flex justify-end gap-3 pt-6 border-t mt-6">
                    <Button type="button" variant="outline" onClick={() => router.push('/shipping-calculator')} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        onClick={handleSave} 
                        disabled={isSaving || !isValid} // Disable if saving or form is invalid
                    >
                        {isSaving ? 'Submitting...' : (isEditMode ? 'Update Quotation' : 'Submit Quotation')}
                    </Button>
                </CardFooter>
            </form>
        </FormProvider>
    );
}

// Wrapper with Suspense boundary
export default function ShippingCalculatorPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-gray-600">Loading Calculator...</p>
            </div>
        }>
            <ShippingCalculatorPageContent />
        </Suspense>
    );
}
