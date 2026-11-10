import React, { useEffect, useState } from 'react';
import { VisualSlotKey } from '../types/news';

interface EditorialMediaProps {
  visualKey: VisualSlotKey;
  customImageUrl?: string;
  alt: string;
  aspectClass?: string;
}

const GENERATED_IMAGE_MAP: Partial<Record<VisualSlotKey, string>> = {
  army_parade: '/src/assets/images/defence_peacekeeping_hero_1794194052145.jpg',
  airforce_tarmac: '/src/assets/images/airforce_transport_aircraft_1794194054689.jpg',
  police_command: '/src/assets/images/police_traffic_security_1794194056373.jpg',
  ansar_rescue: '/src/assets/images/ansar_civil_defense_1794194056274.jpg',
};

export const EditorialMedia: React.FC<EditorialMediaProps> = ({
  visualKey,
  customImageUrl,
  alt,
  aspectClass = 'aspect-[16/9]',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [customImageUrl, visualKey]);

  const resolvedUrl = customImageUrl?.trim() || GENERATED_IMAGE_MAP[visualKey];

  if (resolvedUrl && !imgFailed) {
    return (
      <div className={`relative w-full overflow-hidden bg-stone-200 ${aspectClass}`}>
        <img
          src={resolvedUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
        />
      </div>
    );
  }

  // Bespoke Copyright-Free Editorial & Technical Vector Illustrations for Navy, BGB, Academy, or Fallback
  return (
    <div
      className={`relative w-full overflow-hidden border border-stone-300/80 ${aspectClass} flex items-center justify-center`}
      role="img"
      aria-label={alt}
    >
      {visualKey === 'navy_frigate' && (
        <div className="relative h-full w-full bg-gradient-to-b from-[#0F243C] via-[#163554] to-[#0B1B2D] p-6 flex flex-col justify-between text-stone-100">
          <div className="flex items-center justify-between text-[11px] font-tabular tracking-widest uppercase text-sky-200/80">
            <span>HYDROGRAPHIC SURVEY · BAY OF BENGAL</span>
            <span>21°25&apos;N 91°50&apos;E</span>
          </div>
          <svg
            viewBox="0 0 600 240"
            className="w-full h-auto max-h-48 stroke-sky-200/90 fill-none"
            strokeWidth="1.5"
          >
            {/* Horizon and Bathymetric Contours */}
            <line x1="0" y1="165" x2="600" y2="165" strokeDasharray="4 4" className="stroke-sky-400/40" />
            <path
              d="M 0 185 Q 150 175 300 185 T 600 185"
              className="stroke-sky-300/50"
              strokeWidth="1.5"
            />
            <path
              d="M 0 205 Q 150 220 300 200 T 600 210"
              className="stroke-sky-400/30"
              strokeWidth="1.2"
            />
            {/* Modern Patrol Frigate Silhouette */}
            <polygon
              points="110,165 480,165 515,138 395,138 375,112 285,112 270,138 130,138"
              className="fill-[#1E446B] stroke-sky-200"
            />
            {/* Bridge & Radar Mast */}
            <polygon points="295,112 355,112 345,82 308,82" className="fill-[#255280] stroke-sky-200" />
            <line x1="326" y1="82" x2="326" y2="48" strokeWidth="2" />
            <line x1="312" y1="60" x2="340" y2="60" strokeWidth="1.8" />
            <circle cx="326" cy="44" r="4" className="fill-amber-300 stroke-none" />
            {/* Sonar Sweep Arcs */}
            <path d="M 326 44 A 45 45 0 0 1 368 62" className="stroke-amber-300/60" strokeWidth="1.2" />
            <path d="M 326 44 A 75 75 0 0 1 395 76" className="stroke-amber-300/35" strokeWidth="1.2" />
            {/* Helipad & Bow Gun */}
            <rect x="425" y="128" width="22" height="10" className="fill-sky-900 stroke-sky-200" />
            <line x1="447" y1="132" x2="472" y2="125" strokeWidth="2" />
          </svg>
          <div className="flex items-center justify-between text-[11px] text-sky-100/75 border-t border-sky-200/15 pt-2">
            <span>ENC BATHYMETRIC CHARTING</span>
            <span>MARITIME SAFETY CORRIDOR</span>
          </div>
        </div>
      )}

      {visualKey === 'bgb_border_tech' && (
        <div className="relative h-full w-full bg-gradient-to-br from-[#143325] via-[#1C4532] to-[#0F261C] p-6 flex flex-col justify-between text-stone-100">
          <div className="flex items-center justify-between text-[11px] font-tabular tracking-widest uppercase text-emerald-200/80">
            <span>RIVERINE &amp; COASTAL SURVEILLANCE</span>
            <span>OPTICAL &amp; THERMAL GRID</span>
          </div>
          <svg viewBox="0 0 600 220" className="w-full h-auto max-h-44 stroke-emerald-200/90 fill-none" strokeWidth="1.5">
            {/* River Delta Contours */}
            <path d="M 20 180 C 160 140, 280 200, 580 155" className="stroke-emerald-300/50" strokeWidth="2" />
            <path d="M 20 198 C 160 158, 280 218, 580 173" className="stroke-emerald-400/30" strokeWidth="1.5" />
            {/* Solar Observation Tower */}
            <line x1="180" y1="165" x2="195" y2="65" strokeWidth="2" />
            <line x1="220" y1="165" x2="205" y2="65" strokeWidth="2" />
            <line x1="185" y1="130" x2="215" y2="130" />
            <line x1="190" y1="95" x2="210" y2="95" />
            <rect x="182" y="50" width="36" height="15" className="fill-emerald-900 stroke-emerald-200" />
            {/* Radar / Thermal Cone */}
            <polygon points="218,57 460,25 460,135" className="fill-emerald-400/10 stroke-emerald-300/40" strokeDasharray="5 5" />
            {/* Patrol Interceptor Craft */}
            <polygon points="350,158 470,158 490,142 365,142" className="fill-emerald-800 stroke-emerald-200" />
            <polygon points="390,142 435,142 425,126 398,126" className="fill-emerald-700 stroke-emerald-200" />
          </svg>
          <div className="flex items-center justify-between text-[11px] text-emerald-100/75 border-t border-emerald-200/15 pt-2">
            <span>BGB &amp; COAST GUARD INTEROPERABILITY</span>
            <span>SOLAR TELEMETRY TOWER</span>
          </div>
        </div>
      )}

      {(visualKey !== 'navy_frigate' && visualKey !== 'bgb_border_tech') && (
        <div className="relative h-full w-full bg-gradient-to-br from-[#27241D] via-[#363229] to-[#1C1917] p-6 flex flex-col justify-between text-stone-100">
          <div className="flex items-center justify-between text-[11px] font-tabular tracking-widest uppercase text-amber-200/80">
            <span>DEFENCE 24 BD · ARCHIVAL GRAPHIC</span>
            <span>STRATEGIC &amp; STEM SYMPOSIUM</span>
          </div>
          <svg viewBox="0 0 600 220" className="w-full h-auto max-h-44 stroke-amber-200/85 fill-none" strokeWidth="1.5">
            <rect x="90" y="45" width="420" height="130" rx="4" className="stroke-stone-400/40" />
            <circle cx="210" cy="110" r="42" className="stroke-amber-300/80" />
            <circle cx="210" cy="110" r="22" className="stroke-amber-200/50" strokeDasharray="3 3" />
            <line x1="280" y1="80" x2="465" y2="80" className="stroke-stone-200/80" strokeWidth="2" />
            <line x1="280" y1="105" x2="435" y2="105" className="stroke-stone-300/60" />
            <line x1="280" y1="130" x2="450" y2="130" className="stroke-stone-300/60" />
            <polyline points="185,110 202,124 235,94" className="stroke-amber-300" strokeWidth="2.5" />
          </svg>
          <div className="flex items-center justify-between text-[11px] text-stone-300/80 border-t border-stone-200/15 pt-2">
            <span>VERIFIED EDITORIAL ILLUSTRATION</span>
            <span>PUBLIC SERVICE ARCHIVE</span>
          </div>
        </div>
      )}
    </div>
  );
};
