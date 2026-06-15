'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, Save } from 'lucide-react';
import { updateQcRequest } from '@/lib/qc-db';
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
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!onToggle}
      className="inline-flex items-start gap-1.5 text-left align-top disabled:cursor-default"
    >
      <span
        className={`mt-[2px] inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center border border-slate-800 text-[10px] leading-none ${
          checked ? 'bg-slate-800 text-white' : 'bg-white text-transparent'
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
}: {
  value: string;
  onChange?: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={!onChange}
      className={`border-0 border-b border-dotted border-slate-400 bg-transparent px-1 text-[13px] leading-tight focus:outline-none focus:border-solid focus:border-blue-500 print:border-dotted ${className}`}
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

export function QcRequestPrintForm({ request }: { request: QcRequest }) {
  const [lab, setLab] = useState<QcLabFormData>(request.lab_form_data || {});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof QcLabFormData>(key: K, value: QcLabFormData[K]) => {
    setLab((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await updateQcRequest(request.id, { lab_form_data: lab });
    setSaving(false);
    if (ok) toast.success('Form saved');
    else toast.error('Save failed');
  };

  const handlePrint = () => window.print();

  const items = request.selected_items ?? [];

  return (
    <div>
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
      <div className="qc-print-sheet mx-auto w-full max-w-[800px] border border-slate-300 bg-white p-6 text-slate-900 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
        {/* Header */}
        <div className="mb-3 text-center">
          <h1 className="text-base font-bold">{QC_LAB_LETTERHEAD.nameTh}</h1>
          <p className="text-sm font-semibold">ใบส่งทดสอบ (QC Request)</p>
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

        {/* Officials box */}
        <div className="mt-2 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 border-t border-slate-800 pt-2">
          <span className="text-[12px] font-semibold text-slate-600">สำหรับเจ้าหน้าที่:</span>
          <span className="flex items-baseline gap-1">
            <span className="text-[13px]">เลขที่ตัวอย่างทดสอบ</span>
            <Fill value={lab.lab_sample_no || ''} onChange={(v) => set('lab_sample_no', v)} className="w-28" />
          </span>
          <span className="flex items-baseline gap-1">
            <span className="text-[13px]">เลขที่ทดสอบ</span>
            <Fill value={lab.lab_test_no || ''} onChange={(v) => set('lab_test_no', v)} className="w-28" />
          </span>
        </div>

        {/* Test list */}
        <table className="mt-2 w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-400 p-1 text-left w-8">#</th>
              <th className="border border-slate-400 p-1 text-left">ระบุรายการทดสอบ</th>
              <th className="border border-slate-400 p-1 text-center w-28">ปริมาณต่อหน่วยบรรจุ</th>
              <th className="border border-slate-400 p-1 text-center w-28">จำนวนหน่วยบรรจุทั้งหมด</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-slate-400 p-2 text-center text-slate-400">
                  ไม่มีรายการทดสอบ
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.test_item_id + idx}>
                  <td className="border border-slate-400 p-1 text-center">{idx + 1}</td>
                  <td className="border border-slate-400 p-1">
                    {item.group_label ? `${item.group_label}: ` : ''}
                    {item.name}
                  </td>
                  <td className="border border-slate-400 p-1 text-center">{item.unit_label || ''}</td>
                  <td className="border border-slate-400 p-1 text-center">{item.qty}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Handling / report options (lab editable) */}
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

        {/* Footer: service request no + signature */}
        <div className="mt-3 space-y-2 border-t border-slate-800 pt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[13px]">เลขที่คำขอรับบริการ :</span>
            <Fill value={lab.service_request_no || ''} onChange={(v) => set('service_request_no', v)} className="w-48" />
          </div>
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
