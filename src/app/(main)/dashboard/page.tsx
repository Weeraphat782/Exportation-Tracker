'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, Package, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿123,456</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32</div>
                <p className="text-xs text-muted-foreground">+2 new this month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">128</div>
                <p className="text-xs text-muted-foreground">+6% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12.5%</div>
                <p className="text-xs text-muted-foreground">+3% from last month</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>Monthly shipping volume and revenue</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-80 flex items-center justify-center bg-slate-50 rounded-md">
                  <p className="text-sm text-muted-foreground">Monthly data visualization will appear here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Destinations</CardTitle>
                <CardDescription>By shipment volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="font-medium">Japan</div>
                      <div className="ml-auto">32%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '32%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="font-medium">China</div>
                      <div className="ml-auto">28%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '28%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="font-medium">South Korea</div>
                      <div className="ml-auto">20%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '20%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="font-medium">Hong Kong</div>
                      <div className="ml-auto">12%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '12%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="font-medium">Other</div>
                      <div className="ml-auto">8%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '8%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Recent Quotations</CardTitle>
                <CardDescription>Latest quotation requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Company A - Japan</p>
                      <p className="text-sm text-muted-foreground">2 days ago</p>
                    </div>
                    <div className="ml-auto font-medium">฿38,050</div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Company B - China</p>
                      <p className="text-sm text-muted-foreground">3 days ago</p>
                    </div>
                    <div className="ml-auto font-medium">฿25,750</div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Company C - South Korea</p>
                      <p className="text-sm text-muted-foreground">5 days ago</p>
                    </div>
                    <div className="ml-auto font-medium">฿42,300</div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Company D - Hong Kong</p>
                      <p className="text-sm text-muted-foreground">1 week ago</p>
                    </div>
                    <div className="ml-auto font-medium">฿31,200</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="flex items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">New quotation created</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">New company added</p>
                      <p className="text-xs text-muted-foreground">Yesterday</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Freight rates updated</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">New destination added</p>
                      <p className="text-xs text-muted-foreground">1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="h-[400px] flex items-center justify-center bg-slate-50 rounded-md">
          <p className="text-muted-foreground">Analytics content will be available in the next update</p>
        </TabsContent>
        
        <TabsContent value="reports" className="h-[400px] flex items-center justify-center bg-slate-50 rounded-md">
          <p className="text-muted-foreground">Reports functionality will be available in the next update</p>
        </TabsContent>
      </Tabs>
    </div>
  );
} 