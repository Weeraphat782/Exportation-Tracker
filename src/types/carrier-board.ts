/** Row from public.carrier_board_routes */
export interface CarrierBoardRouteRow {
  id: string;
  country: string;
  city: string;
  carrier_code: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Shape used by CarrierBoard UI */
export interface CarrierBoardDisplayItem {
  id: string;
  country: string;
  city: string;
  carrier: string;
  status: 'Available' | 'Suspended';
}

export function rowToDisplayItem(row: CarrierBoardRouteRow): CarrierBoardDisplayItem {
  return {
    id: row.id,
    country: row.country,
    city: row.city,
    carrier: row.carrier_code,
    status: row.is_active ? 'Available' : 'Suspended',
  };
}
