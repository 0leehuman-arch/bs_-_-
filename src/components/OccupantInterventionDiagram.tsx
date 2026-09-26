import React from 'react';
import { Sun, Moon, Wind, Flame, Eye } from 'lucide-react';

export interface OccupantState {
  nightFlushing: boolean;
  equipmentOff: boolean;
  shadingDeployed: boolean;
  showSolar: boolean;
  showHeat: boolean;
  showWind: boolean;
}

export function computeThermalMetrics(state: OccupantState) {
  let dbt = 29.5;
  let mrt = 32.5;

  if (state.shadingDeployed) {
    mrt -= 4.0;
  }
  if (state.nightFlushing) {
    mrt -= 3.0;
    dbt -= 2.0;
  }
  if (state.equipmentOff) {
    dbt -= 1.5;
  }

  const top = (dbt + mrt) / 2.0;

  let comfortBadge = {
    text: '✓ Optimal Passive Comfort',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    acNeed: 'None (No AC)',
    acClass: 'text-emerald-400 font-semibold',
    diagTag: 'PASSIVE NEUTRAL',
    diagText:
      'Thermal comfort range (Operative Temp ≤ 26.0°C) achieved via occupant passive interventions. Maintains comfortable indoor conditions without mechanical cooling (No AC).',
  };

  if (top > 28.5) {
    comfortBadge = {
      text: '🚨 Severe Overheating Risk',
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
      acNeed: 'High (Requires AC)',
      acClass: 'text-red-400 font-semibold',
      diagTag: 'HIGH OVERHEATING',
      diagText:
        'Lack of occupant intervention allows continuous direct solar gains and internal heat gains. Structural heat storage increases, requiring continuous air conditioning.',
    };
  } else if (top > 26.0) {
    comfortBadge = {
      text: '⚠️ Borderline Heating Risk',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      acNeed: 'Minimal (Might Require AC)',
      acClass: 'text-amber-400 font-semibold',
      diagTag: 'PARTIAL COMFORT',
      diagText:
        'Partial passive measures applied, but slight overheating risk remains. Activating remaining interventions (Night Flushing or Shading) will achieve full comfort.',
    };
  }

  return { dbt, mrt, top, ...comfortBadge };
}

interface OccupantInterventionDiagramProps {
  state: OccupantState;
  onChangeState: React.Dispatch<React.SetStateAction<OccupantState>>;
}

export const OccupantInterventionDiagram: React.FC<OccupantInterventionDiagramProps> = ({
  state,
  onChangeState,
}) => {
  const metrics = computeThermalMetrics(state);

  const toggleIntervention = (key: 'nightFlushing' | 'equipmentOff' | 'shadingDeployed') => {
    onChangeState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePhenomenon = (key: 'showSolar' | 'showHeat' | 'showWind') => {
    onChangeState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full h-full py-1 gap-2.5 my-auto">
      {/* Top Banner Status Info */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-zinc-500 font-bold">&gt;_</span>
          <span className="text-xs font-bold tracking-wider uppercase text-zinc-200 font-mono">
            06 OCCUPANT INTERVENTION &amp; PASSIVE THERMAL CONTROL
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-zinc-500">
            Est. T<sub>op</sub>:{' '}
            <strong className="text-white font-semibold">{metrics.top.toFixed(1)}°C</strong>
          </span>
          <span className="text-zinc-700">|</span>
          <span className={metrics.acClass}>{metrics.acNeed}</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-2">
          {state.nightFlushing ? (
            <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5 font-mono">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nighttime Mode</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 font-mono">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Daytime Mode</span>
            </span>
          )}

          <span
            className={`px-2.5 py-1 text-xs rounded-full font-medium border font-mono ${metrics.className}`}
          >
            {metrics.text}
          </span>
        </div>

        <div className="text-[11px] font-mono text-zinc-500 hidden sm:block">
          Click buttons below to test passive strategies
        </div>
      </div>

      {/* SVG Section Canvas - Rendered directly on background, centered in screen */}
      <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden my-auto py-1 min-h-[300px]">
        <svg
          viewBox="0 0 800 450"
          className="w-full h-auto max-h-[410px] lg:max-h-[440px] my-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.2" />
            </linearGradient>

            <pattern
              id="concreteHatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#3f3f46" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* Sky / Celestial Body */}
          <g transform="translate(120, 70)">
            {state.nightFlushing ? (
              <>
                <circle r="26" fill="#e2e8f0" opacity="0.9" className="transition-all duration-500" />
                <circle r="38" fill="#38bdf8" opacity="0.15" className="animate-pulse" />
              </>
            ) : (
              <>
                <circle r="28" fill="#fbbf24" opacity="0.85" className="transition-all duration-500" />
                <circle r="44" fill="#f59e0b" opacity="0.15" className="animate-pulse" />
              </>
            )}
          </g>

          {/* Exterior Environment Ground */}
          <path d="M 120 380 L 680 380" stroke="#71717a" strokeWidth="2.5" />
          <rect x="120" y="380" width="560" height="40" fill="url(#concreteHatch)" opacity="0.5" />

          {/* Building Section Structure */}
          <g>
            {/* Heavy Concrete Floor Slab (Thermal Mass) */}
            <rect
              x="220"
              y="350"
              width="440"
              height="30"
              fill="url(#concreteHatch)"
              stroke="#71717a"
              strokeWidth="2"
            />
            {/* Red highlight when thermal mass is absorbing uncooled heat */}
            <rect
              x="220"
              y="350"
              width="440"
              height="30"
              fill="#ef4444"
              opacity={!state.nightFlushing && !state.shadingDeployed && state.showHeat ? 0.35 : 0.0}
              className="transition-opacity duration-500"
            />

            {/* Back Wall Outline */}
            <rect
              x="230"
              y="140"
              width="420"
              height="210"
              fill="none"
              stroke="#3f3f46"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />

            {/* Roof Structure */}
            <path
              d="M 180 140 L 680 140 L 660 110 L 200 110 Z"
              fill="url(#concreteHatch)"
              stroke="#71717a"
              strokeWidth="2"
            />

            {/* Left Facade & Glazing Wall (South Facing) */}
            <rect x="220" y="140" width="20" height="50" fill="#3f3f46" />

            {/* Upper Transom Window Opening */}
            <rect
              x="220"
              y="190"
              width="10"
              height="35"
              fill="#38bdf8"
              opacity="0.3"
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            <line
              x1="225"
              y1="190"
              x2={state.nightFlushing ? 204.9 : 225}
              y2={state.nightFlushing ? 218.7 : 225}
              stroke="#38bdf8"
              strokeWidth="3"
              className="transition-all duration-500"
            />

            {/* Middle Wall Spandrel */}
            <rect x="220" y="225" width="20" height="35" fill="#3f3f46" />

            {/* Lower Main Window Opening */}
            <rect
              x="220"
              y="260"
              width="10"
              height="90"
              fill="#38bdf8"
              opacity="0.3"
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            <line
              x1="225"
              y1="260"
              x2={state.nightFlushing ? 173.4 : 225}
              y2={state.nightFlushing ? 333.7 : 350}
              stroke="#38bdf8"
              strokeWidth="3"
              className="transition-all duration-500"
            />

            {/* Right Rear Wall & Clerestory Window */}
            <rect x="640" y="140" width="20" height="60" fill="#3f3f46" />
            <rect
              x="640"
              y="200"
              width="10"
              height="40"
              fill="#38bdf8"
              opacity="0.3"
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            <line
              x1="645"
              y1="200"
              x2={state.nightFlushing ? 667.9 : 645}
              y2={state.nightFlushing ? 232.8 : 240}
              stroke="#38bdf8"
              strokeWidth="3"
              className="transition-all duration-500"
            />
            <rect x="640" y="240" width="20" height="110" fill="#3f3f46" />

            {/* Ceiling Line */}
            <line x1="240" y1="140" x2="640" y2="140" stroke="#52525b" strokeWidth="3" />
          </g>

          {/* External Shading Device (Roof Overhang + Dynamic Louvers) */}
          <g>
            <rect x="180" y="135" width="50" height="10" fill="#71717a" />
            <g
              opacity={state.shadingDeployed ? 1.0 : 0.0}
              className="transition-opacity duration-500"
            >
              <line x1="205" y1="150" x2="205" y2="350" stroke="#a1a1aa" strokeWidth="2" />
              <line x1="195" y1="170" x2="215" y2="165" stroke="#e4e4e7" strokeWidth="3" />
              <line x1="195" y1="200" x2="215" y2="195" stroke="#e4e4e7" strokeWidth="3" />
              <line x1="195" y1="230" x2="215" y2="225" stroke="#e4e4e7" strokeWidth="3" />
              <line x1="195" y1="270" x2="215" y2="265" stroke="#e4e4e7" strokeWidth="3" />
              <line x1="195" y1="300" x2="215" y2="295" stroke="#e4e4e7" strokeWidth="3" />
              <line x1="195" y1="330" x2="215" y2="325" stroke="#e4e4e7" strokeWidth="3" />
            </g>
          </g>

          {/* Interior Furniture & Equipment */}
          <g>
            {/* Desk */}
            <rect
              x="300"
              y="310"
              width="80"
              height="40"
              fill="#27272a"
              stroke="#3f3f46"
              strokeWidth="1.5"
            />

            {/* Computer Equipment */}
            <g className="transition-all duration-300">
              <rect
                x="322"
                y="270"
                width="36"
                height="28"
                rx="2"
                fill={state.equipmentOff ? '#27272a' : '#ef4444'}
                stroke={state.equipmentOff ? '#3f3f46' : '#f97316'}
                strokeWidth="2"
                className="transition-colors duration-300"
              />
              <rect
                x="325"
                y="273"
                width="30"
                height="22"
                rx="1"
                fill={state.equipmentOff ? '#18181b' : '#f87171'}
                className="transition-colors duration-300"
              />
              <path
                d="M 340 298 L 340 310 M 330 310 L 350 310"
                stroke={state.equipmentOff ? '#3f3f46' : '#f97316'}
                strokeWidth="2"
                className="transition-colors duration-300"
              />
            </g>

            {/* Internal Equipment Heat Radiation Waves */}
            {!state.equipmentOff && state.showHeat && (
              <g className="heat-wave-active">
                <path
                  d="M 330 262 Q 335 252 330 242 T 330 222"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.9"
                />
                <path
                  d="M 340 262 Q 345 252 340 242 T 340 222"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.9"
                />
                <path
                  d="M 350 262 Q 355 252 350 242 T 350 222"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.9"
                />
                <text
                  x="340"
                  y="212"
                  textAnchor="middle"
                  fill="#ef4444"
                  fontSize="11"
                  fontWeight="bold"
                >
                  Internal Heat (+Q)
                </text>
              </g>
            )}

            {/* Occupant Silhouette */}
            <g transform="translate(420, 275)">
              <circle cx="12" cy="10" r="8" fill="#a1a1aa" />
              <path d="M 4 35 C 4 22, 20 22, 20 35 Z" fill="#71717a" />
              <rect x="8" y="35" width="3" height="40" fill="#52525b" />
              <rect x="13" y="35" width="3" height="40" fill="#52525b" />
            </g>
          </g>

          {/* Phenomenon Layer 1: Solar Radiation Rays */}
          {state.showSolar && (
            <g className="transition-opacity duration-500">
              {/* Direct Solar Rays */}
              <g opacity={state.shadingDeployed ? 0.15 : 1.0} className="transition-opacity duration-500">
                <path
                  d="M 145 95 L 290 280"
                  stroke="url(#sunGrad)"
                  strokeWidth="4"
                  strokeDasharray="6,4"
                  className="solar-ray"
                />
                <path
                  d="M 155 80 L 380 350"
                  stroke="url(#sunGrad)"
                  strokeWidth="5"
                  strokeDasharray="6,4"
                  className="solar-ray"
                />
                <polygon points="375,342 385,352 370,352" fill="#f97316" />
              </g>

              {/* Reflected Solar Rays when Shading Deployed */}
              {state.shadingDeployed && (
                <g className="transition-opacity duration-500">
                  <path
                    d="M 155 80 L 205 180"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeDasharray="4,4"
                  />
                  <path
                    d="M 205 180 L 130 190"
                    stroke="#fbbf24"
                    strokeWidth="3"
                    strokeDasharray="4,4"
                  />
                  <polygon points="135,185 125,191 135,196" fill="#fbbf24" />
                  <text x="120" y="175" fill="#fbbf24" fontSize="10" fontWeight="bold">
                    Solar Reflected
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Phenomenon Layer 2: Airflow Streamlines */}
          {state.showWind && (
            <g className="transition-opacity duration-500">
              {state.nightFlushing ? (
                /* Open windows night flush airflow */
                <g className="transition-opacity duration-500">
                  <path
                    d="M 120 310 C 180 310, 210 310, 240 315 C 320 325, 450 330, 560 300 C 610 280, 630 240, 650 220 C 660 210, 700 200, 750 200"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    className="airflow-path"
                  />
                  <path
                    d="M 120 210 C 180 210, 210 205, 240 210 C 350 215, 520 210, 640 215 C 680 215, 710 200, 750 190"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="2.5"
                    className="airflow-path"
                  />
                  <text x="130" y="295" fill="#38bdf8" fontSize="11" fontWeight="bold">
                    Cool Night Air
                  </text>
                  <text x="660" y="180" fill="#38bdf8" fontSize="11" fontWeight="bold">
                    Heat Exhaust
                  </text>
                </g>
              ) : (
                /* Closed windows blocked airflow */
                <g className="transition-opacity duration-500">
                  <path
                    d="M 120 300 L 210 300 C 215 300, 215 280, 205 270"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                  <text x="130" y="285" fill="#64748b" fontSize="10">
                    Windows Closed
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Phenomenon Layer 3: Thermal Mass Heat Storage */}
          {state.showHeat && !state.nightFlushing && !state.shadingDeployed && (
            <g className="transition-opacity duration-500">
              <path d="M 260 350 Q 270 335 280 350" stroke="#ef4444" strokeWidth="2" fill="none" />
              <path d="M 380 350 Q 390 335 400 350" stroke="#ef4444" strokeWidth="2" fill="none" />
              <path d="M 500 350 Q 510 335 520 350" stroke="#ef4444" strokeWidth="2" fill="none" />
              <text x="440" y="342" fill="#ef4444" fontSize="10" fontWeight="bold">
                Stored Structural Heat (High MRT)
              </text>
            </g>
          )}

          {/* Annotations */}
          <g fontSize="11" fill="#94a3b8">
            <text x="235" y="370" fill="#a1a1aa">
              High Thermal Mass Floor Slab
            </text>
            <text x="240" y="130">
              Roof Overhang
            </text>
          </g>
        </svg>
      </div>

      {/* Bottom Interactive Controls (2 Rows: Interventions & Phenomena) */}
      <div className="p-3 border-t border-zinc-800 bg-[#141419]/90 rounded-lg flex flex-col space-y-2.5">
        {/* Row 1: 3 Occupant Intervention Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/80 p-2 rounded-md border border-zinc-800">
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Occupant Interventions:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {/* Intervention 1: Night Flushing */}
            <button
              type="button"
              onClick={() => toggleIntervention('nightFlushing')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all border flex items-center gap-1.5 cursor-pointer ${
                state.nightFlushing
                  ? 'border-white bg-white text-zinc-950 font-bold shadow-md'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  state.nightFlushing ? 'bg-sky-500' : 'bg-zinc-500'
                }`}
              />
              ① Night Flushing
            </button>

            {/* Intervention 2: Turn Off Equipment */}
            <button
              type="button"
              onClick={() => toggleIntervention('equipmentOff')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all border flex items-center gap-1.5 cursor-pointer ${
                state.equipmentOff
                  ? 'border-white bg-white text-zinc-950 font-bold shadow-md'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  state.equipmentOff ? 'bg-orange-500' : 'bg-zinc-500'
                }`}
              />
              ② Turn Off Equipment
            </button>

            {/* Intervention 3: Deploy Shading */}
            <button
              type="button"
              onClick={() => toggleIntervention('shadingDeployed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all border flex items-center gap-1.5 cursor-pointer ${
                state.shadingDeployed
                  ? 'border-white bg-white text-zinc-950 font-bold shadow-md'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  state.shadingDeployed ? 'bg-amber-500' : 'bg-zinc-500'
                }`}
              />
              ③ Deploy Shading
            </button>
          </div>
        </div>

        {/* Row 2: Phenomena Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <span className="text-[11px] font-mono text-zinc-400">Phenomena Views:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => togglePhenomenon('showSolar')}
              className={`px-2.5 py-1 text-[11px] rounded transition-all cursor-pointer font-mono ${
                state.showSolar
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
              }`}
            >
              ☀️ Solar Radiation
            </button>
            <button
              type="button"
              onClick={() => togglePhenomenon('showHeat')}
              className={`px-2.5 py-1 text-[11px] rounded transition-all cursor-pointer font-mono ${
                state.showHeat
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-semibold'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
              }`}
            >
              ♨️ Internal Heat &amp; Mass
            </button>
            <button
              type="button"
              onClick={() => togglePhenomenon('showWind')}
              className={`px-2.5 py-1 text-[11px] rounded transition-all cursor-pointer font-mono ${
                state.showWind
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
              }`}
            >
              💨 Airflow &amp; Wind
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
