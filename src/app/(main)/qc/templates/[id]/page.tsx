'use client';

import { useParams } from 'next/navigation';
import { QcTemplateForm } from '@/components/qc/qc-template-form';

export default function QcTemplateEditPage() {
  const params = useParams();
  const templateId = params.id as string;
  return <QcTemplateForm templateId={templateId} />;
}
