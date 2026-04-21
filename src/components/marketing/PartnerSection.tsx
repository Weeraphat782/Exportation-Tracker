'use client';

import Image from "next/image";
import React, { useState } from 'react';

export default function PartnerSection() {
    const [niaLogoError, setNiaLogoError] = useState(false);
    return (
        <section className="relative overflow-hidden py-16 sm:py-24" style={{ background: "linear-gradient(135deg, var(--color-primary-ref) 0%, #1a4279 100%)" }}>
            {/* Background decorative elements */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: "var(--color-accent-ref)" }} />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: "var(--color-accent-ref)" }} />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 flex flex-col items-center">
                        <div className="accent-bar mx-auto mb-4" />
                        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Innovation Fueled by Partnership
                        </h2>
                    </div>

                    <div className="max-w-2xl mb-12">
                        <p className="text-base text-white/70 leading-relaxed">
                            OMG Experience is proud to be part of the Thai innovation ecosystem. Our AI-powered
                            logistics platform is funded and supported by the <span className="font-bold text-white">National Innovation Agency (Public Organization)</span> or NIA, Thailand.
                        </p>
                    </div>

                    {/* NIA LOGO SLOT */}
                    <div className="group relative flex min-h-[8rem] items-center justify-center p-6 bg-white rounded-3xl border border-white/10 shadow-2xl hover:shadow-[0_32px_64px_rgba(0,0,0,0.3)] transition-all duration-300 sm:min-h-[10rem] sm:p-12">
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
