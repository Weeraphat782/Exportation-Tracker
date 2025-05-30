'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash } from 'lucide-react';
import Link from 'next/link';

// Dummy data for example
const dummyServices = [
  { id: '1', name: 'DHL Express', vehicleType: 'Truck', pricePerKm: 20, contactNumber: '02-123-4567' },
  { id: '2', name: 'Kerry Express', vehicleType: 'Van', pricePerKm: 15, contactNumber: '02-234-5678' },
  { id: '3', name: 'Thai Post', vehicleType: 'Truck', pricePerKm: 12, contactNumber: '02-345-6789' },
  { id: '4', name: 'Ninja Van', vehicleType: 'Motorcycle', pricePerKm: 8, contactNumber: '02-456-7890' },
];

export default function DeliveryServicePage() {
  const [deliveryServices, setDeliveryServices] = useState(dummyServices);

  const handleDelete = (id: string) => {
    if (window.confirm('คุณต้องการลบบริการขนส่งนี้ใช่หรือไม่?')) {
      setDeliveryServices(deliveryServices.filter(service => service.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Services</h1>
          <p className="text-muted-foreground">
            Manage delivery service providers for your shipments.
          </p>
        </div>
        <Button asChild>
          <Link href="/settings/delivery-service/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Service
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>
            List of all available delivery service providers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Price per km (THB)</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No delivery services found. Add your first service.
                  </TableCell>
                </TableRow>
              ) : (
                deliveryServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.vehicleType}</TableCell>
                    <TableCell>{service.pricePerKm}</TableCell>
                    <TableCell>{service.contactNumber}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/settings/delivery-service/${service.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 