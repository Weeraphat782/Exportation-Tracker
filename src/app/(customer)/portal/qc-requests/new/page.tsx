'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import { createQcRequest, getQcStandards } from '@/lib/qc-db';
import { EMPTY_CATALOG_SELECTIONS, hasCatalogSelections } from '@/lib/qc-catalog';
import type { QcCatalogSelections } from '@/lib/qc-catalog';
import { QcCatalogFields } from '@/components/qc/qc-catalog-fields';
import type { QcSampleType, QcTestMethod, QcTestStandard } from '@/lib/qc-types';
import { QC_SAMPLE_TYPE_LABELS, QC_TEST_METHOD_LABELS } from '@/lib/qc-types';
import { toast } from 'sonner';

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Details' },
    { n: 2, label: 'Tests' },
    { n: 3, label: 'Submit' },
  ] as const;

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 flex-wrap">
      {steps.map((step, idx) => {
        const done = currentStep > step.n;
        const active = currentStep === step.n;
        return (
          <div key={step.n} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  done
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : active
                      ? 'border-emerald-500 text-emerald-600 bg-white'
                      : 'border-gray-200 text-gray-400 bg-gray-50'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : step.n}
              </div>
              <span className="text-[10px] font-bold uppercase text-gray-400 hidden sm:block">
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function NewQcRequestPage() {
  const router = useRouter();
  const { user, profile } = useCustomerAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [standards, setStandards] = useState<QcTestStandard[]>([]);
  const [standardId, setStandardId] = useState('');
  const [catalogSelections, setCatalogSelections] = useState<QcCatalogSelections>({
    ...EMPTY_CATALOG_SELECTIONS,
  });
  const [submitting, setSubmitting] = useState(false);

  const [companyNameAddress, setCompanyNameAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sampleName, setSampleName] = useState('');
  const [lotNo, setLotNo] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [sampleQty, setSampleQty] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [samplingDate, setSamplingDate] = useState('');
  const [sampleType, setSampleType] = useState<QcSampleType>('solid');
  const [sampleTypeOther, setSampleTypeOther] = useState('');
  const [testMethod, setTestMethod] = useState<QcTestMethod>('lab');
  const [testMethodOther, setTestMethodOther] = useState('');

  useEffect(() => {
    getQcStandards(true).then(setStandards);
  }, []);

  useEffect(() => {
    if (profile) {
      setCompanyNameAddress(profile.company || '');
      setContactName(profile.full_name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const applyStandard = (id: string) => {
    setStandardId(id);
    if (!id) return;
    const std = standards.find((s) => s.id === id);
    if (std) {
      setCatalogSelections({
        items: [...std.selections.items],
        units: { ...(std.selections.units || {}) },
        potencyOther: std.selections.potencyOther,
        heavyMetalsOther: std.selections.heavyMetalsOther,
        other: std.selections.other,
      });
      toast.success(`Applied standard: ${std.name}`);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!hasCatalogSelections(catalogSelections)) {
      toast.error('Please select at least one test');
      return;
    }
    setSubmitting(true);
    const created = await createQcRequest({
      customer_user_id: user.id,
      catalog_selections: catalogSelections,
      company_name_address: companyNameAddress,
      contact_name: contactName,
      phone,
      email,
      sample_name: sampleName,
      lot_no: lotNo,
      manufacturer,
      sample_qty: sampleQty,
      production_date: productionDate || undefined,
      expiry_date: expiryDate || undefined,
      sampling_date: samplingDate || undefined,
      sample_type: sampleType,
      sample_type_other: sampleType === 'other' ? sampleTypeOther : undefined,
      test_method: testMethod,
      test_method_other: testMethod === 'other' ? testMethodOther : undefined,
    });
    setSubmitting(false);
    if (created) {
      toast.success('QC request submitted');
      router.push(`/portal/qc-requests/${created.id}`);
    } else {
      toast.error('Failed to submit request');
    }
  };

  const selectedCount = catalogSelections.items.length;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/portal/qc-requests" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to QC Requests
      </Link>

      <h1 className="text-2xl font-bold mb-2">New QC Request</h1>
      <p className="text-slate-500 text-sm mb-6">FM-QC-019 — ใบส่งทดสอบ (QC Request)</p>

      <StepIndicator currentStep={step} />

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample & Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company Name & Address</Label>
              <Textarea value={companyNameAddress} onChange={(e) => setCompanyNameAddress(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Contact Name</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Sample Name</Label>
                <Input
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                  placeholder="Dried cannabis flower + ชื่อสายพันธุ์"
                />
                <p className="mt-1 text-xs text-slate-500">
                  ระบุชนิดตัวอย่างตามด้วยชื่อสายพันธุ์ เช่น Dried cannabis flower - Charlotte&apos;s Angel
                </p>
              </div>
              <div>
                <Label>Lot No.</Label>
                <Input value={lotNo} onChange={(e) => setLotNo(e.target.value)} />
              </div>
              <div>
                <Label>Manufacturer</Label>
                <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
              </div>
              <div>
                <Label>Sample Qty</Label>
                <Input value={sampleQty} onChange={(e) => setSampleQty(e.target.value)} />
              </div>
              <div>
                <Label>Production Date</Label>
                <Input type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
              <div>
                <Label>Sampling Date</Label>
                <Input type="date" value={samplingDate} onChange={(e) => setSamplingDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Sample Type</Label>
                <Select value={sampleType} onValueChange={(v) => setSampleType(v as QcSampleType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(QC_SAMPLE_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sampleType === 'other' && (
                  <Input className="mt-2" placeholder="Specify" value={sampleTypeOther} onChange={(e) => setSampleTypeOther(e.target.value)} />
                )}
              </div>
              <div>
                <Label>Test Method</Label>
                <Select value={testMethod} onValueChange={(v) => setTestMethod(v as QcTestMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(QC_TEST_METHOD_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {testMethod === 'other' && (
                  <Input className="mt-2" placeholder="Specify" value={testMethodOther} onChange={(e) => setTestMethodOther(e.target.value)} />
                )}
              </div>
            </div>
            <Button onClick={() => setStep(2)}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Tests (FM-QC-019)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {standards.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <Label>Apply standard (optional)</Label>
                <Select value={standardId || 'none'} onValueChange={(v) => applyStandard(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a standard e.g. GACP" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None — select manually</SelectItem>
                    {standards.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {s.description ? ` — ${s.description}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <QcCatalogFields value={catalogSelections} onChange={setCatalogSelections} />
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button disabled={!hasCatalogSelections(catalogSelections)} onClick={() => setStep(3)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary & Submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 space-y-2 text-sm">
              <p><span className="text-slate-500">Sample:</span> {sampleName || '—'}</p>
              <p><span className="text-slate-500">Tests selected:</span> {selectedCount} item(s)</p>
              {catalogSelections.potencyOther && (
                <p className="text-xs text-slate-600">Potency other: {catalogSelections.potencyOther}</p>
              )}
              {catalogSelections.other && (
                <p className="text-xs text-slate-600 whitespace-pre-wrap">Other: {catalogSelections.other}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Submit QC Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
