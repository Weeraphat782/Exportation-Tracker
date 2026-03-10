'use client';

import React from 'react';

export default function PartnerSection() {
    return (
        <section className="bg-neutral-50 py-16 border-t border-neutral-100">
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
                            OMGEXP is proud to be part of the Thai innovation ecosystem. The development of our AI-powered
                            logistics platform is funded and supported by the <span className="font-bold text-neutral-900">National Innovation Agency (Public Organization)</span> or NIA, Thailand.
                        </p>
                    </div>

                    {/* NIA LOGO SLOT */}
                    <div className="group relative flex items-center justify-center p-12 bg-white rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl transition-all duration-300">
                        {/* 🛑 PLACE YOUR NIA LOGO HERE 🛑 */}
                        {/* You can replace this <img> tag with your actual NIA logo file path */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/partners/nia-logo.png"
                            className="h-32 md:h-40 w-auto transition-all duration-500"
                            onError={(e) => {
                                // If image doesn't exist yet, show a clean placeholder box
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = "flex items-center justify-center px-12 py-6 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 font-bold uppercase tracking-widest";
                                    placeholder.innerText = "NIA LOGO SLOT";
                                    parent.appendChild(placeholder);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
