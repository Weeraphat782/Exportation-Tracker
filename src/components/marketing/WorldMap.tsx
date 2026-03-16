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

const PRIMARY = '#215497';
const PRIMARY_DARK = '#1a4279';
const ACCENT = '#5BBF21';
const ACCENT_LIGHT = '#86ef6c';

export default function WorldMap() {
    return (
        <div
            className="relative h-[300px] w-full overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 sm:h-[450px] lg:h-[550px]"
            style={{ background: `linear-gradient(135deg, ${PRIMARY_DARK} 0%, ${PRIMARY} 50%, #0f2847 100%)` }}
        >
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
            <div className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: ACCENT }} />
                        <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: ACCENT }} />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/90 drop-shadow-md">
                        Global Logistics Network
                    </h4>
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-widest font-semibold" style={{ color: `${ACCENT}99` }}>
                    Live Connections & Active Routes
                </p>
            </div>

            {/* Map Legend */}
            <div className="absolute right-4 bottom-4 z-20 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl transition hover:bg-black/60 sm:right-8 sm:bottom-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-6 rounded-full" style={{ background: `linear-gradient(to right, transparent, ${ACCENT})` }} />
                        <span className="text-[10px] font-bold text-white/70 uppercase">Route Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
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
                                fill={PRIMARY_DARK}
                                stroke="#2a5a9e"
                                strokeWidth={0.5}
                                style={{
                                    default: { outline: 'none' },
                                    hover: { fill: '#2a5a9e', transition: 'all 250ms', outline: 'none' },
                                    pressed: { outline: 'none' },
                                }}
                            />
                        ))
                    }
                </Geographies>

                {/* Definitions for Gradients */}
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity="0.2" />
                        <stop offset="50%" stopColor={ACCENT_LIGHT} stopOpacity="1" />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {/* Connection Arcs with Glow and Flow */}
                {destinations.map((dest, i) => (
                    <g key={`route-${i}`}>
                        {/* Shadow path for glow */}
                        <Line
                            from={thailand}
                            to={dest.coords}
                            stroke={ACCENT}
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

                {/* Destination Radar Markers */}
                {destinations.map((dest) => (
                    <Marker key={dest.name} coordinates={dest.coords}>
                        <circle r={12} fill="transparent" stroke={ACCENT} strokeWidth={1} className="radar-ring" />
                        <circle r={12} fill="transparent" stroke={ACCENT} strokeWidth={1} className="radar-ring-delayed" />
                        <circle r={5} fill="#fff" stroke={ACCENT} strokeWidth={1.5} />
                        <text
                            textAnchor={dest.align}
                            x={dest.offset[0]}
                            y={dest.offset[1]}
                            className="pointer-events-none select-none drop-shadow-xl"
                            style={{ fontFamily: 'Inter, sans-serif', fill: '#e2e8f0', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                        >
                            {dest.name}
                        </text>
                    </Marker>
                ))}

                {/* Thailand Hub */}
                <Marker coordinates={thailand}>
                    <circle r={18} fill={`${ACCENT}33`} className="radar-ring" />
                    <circle r={18} fill={`${ACCENT}1a`} className="radar-ring-delayed" />
                    <circle r={8} fill={ACCENT} stroke="#fff" strokeWidth={2.5} className="shadow-2xl" />
                    <text
                        textAnchor="middle"
                        y={-22}
                        style={{ fontFamily: 'Inter, sans-serif', fill: '#fff', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.12em' }}
                    >
                        Thailand
                    </text>
                </Marker>
            </ComposableMap>

            {/* High-tech Grid Overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

            {/* Edge Glows */}
            <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: `linear-gradient(to bottom, ${PRIMARY_DARK}, transparent 20%, transparent 80%, ${PRIMARY_DARK})` }} />
            <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: `linear-gradient(to right, ${PRIMARY_DARK}, transparent 20%, transparent 80%, ${PRIMARY_DARK})` }} />
        </div>
    );
}
