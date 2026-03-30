'use client';

import Image from "next/image";
import React, { useState } from 'react';

export default function PartnerSection() {
    const [niaLogoError, setNiaLogoError] = useState(false);
    return (
        <section className="bg-neutral-50 py-10 border-t border-neutral-100 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-8 flex flex-col items-center">
                        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                            Innovation Fueled by Partnership
                        </h2>
                        <div className="mt-2 h-1 w-20 bg-[#86ef6c] rounded-full" />
                    </div>

                    <div className="max-w-3xl mb-12">
                        <p className="text-lg text-neutral-600 leading-relaxed">
                            OMG Experience is proud to be part of the Thai innovation ecosystem. The development of our AI-powered
                            logistics platform is funded and supported by the <span className="font-bold text-neutral-900">National Innovation Agency (Public Organization)</span> or NIA, Thailand.
                        </p>
                    </div>

                    {/* NIA LOGO SLOT */}
                    <div className="group relative flex min-h-[8rem] items-center justify-center p-6 bg-white rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl transition-all duration-300 sm:min-h-[10rem] sm:p-12">
                        {!niaLogoError ? (
                            <Image
                                src="/images/partners/nia-logo.png"
                                alt="National Innovation Agency Thailand logo"
                                width={320}
                                height={160}
                                className="h-32 w-auto max-w-full object-contain transition-all duration-500 md:h-40"
                                onError={() => setNiaLogoError(true)}
                            />
                        ) : (
                            <div className="flex items-center justify-center px-12 py-6 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 font-bold uppercase tracking-widest">
                                NIA LOGO SLOT
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
