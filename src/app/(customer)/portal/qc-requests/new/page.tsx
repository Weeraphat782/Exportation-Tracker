'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import {
  createQcRequest,
  getQcTemplates,
  getQcTestItems,
  nestQcTestItems,
} from '@/lib/qc-db';
import { buildSelectedItem, computeQcInvoiceTotals } from '@/lib/qc-invoice';
import type { QcSampleType, QcTemplate, QcTestItem, QcTestMethod } from '@/lib/qc-types';
import { QC_SAMPLE_TYPE_LABELS, QC_TEST_METHOD_LABELS } from '@/lib/qc-types';
import { toast } from 'sonner';

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  const steps = [
    { n: 1, label: 'Template' },
    { n: 2, label: 'Details' },
    { n: 3, label: 'Tests' },
    { n: 4, label: 'Summary' },
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

function TestTree({
  nodes,
  qtyMap,
  onQtyChange,
  depth,
}: {
  nodes: QcTestItem[];
  qtyMap: Record<string, number>;
  onQtyChange: (id: string, qty: number) => void;
  depth: number;
}) {
  return (
    <div className="space-y-2" style={{ marginLeft: depth * 16 }}>
      {nodes.map((node) => {
        const hasPrice = node.price != null && Number(node.price) > 0;
        const isLeaf = !node.children?.length;
        return (
          <div key={node.id}>
            {isLeaf && hasPrice ? (
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <Checkbox
                  checked={(qtyMap[node.id] || 0) > 0}
                  onCheckedChange={(checked) => onQtyChange(node.id, checked ? 1 : 0)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {node.group_label ? `${node.group_label}: ` : ''}
                    {node.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Number(node.price).toLocaleString()} THB / {node.unit_label || 'unit'}
                    {node.test_duration ? ` · ${node.test_duration}` : ''}
                  </p>
                </div>
                {(qtyMap[node.id] || 0) > 0 && (
                  <Input
                    type="number"
                    min={node.min_sample_qty || 1}
                    className="w-20"
                    value={qtyMap[node.id] || 1}
                    onChange={(e) => onQtyChange(node.id, Math.max(0, parseInt(e.target.value) || 0))}
                  />
                )}
              </div>
            ) : (
              <p className="text-sm font-semibold text-gray-700 py-1">{node.name}</p>
            )}
            {node.children && node.children.length > 0 && (
              <TestTree nodes={node.children} qtyMap={qtyMap} onQtyChange={onQtyChange} depth={depth + 1} />
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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [templates, setTemplates] = useState<QcTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [testTree, setTestTree] = useState<QcTestItem[]>([]);
  const [flatItems, setFlatItems] = useState<QcTestItem[]>([]);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
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
    getQcTemplates(true).then(setTemplates);
  }, []);

  useEffect(() => {
    if (profile) {
      setCompanyNameAddress(profile.company || '');
      setContactName(profile.full_name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!templateId) return;
    getQcTestItems(templateId).then((items) => {
      setFlatItems(items);
      setTestTree(nestQcTestItems(items));
      setQtyMap({});
    });
  }, [templateId]);

  const selectedItems = useMemo(() => {
    return flatItems
      .filter((item) => (qtyMap[item.id] || 0) > 0 && item.price != null)
      .map((item) => buildSelectedItem(item, qtyMap[item.id] || 1));
  }, [flatItems, qtyMap]);

  const totals = useMemo(() => computeQcInvoiceTotals(selectedItems), [selectedItems]);

  const handleQtyChange = (id: string, qty: number) => {
    setQtyMap((prev) => ({ ...prev, [id]: qty }));
  };

  const handleSubmit = async () => {
    if (!user || !templateId || selectedItems.length === 0) {
      toast.error('Please complete all required fields');
      return;
    }
    setSubmitting(true);
    const created = await createQcRequest({
      customer_user_id: user.id,
      template_id: templateId,
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
      selected_items: selectedItems,
    });
    setSubmitting(false);
    if (created) {
      toast.success('QC request submitted');
      router.push(`/portal/qc-requests/${created.id}`);
    } else {
      toast.error('Failed to submit request');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/portal/qc-requests" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to QC Requests
      </Link>

      <h1 className="text-2xl font-bold mb-2">New QC Request</h1>
      <p className="text-slate-500 text-sm mb-6">FM-QC-019 — Lab testing request form</p>

      <StepIndicator currentStep={step} />

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Test Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a test panel" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={!templateId} onClick={() => setStep(2)}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
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
                <Input value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <TestTree nodes={testTree} qtyMap={qtyMap} onQtyChange={handleQtyChange} depth={0} />
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button disabled={selectedItems.length === 0} onClick={() => setStep(4)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary & Submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 space-y-2 text-sm">
              {selectedItems.map((item) => (
                <div key={item.test_item_id} className="flex justify-between">
                  <span>{item.name} × {item.qty}</span>
                  <span>{item.subtotal.toLocaleString()} THB</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Grand Total (incl. VAT)</span>
                <span>{totals.grand_total.toLocaleString()} THB</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
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
