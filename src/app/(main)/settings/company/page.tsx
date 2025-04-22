'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCompanies, deleteCompany as dbDeleteCompany, Company as CompanyType } from '@/lib/db';

export default function CompanySettingsPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load companies from Database
  useEffect(() => {
    async function loadCompanies() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCompanies();
        if (data !== null) {
          setCompanies(data);
        } else {
          setError('Failed to load companies. Please check console for details.');
        }
      } catch (err) {
        console.error('Error in component loading companies:', err);
        setError('An unexpected error occurred while loading companies.');
      } finally {
        setLoading(false);
      }
    }
    loadCompanies();
  }, []);

  // Handle edit button click
  const handleEdit = (id: string) => {
    router.push(`/settings/company/${id}`);
  };

  // Handle delete button click
  const handleDelete = async (id: string) => {
    const companyToDelete = companies.find(c => c.id === id);
    if (!companyToDelete) return;

    const isConfirmed = window.confirm(`คุณต้องการลบ ${companyToDelete.name} ใช่หรือไม่?`);
    if (!isConfirmed) {
      return;
    }

    // Optimistically remove from UI
    setCompanies(companies.filter(company => company.id !== id));

    // Delete from database
    try {
      const success = await dbDeleteCompany(id);
      if (!success) {
        setError(`Failed to delete company: ${companyToDelete.name}`);
        // Revert UI change if delete failed
        setCompanies([...companies]); 
      } else {
         console.log(`Deleted company with ID: ${id}`);
         // Optionally show a success message
      }
    } catch (err) {
      console.error('Error deleting company:', err);
      setError('An unexpected error occurred while deleting the company.');
      // Revert UI change on error
      setCompanies([...companies]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Company Settings</h1>
          <p className="text-slate-500">Manage company information for your exports</p>
        </div>
        <Link href="/settings/company/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading companies...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No companies found.</TableCell>
                  </TableRow>
                ) : (
                  companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.address || '-'}</TableCell>
                      <TableCell>{company.contact_person || '-'}</TableCell>
                      <TableCell>{company.contact_email || '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="inline-flex items-center"
                          onClick={() => handleEdit(company.id)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="inline-flex items-center text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(company.id)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 