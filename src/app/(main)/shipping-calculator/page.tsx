'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Plus, FileText, Trash, Edit, User, Copy, ExternalLink, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateDocumentUploadLink } from '@/lib/storage';
import { getQuotations, deleteQuotation as dbDeleteQuotation, Quotation } from '@/lib/db';

// In a real application, this would come from an API
// For now, we'll use some mock data
const mockQuotations = [
  {
    id: 'QT-2025-0001',
    date: '2025-03-01',
    companyName: 'Company A',
    destination: 'Japan',
    totalCost: 38050,
    status: 'draft'
  },
  {
    id: 'QT-2025-0002',
    date: '2025-03-03',
    companyName: 'Company B',
    destination: 'China',
    totalCost: 25750,
    status: 'sent'
  },
  {
    id: 'QT-2025-0003',
    date: '2025-03-05',
    companyName: 'Company C',
    destination: 'South Korea',
    totalCost: 42300,
    status: 'accepted'
  },
  {
    id: 'QT-2025-0004',
    date: '2025-03-10',
    companyName: 'Company D',
    destination: 'Hong Kong',
    totalCost: 31200,
    status: 'draft'
  },
];

export default function ShippingCalculatorPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // First useEffect - only for auth checking
  useEffect(() => {
    console.log("ShippingCalculator: Checking authentication");
    
    // Simple check for user data in localStorage
    function checkLocalAuth() {
      try {
        // First check our local user object
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user && user.isAuthenticated) {
            console.log("ShippingCalculator: Local auth found for", user.email);
            setAuthChecked(true);
            return true;
          }
        }
        
        // Also check our auth_session
        const authSession = localStorage.getItem('auth_session');
        if (authSession) {
          const session = JSON.parse(authSession);
          if (session && session.email) {
            console.log("ShippingCalculator: Auth session found for", session.email);
            setAuthChecked(true);
            return true;
          }
        }
        
        return false;
      } catch (err) {
        console.error("ShippingCalculator: Error checking local auth", err);
        return false;
      }
    }
    
    // Check Supabase session as a fallback
    async function checkSupabaseAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data && data.session) {
          console.log("ShippingCalculator: Supabase session found for", data.session.user.email);
          
          // Save to localStorage for future checks
          localStorage.setItem('user', JSON.stringify({
            email: data.session.user.email,
            id: data.session.user.id,
            isAuthenticated: true
          }));
          
          setAuthChecked(true);
          return true;
        }
        return false;
      } catch (err) {
        console.error("ShippingCalculator: Error checking Supabase auth", err);
        return false;
      }
    }
    
    // First try local auth (faster)
    if (checkLocalAuth()) {
      console.log("ShippingCalculator: User is authenticated via local storage");
      return;
    }
    
    // If local auth fails, try Supabase
    checkSupabaseAuth().then(isAuthenticated => {
      if (!isAuthenticated) {
        console.log("ShippingCalculator: No authentication found, redirecting to login");
        window.location.href = '/login';
      }
    });
  }, []);

  // Load quotations from Supabase after auth is confirmed
  useEffect(() => {
    // Only load data after authentication is confirmed
    if (!authChecked) return;
    
    console.log("ShippingCalculator: Loading quotation data from Supabase");
    
    // Get user data from localStorage
    let userId = '';
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        userId = userData.id;
      }
    } catch (error) {
      console.error('Error getting user information:', error);
    }
    
    if (!userId) {
      console.error('User ID not found, cannot load quotations');
      setLoading(false);
      return;
    }
    
    // Load from Supabase
    async function loadQuotationsFromDB() {
      try {
        const quotationData = await getQuotations(userId);
        if (quotationData) {
          setQuotations(quotationData);
        } else {
          // Fallback to localStorage if database fetch fails
          const savedQuotations = localStorage.getItem('quotations');
          if (savedQuotations) {
            const parsedQuotations = JSON.parse(savedQuotations);
            setQuotations(parsedQuotations);
          } else {
            setQuotations([]);
          }
        }
      } catch (error) {
        console.error('Error loading quotations from database:', error);
        // Removed fallback to mockQuotations as its structure is incorrect
        setQuotations([]); 
      } finally {
        setLoading(false);
      }
    }
    
    loadQuotationsFromDB();
  }, [authChecked]);

  // Format number as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle different date formats
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString; // Return original string if parsing fails
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'draft':
        return 'warning';
      case 'sent':
        return 'success';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'draft':
        return 'Draft';
      case 'sent':
        return 'Submitted';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    // ขอการยืนยันก่อนลบ
    const isConfirmed = window.confirm(`คุณต้องการลบใบเสนอราคา ${id} ใช่หรือไม่?`);
    
    if (!isConfirmed) {
      return; // ยกเลิกการลบถ้าไม่ยืนยัน
    }
    
    // Remove quotation from UI immediately for responsive feel
    setQuotations(quotations.filter(q => q.id !== id));
    
    // Delete from Supabase
    try {
      const success = await dbDeleteQuotation(id);
      
      if (!success) {
        console.error('Failed to delete quotation from database');
        // Restore UI if database delete fails
        const savedQuotations = localStorage.getItem('quotations');
        if (savedQuotations) {
          const parsedQuotations = JSON.parse(savedQuotations);
          setQuotations(parsedQuotations);
        }
      } else {
        console.log('Quotation deleted successfully from database');
        
        // Also remove from localStorage for sync
        try {
          const savedQuotations = localStorage.getItem('quotations');
          if (savedQuotations) {
            const parsedQuotations = JSON.parse(savedQuotations);
            const updatedQuotations = parsedQuotations.filter((q: any) => q.id !== id);
            localStorage.setItem('quotations', JSON.stringify(updatedQuotations));
          }
        } catch (error) {
          console.error('Error removing quotation from localStorage:', error);
        }
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
    }
  };

  const handleViewQuotation = (id: string) => {
    // Find quotation in our list
    const quotation = quotations.find(q => q.id === id);
    if (quotation) {
      // Set the quotation data in sessionStorage for the preview page
      sessionStorage.setItem('quotationData', JSON.stringify(quotation));
      router.push(`/shipping-calculator/preview?id=${id}`);
    }
  };

  const handleEditQuotation = (id: string) => {
    // Find quotation in our list
    const quotation = quotations.find(q => q.id === id);
    if (quotation) {
      // Set the quotation data in sessionStorage for edit page
      sessionStorage.setItem('editQuotationData', JSON.stringify(quotation));
      router.push(`/shipping-calculator/new?edit=${id}`);
    }
  };

  const handleCopyLink = (quotation: Quotation) => {
    // สร้างลิงก์อัปโหลดเอกสารโดยใช้ฟังก์ชันจาก storage.ts
    const uploadUrl = generateDocumentUploadLink(
      quotation.id,
      quotation.company_name || 'Unknown Company',
      quotation.destination || 'Unknown Destination'
    );
    
    // คัดลอกลิงก์
    navigator.clipboard.writeText(uploadUrl)
      .then(() => {
        // Show alert instead of toast
        alert(`Document upload link for ${quotation.id} copied successfully.`);
        
        // เก็บบันทึกว่าเพิ่งคัดลอกลิงก์ quotation ใด
        setCopySuccess(quotation.id);
        
        // ล้างสถานะการคัดลอกหลังจาก 3 วินาที
        setTimeout(() => {
          setCopySuccess(null);
        }, 3000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        alert("Failed to copy link to clipboard");
      });
  };

  // Filter quotations based on search term (use fields available in the data)
  const filteredQuotations = quotations.filter(quotation => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (quotation.id?.toLowerCase().includes(searchTermLower)) ||
      (quotation.company_name?.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shipping Calculator</h1>
        <Button asChild>
          <Link href="/shipping-calculator/new">
            <Plus className="h-4 w-4 mr-2" />
            New Calculation
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Quotations</CardTitle>
          <CardDescription>View and manage your recent shipping quotations</CardDescription>
          {/* Add Search Input Here */}
          <div className="relative mt-4">
             {/* Add Search Icon back */}
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /> 
             <Input 
                type="search"
                placeholder="Search by ID or Company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full md:w-1/3"
              />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse">Loading quotations...</div>
            </div>
          ) : quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No quotations yet</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Create your first shipping calculation to generate a quotation.
              </p>
              <Button asChild>
                <Link href="/shipping-calculator/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Calculation
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell>{formatDate(quotation.created_at)}</TableCell>
                      <TableCell>{quotation.id}</TableCell>
                      <TableCell>{quotation.company_name}</TableCell>
                      <TableCell>{quotation.destination}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(quotation.status)}>
                          {getStatusText(quotation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(quotation.total_cost)}</TableCell>
                      <TableCell className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        {quotation.user_id || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {quotation.status === 'sent' && (
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleEditQuotation(quotation.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleViewQuotation(quotation.id)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          
                          {/* Copy link button - visible for sent and accepted quotations */}
                          {(quotation.status === 'sent' || quotation.status === 'accepted') && (
                            <Button
                              variant="outline" 
                              size="icon"
                              onClick={() => handleCopyLink(quotation)}
                              title="Copy document upload link for customer"
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            >
                              {copySuccess === quotation.id ? (
                                <Copy className="h-4 w-4" />
                              ) : (
                                <ExternalLink className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteQuotation(quotation.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 