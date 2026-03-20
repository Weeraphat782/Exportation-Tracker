import { redirect } from 'next/navigation';

/** Legacy URL: main app sidebar uses /settings/carrier-board */
export default function CarrierBoardAdminRedirectPage() {
  redirect('/settings/carrier-board');
}
