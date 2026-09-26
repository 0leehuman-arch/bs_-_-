import React, { useState } from 'react';

type StrategyType = 'daytime' | 'shading' | 'nighttime' | 'thermal_mass';
type ColorKey = 'GREEN' | 'ORANGE' | 'DARK GRAY';

const DATA_TABLE: Record<StrategyType, Record<number, ColorKey[]>> = {
  daytime: {
    20: ['ORANGE', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
    30: ['DARK GRAY', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
    40: ['DARK GRAY', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
    50: ['DARK GRAY', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
    60: ['DARK GRAY', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
    70: ['DARK GRAY', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
    80: ['DARK GRAY', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
  },
  shading: {
    20: ['ORANGE', 'ORANGE', 'ORANGE', 'ORANGE'],
    30: ['DARK GRAY', 'DARK GRAY', 'DARK GRAY', 'ORANGE'],
    40: ['ORANGE', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
    50: ['ORANGE', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
    60: ['ORANGE', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
    70: ['DARK GRAY', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
    80: ['DARK GRAY', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'],
  },
  nighttime: {
    20: ['GREEN', 'GREEN', 'GREEN', 'GREEN'],
    30: ['GREEN', 'GREEN', 'GREEN', 'GREEN'],
    40: ['GREEN', 'GREEN', 'GREEN', 'GREEN'],
    50: ['GREEN', 'GREEN', 'GREEN', 'GREEN'],
    60: ['GREEN', 'ORANGE', 'ORANGE', 'ORANGE'],
    70: ['GREEN', 'ORANGE', 'ORANGE', 'ORANGE'],
    80: ['GREEN', 'ORANGE', 'ORANGE', 'ORANGE'],
  },
  thermal_mass: {
    20: ['GREEN', 'GREEN', 'GREEN', 'GREEN'],
    30: ['GREEN', 'GREEN', 'GREEN', 'GREEN'],
    40: ['GREEN', 'GREEN', 'GREEN', 'GREEN'],
    50: ['GREEN', 'GREEN', 'GREEN', 'GREEN'],
    60: ['GREEN', 'GREEN', 'GREEN', 'GREEN'],
    70: ['GREEN', 'GREEN', 'GREEN', 'GREEN'],
    80: ['GREEN', 'GREEN', 'GREEN', 'GREEN'],
  },
};

const COLOR_MAP: Record<ColorKey, string> = {
  GREEN: '#35B94A',
  ORANGE: '#F47C20',
  'DARK GRAY': '#3f3f46',
};

const SECTION_EXPLANATIONS: Record<StrategyType, string> = {
  daytime: 'DAYTIME VENTILATION: Natural airflow introduced during daytime hours.',
  shading: 'EXTERNAL SHADING: Blocks direct solar heat radiation before penetrating glass.',
  nighttime: 'NIGHTTIME VENTILATION: Cool night air flushes room heat and resets slab mass.',
  thermal_mass: 'THERMAL MASS: High heat capacity structure stores daytime heat gains.',
};

const STRATEGY_LABELS: Record<StrategyType, string> = {
  daytime: 'Daytime ventilation',
  shading: 'Shading',
  nighttime: 'Nighttime ventilation',
  thermal_mass: 'Thermal mass',
};

const WWR_TICKS = [20, 30, 40, 50, 60, 70, 80];

export const PassiveConditioningDiagram: React.FC = () => {
  const [wwr, setWwr] = useState<number>(50);
  const [strategy, setStrategy] = useState<StrategyType>('nighttime');

  // Sector colors lookup
  const sectorColors = DATA_TABLE[strategy][wwr] || ['DARK GRAY', 'DARK GRAY', 'DARK GRAY', 'DARK GRAY'];
  const greenCount = sectorColors.filter((c) => c === 'GREEN').length;
  const orangeCount = sectorColors.filter((c) => c === 'ORANGE').length;
  const grayCount = sectorColors.filter((c) => c === 'DARK GRAY').length;

  let circularInterpretation = '';
  if (greenCount === 4) {
    circularInterpretation = 'All four sectors remain within the no-AC requirement range (<20 kWh).';
  } else if (grayCount === 4) {
    circularInterpretation = 'All four sectors exceed passive threshold and require active AC cooling.';
  } else if (greenCount > 0 && orangeCount > 0 && grayCount === 0) {
    circularInterpretation = 'Some sectors shift into borderline cooling requirement (<1200 kWh).';
  } else {
    circularInterpretation = 'Multiple sectors require active mechanical cooling.';
  }

  // Architectural Section Calculations
  const wallTopY = 39;
  const wallBottomY = 175;
  const totalWallHeight = 136; // 175 - 39

  const windowHeight = totalWallHeight * (wwr / 100);
  const windowTopY = wallTopY + (totalWallHeight - windowHeight) / 2;
  const windowBottomY = windowTopY + windowHeight;

  const rightWallTopHeight = Math.max(0, windowTopY - wallTopY);
  const rightWallBottomY = windowBottomY;
  const rightWallBottomHeight = Math.max(0, wallBottomY - windowBottomY);

  return (
    <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full h-full overflow-y-auto py-2 gap-3">
      {/* Top Banner Status Info */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-zinc-500 font-bold">&gt;_</span>
          <span className="text-xs font-bold tracking-wider uppercase text-zinc-200 font-mono">
            04 PASSIVE CLIMATE ANALYSIS CANVAS
          </span>
        </div>
        <span className="font-mono text-xs text-zinc-400">
          {wwr}% WWR | {STRATEGY_LABELS[strategy].toUpperCase()}
        </span>
      </div>

      {/* Control Panel: WWR Slider & Strategy Select */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#141419] border border-zinc-800 p-3.5 rounded-lg">
        {/* WWR Slider */}
        <div className="flex flex-col gap-1.5 justify-center">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Window-to-Wall Ratio (WWR)
            </span>
            <span className="text-xs font-bold font-mono text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {wwr}%
            </span>
          </div>

          <div className="py-1">
            <input
              type="range"
              min={20}
              max={80}
              step={10}
              value={wwr}
              onChange={(e) => setWwr(parseInt(e.target.value, 10))}
              className="w-full accent-white h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between mt-1 px-0.5">
              {WWR_TICKS.map((tickVal) => (
                <button
                  key={tickVal}
                  type="button"
                  onClick={() => setWwr(tickVal)}
                  className={`text-[11px] font-mono cursor-pointer transition-colors ${
                    wwr === tickVal ? 'text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tickVal}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Passive Design Strategy Select */}
        <div className="flex flex-col gap-1.5 justify-center">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Passive Design Strategy
            </span>
          </div>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as StrategyType)}
            className="w-full py-2 px-3 text-xs font-mono text-zinc-200 bg-[#0c0c0f] border border-zinc-700 rounded focus:border-zinc-500 outline-none cursor-pointer"
          >
            <option value="daytime">Daytime ventilation</option>
            <option value="shading">Shading</option>
            <option value="nighttime">Nighttime ventilation</option>
            <option value="thermal_mass">Thermal mass</option>
          </select>
        </div>
      </div>

      {/* Dual Diagrams Wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-[280px]">
        {/* 1. Circular Analysis Diagram (5 cols) */}
        <div className="md:col-span-5 bg-[#141419] border border-zinc-800 rounded-lg p-3 flex flex-col justify-between items-center">
          <div className="w-full flex justify-between items-center border-b border-zinc-800 pb-1.5 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              1. Circular Analysis Diagram
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Fig 4.11 Sector Matrix</span>
          </div>

          <div className="w-full flex-1 flex items-center justify-center py-2">
            <svg width="190" height="190" viewBox="0 0 220 220">
              <g transform="translate(110, 110)">
                {/* Sector 1: Top-Right (0° to 90°) */}
                <path
                  d="M 0 0 L 0 -95 A 95 95 0 0 1 95 0 Z"
                  fill={COLOR_MAP[sectorColors[0]]}
                  stroke="#08080a"
                  strokeWidth="2"
                  className="transition-colors duration-300"
                />
                {/* Sector 2: Bottom-Right (90° to 180°) */}
                <path
                  d="M 0 0 L 95 0 A 95 95 0 0 1 0 95 Z"
                  fill={COLOR_MAP[sectorColors[1]]}
                  stroke="#08080a"
                  strokeWidth="2"
                  className="transition-colors duration-300"
                />
                {/* Sector 3: Bottom-Left (180° to 270°) */}
                <path
                  d="M 0 0 L 0 95 A 95 95 0 0 1 -95 0 Z"
                  fill={COLOR_MAP[sectorColors[2]]}
                  stroke="#08080a"
                  strokeWidth="2"
                  className="transition-colors duration-300"
                />
                {/* Sector 4: Top-Left (270° to 360°) */}
                <path
                  d="M 0 0 L -95 0 A 95 95 0 0 1 0 -95 Z"
                  fill={COLOR_MAP[sectorColors[3]]}
                  stroke="#08080a"
                  strokeWidth="2"
                  className="transition-colors duration-300"
                />

                {/* Outer Border Line */}
                <circle cx="0" cy="0" r="95" fill="none" stroke="#ededed" strokeWidth="1.5" />
                {/* Divider Lines */}
                <line x1="-95" y1="0" x2="95" y2="0" stroke="#08080a" strokeWidth="1.5" />
                <line x1="0" y1="-95" x2="0" y2="95" stroke="#08080a" strokeWidth="1.5" />
              </g>
            </svg>
          </div>

          <div className="w-full p-2 bg-[#0d0d11] border-l-2 border-white text-[11px] font-mono text-zinc-300 min-h-[2.4rem] flex items-center">
            {circularInterpretation}
          </div>
        </div>

        {/* 2. Architectural Section Diagram (7 cols) */}
        <div className="md:col-span-7 bg-[#141419] border border-zinc-800 rounded-lg p-3 flex flex-col justify-between items-center">
          <div className="w-full flex justify-between items-center border-b border-zinc-800 pb-1.5 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              2. Architectural Section Model
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Spatial Application</span>
          </div>

          <div className="w-full flex-1 flex items-center justify-center py-1">
            <svg width="100%" height="200" viewBox="0 0 320 210" className="max-w-[340px]">
              <defs>
                <pattern
                  id="concrete-pattern"
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#52525b" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Sky / Outdoor Ambient */}
              <rect
                x="10"
                y="10"
                width="300"
                height="190"
                fill={strategy === 'nighttime' ? '#090d14' : '#111115'}
                rx="3"
                className="transition-colors duration-300"
              />

              {/* Room Enclosure */}
              {/* Floor Slab */}
              <rect
                x="35"
                y="175"
                width="225"
                height="14"
                fill="#27272a"
                stroke="#52525b"
                strokeWidth="1"
              />
              {/* Ceiling Slab */}
              <rect
                x="35"
                y="25"
                width="225"
                height="14"
                fill="#27272a"
                stroke="#52525b"
                strokeWidth="1"
              />
              {/* Left Wall */}
              <rect
                x="35"
                y="39"
                width="14"
                height="136"
                fill="#27272a"
                stroke="#52525b"
                strokeWidth="1"
              />

              {/* Thermal Mass Overlays (visible when strategy === 'thermal_mass') */}
              <rect
                x="49"
                y="167"
                width="190"
                height="8"
                fill="url(#concrete-pattern)"
                stroke="#71717a"
                strokeWidth="0.8"
                opacity={strategy === 'thermal_mass' ? 1 : 0}
                className="transition-opacity duration-300"
              />
              <rect
                x="49"
                y="39"
                width="10"
                height="128"
                fill="url(#concrete-pattern)"
                stroke="#71717a"
                strokeWidth="0.8"
                opacity={strategy === 'thermal_mass' ? 1 : 0}
                className="transition-opacity duration-300"
              />

              {/* Exterior Spandrels (Right Wall) */}
              <rect
                x="246"
                y="39"
                width="12"
                height={rightWallTopHeight}
                fill="#27272a"
                className="transition-all duration-300"
              />
              <rect
                x="246"
                y={rightWallBottomY}
                width="12"
                height={rightWallBottomHeight}
                fill="#27272a"
                className="transition-all duration-300"
              />

              {/* Window Glazing & Frame */}
              <line
                x1="252"
                y1={windowTopY}
                x2="252"
                y2={windowBottomY}
                stroke="#38bdf8"
                strokeWidth="3"
                opacity="0.8"
                className="transition-all duration-300"
              />
              <line
                x1="244"
                y1={windowTopY}
                x2="260"
                y2={windowTopY}
                stroke="#e4e4e7"
                strokeWidth="1"
                className="transition-all duration-300"
              />
              <line
                x1="244"
                y1={windowBottomY}
                x2="260"
                y2={windowBottomY}
                stroke="#e4e4e7"
                strokeWidth="1"
                className="transition-all duration-300"
              />

              {/* Seated Silhouette & Furniture */}
              <g stroke="#a1a1aa" strokeWidth="1" fill="none">
                <path d="M 100 150 L 140 150 M 110 150 L 110 175 M 135 150 L 135 175" />
                <path d="M 85 160 L 98 160 M 85 140 L 85 175 M 98 160 L 98 175" />
                <circle cx="91" cy="130" r="4" fill="#a1a1aa" />
                <path d="M 91 134 C 91 142, 89 146, 89 155 L 100 155" stroke="#a1a1aa" strokeWidth="2" />
              </g>

              {/* Dynamic WWR Indicator */}
              <g className="transition-all duration-300">
                <line
                  x1="272"
                  y1={windowTopY}
                  x2="272"
                  y2={windowBottomY}
                  stroke="#71717a"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x="280"
                  y={(windowTopY + windowBottomY) / 2 + 3}
                  fontSize="9"
                  fill="#a1a1aa"
                  fontFamily="monospace"
                >
                  {wwr}%
                </text>
              </g>

              {/* Strategy Overlays */}
              {/* Daytime Ventilation */}
              <g opacity={strategy === 'daytime' ? 1 : 0} className="transition-opacity duration-300">
                <circle cx="285" cy="35" r="9" fill="#F47C20" opacity="0.9" />
                <line
                  x1="252"
                  y1={windowTopY}
                  x2="238"
                  y2={windowTopY + 11}
                  stroke="#ededed"
                  strokeWidth="1.5"
                />
                <line
                  x1="252"
                  y1={windowBottomY}
                  x2="238"
                  y2={windowBottomY - 11}
                  stroke="#ededed"
                  strokeWidth="1.5"
                />
                <path
                  className="airflow-path"
                  d="M 290 90 Q 240 80, 160 105 T 45 80"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
              </g>

              {/* External Shading */}
              <g opacity={strategy === 'shading' ? 1 : 0} className="transition-opacity duration-300">
                <circle cx="288" cy="30" r="9" fill="#F47C20" />
                <rect x="235" y="48" width="28" height="4" fill="#ededed" />
                <line
                  x1="238"
                  y1="52"
                  x2="238"
                  y2="128"
                  stroke="#ededed"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
                <line
                  x1="280"
                  y1="36"
                  x2="246"
                  y2="52"
                  stroke="#F47C20"
                  strokeWidth="1.5"
                />
                <line
                  x1="285"
                  y1="42"
                  x2="242"
                  y2="70"
                  stroke="#F47C20"
                  strokeWidth="1.5"
                />
              </g>

              {/* Nighttime Ventilation */}
              <g opacity={strategy === 'nighttime' ? 1 : 0} className="transition-opacity duration-300">
                <path d="M 285 25 A 8 8 0 1 0 293 35 A 6 6 0 1 1 285 25 Z" fill="#F4D03F" />
                <line
                  x1="252"
                  y1={windowTopY}
                  x2="238"
                  y2={windowTopY + 11}
                  stroke="#ededed"
                  strokeWidth="1.5"
                />
                <line
                  x1="252"
                  y1={windowBottomY}
                  x2="238"
                  y2={windowBottomY - 11}
                  stroke="#ededed"
                  strokeWidth="1.5"
                />
                <path
                  className="airflow-path"
                  d="M 290 105 Q 240 115, 150 145 T 50 135"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
                <path
                  className="heat-wave airflow-path"
                  d="M 100 155 Q 150 100, 240 65 T 290 50"
                  fill="none"
                  stroke="#F47C20"
                  strokeWidth="1.5"
                />
              </g>

              {/* Thermal Mass */}
              <g opacity={strategy === 'thermal_mass' ? 1 : 0} className="transition-opacity duration-300">
                <circle cx="285" cy="35" r="8" fill="#F47C20" />
                <path
                  className="heat-wave"
                  d="M 150 110 L 150 160"
                  stroke="#F47C20"
                  strokeWidth="1.5"
                  fill="none"
                />
                <polygon points="147,155 150,163 153,155" fill="#F47C20" />
                <path
                  className="heat-wave"
                  d="M 90 85 L 56 85"
                  stroke="#F47C20"
                  strokeWidth="1.5"
                  fill="none"
                />
                <polygon points="60,82 52,85 60,88" fill="#F47C20" />
              </g>
            </svg>
          </div>

          <div className="w-full p-2 bg-[#0d0d11] border-l-2 border-white text-[11px] font-mono text-zinc-300 min-h-[2.4rem] flex items-center">
            {SECTION_EXPLANATIONS[strategy]}
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between bg-[#141419] border border-zinc-800 px-4 py-2 rounded-lg text-xs font-mono">
        <span className="text-zinc-500 text-[11px]">COOLING REQUIREMENT LEGEND:</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-zinc-300 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-xs bg-[#35B94A]" />
            <span>No AC required (&lt;20 kWh)</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-xs bg-[#F47C20]" />
            <span>Might require AC (&lt;1200 kWh)</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-xs bg-[#3f3f46]" />
            <span>Requires AC</span>
          </div>
        </div>
      </div>
    </div>
  );
};
