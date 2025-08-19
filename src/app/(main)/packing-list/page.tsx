'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function PackingListPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Packing List Generator</h1>
          <p className="text-muted-foreground">Generate professional packing lists for your shipments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Packing List Generator
          </CardTitle>
          <CardDescription>
            This module will help you generate detailed packing lists for export shipments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Packing List Generator</h3>
            <p className="text-sm text-gray-500 mt-1">
              This feature is coming soon. Stay tuned for updates!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
