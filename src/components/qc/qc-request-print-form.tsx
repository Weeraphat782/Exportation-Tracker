'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, Save } from 'lucide-react';
import { updateQcRequest } from '@/lib/qc-db';
import { normalizeCatalogSelections, hasCatalogSelections } from '@/lib/qc-catalog';
import { QcCatalogFields } from '@/components/qc/qc-catalog-fields';
import { QC_LAB_LETTERHEAD } from '@/lib/qc-types';
import type { QcLabFormData, QcRequest } from '@/lib/qc-types';
import { toast } from 'sonner';

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB');
}

/** Checkbox that prints cleanly. Editable toggles when `onToggle` is provided. */
function Check({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: React.ReactNode;
  onToggle?: () => void;
}) {
  const editable = !!onToggle;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!editable}
      className={`inline-flex items-start gap-1.5 text-left align-top disabled:cursor-default ${
        editable
          ? 'cursor-pointer -mx-1 rounded px-1 hover:bg-emerald-50 print:mx-0 print:px-0 print:hover:bg-transparent'
          : ''
      }`}
    >
      <span
        className={`mt-[2px] inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center border bg-white text-[11px] font-bold leading-none [print-color-adjust:exact] [-webkit-print-color-adjust:exact] ${
          checked
            ? 'border-red-600 text-red-600'
            : editable
              ? 'border-emerald-500 text-transparent ring-1 ring-emerald-300 print:border-slate-800 print:ring-0'
              : 'border-slate-800 text-transparent'
        }`}
      >
        {checked ? '✓' : ''}
      </span>
      <span className="text-[13px] leading-tight">{label}</span>
    </button>
  );
}

/** Inline fill-in-the-blank input that prints as an underlined value. */
function Fill({
  value,
  onChange,
  className = '',
  placeholder,
  underline = true,
}: {
  value: string;
  onChange?: (v: string) => void;
  className?: string;
  placeholder?: string;
  underline?: boolean;
}) {
  const editable = !!onChange;
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={!editable}
      className={`border-0 bg-transparent px-1 text-[13px] leading-tight focus:outline-none ${
        underline ? 'border-b' : ''
      } ${
        editable
          ? `border-solid border-emerald-400 bg-emerald-50/40 focus:border-emerald-600 print:border-slate-400 print:bg-transparent ${underline ? 'print:border-dotted' : ''}`
          : underline
            ? 'border-dotted border-slate-400'
            : ''
      } ${className}`}
    />
  );
}

function StaticValue({ value }: { value?: string | null }) {
  return (
    <span className="border-b border-dotted border-slate-400 px-1 text-[13px]">
      {value?.trim() ? value : '\u00A0'}
    </span>
  );
}

export type QcRequestPrintFormEditor = 'lab' | 'customer';

export function QcRequestPrintForm({
  request,
  editor = 'lab',
}: {
  request: QcRequest;
  editor?: QcRequestPrintFormEditor;
}) {
  const [lab, setLab] = useState<QcLabFormData>(request.lab_form_data || {});
  const [saving, setSaving] = useState(false);
  const isLabEditor = editor === 'lab';

  const set = <K extends keyof QcLabFormData>(key: K, value: QcLabFormData[K]) => {
    setLab((prev) => ({ ...prev, [key]: value }));
  };

  const labOnlyFill = (
    value: string,
    onChange: (v: string) => void,
    className?: string,
    underline = true
  ) => (
    <Fill
      value={value}
      onChange={isLabEditor ? onChange : undefined}
      className={className}
      underline={underline}
    />
  );

  const handleSave = async () => {
    setSaving(true);
    const ok = await updateQcRequest(
      request.id,
      { lab_form_data: lab },
      { asCustomer: editor === 'customer' }
    );
    setSaving(false);
    if (ok) toast.success('Form saved');
    else toast.error('Save failed');
  };

  const handlePrint = () => window.print();

  const catalogSelections = normalizeCatalogSelections(request.catalog_selections);
  const legacyItems = request.selected_items ?? [];
  const useCatalog = hasCatalogSelections(catalogSelections);

  return (
    <div>
      {/* Customer hint — hidden when printing */}
      {editor === 'customer' && (
        <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 print:hidden">
          ช่องที่มี <span className="font-semibold">กรอบสีเขียว</span> สามารถติ๊กหรือกรอกได้เอง (ไม่บังคับ)
          เมื่อกรอกเสร็จกด <span className="font-semibold">Save Form</span> แล้วจึงกด{' '}
          <span className="font-semibold">Print Form</span> เพื่อพิมพ์แนบไปกับตัวอย่าง
        </div>
      )}

      {/* Toolbar — hidden when printing */}
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save Form
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1" />
          Print Form
        </Button>
      </div>

      {/* A4 form sheet */}
      <div className="qc-print-sheet mx-auto w-full max-w-[794px] min-h-[1123px] border border-slate-300 bg-white p-6 text-slate-900 shadow-sm print:w-[210mm] print:min-h-[297mm] print:max-w-none print:border-0 print:p-0 print:shadow-none">
        {/* Header */}
        <div className="mb-3">
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/QC form LOgo.png"
              alt="Lab logo"
              className="h-20 w-auto object-contain [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
            />
          </div>
          <div className="mb-1 flex justify-end">
            <span className="flex items-baseline gap-1">
              <span className="text-[12px] whitespace-nowrap">เลขที่คำขอรับบริการ :</span>
              {labOnlyFill(lab.service_request_no || '', (v) => set('service_request_no', v), 'w-28')}
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-base font-bold">{QC_LAB_LETTERHEAD.nameTh}</h1>
            <p className="text-sm font-semibold">ใบส่งทดสอบ (QC Request)</p>
          </div>
        </div>

        {/* Company / contact */}
        <div className="space-y-1.5 border-t border-slate-800 pt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[13px] shrink-0">ชื่อบริษัท/ที่อยู่ ที่ใช้ในการออกรายงานผลการทดสอบ :</span>
            <StaticValue value={request.company_name_address} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[13px] shrink-0">ผู้ติดต่อ :</span>
            <StaticValue value={request.contact_name} />
          </div>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
            <span className="flex items-baseline gap-1">
              <span className="text-[13px]">โทรศัพท์ :</span>
              <StaticValue value={request.phone} />
            </span>
            <span className="flex items-baseline gap-1">
              <span className="text-[13px]">อีเมล :</span>
              <StaticValue value={request.email} />
            </span>
          </div>
        </div>

        {/* Sample details */}
        <div className="mt-2 space-y-1.5 border-t border-slate-800 pt-2">
          <p className="text-[13px] font-semibold">รายละเอียดตัวอย่าง</p>
          <div className="flex items-baseline gap-1">
            <span className="text-[13px] shrink-0">ชื่อตัวอย่าง :</span>
            <StaticValue value={request.sample_name} />
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
            <span className="flex items-baseline gap-1">
              <span className="text-[13px]">รุ่นการผลิต/Lot No.:</span>
              <StaticValue value={request.lot_no} />
            </span>
            <span className="flex items-baseline gap-1">
              <span className="text-[13px]">ผู้ผลิต:</span>
              <StaticValue value={request.manufacturer} />
            </span>
            <span className="flex items-baseline gap-1">
              <span className="text-[13px]">จำนวนตัวอย่าง:</span>
              <StaticValue value={request.sample_qty} />
            </span>
            <span className="flex items-baseline gap-1">
              <span className="text-[13px]">วันที่ผลิต:</span>
              <StaticValue value={formatDate(request.production_date)} />
            </span>
            <span className="flex items-baseline gap-1">
              <span className="text-[13px]">วันหมดอายุ:</span>
              <StaticValue value={formatDate(request.expiry_date)} />
            </span>
            <span className="flex items-baseline gap-1">
              <span className="text-[13px]">วันที่สุ่มตัวอย่าง:</span>
              <StaticValue value={formatDate(request.sampling_date)} />
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[13px]">ประเภทตัวอย่าง:</span>
            <Check checked={request.sample_type === 'solid'} label="ของแข็ง" />
            <Check checked={request.sample_type === 'liquid'} label="ของเหลว" />
            <Check checked={request.sample_type === 'other'} label="อื่นๆ" />
            {request.sample_type === 'other' && <StaticValue value={request.sample_type_other} />}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[13px]">วิธีการที่ใช้ทดสอบ:</span>
            <Check checked={request.test_method === 'lab'} label="วิธีของห้องปฏิบัติการ" />
            <Check checked={request.test_method === 'customer'} label="วิธีที่ผู้ขอรับบริการกำหนด" />
            <Check checked={request.test_method === 'other'} label="อื่นๆ" />
            {request.test_method === 'other' && <StaticValue value={request.test_method_other} />}
          </div>
        </div>

        {/* Test list — FM-QC-019 table with quantity columns + officials box */}
        <div className="mt-2 border-t border-slate-800 pt-2">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-slate-800 p-1 text-left align-middle">
                  ระบุรายการทดสอบ
                </th>
                <th rowSpan={2} className="border border-slate-800 p-1 text-center align-middle w-[64px] leading-tight">
                  ปริมาณต่อ
                  <br />
                  หน่วยบรรจุ
                </th>
                <th rowSpan={2} className="border border-slate-800 p-1 text-center align-middle w-[64px] leading-tight">
                  จำนวน
                  <br />
                  หน่วยบรรจุ
                  <br />
                  ทั้งหมด
                </th>
                <th colSpan={2} className="border border-slate-800 p-1 text-center align-middle">
                  สำหรับเจ้าหน้าที่
                </th>
              </tr>
              <tr>
                <th className="border border-slate-800 p-1 text-center align-middle w-[90px] leading-tight">
                  เลขที่ตัวอย่างทดสอบ
                </th>
                <th className="border border-slate-800 p-1 text-center align-middle w-[90px] leading-tight">
                  เลขที่ทดสอบ
                </th>
              </tr>
            </thead>
            <tbody>
              {useCatalog ? (
                <tr>
                  <td className="border border-slate-800 p-2 align-top">
                    <QcCatalogFields value={catalogSelections} readOnly variant="print" />
                  </td>
                  <td className="border border-slate-800 p-1 align-top" aria-hidden="true">&nbsp;</td>
                  <td className="border border-slate-800 p-1 align-top" aria-hidden="true">&nbsp;</td>
                  <td className="border border-slate-800 p-1 align-top">
                    {labOnlyFill(lab.lab_sample_no || '', (v) => set('lab_sample_no', v), 'w-full', false)}
                  </td>
                  <td className="border border-slate-800 p-1 align-top">
                    {labOnlyFill(lab.lab_test_no || '', (v) => set('lab_test_no', v), 'w-full', false)}
                  </td>
                </tr>
              ) : legacyItems.length === 0 ? (
                <tr>
                  <td className="border border-slate-800 p-2 text-center text-slate-400">
                    ไม่มีรายการทดสอบ
                  </td>
                  <td className="border border-slate-800 p-1">&nbsp;</td>
                  <td className="border border-slate-800 p-1">&nbsp;</td>
                  <td className="border border-slate-800 p-1">
                    {labOnlyFill(lab.lab_sample_no || '', (v) => set('lab_sample_no', v), 'w-full', false)}
                  </td>
                  <td className="border border-slate-800 p-1">
                    {labOnlyFill(lab.lab_test_no || '', (v) => set('lab_test_no', v), 'w-full', false)}
                  </td>
                </tr>
              ) : (
                legacyItems.map((item, idx) => (
                  <tr key={item.test_item_id + idx}>
                    <td className="border border-slate-800 p-1">
                      {item.group_label ? `${item.group_label}: ` : ''}
                      {item.name}
                    </td>
                    <td className="border border-slate-800 p-1 text-center">{item.unit_label || ''}</td>
                    <td className="border border-slate-800 p-1 text-center">{item.qty}</td>
                    {idx === 0 ? (
                      <>
                        <td className="border border-slate-800 p-1 align-top" rowSpan={legacyItems.length}>
                          {labOnlyFill(lab.lab_sample_no || '', (v) => set('lab_sample_no', v), 'w-full', false)}
                        </td>
                        <td className="border border-slate-800 p-1 align-top" rowSpan={legacyItems.length}>
                          {labOnlyFill(lab.lab_test_no || '', (v) => set('lab_test_no', v), 'w-full', false)}
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Handling / report options (customer fills on form; optional, not mandatory) */}
        <div className="mt-3 space-y-2 border-t border-slate-800 pt-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[13px]">สภาวะการเก็บรักษา :</span>
            <Check checked={lab.storage_condition === 'room'} label="อุณหภูมิห้อง ต่ำกว่า 30 °C" onToggle={() => set('storage_condition', 'room')} />
            <Check checked={lab.storage_condition === 'cold'} label="อุณหภูมิ 2 – 8 °C" onToggle={() => set('storage_condition', 'cold')} />
            <Check checked={lab.storage_condition === 'other'} label="ระบุ" onToggle={() => set('storage_condition', 'other')} />
            {lab.storage_condition === 'other' && (
              <Fill value={lab.storage_condition_other || ''} onChange={(v) => set('storage_condition_other', v)} className="w-48" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[13px]">เอกสารประกอบการส่งตัวอย่าง :</span>
            <Check checked={lab.attached_docs === 'none'} label="ไม่มี" onToggle={() => set('attached_docs', 'none')} />
            <Check checked={lab.attached_docs === 'yes'} label="มี ระบุ" onToggle={() => set('attached_docs', 'yes')} />
            {lab.attached_docs === 'yes' && (
              <Fill value={lab.attached_docs_detail || ''} onChange={(v) => set('attached_docs_detail', v)} className="w-48" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[13px]">การรับตัวอย่างคืน :</span>
            <Check checked={lab.sample_return === 'none'} label="ไม่รับคืน" onToggle={() => set('sample_return', 'none')} />
            <Check checked={lab.sample_return === 'with_report'} label="รับคืนพร้อมกับรายงานผลการทดสอบ" onToggle={() => set('sample_return', 'with_report')} />
            <Check checked={lab.sample_return === 'container_only'} label="รับคืนเฉพาะภาชนะบรรจุ" onToggle={() => set('sample_return', 'container_only')} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[13px]">ใบรายงานผลการทดสอบ (Test Report) :</span>
            <Check checked={lab.report_language === 'th'} label="ภาษาไทย" onToggle={() => set('report_language', 'th')} />
            <Check checked={lab.report_language === 'en'} label="ภาษาอังกฤษ" onToggle={() => set('report_language', 'en')} />
          </div>

          <div className="space-y-1">
            <span className="text-[13px]">รูปแบบรายงานผลการทดสอบที่ต้องการ :</span>
            <div className="flex flex-col gap-1 pl-4">
              <Check checked={!!lab.report_format_lab} label="ตามรูปแบบของห้องปฏิบัติการ" onToggle={() => set('report_format_lab', !lab.report_format_lab)} />
              <Check checked={!!lab.want_raw_data} label="Raw Data หรือ Analytical Record (ค่าบริการ 200 บาท/ตัวอย่าง/รายงานการทดสอบ)" onToggle={() => set('want_raw_data', !lab.want_raw_data)} />
              <Check checked={!!lab.want_uncertainty} label="แสดงค่า Uncertainty – คิดค่าบริการเพิ่ม (500 บาท/ตัวอย่าง/รายงานการทดสอบ)" onToggle={() => set('want_uncertainty', !lab.want_uncertainty)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[13px]">การจัดส่งใบรายงาน :</span>
            <Check checked={lab.report_delivery === 'pickup'} label="มารับด้วยตนเอง" onToggle={() => set('report_delivery', 'pickup')} />
            <Check checked={lab.report_delivery === 'other'} label="ช่องทางการติดต่ออื่น ระบุ" onToggle={() => set('report_delivery', 'other')} />
            {lab.report_delivery === 'other' && (
              <Fill value={lab.report_delivery_other || ''} onChange={(v) => set('report_delivery_other', v)} className="w-48" />
            )}
          </div>
        </div>

        {/* Policy notes */}
        <div className="mt-3 space-y-0.5 border-t border-slate-800 pt-2 text-[11px] text-slate-600">
          <p>• ห้องปฏิบัติการมีนโยบาย ไม่ตัดสินผลการทดสอบ ผ่าน / ไม่ผ่าน</p>
          <p>• หากไม่มารับตัวอย่างคืน ภายใน 7 วัน หลังรับใบรายงานผลการทดสอบ ห้องปฏิบัติการจะทำการทำลายตัวอย่างที่เหลือตามความเหมาะสม</p>
          <p>• หากมีข้อสงสัยในรายงานผลการทดสอบ กรุณาแจ้งกลับยังห้องปฏิบัติการ ภายใน 7 วันทำการ</p>
        </div>

        {/* Footer: signature */}
        <div className="mt-3 space-y-2 border-t border-slate-800 pt-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pt-3">
            <span className="flex items-baseline gap-1 text-[13px]">
              ยืนยันการส่งตัวอย่างตามสภาพ ลงชื่อ
              <Fill value={lab.signer_name || ''} onChange={(v) => set('signer_name', v)} className="w-56" />
              ผู้ขอรับบริการ
            </span>
            <span className="flex items-baseline gap-1 text-[13px]">
              วันที่
              <Fill value={lab.sign_date || ''} onChange={(v) => set('sign_date', v)} className="w-32" />
            </span>
          </div>
        </div>

        <div className="mt-3 flex justify-between text-[11px] text-slate-500">
          <span>{QC_LAB_LETTERHEAD.formCode}</span>
          <span>{request.qc_code}</span>
        </div>
      </div>
    </div>
  );
}
