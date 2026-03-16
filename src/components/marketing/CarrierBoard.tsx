'use client';

import React from 'react';

const ACCENT = '#5BBF21';

const carriers = [
    { country: "Switzerland", city: "Zurich", carrier: "TG", status: "Available" },
    { country: "Macedonia", city: "Skopje", carrier: "LH", status: "Available" },
    { country: "Germany", city: "Munich, Frankfurt", carrier: "LH", status: "Available" },
    { country: "Australia", city: "Melbourne, Sydney", carrier: "TG", status: "Available" },
    { country: "Czech", city: "Prague", carrier: "QR", status: "Suspended" },
    { country: "Portugal", city: "Lisbon", carrier: "QR", status: "Suspended" },
    { country: "New Zealand", city: "Auckland", carrier: "Qantas", status: "Available" },
];

export default function CarrierBoard() {
    return (
        <div className="mx-auto w-full lg:ml-auto animate-fade-in-up stagger-1">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl">
                {/* Green accent bar (like Footer) */}
                <div
                    className="h-0.5 w-full"
                    style={{ background: `linear-gradient(90deg, ${ACCENT}, #86ef6c, ${ACCENT})` }}
                />
                {/* Header Style FIDS */}
                <div className="bg-white/5 px-4 py-2.5 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: ACCENT }} />
                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: ACCENT }} />
                        </div>
                        <h3 className="text-sm font-bold tracking-[0.2em] text-white/90 uppercase font-mono">
                            Live Shipping Status
                        </h3>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                        Real-Time Feed
                    </div>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-white/5 bg-white/5 text-[9px] font-bold uppercase tracking-wider text-neutral-400 sm:px-4">
                    <div className="col-span-5">Destination</div>
                    <div className="col-span-4 text-center">Carrier</div>
                    <div className="col-span-3 text-right">Status</div>
                </div>

                {/* Board Rows - No internal scroll, show all */}
                <div className="divide-y divide-white/5">
                    {carriers.map((item, idx) => (
                        <div
                            key={idx}
                            className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-white/5 transition-colors group"
                        >
                            {/* Destination Column */}
                            <div className="col-span-5 flex flex-col min-w-0">
                                <span className="text-sm font-bold text-white transition-colors truncate group-hover:text-[var(--color-accent-ref)]">
                                    {item.country}
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono truncate italic">
                                    {item.city}
                                </span>
                            </div>

                            {/* Carrier Slot Column - logo size unchanged */}
                            <div className="col-span-4 flex justify-center">
                                <div className="w-16 h-10 bg-white/90 rounded-md flex items-center justify-center border border-white/20 shadow-sm px-2 py-1.5 relative sm:w-24 sm:h-14 sm:px-3 sm:py-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`/images/carriers/logo-${item.carrier.toLowerCase()}.png`}
                                        alt={item.carrier}
                                        className="max-h-full max-w-full object-contain"
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            target.style.display = 'none';
                                            const next = target.nextElementSibling as HTMLElement;
                                            if (next) next.style.display = 'block';
                                        }}
                                    />
                                    <span className="text-[12px] font-black text-neutral-900 hidden uppercase tracking-tighter">
                                        {item.carrier}
                                    </span>
                                </div>
                            </div>

                            {/* Status Column */}
                            <div className="col-span-3 text-right flex flex-col items-end">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-[11px] font-mono font-bold uppercase tracking-tighter ${item.status === 'Available' ? '' : 'text-red-500'}`}
                                        style={item.status === 'Available' ? { color: ACCENT } : undefined}
                                    >
                                        {item.status}
                                    </span>
                                    <div
                                        className={`h-2 w-2 rounded-full ${item.status === 'Suspended' ? 'animate-pulse' : ''}`}
                                        style={
                                            item.status === 'Available'
                                                ? { backgroundColor: ACCENT, boxShadow: `0 0 8px ${ACCENT}99` }
                                                : { backgroundColor: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer info */}
                <div className="bg-black/20 px-3 py-2 border-t border-white/5 sm:px-4">
                    <p className="text-[9px] text-neutral-500 text-center font-mono uppercase tracking-[0.1em]">
                        * Subject to active flight schedules and regional restrictions
                    </p>
                </div>
            </div>
        </div>
    );
}
