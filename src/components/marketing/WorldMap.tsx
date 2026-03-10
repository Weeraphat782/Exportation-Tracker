'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ComposableMap = dynamic(() => import('react-simple-maps').then(mod => mod.ComposableMap), { ssr: false });
const Geographies = dynamic(() => import('react-simple-maps').then(mod => mod.Geographies), { ssr: false });
const Geography = dynamic(() => import('react-simple-maps').then(mod => mod.Geography), { ssr: false });
const Marker = dynamic(() => import('react-simple-maps').then(mod => mod.Marker), { ssr: false });
const Line = dynamic(() => import('react-simple-maps').then(mod => mod.Line), { ssr: false });

const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";
const thailand: [number, number] = [100.9925, 15.8700];

const destinations = [
    { name: "Switzerland", coords: [8.2275, 46.8182] as [number, number], offset: [0, -12] as [number, number], align: "end" as const },
    { name: "Portugal", coords: [-8.2245, 39.3999] as [number, number], offset: [-10, 0] as [number, number], align: "end" as const },
    { name: "Australia", coords: [133.7751, -25.2744] as [number, number], offset: [0, 22] as [number, number], align: "middle" as const },
    { name: "Czech Republic", coords: [15.4730, 49.8175] as [number, number], offset: [0, -12] as [number, number], align: "start" as const },
    { name: "North Macedonia", coords: [21.7453, 41.6086] as [number, number], offset: [0, 22] as [number, number], align: "middle" as const },
    { name: "South Africa", coords: [22.9375, -30.5595] as [number, number], offset: [0, 22] as [number, number], align: "middle" as const },
    { name: "Uganda", coords: [32.2903, 1.3733] as [number, number], offset: [0, 22] as [number, number], align: "middle" as const },
];

export default function WorldMap() {
    return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-[#0a0f1d] shadow-2xl transition-all duration-500" style={{ height: '550px' }}>
            <style jsx global>{`
                @keyframes lineFlow {
                    from { stroke-dashoffset: 20; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes radarPulse {
                    0% { transform: scale(0.5); opacity: 0.8; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                .animate-line-flow {
                    stroke-dasharray: 4 2;
                    animation: lineFlow 1s linear infinite;
                }
                .radar-ring {
                    animation: radarPulse 2s cubic-bezier(0.21, 0.53, 0.56, 0.8) infinite;
                }
                .radar-ring-delayed {
                    animation: radarPulse 2s cubic-bezier(0.21, 0.53, 0.56, 0.8) infinite 1s;
                }
            `}</style>

            {/* Premium Header Overlay */}
            <div className="absolute left-8 top-8 z-20">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/90 drop-shadow-md">
                        Global Logistics Network
                    </h4>
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-blue-400/60 font-semibold">
                    Live Connections & Active Routes
                </p>
            </div>

            {/* Map Legend */}
            <div className="absolute right-8 bottom-8 z-20 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl transition hover:bg-black/60">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-6 rounded-full bg-gradient-to-r from-blue-500/0 to-blue-500"></div>
                        <span className="text-[10px] font-bold text-white/70 uppercase">Route Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                        <span className="text-[10px] font-bold text-white/70 uppercase">Hub: Thailand</span>
                    </div>
                </div>
            </div>

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 140, center: [20, 20] }}
                width={800}
                height={550}
                className="h-full w-full opacity-80"
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="#161b2e"
                                stroke="#1e293b"
                                strokeWidth={0.5}
                                style={{
                                    default: { outline: 'none' },
                                    hover: { fill: "#1e293b", transition: 'all 250ms', outline: 'none' },
                                    pressed: { outline: 'none' },
                                }}
                            />
                        ))
                    }
                </Geographies>

                {/* Connection Arcs with Glow and Flow */}
                {destinations.map((dest, i) => (
                    <g key={`route-${i}`}>
                        {/* Shadow path for glow */}
                        <Line
                            from={thailand}
                            to={dest.coords}
                            stroke="#3b82f6"
                            strokeWidth={3}
                            strokeLinecap="round"
                            opacity={0.05}
                        />
                        {/* Animated flow line */}
                        <Line
                            from={thailand}
                            to={dest.coords}
                            stroke="url(#lineGradient)"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            className="animate-line-flow"
                        />
                    </g>
                ))}

                {/* Definitions for Gradients */}
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
                        <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {/* Destination Radar Markers */}
                {destinations.map((dest) => (
                    <Marker key={dest.name} coordinates={dest.coords}>
                        {/* Radar Rings - Scaled up */}
                        <circle r={12} fill="transparent" stroke="#3b82f6" strokeWidth={1} className="radar-ring" />
                        <circle r={12} fill="transparent" stroke="#3b82f6" strokeWidth={1} className="radar-ring-delayed" />

                        <circle r={5} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} />
                        <text
                            textAnchor={dest.align}
                            x={dest.offset[0]}
                            y={dest.offset[1]}
                            className="pointer-events-none select-none drop-shadow-xl"
                            style={{ fontFamily: 'Inter, sans-serif', fill: '#cbd5e1', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                        >
                            {dest.name}
                        </text>
                    </Marker>
                ))}

                {/* Thailand Hub - THE MASTER HUB - Scaled up */}
                <Marker coordinates={thailand}>
                    <circle r={18} fill="rgba(34, 197, 94, 0.2)" className="radar-ring" />
                    <circle r={18} fill="rgba(34, 197, 94, 0.1)" className="radar-ring-delayed" />
                    <circle r={8} fill="#22c55e" stroke="#fff" strokeWidth={2.5} className="shadow-2xl" />
                    <text
                        textAnchor="middle"
                        y={-22}
                        style={{ fontFamily: 'Inter, sans-serif', fill: '#fff', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.12em' }}
                    >
                        OMGEXP HUB
                    </text>
                </Marker>
            </ComposableMap>

            {/* High-tech Grid Overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

            {/* Edge Glows */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-transparent to-[#0a0f1d] opacity-40" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a0f1d] via-transparent to-[#0a0f1d] opacity-40" />
        </div>
    );
}
