'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Plus, Minus, Download, Eye, BarChart3, ChevronLeft, ChevronRight, Check, Save, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { generatePackingListPDF } from '@/lib/packing-list-pdf';
import { generateSankeyChart } from '@/lib/sankey-chart';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ProductItem {
  id: string;
  productCode: string;
  description: string;
  batch: string;
  quantity: number; // จำนวนกล่องของ product นี้ใน pallet
  weightPerBox: number; // น้ำหนักต่อกล่อง (กรัม)
  totalGrossWeight: number; // น้ำหนักรวม gross สำหรับ product นี้ (กรัม)
  hasMixedProducts: boolean; // มีสินค้า 2 อย่างในกล่องเดียวกันหรือไม่
  secondProduct?: {
    productCode: string;
    description: string;
    batch: string;
    weightPerBox: number; // น้ำหนักของสินค้าที่ 2 ต่อกล่อง (กรัม)
    totalGrossWeight: number; // น้ำหนักรวม gross สำหรับสินค้าที่ 2 (กรัม)
  };
}

interface PalletItem {
  id: string;
  boxNumberFrom: number;
  boxNumberTo: number;
  products: ProductItem[]; // เปลี่ยนจาก single product เป็น array of products
}

interface PackingListData {
  id?: string;
  packing_list_no?: string;
  // Header Information
  consignee: string;
  consigneeAddress: string;
  consigneePhone: string;
  consigneeEmail: string;
  consigneeContract: string;
  consigner: string;
  consignerAddress: string;
  consignerPhone: string;
  consignerEmail: string;
  consignerContract: string;
  shippedTo: string;
  shippedToAddress: string;
  shippedToPhone: string;
  shippedToEmail: string;
  shippedToContract: string;
  customerOpNo: string;
  typeOfShipment: string;
  portLoading: string;
  portDestination: string;
  
  // Pallets and Items
  pallets: PalletItem[];
  
  // Footer Information
  totalGrossWeight: number;
  boxSize: string;
  shippingMark: string;
  airport: string;
  destination: string;
  countryOfOrigin: string;
  status?: 'draft' | 'completed' | 'archived';
  notes?: string;
}

const WIZARD_STEPS = [
  { id: 1, title: 'Consigner Information', description: 'Consigner details and shipping information' },
  { id: 2, title: 'Consignee & Shipped To', description: 'Consignee and Shipped To information' },
  { id: 3, title: 'Pallet & Box Details', description: 'Configure pallets and their contents' },
  { id: 4, title: 'Summary & Export', description: 'Review data and generate documents' }
];

export default function PackingListPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [packingData, setPackingData] = useState<PackingListData>({
    consignee: '',
    consigneeAddress: '',
    consigneePhone: '',
    consigneeEmail: '',
    consigneeContract: '',
    consigner: '',
    consignerAddress: '',
    consignerPhone: '',
    consignerEmail: '',
    consignerContract: '',
    shippedTo: '',
    shippedToAddress: '',
    shippedToPhone: '',
    shippedToEmail: '',
    shippedToContract: '',
    customerOpNo: '',
    typeOfShipment: '',
    portLoading: '',
    portDestination: '',
    pallets: [],
    totalGrossWeight: 0,
    boxSize: '',
    shippingMark: '',
    airport: '',
    destination: '',
    countryOfOrigin: 'Thailand',
    status: 'draft'
  });

  // State สำหรับ Save/Load functionality
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  interface SavedPackingListRow {
    id: string;
    packing_list_no: string;
    consigner: string;
    consignee: string;
    port_loading?: string;
    port_destination?: string;
    status: 'draft' | 'completed' | 'archived';
    created_at: string;
  }
  const [savedPackingLists, setSavedPackingLists] = useState<SavedPackingListRow[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  // Calculate totals
  const calculateTotals = () => {
    let totalBoxes = 0;
    let totalNetWeight = 0;
    
    packingData.pallets.forEach(pallet => {
      const boxes = (pallet.boxNumberTo - pallet.boxNumberFrom) + 1;
      totalBoxes += boxes;
      
      // คำนวณน้ำหนักรวมของ products ใน pallet นี้ (รวม mixed products)
      const palletNetWeight = pallet.products.reduce((sum, product) => {
        let productNet = product.quantity * product.weightPerBox;
        // เพิ่มน้ำหนักของสินค้าที่ 2 ถ้ามี mixed products
        if (product.hasMixedProducts && product.secondProduct) {
          productNet += product.quantity * product.secondProduct.weightPerBox;
        }
        return sum + productNet;
      }, 0);
      
      totalNetWeight += palletNetWeight;
    });
    
    return {
      totalPallets: packingData.pallets.length,
      totalBoxes,
      totalNetWeight,
      totalGrossWeightIncludingPallets: packingData.totalGrossWeight
    };
  };

  const totals = calculateTotals();

  // ฟังก์ชันสำหรับ Save Packing List
  const savePackingList = async () => {
    if (!packingData.consignee || !packingData.consigner) {
      toast.error('กรุณากรอกข้อมูล Consignee และ Consigner');
      return;
    }

    setIsSaving(true);
    try {
      // Attach Supabase access token so API can authenticate via Authorization header
      const { data: sessionData } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const response = await fetch('/api/packing-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify(packingData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`บันทึกสำเร็จ! เลขที่: ${result.data.packing_list_no}`);
        setPackingData(prev => ({
          ...prev,
          id: result.data.id,
          packing_list_no: result.data.packing_list_no
        }));
      } else {
        toast.error('เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Error saving packing list:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  // ฟังก์ชันสำหรับโหลดรายการ Packing Lists
  const loadPackingLists = async () => {
    setIsLoadingLists(true);
    try {
      const { data: sessionData } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const response = await fetch('/api/packing-lists', {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
      });
      const result = await response.json();

      if (result.success) {
        setSavedPackingLists(result.data);
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดรายการ');
      }
    } catch (error) {
      console.error('Error loading packing lists:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดรายการ');
    } finally {
      setIsLoadingLists(false);
    }
  };

  // ฟังก์ชันสำหรับโหลด Packing List ที่เลือก
  const loadPackingList = async (id: string) => {
    try {
      const { data: sessionData } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const response = await fetch(`/api/packing-lists/${id}`, {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
      });
      const result = await response.json();

      if (result.success) {
        setPackingData(result.data);
        setIsLoadDialogOpen(false);
        toast.success('โหลดข้อมูลสำเร็จ!');
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Error loading packing list:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  // เปิด Load Dialog และโหลดรายการ
  const openLoadDialog = () => {
    setIsLoadDialogOpen(true);
    loadPackingLists();
  };

  const addPallet = () => {
    const newPallet: PalletItem = {
      id: Date.now().toString(),
      boxNumberFrom: 0,
      boxNumberTo: 0,
      products: [
        {
          id: Date.now().toString() + '_product_1',
          productCode: '',
          description: '',
          batch: '',
          quantity: 0,
          weightPerBox: 0,
          totalGrossWeight: 0,
          hasMixedProducts: false
        }
      ]
    };
    
    setPackingData(prev => ({
      ...prev,
      pallets: [...prev.pallets, newPallet]
    }));
  };

  const removePallet = (id: string) => {
    if (packingData.pallets.length > 1) {
      setPackingData(prev => ({
        ...prev,
        pallets: prev.pallets.filter(p => p.id !== id)
      }));
    }
  };

  const updatePallet = (id: string, field: keyof PalletItem, value: string | number) => {
    setPackingData(prev => ({
      ...prev,
      pallets: prev.pallets.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const addProduct = (palletId: string) => {
    const newProduct: ProductItem = {
      id: Date.now().toString() + '_product',
      productCode: '',
      description: '',
      batch: '',
      quantity: 0,
      weightPerBox: 0,
      totalGrossWeight: 0,
      hasMixedProducts: false
    };

    setPackingData(prev => ({
      ...prev,
      pallets: prev.pallets.map(pallet =>
        pallet.id === palletId
          ? { ...pallet, products: [...pallet.products, newProduct] }
          : pallet
      )
    }));
  };

  const removeProduct = (palletId: string, productId: string) => {
    setPackingData(prev => ({
      ...prev,
      pallets: prev.pallets.map(pallet =>
        pallet.id === palletId
          ? { ...pallet, products: pallet.products.filter(product => product.id !== productId) }
          : pallet
      )
    }));
  };

  const updateProduct = (palletId: string, productId: string, field: keyof ProductItem, value: string | number | boolean) => {
    setPackingData(prev => ({
      ...prev,
      pallets: prev.pallets.map(pallet =>
        pallet.id === palletId
          ? {
              ...pallet,
              products: pallet.products.map(product =>
                product.id === productId
                  ? { ...product, [field]: value }
                  : product
              )
            }
          : pallet
      )
    }));
  };

  const toggleMixedProducts = (palletId: string, productId: string, checked: boolean) => {
    setPackingData(prev => ({
      ...prev,
      pallets: prev.pallets.map(pallet =>
        pallet.id === palletId
          ? {
              ...pallet,
              products: pallet.products.map(product =>
                product.id === productId
                  ? { 
                      ...product, 
                      hasMixedProducts: checked,
                      secondProduct: checked ? {
                        productCode: '',
                        description: '',
                        batch: '',
                        weightPerBox: 12750, // default half weight
                        totalGrossWeight: 127500 // default gross weight for second product
                      } : undefined
                    }
                  : product
              )
            }
          : pallet
      )
    }));
  };

  const updateSecondProduct = (palletId: string, productId: string, field: keyof NonNullable<ProductItem['secondProduct']>, value: string | number) => {
    setPackingData(prev => ({
      ...prev,
      pallets: prev.pallets.map(pallet =>
        pallet.id === palletId
          ? {
              ...pallet,
              products: pallet.products.map(product =>
                product.id === productId && product.secondProduct
                  ? { 
                      ...product, 
                      secondProduct: {
                        ...product.secondProduct,
                        [field]: value
                      }
                    }
                  : product
              )
            }
          : pallet
      )
    }));
  };

  const updateHeader = (field: keyof PackingListData, value: string | number) => {
    setPackingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePDF = () => {
    const totals = calculateTotals();
    generatePackingListPDF(packingData, totals);
  };

  const generateSankey = () => {
    // Check if we have enough data
    if (packingData.pallets.length === 0) {
      toast.error('Please add at least one pallet to generate Sankey chart');
      return;
    }

    // Check if pallets have required product data
    const hasData = packingData.pallets.some(pallet => 
      pallet.products.some(product => 
        product.productCode || product.description || product.batch
      )
    );

    if (!hasData) {
      toast.error('Please fill in Product Code, Description, or Batch information for products in pallets');
      return;
    }

    // Validate product quantities
    const invalidQuantities = packingData.pallets.some(pallet =>
      pallet.products.some(product => product.quantity <= 0)
    );

    if (invalidQuantities) {
      toast.error('All product quantities must be greater than 0');
      return;
    }

    generateSankeyChart(packingData);
    toast.success('Sankey chart opened in new window!');
  };

  const previewData = () => {
    console.log('Packing List Data:', packingData);
    console.log('Calculated Totals:', totals);
    toast.success('Data logged to console');
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const isStepCompleted = (step: number) => {
    switch (step) {
      case 1:
        return packingData.consigner.trim() !== '' && 
               packingData.customerOpNo.trim() !== '' && 
               packingData.typeOfShipment.trim() !== '' && 
               packingData.portLoading.trim() !== '' && 
               packingData.portDestination.trim() !== '';
      case 2:
        return packingData.consignee.trim() !== '' && 
               packingData.shippedTo.trim() !== '';
      case 3:
        return packingData.pallets.length > 0 && packingData.pallets.every(pallet => 
          pallet.boxNumberFrom > 0 && 
          pallet.boxNumberTo >= pallet.boxNumberFrom && 
          pallet.products.length > 0 &&
          pallet.products.every(product => 
            product.quantity > 0 && 
            product.weightPerBox > 0 &&
            (product.productCode.trim() !== '' || product.description.trim() !== '' || product.batch.trim() !== '')
          )
        );
      case 4:
        // Step 4 is completed only when user has filled in additional info
        return packingData.boxSize.trim() !== '' || 
               packingData.airport.trim() !== '' || 
               packingData.destination.trim() !== '' || 
               packingData.totalGrossWeight > 0;
      default:
        return false;
    }
  };

  const canProceedToNext = () => {
    return true; // Allow users to proceed to next step without validation
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = isStepCompleted(step.id);
          const canAccess = true; // Allow access to all steps
          
          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => canAccess ? goToStep(step.id) : null}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${isActive 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : isCompleted 
                      ? 'border-green-600 bg-green-600 text-white cursor-pointer hover:bg-green-700' 
                      : canAccess
                        ? 'border-gray-300 bg-white text-gray-600 cursor-pointer hover:border-blue-400'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
                disabled={!canAccess}
              >
                {isCompleted && !isActive ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </button>
              
              {index < WIZARD_STEPS.length - 1 && (
                <div className={`
                  w-16 h-0.5 mx-2
                  ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-center">
        <h2 className="text-2xl font-bold">{WIZARD_STEPS[currentStep - 1].title}</h2>
        <p className="text-muted-foreground">{WIZARD_STEPS[currentStep - 1].description}</p>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderConsignerInformation();
      case 2:
        return renderConsigneeShippedToInformation();
      case 3:
        return renderPalletDetails();
      case 4:
        return renderSummaryAndExport();
      default:
        return null;
    }
  };

  const renderConsignerInformation = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Consigner Information</CardTitle>
          <CardDescription>Details of the sender</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Consigner Section */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consigner">Company Name</Label>
                <Input
                  id="consigner"
                  value={packingData.consigner}
                  onChange={(e) => updateHeader('consigner', e.target.value)}
                  placeholder="Enter consigner company name"
                />
              </div>
              
              <div>
                <Label htmlFor="consignerPhone">Phone Number</Label>
                <Input
                  id="consignerPhone"
                  value={packingData.consignerPhone}
                  onChange={(e) => updateHeader('consignerPhone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="consignerAddress">Address</Label>
                <Textarea
                  id="consignerAddress"
                  value={packingData.consignerAddress}
                  onChange={(e) => updateHeader('consignerAddress', e.target.value)}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="consignerEmail">Email</Label>
                <Input
                  id="consignerEmail"
                  type="email"
                  value={packingData.consignerEmail}
                  onChange={(e) => updateHeader('consignerEmail', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="consignerContract">Contract</Label>
                <Input
                  id="consignerContract"
                  value={packingData.consignerContract}
                  onChange={(e) => updateHeader('consignerContract', e.target.value)}
                  placeholder="Enter contract number"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
          <CardDescription>Customer operation details and port information</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerOpNo">Customer PO No</Label>
            <Input
              id="customerOpNo"
              value={packingData.customerOpNo}
              onChange={(e) => updateHeader('customerOpNo', e.target.value)}
              placeholder="Enter customer operation number"
            />
          </div>
          
          <div>
            <Label htmlFor="typeOfShipment">Type of Shipment</Label>
            <Input
              id="typeOfShipment"
              value={packingData.typeOfShipment}
              onChange={(e) => updateHeader('typeOfShipment', e.target.value)}
              placeholder="e.g., Air Freight, Sea Freight"
            />
          </div>
          
          <div>
            <Label htmlFor="portLoading">Port of Loading</Label>
            <Input
              id="portLoading"
              value={packingData.portLoading}
              onChange={(e) => updateHeader('portLoading', e.target.value)}
              placeholder="Enter port of loading"
            />
          </div>
          
          <div>
            <Label htmlFor="portDestination">Port of Destination</Label>
            <Input
              id="portDestination"
              value={packingData.portDestination}
              onChange={(e) => updateHeader('portDestination', e.target.value)}
              placeholder="Enter port of destination"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderConsigneeShippedToInformation = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Consignee Information</CardTitle>
          <CardDescription>Details of the recipient</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Consignee Section */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consignee">Company Name</Label>
                <Input
                  id="consignee"
                  value={packingData.consignee}
                  onChange={(e) => updateHeader('consignee', e.target.value)}
                  placeholder="Enter consignee company name"
                />
              </div>
              
              <div>
                <Label htmlFor="consigneePhone">Phone Number</Label>
                <Input
                  id="consigneePhone"
                  value={packingData.consigneePhone}
                  onChange={(e) => updateHeader('consigneePhone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="consigneeAddress">Address</Label>
                <Textarea
                  id="consigneeAddress"
                  value={packingData.consigneeAddress}
                  onChange={(e) => updateHeader('consigneeAddress', e.target.value)}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="consigneeEmail">Email</Label>
                <Input
                  id="consigneeEmail"
                  type="email"
                  value={packingData.consigneeEmail}
                  onChange={(e) => updateHeader('consigneeEmail', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="consigneeContract">Contract</Label>
                <Input
                  id="consigneeContract"
                  value={packingData.consigneeContract}
                  onChange={(e) => updateHeader('consigneeContract', e.target.value)}
                  placeholder="Enter contract number"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipped To Information</CardTitle>
          <CardDescription>Shipping destination details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shipped To Section */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippedTo">Company Name</Label>
                <Input
                  id="shippedTo"
                  value={packingData.shippedTo}
                  onChange={(e) => updateHeader('shippedTo', e.target.value)}
                  placeholder="Enter shipped to company name"
                />
              </div>
              
              <div>
                <Label htmlFor="shippedToPhone">Phone Number</Label>
                <Input
                  id="shippedToPhone"
                  value={packingData.shippedToPhone}
                  onChange={(e) => updateHeader('shippedToPhone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="shippedToAddress">Address</Label>
                <Textarea
                  id="shippedToAddress"
                  value={packingData.shippedToAddress}
                  onChange={(e) => updateHeader('shippedToAddress', e.target.value)}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="shippedToEmail">Email</Label>
                <Input
                  id="shippedToEmail"
                  type="email"
                  value={packingData.shippedToEmail}
                  onChange={(e) => updateHeader('shippedToEmail', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="shippedToContract">Contract</Label>
                <Input
                  id="shippedToContract"
                  value={packingData.shippedToContract}
                  onChange={(e) => updateHeader('shippedToContract', e.target.value)}
                  placeholder="Enter contract number"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPalletDetails = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Pallets & Items</CardTitle>
            <CardDescription>Configure pallets and their contents</CardDescription>
          </div>
          <Button onClick={addPallet} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Pallet
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {packingData.pallets.map((pallet, index) => {
          const boxes = (pallet.boxNumberTo - pallet.boxNumberFrom) + 1;
          
          return (
            <div key={pallet.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Pallet {index + 1}</h3>
                {packingData.pallets.length > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removePallet(pallet.id)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label>Box No. From</Label>
                  <Input
                    type="number"
                    value={pallet.boxNumberFrom}
                    onChange={(e) => updatePallet(pallet.id, 'boxNumberFrom', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label>Box No. To</Label>
                  <Input
                    type="number"
                    value={pallet.boxNumberTo}
                    onChange={(e) => updatePallet(pallet.id, 'boxNumberTo', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Products Section */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-medium">Products in this Pallet</Label>
                  <Button 
                    onClick={() => addProduct(pallet.id)} 
                    size="sm" 
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Product
                  </Button>
                </div>

                {pallet.products.map((product, productIndex) => (
                  <div key={product.id} className="border rounded-lg p-3 mb-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Product {productIndex + 1}</span>
                      {pallet.products.length > 1 && (
                        <Button 
                          onClick={() => removeProduct(pallet.id, product.id)} 
                          size="sm" 
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <Label>Product Code</Label>
                        <Input
                          value={product.productCode}
                          onChange={(e) => updateProduct(pallet.id, product.id, 'productCode', e.target.value)}
                          placeholder="Enter product code"
                        />
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={product.description}
                          onChange={(e) => updateProduct(pallet.id, product.id, 'description', e.target.value)}
                          placeholder="Product description"
                        />
                      </div>
                      
                      <div>
                        <Label>Batch</Label>
                        <Input
                          value={product.batch}
                          onChange={(e) => updateProduct(pallet.id, product.id, 'batch', e.target.value)}
                          placeholder="Batch number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Quantity (boxes)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => updateProduct(pallet.id, product.id, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Number of boxes"
                        />
                      </div>

                      <div>
                        <Label>Net Weight/Box (g)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={product.weightPerBox}
                          onChange={(e) => updateProduct(pallet.id, product.id, 'weightPerBox', parseFloat(e.target.value) || 0)}
                          placeholder="Net weight per box"
                        />
                      </div>

                      <div>
                        <Label>Total Gross Weight (g)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={product.totalGrossWeight}
                          onChange={(e) => updateProduct(pallet.id, product.id, 'totalGrossWeight', parseFloat(e.target.value) || 0)}
                          placeholder="Total gross weight for this product"
                        />
                      </div>
                    </div>

                    {/* Mixed Products Checkbox */}
                    <div className="flex items-center space-x-2 mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <Checkbox
                        id={`mixed-${product.id}`}
                        checked={product.hasMixedProducts}
                        onCheckedChange={(checked) => toggleMixedProducts(pallet.id, product.id, checked as boolean)}
                      />
                      <Label htmlFor={`mixed-${product.id}`} className="text-sm font-medium text-yellow-800">
                        This box contains 2 different products (Mixed Products)
                      </Label>
                    </div>

                    {/* Second Product Fields */}
                    {product.hasMixedProducts && product.secondProduct && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <Label className="text-sm font-medium text-blue-800 mb-2 block">Second Product in Same Box</Label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <Label>Product Code (2nd)</Label>
                            <Input
                              value={product.secondProduct.productCode}
                              onChange={(e) => updateSecondProduct(pallet.id, product.id, 'productCode', e.target.value)}
                              placeholder="Second product code"
                            />
                          </div>
                          
                          <div>
                            <Label>Description (2nd)</Label>
                            <Input
                              value={product.secondProduct.description}
                              onChange={(e) => updateSecondProduct(pallet.id, product.id, 'description', e.target.value)}
                              placeholder="Second product description"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label>Batch (2nd)</Label>
                            <Input
                              value={product.secondProduct.batch}
                              onChange={(e) => updateSecondProduct(pallet.id, product.id, 'batch', e.target.value)}
                              placeholder="Second product batch"
                            />
                          </div>

                          <div>
                            <Label>Net Weight/Box (2nd) (g)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={product.secondProduct.weightPerBox}
                              onChange={(e) => updateSecondProduct(pallet.id, product.id, 'weightPerBox', parseFloat(e.target.value) || 0)}
                              placeholder="Net weight of second product per box"
                            />
                          </div>

                          <div>
                            <Label>Total Gross Weight (2nd) (g)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={product.secondProduct.totalGrossWeight}
                              onChange={(e) => updateSecondProduct(pallet.id, product.id, 'totalGrossWeight', parseFloat(e.target.value) || 0)}
                              placeholder="Total gross weight for second product"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="bg-muted p-3 rounded">
                <p className="text-sm">
                  <strong>Boxes:</strong> {boxes} | 
                  <strong> Net Weight:</strong> {(pallet.products.reduce((sum, product) => {
                    let productNet = product.quantity * product.weightPerBox;
                    if (product.hasMixedProducts && product.secondProduct) {
                      productNet += product.quantity * product.secondProduct.weightPerBox;
                    }
                    return sum + productNet;
                  }, 0)).toFixed(1)} g |
                  <strong> Gross Weight:</strong> {(pallet.products.reduce((sum, product) => {
                    let productGross = product.totalGrossWeight;
                    if (product.hasMixedProducts && product.secondProduct) {
                      productGross += product.secondProduct.totalGrossWeight;
                    }
                    return sum + productGross;
                  }, 0)).toFixed(1)} g |
                  <strong> Range:</strong> {pallet.boxNumberFrom}-{pallet.boxNumberTo}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  const renderSummaryAndExport = () => (
    <div className="space-y-6">
      {/* Footer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Final shipping details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalGrossWeight">Total Gross Weight (Pallet Include) (g)</Label>
            <Input
              id="totalGrossWeight"
              type="number"
              step="0.1"
              value={packingData.totalGrossWeight}
              onChange={(e) => updateHeader('totalGrossWeight', parseFloat(e.target.value) || 0)}
              placeholder="Enter total gross weight including pallets in grams"
            />
          </div>

          <div>
            <Label htmlFor="boxSize">Box Size</Label>
            <Input
              id="boxSize"
              value={packingData.boxSize}
              onChange={(e) => updateHeader('boxSize', e.target.value)}
              placeholder="e.g., 1-50"
            />
          </div>
          
          <div>
            <Label htmlFor="shippingMark">Shipping Mark</Label>
            <Input
              id="shippingMark"
              value={packingData.shippingMark}
              onChange={(e) => updateHeader('shippingMark', e.target.value)}
              placeholder="Enter shipping mark"
            />
          </div>
          
          <div>
            <Label htmlFor="airport">Airport</Label>
            <Input
              id="airport"
              value={packingData.airport}
              onChange={(e) => updateHeader('airport', e.target.value)}
              placeholder="e.g., BKK"
            />
          </div>
          
          <div>
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              value={packingData.destination}
              onChange={(e) => updateHeader('destination', e.target.value)}
              placeholder="e.g., Munich, Germany"
            />
          </div>
          
          <div>
            <Label htmlFor="countryOfOrigin">Country of Origin</Label>
            <Input
              id="countryOfOrigin"
              value={packingData.countryOfOrigin}
              onChange={(e) => updateHeader('countryOfOrigin', e.target.value)}
              placeholder="e.g., Thailand"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totals.totalPallets}</div>
              <div className="text-sm text-blue-600">Total Pallets</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totals.totalBoxes}</div>
              <div className="text-sm text-green-600">Total Boxes</div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{totals.totalNetWeight.toFixed(1)}</div>
              <div className="text-sm text-orange-600">Net Weight (g)</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{packingData.totalGrossWeight}</div>
              <div className="text-sm text-purple-600">Gross Weight (g)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button onClick={generateSankey} size="lg" variant="outline" className="px-8">
          <BarChart3 className="h-5 w-5 mr-2" />
          Generate Sankey Chart
        </Button>
        <Button onClick={generatePDF} size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
          <Download className="h-5 w-5 mr-2" />
          Export PDF
        </Button>
        <Button variant="outline" onClick={previewData} size="lg" className="px-8">
          <Eye className="h-4 w-4 mr-2" />
          Preview Data
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Packing List Generator</h1>
          <p className="text-muted-foreground">
            Generate professional packing lists for your shipments
            {packingData.packing_list_no && (
              <span className="ml-2 text-sm font-medium text-blue-600">
                ({packingData.packing_list_no})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openLoadDialog} className="flex items-center">
            <FolderOpen className="h-4 w-4 mr-2" />
            Load
          </Button>
          <Button 
            onClick={savePackingList} 
            disabled={isSaving}
            className="flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {WIZARD_STEPS.length}
        </div>
        
        <Button 
          onClick={nextStep}
          disabled={currentStep === WIZARD_STEPS.length || !canProceedToNext()}
          className="flex items-center"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Load Dialog */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Load Packing List</DialogTitle>
            <DialogDescription>
              Select a saved packing list to load
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingLists ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : savedPackingLists.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">No saved packing lists found</div>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPackingLists.map((list) => (
                <div 
                  key={list.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => loadPackingList(list.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{list.packing_list_no}</h3>
                      <p className="text-sm text-muted-foreground">
                        {list.consigner} → {list.consignee}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {list.port_loading} → {list.port_destination}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {list.status === 'draft' ? 'Draft' : 
                         list.status === 'completed' ? 'Completed' : 'Archived'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(list.created_at).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}