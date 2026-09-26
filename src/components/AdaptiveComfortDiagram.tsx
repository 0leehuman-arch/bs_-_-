import React, { useRef } from 'react';

export interface AdaptiveComfortPoint {
  trm: number; // Prevailing mean outdoor temp
  top: number; // Indoor operative temp
}

export interface ComfortLimits {
  center: number;
  lower80: number;
  upper80: number;
  lower90: number;
  upper90: number;
}

export function getComfortLimits(trm: number): ComfortLimits {
  const tcomf = 0.31 * trm + 17.8;
  return {
    center: tcomf,
    lower80: tcomf - 3.5,
    upper80: tcomf + 3.5,
    lower90: tcomf - 2.5,
    upper90: tcomf + 2.5,
  };
}

export interface ComfortDiagnosis {
  badgeText: string;
  badgeClass: string;
  desc: string;
  adjValue: string;
  adjClass: string;
  adjText: string;
  indicatorClass: string;
}

export function analyzeAdaptiveComfort(trm: number, top: number): ComfortDiagnosis {
  const limits = getComfortLimits(trm);

  if (top <= limits.upper90 && top >= limits.lower90) {
    return {
      badgeText: '90% Acceptability Limits',
      badgeClass: 'text-[#3F8032] border-[#3F8032]/40 bg-[#3F8032]/10',
      desc: 'Located within the optimal comfort range. The vast majority of occupants are thermally satisfied.',
      adjValue: 'Optimal (0.0 °C)',
      adjClass: 'text-zinc-400',
      adjText: 'The temperature is within the target comfort range. No indoor temperature adjustment is needed.',
      indicatorClass: 'bg-[#3F8032]',
    };
  } else if (top <= limits.upper80 && top >= limits.lower80) {
    return {
      badgeText: '80% Acceptability Limits',
      badgeClass: 'text-[#A0BA43] border-[#A0BA43]/40 bg-[#A0BA43]/10',
      desc: 'Located within the standard comfort range. Acceptable to at least 80% of the occupants.',
      adjValue: 'Acceptable (0.0 °C)',
      adjClass: 'text-zinc-400',
      adjText: 'Within the acceptable comfort limits. Additional HVAC intervention is optional.',
      indicatorClass: 'bg-[#A0BA43]',
    };
  } else if (top > limits.upper80) {
    const needToDrop = (top - limits.upper80).toFixed(1);
    return {
      badgeText: 'NON-COMFORT (Overheating)',
      badgeClass: 'text-red-400 border-red-500/40 bg-red-950/20',
      desc: 'Temperature exceeds comfort limits. Increased airflow, shading deployment, or mechanical cooling is required.',
      adjValue: `-${needToDrop} °C`,
      adjClass: 'text-red-400 font-bold',
      adjText: `The indoor temperature is too high. To enter the comfort zone (80% limits), the operative temperature must be lowered by at least ${needToDrop}°C.`,
      indicatorClass: 'bg-red-500',
    };
  } else {
    const needToRaise = (limits.lower80 - top).toFixed(1);
    return {
      badgeText: 'NON-COMFORT (Underheating)',
      badgeClass: 'text-blue-400 border-blue-500/40 bg-blue-950/20',
      desc: 'Temperature is below comfort limits. Increased solar gains or mechanical heating is required.',
      adjValue: `+${needToRaise} °C`,
      adjClass: 'text-blue-400 font-bold',
      adjText: `The indoor temperature is too low. To enter the comfort zone (80% limits), the operative temperature must be raised by at least ${needToRaise}°C.`,
      indicatorClass: 'bg-blue-500',
    };
  }
}

interface AdaptiveComfortDiagramProps {
  point: AdaptiveComfortPoint;
  onChangePoint: (p: AdaptiveComfortPoint) => void;
}

export const AdaptiveComfortDiagram: React.FC<AdaptiveComfortDiagramProps> = ({
  point,
  onChangePoint,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG dimensions & coordinate scales
  const svgW = 740;
  const svgH = 430;
  const margin = { top: 30, right: 35, bottom: 65, left: 65 };
  const innerW = svgW - margin.left - margin.right;
  const innerH = svgH - margin.top - margin.bottom;

  const dataMinX = 10;
  const dataMaxX = 34;
  const dataMinY = 14;
  const dataMaxY = 34;

  const mapX = (val: number) => margin.left + ((val - dataMinX) / (dataMaxX - dataMinX)) * innerW;
  const mapY = (val: number) => margin.top + innerH - ((val - dataMinY) / (dataMaxY - dataMinY)) * innerH;

  const invMapX = (px: number) => {
    const val = dataMinX + ((px - margin.left) / innerW) * (dataMaxX - dataMinX);
    return Math.max(10, Math.min(33.5, val));
  };

  const invMapY = (py: number) => {
    const val = dataMinY + ((margin.top + innerH - py) / innerH) * (dataMaxY - dataMinY);
    return Math.max(14, Math.min(34, val));
  };

  // Grid steps
  const xTicks = [];
  for (let x = dataMinX; x <= dataMaxX; x += 2) {
    xTicks.push(x);
  }

  const yTicks = [];
  for (let y = dataMinY; y <= dataMaxY; y += 2) {
    yTicks.push(y);
  }

  // Polygon bounds: 10 to 33.5
  const pX_start = 10;
  const pX_end = 33.5;
  const limitsStart = getComfortLimits(pX_start);
  const limitsEnd = getComfortLimits(pX_end);

  const poly80 = `
    ${mapX(pX_start)},${mapY(limitsStart.lower80)} 
    ${mapX(pX_end)},${mapY(limitsEnd.lower80)} 
    ${mapX(pX_end)},${mapY(limitsEnd.upper80)} 
    ${mapX(pX_start)},${mapY(limitsStart.upper80)}
  `;

  const poly90 = `
    ${mapX(pX_start)},${mapY(limitsStart.lower90)} 
    ${mapX(pX_end)},${mapY(limitsEnd.lower90)} 
    ${mapX(pX_end)},${mapY(limitsEnd.upper90)} 
    ${mapX(pX_start)},${mapY(limitsStart.upper90)}
  `;

  const currentPx = mapX(point.trm);
  const currentPy = mapY(point.top);

  // SVG click handler
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleX = svgW / rect.width;
    const scaleY = svgH / rect.height;

    const px = mouseX * scaleX;
    const py = mouseY * scaleY;

    if (
      px >= margin.left &&
      px <= margin.left + innerW &&
      py >= margin.top &&
      py <= margin.top + innerH
    ) {
      const newTrm = parseFloat(invMapX(px).toFixed(1));
      const newTop = parseFloat(invMapY(py).toFixed(1));
      onChangePoint({ trm: newTrm, top: newTop });
    }
  };

  const diagnosis = analyzeAdaptiveComfort(point.trm, point.top);

  return (
    <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full h-full py-2 gap-2.5">
      {/* Header matching other slides */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 px-1 shrink-0">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5 font-mono">
            &gt;_ INTERACTIVE DIAGRAM CANVAS CONTAINER
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
            04 Adaptive Thermal Comfort
          </h1>
          <p className="text-xs text-zinc-400">
            ASHRAE 55 Occupant comfort limits (80%, 90% Acceptability) and real-time positional analysis.
          </p>
        </div>
        <div className="px-2.5 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs rounded font-mono shrink-0">
          #slide-content-5
        </div>
      </div>

      {/* SVG Canvas - Rendered directly on background without nested black box */}
      <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden cursor-crosshair min-h-[290px] my-auto">
        <svg
          ref={svgRef}
          onClick={handleSvgClick}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto max-h-[380px] lg:max-h-[410px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background Grid */}
          <g opacity="0.18">
            {xTicks.map((x) => (
              <line
                key={`grid-x-${x}`}
                x1={mapX(x)}
                y1={margin.top}
                x2={mapX(x)}
                y2={margin.top + innerH}
                stroke="#71717a"
                strokeWidth="1"
              />
            ))}
            {yTicks.map((y) => (
              <line
                key={`grid-y-${y}`}
                x1={margin.left}
                y1={mapY(y)}
                x2={margin.left + innerW}
                y2={mapY(y)}
                stroke="#71717a"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* 80% Acceptability Area (Light Green) */}
          <polygon points={poly80} fill="#A0BA43" fillOpacity="0.88" stroke="none" />

          {/* 90% Acceptability Area (Dark Green) */}
          <polygon points={poly90} fill="#3F8032" fillOpacity="0.95" stroke="none" />

          {/* Axis Lines */}
          <line
            x1={margin.left}
            y1={margin.top + innerH}
            x2={margin.left + innerW}
            y2={margin.top + innerH}
            stroke="#a1a1aa"
            strokeWidth="1.8"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + innerH}
            stroke="#a1a1aa"
            strokeWidth="1.8"
          />

          {/* X & Y Tick Labels */}
          <g fontFamily="monospace" fontSize="10" fill="#a1a1aa">
            {xTicks.map((x) => (
              <text
                key={`lbl-x-${x}`}
                x={mapX(x)}
                y={margin.top + innerH + 18}
                textAnchor="middle"
              >
                {x}
              </text>
            ))}
            {yTicks.map((y) => (
              <text
                key={`lbl-y-${y}`}
                x={margin.left - 12}
                y={mapY(y) + 3}
                textAnchor="end"
              >
                {y}
              </text>
            ))}
          </g>

          {/* Axis Titles */}
          <text
            x={margin.left + innerW / 2}
            y={margin.top + innerH + 42}
            fill="#d4d4d8"
            fontFamily="monospace"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
          >
            Prevailing mean outdoor temperature [°C]
          </text>
          <text
            x={margin.left - 42}
            y={margin.top + innerH / 2}
            fill="#d4d4d8"
            fontFamily="monospace"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(-90 ${margin.left - 42} ${margin.top + innerH / 2})`}
          >
            Operative temperature [°C]
          </text>

          {/* Interactive Cursor / Target */}
          <g>
            {/* Dashed Crosshairs */}
            <line
              x1={currentPx}
              y1={margin.top}
              x2={currentPx}
              y2={margin.top + innerH}
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeDasharray="4,4"
              opacity="0.8"
            />
            <line
              x1={margin.left}
              y1={currentPy}
              x2={margin.left + innerW}
              y2={currentPy}
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeDasharray="4,4"
              opacity="0.8"
            />

            {/* Target Halo */}
            <circle
              cx={currentPx}
              cy={currentPy}
              r="13"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.4"
            />

            {/* Center Point */}
            <circle
              cx={currentPx}
              cy={currentPy}
              r="5.5"
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="2"
              className="transition-all duration-75"
            />
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 px-4 py-1 shrink-0 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#3F8032] border border-[#2b5a22]"></div>
          <span className="text-zinc-300 font-semibold">90% acceptability limits</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#A0BA43] border border-[#839836]"></div>
          <span className="text-zinc-300 font-semibold">80% acceptability limits</span>
        </div>
      </div>

      {/* Interaction Controls (Sliders) */}
      <div className="bg-[#141419] border border-zinc-800 p-3 rounded-lg flex flex-col sm:flex-row gap-4 shrink-0 font-mono text-xs">
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-zinc-400 font-semibold text-[11px]">
              Prevailing Mean Outdoor Temp (T_rm)
            </span>
            <span className="text-white font-bold bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {point.trm.toFixed(1)} °C
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={33.5}
            step={0.1}
            value={point.trm}
            onChange={(e) =>
              onChangePoint({ ...point, trm: parseFloat(e.target.value) })
            }
            className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg mt-1"
          />
        </div>

        <div className="flex-1 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-zinc-400 font-semibold text-[11px]">
              Indoor Operative Temp (T_op)
            </span>
            <span className="text-white font-bold bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {point.top.toFixed(1)} °C
            </span>
          </div>
          <input
            type="range"
            min={14}
            max={34}
            step={0.1}
            value={point.top}
            onChange={(e) =>
              onChangePoint({ ...point, top: parseFloat(e.target.value) })
            }
            className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg mt-1"
          />
        </div>
      </div>
    </div>
  );
};
