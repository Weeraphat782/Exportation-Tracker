'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Download, Trash, Edit, User, Link2, Copy, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateDocumentUploadLink } from '@/lib/storage';
import { getQuotations, deleteQuotation as dbDeleteQuotation } from '@/lib/db';

// In a real application, this would come from an API
// For now, we'll use some mock data
const mockQuotations = [
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
  }
];

// Modify the QuotationRow type to include status
interface QuotationRow {
  id: string;
  date: string;
  quotationNo: string;
  client: string;
  destination: string;
  status: 'sent' | string;
  createdBy?: string; // Add creator
}

export default function ShippingCalculatorPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

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
        setCurrentUser(userData.email || 'Unknown User');
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
          // ปรับแต่งข้อมูลเพื่อให้แสดงผลถูกต้อง
          const enhancedData = await Promise.all(quotationData.map(async q => {
            // ดึงข้อมูลผู้ใช้จาก Supabase ด้วย user_id
            let creatorEmail = 'Unknown';
            if (q.user_id) {
              try {
                const { data: userData } = await supabase
                  .from('profiles')
                  .select('email')
                  .eq('id', q.user_id)
                  .single();
                
                if (userData && userData.email) {
                  creatorEmail = userData.email;
                }
              } catch (error) {
                console.error('Error fetching user data:', error);
              }
            }
            
            return {
              ...q,
              date: q.created_at ? new Date(q.created_at).toLocaleDateString() : 'N/A',
              companyName: q.company_name || 'N/A',
              totalCost: q.total_cost || 0,
              createdBy: creatorEmail
            };
          }));
          
          setQuotations(enhancedData);
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
        // Fallback to mock data in case of error
        setQuotations(mockQuotations);
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

  const handleCreateNew = () => {
    // Clear any ongoing edit data
    sessionStorage.removeItem('editQuotationData');
    sessionStorage.removeItem('editingQuotationId');
    router.push('/shipping-calculator/new');
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

  const handleCopyLink = (quotation: any) => {
    try {
      const path = generateDocumentUploadLink(
        quotation.id,
        quotation.companyName || 'Unknown',
        quotation.destination || 'Unknown'
      );
      navigator.clipboard.writeText(path);
      setCopySuccess(quotation.id);
      
      setTimeout(() => {
        setCopySuccess(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell>{quotation.date || 'N/A'}</TableCell>
                      <TableCell>{quotation.id}</TableCell>
                      <TableCell>{quotation.companyName || 'N/A'}</TableCell>
                      <TableCell>{quotation.destination}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(quotation.status)}>
                          {getStatusText(quotation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(quotation.totalCost || 0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleEditQuotation(quotation.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleViewQuotation(quotation.id)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          
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