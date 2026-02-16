/**
 * Calculates the volume weight for a single pallet
 * Formula: Volume Weight (kg) = ⌈(Length × Width × Height)/6000⌉
 */
export function calculateVolumeWeight(
  length: number,
  width: number,
  height: number
): number {
  const volumeWeight = (length * width * height) / 6000;
  return Math.ceil(volumeWeight);
}

/**
 * Gets the volume weight for a pallet
 */
export function getVolumeWeightForPallet(pallet: {
  length: number;
  width: number;
  height: number;
}): number {
  return calculateVolumeWeight(pallet.length, pallet.width, pallet.height);
}

/**
 * Returns the applicable freight rate for a given weight
 */
export function getApplicableRate(
  weight: number,
  freightRates: Array<{ minRate: number; maxRate: number; rate: number }>
): number {
  // ถ้าไม่มี freightRates หรือเป็น array ว่าง ให้คืนค่า 0
  if (!freightRates || freightRates.length === 0) {
    console.warn("No freight rates provided, returning 0");
    return 0;
  }

  // Sort rates by minRate in ascending order
  const sortedRates = [...freightRates].sort((a, b) => a.minRate - b.minRate);

  // Find the applicable rate based on weight
  for (const rate of sortedRates) {
    if (weight >= rate.minRate && weight <= rate.maxRate) {
      return rate.rate;
    }
  }

  // If weight exceeds all defined ranges, use the highest rate
  if (sortedRates.length > 0) {
    return sortedRates[sortedRates.length - 1].rate;
  }

  // Default fallback - should never reach here in practice
  return 0;
}

/**
 * Calculates the cost for a single pallet
 */
export function getPalletCost(
  volumeWeight: number,
  applicableRate: number
): number {
  return Math.round(volumeWeight * applicableRate);
}

/**
 * Calculates the total freight cost for all pallets
 */
export function calculateFreightCost(
  pallets: Array<{
    length: number;
    width: number;
    height: number;
    weight: number;
  }>,
  freightRates: Array<{ minRate: number; maxRate: number; rate: number }>
): number {
  let totalFreightCost = 0;

  // Sum the costs of all pallets
  for (const pallet of pallets) {
    // Skip calculations for incomplete pallet data
    if (!pallet.length || !pallet.width || !pallet.height) {
      continue;
    }

    // Calculate volume weight with precise rounding
    const volumeWeight = getVolumeWeightForPallet(pallet);

    // Find applicable rate
    const applicableRate = getApplicableRate(volumeWeight, freightRates);

    // Calculate pallet cost with exact multiplication and rounding
    const palletCost = Math.round(volumeWeight * applicableRate);

    // Add to total
    totalFreightCost += palletCost;
  }

  return totalFreightCost;
}

/**
 * Calculates the total volume weight for all pallets
 */
export function getTotalVolumeWeight(
  pallets: Array<{
    length: number;
    width: number;
    height: number;
  }>
): number {
  return pallets.reduce(
    (total, pallet) => total + getVolumeWeightForPallet(pallet),
    0
  );
}

/**
 * Calculates the total actual weight for all pallets
 */
export function getTotalActualWeight(
  pallets: Array<{ weight: number }>
): number {
  return pallets.reduce((total, pallet) => total + pallet.weight, 0);
}

/**
 * Returns the chargeable weight (higher of volume weight or actual weight)
 */
export function getChargeableWeight(
  pallets: Array<{
    length: number;
    width: number;
    height: number;
    weight: number;
  }>
): number {
  const totalVolumeWeight = getTotalVolumeWeight(pallets);
  const totalActualWeight = getTotalActualWeight(pallets);

  return Math.max(totalVolumeWeight, totalActualWeight);
}

/**
 * Calculates the total cost
 */
export function calculateTotalCost({
  pallets,
  freightRates,
  deliveryServiceRequired,
  deliveryVehicleType,
  deliveryRates,
  clearanceCost,
  additionalCharges,
}: {
  pallets: Array<{
    length: number;
    width: number;
    height: number;
    weight: number;
  }>;
  freightRates: Array<{ minRate: number; maxRate: number; rate: number }>;
  deliveryServiceRequired: boolean;
  deliveryVehicleType?: string;
  deliveryRates: Record<string, number>;
  clearanceCost: number;
  additionalCharges: Array<{ description: string; amount: number }>;
}): {
  totalFreightCost: number;
  deliveryCost: number;
  clearanceCost: number;
  totalAdditionalCharges: number;
  totalCost: number;
  totalVolumeWeight: number;
  totalActualWeight: number;
  chargeableWeight: number;
} {
  // Calculate total freight cost (only the sum of pallet costs)
  const totalFreightCost = calculateFreightCost(pallets, freightRates);

  // Calculate delivery cost
  let deliveryCost = 0;
  if (deliveryServiceRequired && deliveryVehicleType) {
    deliveryCost = deliveryRates[deliveryVehicleType];
  }

  // Calculate total additional charges
  const totalAdditionalCharges = additionalCharges.reduce(
    (total, charge) => total + charge.amount,
    0
  );

  // Calculate total volume and actual weights
  const totalVolumeWeight = getTotalVolumeWeight(pallets);
  const totalActualWeight = getTotalActualWeight(pallets);
  const chargeableWeight = getChargeableWeight(pallets);

  // Calculate total cost - clearanceCost is kept as a separate item
  const totalCost = totalFreightCost + deliveryCost + clearanceCost + totalAdditionalCharges;

  return {
    totalFreightCost,
    deliveryCost,
    clearanceCost,
    totalAdditionalCharges,
    totalCost,
    totalVolumeWeight,
    totalActualWeight,
    chargeableWeight,
  };
} 