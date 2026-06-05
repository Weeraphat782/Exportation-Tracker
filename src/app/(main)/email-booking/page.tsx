'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mail, Search, Plus, FileText, Link2, Loader2 } from 'lucide-react';
import { getQuotations, Quotation, getQuotationPayableTotalThb, generateBookingShareToken } from '@/lib/db';
import { toast } from 'sonner';

export default function EmailBookingListPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copyingId, setCopyingId] = useState<string | null>(null);

  useEffect(() => {
    const loadQuotations = async () => {
      try {
        setLoading(true);

        // Get user ID from localStorage
        const userString = localStorage.getItem('user');
        if (!userString) {
          toast.error('User not authenticated');
          return;
        }

        const userData = JSON.parse(userString);
        const quotationData = await getQuotations(userData.id);

        if (quotationData) {
          // Filter quotations that are suitable for booking (accepted status)
          const bookableQuotations = quotationData.filter(q =>
            ['accepted', 'docs_uploaded', 'completed'].includes(q.status)
          );
          setQuotations(bookableQuotations);
        }
      } catch (error) {
        console.error('Error loading quotations:', error);
        toast.error('Error loading quotations');
      } finally {
        setLoading(false);
      }
    };

    loadQuotations();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'docs_uploaded':
        return 'default';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getBookingStatusBadge = (q: Quotation) => {
    const bs = q.booking_status || 'draft';
    if (bs === 'sent') {
      return <Badge variant="secondary">Link sent</Badge>;
    }
    return <Badge variant="outline">Draft</Badge>;
  };

  const handleCopyBookingLink = async (quotation: Quotation) => {
    setCopyingId(quotation.id);
    try {
      const token =
        quotation.booking_share_token || (await generateBookingShareToken(quotation.id));
      if (!token) {
        toast.error('Could not generate link — open booking page and save details first');
        return;
      }
      const url = `${window.location.origin}/booking/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Booking link copied');
    } finally {
      setCopyingId(null);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'docs_uploaded':
        return 'Documents Uploaded';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  // Filter quotations based on search term
  const filteredQuotations = quotations.filter(quotation => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (quotation.id?.toLowerCase().includes(searchTermLower)) ||
      (quotation.company_name?.toLowerCase().includes(searchTermLower)) ||
      (quotation.destination?.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Booking</h1>
          <p className="text-muted-foreground">Prepare booking details and share Air Freight booking links</p>
        </div>
        <Button asChild>
          <Link href="/shipping-calculator">
            <Plus className="h-4 w-4 mr-2" />
            View All Quotations
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Bookable Quotations
          </CardTitle>
          <CardDescription>
            Quotations that are ready for booking (Accepted, Documents Uploaded, or Completed status)
          </CardDescription>

          {/* Search Input */}
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by ID, Company, or Destination..."
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
          ) : filteredQuotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No bookable quotations</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                {quotations.length === 0
                  ? "No quotations with accepted status found."
                  : "No quotations match your search criteria."
                }
              </p>
              <Button asChild>
                <Link href="/shipping-calculator">
                  <FileText className="h-4 w-4 mr-2" />
                  View All Quotations
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
                    <TableHead>Weight (KG)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Total Cost (incl. VAT)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell>{formatDate(quotation.created_at)}</TableCell>
                      <TableCell className="font-mono text-sm">{quotation.quotation_no || quotation.id.slice(0, 8)}</TableCell>
                      <TableCell>{quotation.company_name}</TableCell>
                      <TableCell>{quotation.destination}</TableCell>
                      <TableCell>
                        {quotation.chargeable_weight
                          ? `${quotation.chargeable_weight} KG`
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(quotation.status)}>
                          {getStatusText(quotation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getBookingStatusBadge(quotation)}</TableCell>
                      <TableCell>{formatCurrency(getQuotationPayableTotalThb(quotation))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyBookingLink(quotation)}
                            disabled={copyingId === quotation.id}
                          >
                            {copyingId === quotation.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Link2 className="h-4 w-4 mr-1" />
                            )}
                            Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/email-booking/${quotation.id}`}>
                              <Mail className="h-4 w-4 mr-1" />
                              Booking
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/shipping-calculator/preview?id=${quotation.id}`}>
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </Link>
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


