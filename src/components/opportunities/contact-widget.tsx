"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Building2 } from 'lucide-react';

interface ContactWidgetProps {
    companyName: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
}

export function ContactWidget({ companyName, contactPerson, contactEmail, contactPhone }: ContactWidgetProps) {
    return (
        <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3 border-b border-gray-50">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Customer Contact
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Company</div>
                        <div className="text-sm font-bold text-gray-900">{companyName}</div>
                    </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-gray-50">
                    <div className="mt-1 flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Contact Name</div>
                        <div className="text-sm font-medium text-gray-900">{contactPerson || 'Not provided'}</div>
                    </div>
                </div>

                {contactEmail && (
                    <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email</div>
                            <div className="text-sm font-medium text-gray-900 truncate" title={contactEmail}>
                                {contactEmail}
                            </div>
                            <a href={`mailto:${contactEmail}`} className="text-[10px] text-blue-600 hover:underline">
                                Send Mail
                            </a>
                        </div>
                    </div>
                )}

                {contactPhone && (
                    <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Phone</div>
                            <div className="text-sm font-medium text-gray-900">{contactPhone}</div>
                            <a href={`tel:${contactPhone}`} className="text-[10px] text-emerald-600 hover:underline">
                                Call Now
                            </a>
                        </div>
                    </div>
                )}

                {!contactPerson && !contactEmail && !contactPhone && (
                    <div className="py-2 text-center text-xs text-gray-400 italic">
                        No contact information available for {companyName}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
