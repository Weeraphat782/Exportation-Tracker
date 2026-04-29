import { redirect } from 'next/navigation';

export default function SiteAuthIndexPage() {
  redirect('/site/login');
}
