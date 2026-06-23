'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Check, Download, Loader2 } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import {
  createQcRequest,
  getQcTemplates,
  getQcTestItems,
  nestQcTestItems,
} from '@/lib/qc-db';
import { buildSelectedItem, computeQcInvoiceTotals } from '@/lib/qc-invoice';
import { loadSession } from '@/lib/customer-query-client';
import { getStoredSession } from '@/lib/session-helper';
import type {
  QcSampleType,
  QcSelectedItem,
  QcTemplate,
  QcTestItem,
  QcTestMethod,
} from '@/lib/qc-types';
import {
  QC_REQUEST_FORM_FILE,
  QC_SAMPLE_TYPE_LABELS,
  QC_TEST_METHOD_LABELS,
} from '@/lib/qc-types';
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

function QcFormDownloadCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3 ${className ?? ''}`}>
      <div>
        <p className="text-sm font-semibold text-slate-800">แบบฟอร์ม QC Request (FM-QC-019)</p>
        <p className="text-xs text-slate-500 mt-1">
          ดาวน์โหลดแบบฟอร์มจริง พิมพ์และติ๊กด้วยตนเอง แล้วแนบไปกับตัวอย่าง
        </p>
      </div>
      <a href={QC_REQUEST_FORM_FILE} target="_blank" rel="noreferrer">
        <Button variant="outline" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          เปิด / ดาวน์โหลดฟอร์ม FM-QC-019
        </Button>
      </a>
    </div>
  );
}

function formatMoney(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function collectLeafItems(nodes: QcTestItem[]): { item: QcTestItem; groupLabel?: string | null }[] {
  const out: { item: QcTestItem; groupLabel?: string | null }[] = [];
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        out.push({ item: child, groupLabel: node.name });
      }
    } else {
      out.push({ item: node });
    }
  }
  return out;
}

function collectGroupLeafItems(group: QcTestItem): QcTestItem[] {
  if (group.children && group.children.length > 0) return group.children;
  return [group];
}

function TestRow({
  item,
  groupLabel,
  checked,
  qty,
  onCheckedChange,
  onQtyChange,
  minSampleQty,
}: {
  item: QcTestItem;
  groupLabel?: string | null;
  checked: boolean;
  qty: number;
  onCheckedChange: (checked: boolean) => void;
  onQtyChange: (qty: number) => void;
  minSampleQty?: number | null;
}) {
  const price = Number(item.price) || 0;
  return (
    <div className="flex flex-wrap items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <Checkbox
        id={`test-${item.id}`}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
      <label htmlFor={`test-${item.id}`} className="flex-1 min-w-[140px] text-sm cursor-pointer">
        {groupLabel ? (
          <span className="text-slate-500">{groupLabel}: </span>
        ) : null}
        {item.name}
        {item.unit_label ? (
          <span className="text-slate-400 text-xs ml-1">({item.unit_label})</span>
        ) : null}
        {minSampleQty != null && minSampleQty > 0 ? (
          <span className="block text-xs text-amber-700 mt-0.5">
            ขั้นต่ำตัวอย่าง: {minSampleQty}
            {item.unit_label ? ` ${item.unit_label}` : ''}
          </span>
        ) : null}
      </label>
      <span className="text-sm tabular-nums text-slate-600 shrink-0">
        {formatMoney(price)} THB
      </span>
      {checked && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-slate-500 shrink-0">Qty</Label>
          <Input
            type="number"
            min={1}
            className="w-20 h-8"
            value={qty}
            onChange={(e) => onQtyChange(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
      )}
    </div>
  );
}

export default function NewQcRequestPage() {
  const router = useRouter();
  const { user, profile } = useCustomerAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  const [templates, setTemplates] = useState<QcTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [nestedItems, setNestedItems] = useState<QcTestItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [qtys, setQtys] = useState<Record<string, number>>({});

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
  const [bulkQty, setBulkQty] = useState('1');

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
    if (!templateId) {
      setNestedItems([]);
      setCheckedIds(new Set());
      setQtys({});
      return;
    }
    setLoadingItems(true);
    getQcTestItems(templateId).then((raw) => {
      setNestedItems(nestQcTestItems(raw));
      setCheckedIds(new Set());
      setQtys({});
      setLoadingItems(false);
    });
  }, [templateId]);

  const selectedItems = useMemo((): QcSelectedItem[] => {
    const items: QcSelectedItem[] = [];
    for (const node of nestedItems) {
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          if (!checkedIds.has(child.id)) continue;
          const qty = qtys[child.id] ?? 1;
          const built = buildSelectedItem(child, qty);
          built.group_label = node.name;
          items.push(built);
        }
      } else if (checkedIds.has(node.id)) {
        const qty = qtys[node.id] ?? 1;
        items.push(buildSelectedItem(node, qty));
      }
    }
    return items;
  }, [nestedItems, checkedIds, qtys]);

  const totals = useMemo(() => computeQcInvoiceTotals(selectedItems), [selectedItems]);

  const leafItems = useMemo(() => collectLeafItems(nestedItems), [nestedItems]);
  const allSelected =
    leafItems.length > 0 && leafItems.every(({ item }) => checkedIds.has(item.id));

  const minSampleSummary = useMemo(() => {
    const lines: string[] = [];
    for (const node of nestedItems) {
      const minQty = node.min_sample_qty;
      if (minQty != null && minQty > 0) {
        lines.push(`${node.name}: ขั้นต่ำ ${minQty}${node.unit_label ? ` ${node.unit_label}` : ''}`);
      }
    }
    return lines;
  }, [nestedItems]);

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setCheckedIds(new Set());
      return;
    }
    const nextIds = new Set<string>();
    const nextQtys: Record<string, number> = {};
    for (const { item } of leafItems) {
      nextIds.add(item.id);
      nextQtys[item.id] = qtys[item.id] ?? 1;
    }
    setCheckedIds(nextIds);
    setQtys((prev) => ({ ...prev, ...nextQtys }));
  };

  const toggleGroup = (group: QcTestItem, checked: boolean) => {
    const leaves = collectGroupLeafItems(group);
    setCheckedIds((prev) => {
      const next = new Set(prev);
      for (const item of leaves) {
        if (checked) next.add(item.id);
        else next.delete(item.id);
      }
      return next;
    });
    if (checked) {
      setQtys((prev) => {
        const next = { ...prev };
        for (const item of leaves) {
          if (!next[item.id]) next[item.id] = 1;
        }
        return next;
      });
    }
  };

  const toggleItem = (id: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
        if (!qtys[id]) setQtys((q) => ({ ...q, [id]: 1 }));
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const applyQtyToAll = () => {
    const qty = Math.max(1, Math.floor(Number(bulkQty) || 1));
    const targets = checkedIds.size > 0 ? leafItems.filter(({ item }) => checkedIds.has(item.id)) : leafItems;
    if (targets.length === 0) {
      toast.error('เลือกรายการก่อน หรือยังไม่มีรายการให้ตั้งค่า');
      return;
    }
    const nextIds = new Set(checkedIds);
    setQtys((prev) => {
      const next = { ...prev };
      for (const { item } of targets) {
        next[item.id] = qty;
        nextIds.add(item.id);
      }
      return next;
    });
    setCheckedIds(nextIds);
    toast.success(`ตั้งจำนวน ${qty} ให้ ${targets.length} รายการแล้ว`);
  };

  const notifyLabAdmins = async (requestId: string) => {
    try {
      await loadSession();
      const token = getStoredSession()?.access_token;
      if (!token) return;

      await fetch('/api/qc/notify-new-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });
    } catch (err) {
      console.error('[qc new request] lab notification failed:', err);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!templateId) {
      toast.error('Please select a test template');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Please select at least one test');
      return;
    }
    setSubmitting(true);
    const created = await createQcRequest({
      customer_user_id: user.id,
      template_id: templateId,
      selected_items: selectedItems,
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
      void notifyLabAdmins(created.id);
      toast.success('QC request submitted');
      router.push(`/portal/qc-requests/${created.id}`);
    } else {
      toast.error('Failed to submit request');
    }
  };

  const selectedTemplate = templates.find((t) => t.id === templateId);

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
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Tests</CardTitle>
              <CardDescription>Choose a test panel and tick the items you need</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Test Template</Label>
                <Select value={templateId || 'none'} onValueChange={(v) => setTemplateId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Select a template…</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                        {t.description ? ` — ${t.description}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loadingItems ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : templateId && nestedItems.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">This template has no test items yet.</p>
              ) : templateId ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-semibold">หากตรวจหลาย sample ใน 1 รายการ</p>
                    <p className="mt-1">
                      ให้ใส่จำนวนรวมในช่อง Qty แล้วพิมพ์แบบฟอร์ม QC Request ให้ครบเท่าจำนวน sample
                      พร้อมกรอกและติ๊กรายการให้ครบทุกชุด
                    </p>
                  </div>

                  {minSampleSummary.length > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                      <p className="font-semibold">ปริมาณตัวอย่างขั้นต่ำที่ต้องส่ง</p>
                      <ul className="mt-1 list-disc list-inside space-y-0.5">
                        {minSampleSummary.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all-tests"
                        checked={allSelected}
                        onCheckedChange={(v) => toggleAll(v === true)}
                      />
                      <label htmlFor="select-all-tests" className="text-sm font-medium cursor-pointer">
                        เลือกทั้งหมด ({leafItems.length} รายการ)
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-slate-500 shrink-0">ตั้งจำนวนทุกรายการ</Label>
                      <Input
                        type="number"
                        min={1}
                        className="w-20 h-8"
                        value={bulkQty}
                        onChange={(e) => setBulkQty(e.target.value)}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={applyQtyToAll}>
                        ใช้กับ{checkedIds.size > 0 ? 'ที่เลือก' : 'ทั้งหมด'}
                      </Button>
                    </div>
                  </div>

                  {nestedItems.map((node) => (
                    <div key={node.id} className="rounded-lg border border-slate-200 p-3">
                      {node.children && node.children.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-sm font-semibold text-slate-700">{node.name}</p>
                            <button
                              type="button"
                              className="text-xs text-emerald-700 hover:underline"
                              onClick={() => {
                                const leaves = collectGroupLeafItems(node);
                                const allOn = leaves.every((c) => checkedIds.has(c.id));
                                toggleGroup(node, !allOn);
                              }}
                            >
                              {collectGroupLeafItems(node).every((c) => checkedIds.has(c.id))
                                ? 'ยกเลิกทั้งกลุ่ม'
                                : 'เลือกทั้งกลุ่ม'}
                            </button>
                          </div>
                          {node.children.map((child) => (
                            <TestRow
                              key={child.id}
                              item={child}
                              groupLabel={node.name}
                              checked={checkedIds.has(child.id)}
                              qty={qtys[child.id] ?? 1}
                              onCheckedChange={(c) => toggleItem(child.id, c)}
                              onQtyChange={(q) => setQtys((prev) => ({ ...prev, [child.id]: q }))}
                              minSampleQty={node.min_sample_qty}
                            />
                          ))}
                        </>
                      ) : (
                        <TestRow
                          item={node}
                          checked={checkedIds.has(node.id)}
                          qty={qtys[node.id] ?? 1}
                          onCheckedChange={(c) => toggleItem(node.id, c)}
                          onQtyChange={(q) => setQtys((prev) => ({ ...prev, [node.id]: q }))}
                          minSampleQty={node.min_sample_qty}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              {selectedItems.length > 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">{selectedItems.length} item(s) selected</span>
                    <span className="font-semibold text-emerald-800 tabular-nums">
                      ราคาประมาณการ: {formatMoney(totals.grand_total)} THB
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    ยอดนี้เป็นราคาประมาณการ ห้องแล็บอาจปรับส่วนลดและยืนยันราคาก่อนแสดง QR ชำระเงิน
                  </p>
                </div>
              )}

              <QcFormDownloadCard />

              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button
                  disabled={!templateId || selectedItems.length === 0}
                  onClick={() => setStep(3)}
                >
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary & Submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">ก่อนส่งตัวอย่าง — สำคัญ</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>ติดเลข Lot No. ของสินค้ามาด้วยทุกครั้ง</li>
                <li>
                  หลัง submit ให้พิมพ์ QR Code จากระบบติดบนถุงตัวอย่างเพื่อ tracking
                  (1 รายการมี 5 sample = พิมพ์ QR 5 อันติดครบ 5 sample)
                </li>
                <li>แนบแบบฟอร์ม FM-QC-019 ที่กรอกและติ๊กครบแล้วมาพร้อมตัวอย่าง</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4 space-y-2 text-sm">
              <p><span className="text-slate-500">Sample:</span> {sampleName || '—'}</p>
              <p>
                <span className="text-slate-500">Template:</span>{' '}
                {selectedTemplate?.name || '—'}
              </p>
              <p><span className="text-slate-500">Tests selected:</span> {selectedItems.length} item(s)</p>
              <ul className="text-xs text-slate-600 space-y-1 pl-2">
                {selectedItems.map((item) => (
                  <li key={item.test_item_id}>
                    {item.group_label ? `${item.group_label}: ` : ''}
                    {item.name} × {item.qty} — {formatMoney(item.subtotal)} THB
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
                <p className="text-xs text-amber-700 font-medium">ราคาประมาณการ (อาจมีการเปลี่ยนแปลง)</p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="tabular-nums">{formatMoney(totals.subtotal)} THB</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">VAT 7%</span>
                  <span className="tabular-nums">{formatMoney(totals.vat)} THB</span>
                </p>
                <p className="flex justify-between font-semibold text-base">
                  <span>Grand Total (est.)</span>
                  <span className="tabular-nums text-emerald-700">{formatMoney(totals.grand_total)} THB</span>
                </p>
              </div>
            </div>

            <QcFormDownloadCard />

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
