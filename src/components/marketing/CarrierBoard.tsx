'use client';

import React from 'react';

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
        <div className="mx-auto w-full max-w-2xl lg:ml-auto animate-fade-in-up stagger-1">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl">
                {/* Header Style FIDS */}
                <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </div>
                        <h3 className="text-sm font-bold tracking-[0.2em] text-blue-400 uppercase font-mono">
                            Live Shipping Status
                        </h3>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                        Real-Time Feed
                    </div>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-white/5 bg-white/5 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                    <div className="col-span-5">Destination</div>
                    <div className="col-span-4 text-center">Carrier</div>
                    <div className="col-span-3 text-right">Status</div>
                </div>

                {/* Board Rows - No internal scroll, show all */}
                <div className="divide-y divide-white/5">
                    {carriers.map((item, idx) => (
                        <div
                            key={idx}
                            className="grid grid-cols-12 gap-2 px-6 py-4 items-center hover:bg-white/5 transition-colors group"
                        >
                            {/* Destination Column */}
                            <div className="col-span-5 flex flex-col min-w-0">
                                <span className="text-base font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                                    {item.country}
                                </span>
                                <span className="text-xs text-neutral-400 font-mono truncate italic">
                                    {item.city}
                                </span>
                            </div>

                            {/* Carrier Slot Column - White background and even Larger */}
                            <div className="col-span-4 flex justify-center">
                                <div className="w-24 h-14 bg-white rounded-lg flex items-center justify-center border border-white/20 shadow-sm px-3 py-2 relative">
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
                                    <span className={`text-[11px] font-mono font-bold uppercase tracking-tighter ${item.status === 'Available' ? 'text-green-400' : 'text-red-500'
                                        }`}>
                                        {item.status}
                                    </span>
                                    <div className={`h-2 w-2 rounded-full ${item.status === 'Available'
                                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                                        : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'
                                        }`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer info */}
                <div className="bg-neutral-900/50 px-6 py-3 border-t border-white/5">
                    <p className="text-[9px] text-neutral-500 text-center font-mono uppercase tracking-[0.1em]">
                        * Subject to active flight schedules and regional restrictions
                    </p>
                </div>
            </div>

            {/* Aesthetic FIDS Details: Shadow accents */}
            <div className="mt-4 flex justify-between px-2">
                <div className="h-1 w-12 bg-neutral-800 rounded-full" />
                <div className="h-1 w-12 bg-neutral-800 rounded-full" />
            </div>
        </div>
    );
}
