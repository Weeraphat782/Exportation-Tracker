import Link from 'next/link';
import { ClipboardList, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const links = [
  {
    href: '/qc/requests',
    title: 'QC Requests',
    description: 'Lab work queue — New, Processing, Complete',
    icon: ClipboardList,
  },
  {
    href: '/qc/templates',
    title: 'QC Templates',
    description: 'Legacy test panels and pricing',
    icon: FlaskConical,
  },
];

export default function QcHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QC Lab</h1>
        <p className="text-slate-500">Quality control requests and test configuration</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {links.map((item) => (
          <Card key={item.href} className="hover:border-blue-200 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <item.icon className="h-5 w-5 text-blue-600" />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500">{item.description}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href={item.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
