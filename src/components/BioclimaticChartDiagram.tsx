import React, { useRef, useEffect } from 'react';

export interface PMVPoint {
  temp: number;
  hum: number;
}

export interface ZoneInfo {
  name: string;
  isComfort: boolean;
  color: string;
  desc: string;
  strategy: string;
}

export const bounds = {
  minTemp: -10,
  maxTemp: 50,
  minHum: 0,
  maxHum: 40,
  padLeft: 80,
  padRight: 60,
  padTop: 50,
  padBottom: 70,
  svgWidth: 800,
  svgHeight: 500,
};

export function tempToSvgX(temp: number): number {
  const ratio = (temp - bounds.minTemp) / (bounds.maxTemp - bounds.minTemp);
  return bounds.padLeft + ratio * (bounds.svgWidth - bounds.padLeft - bounds.padRight);
}

export function humToSvgY(hum: number): number {
  const ratio = (hum - bounds.minHum) / (bounds.maxHum - bounds.minHum);
  return bounds.svgHeight - bounds.padBottom - ratio * (bounds.svgHeight - bounds.padTop - bounds.padBottom);
}

export function svgXToTemp(x: number): number {
  const ratio = (x - bounds.padLeft) / (bounds.svgWidth - bounds.padLeft - bounds.padRight);
  return Math.max(bounds.minTemp, Math.min(bounds.maxTemp, bounds.minTemp + ratio * (bounds.maxTemp - bounds.minTemp)));
}

export function svgYToHum(y: number): number {
  const ratio = (bounds.svgHeight - bounds.padBottom - y) / (bounds.svgHeight - bounds.padTop - bounds.padBottom);
  return Math.max(bounds.minHum, Math.min(bounds.maxHum, bounds.minHum + ratio * (bounds.maxHum - bounds.minHum)));
}

// Saturation Vapour Pressure Curve (Tetens Equation)
export function getSaturationHumidity(tempC: number): number {
  if (tempC < -10) return 1.5;
  const pSat = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const ah = 622 * (pSat / (101.325 - pSat));
  return Math.min(ah, 40);
}

export function getZoneInfo(temp: number, hum: number): ZoneInfo {
  const satH = getSaturationHumidity(temp);
  if (hum > satH + 0.1) {
    return {
      name: 'Supersaturated Area',
      isComfort: false,
      color: '#64748b',
      desc: 'Air humidity exceeds saturation level, causing condensation.',
      strategy: 'Dehumidification and moisture removal required.',
    };
  }

  const effT_green = temp + 0.125 * hum;
  const effT_fan = temp + (4.0 / 24.0) * hum;
  const effT_window = temp + (4.0 / 24.0) * hum;

  if (effT_green >= 21.5 && effT_green <= 27.5) {
    return {
      name: 'Comfort range',
      isComfort: true,
      color: '#22C55E',
      desc: 'Current conditions are thermally comfortable without active HVAC intervention.',
      strategy: 'Comfort range: Current conditions are thermally comfortable without active HVAC intervention.',
    };
  }

  if (effT_green < 21.5) {
    return {
      name: 'Solar gains desired',
      isComfort: false,
      color: '#EF4444',
      desc: 'Low temperature condition requiring passive solar heating or thermal insulation gains.',
      strategy: 'Solar gains: Utilize direct passive solar radiation to heat the indoor space.',
    };
  }

  if (effT_green > 27.5 && effT_fan <= 32.0) {
    return {
      name: 'Increased air speed - fan',
      isComfort: false,
      color: '#EA580C',
      desc: 'Warm thermal condition requiring elevated airflow velocity provided by ceiling or mechanical fans.',
      strategy:
        'Increased air speed – fan: Use ceiling or portable mechanical fans to increase indoor air velocity for convective cooling.',
    };
  }

  if (effT_fan > 32.0 && effT_window <= 33.2) {
    return {
      name: 'Increased air speed - window',
      isComfort: false,
      color: '#F97316',
      desc: 'Elevated temperature where natural cross-ventilation through open windows provides effective convective cooling.',
      strategy:
        'Increased air speed – window: Utilize natural cross-ventilation through open windows to increase indoor air speed.',
    };
  }

  const rightMaxT = 44.0 - (2.0 / 21.0) * hum;
  if (effT_window > 33.2 && temp <= rightMaxT && hum <= 21.0) {
    return {
      name: 'Night vent. + thermal mass',
      isComfort: false,
      color: '#3F3F46',
      desc: 'Hot daytime climate where flushing the building with cool nighttime outdoor air discharges heat stored in structural high-mass elements.',
      strategy:
        'Night ventilation + thermal mass: Flush the building with cool night air to discharge heat stored in high thermal mass construction.',
    };
  }

  return {
    name: 'Extreme / Active Cooling Required',
    isComfort: false,
    color: '#64748b',
    desc: 'Conditions exceed passive cooling capabilities. Mechanical air conditioning and dehumidification are required.',
    strategy: 'Active Cooling & Mechanical HVAC: Operate mechanical HVAC equipment.',
  };
}

export function calculateAdjustments(temp: number, hum: number): { tempAdj: string; humAdj: string } {
  const effT = temp + 0.125 * hum;
  let adjTStr = '0.0 °C (Optimal)';
  const adjHStr = '0.0 g/kg (Optimal)';

  if (effT < 21.5) {
    const diff = (21.5 - effT).toFixed(1);
    adjTStr = `+${diff} °C (Need Heating)`;
  } else if (effT > 27.5) {
    const diff = (effT - 27.5).toFixed(1);
    adjTStr = `-${diff} °C (Need Cooling)`;
  }

  return { tempAdj: adjTStr, humAdj: adjHStr };
}

interface BioclimaticChartDiagramProps {
  point: PMVPoint;
  onChangePoint: (p: PMVPoint) => void;
}

export const BioclimaticChartDiagram: React.FC<BioclimaticChartDiagramProps> = ({
  point,
  onChangePoint,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Compute grid lines and ticks
  const tempGrid = [];
  for (let t = bounds.minTemp; t <= bounds.maxTemp; t += 5) {
    tempGrid.push(t);
  }

  const humGrid = [];
  for (let h = bounds.minHum; h <= bounds.maxHum; h += 5) {
    humGrid.push(h);
  }

  // Saturation curve points
  const satCurvePoints: string[] = [];
  const clipPathPoints: [number, number][] = [[bounds.padLeft, bounds.svgHeight - bounds.padBottom]];

  for (let t = -10; t <= 36.5; t += 0.5) {
    const ah = getSaturationHumidity(t);
    if (ah <= 40) {
      const x = tempToSvgX(t);
      const y = humToSvgY(ah);
      satCurvePoints.push(`${x},${y}`);
      clipPathPoints.push([x, y]);
    }
  }

  clipPathPoints.push([tempToSvgX(50), humToSvgY(40)]);
  clipPathPoints.push([tempToSvgX(50), bounds.svgHeight - bounds.padBottom]);
  clipPathPoints.push([bounds.padLeft, bounds.svgHeight - bounds.padBottom]);

  const satClipD = `M ${clipPathPoints.map((p) => p.join(',')).join(' L ')} Z`;
  const satCurveD = `M ${satCurvePoints.join(' L ')}`;

  // Saturation fill path
  const fillPoints: [number, number][] = [[bounds.padLeft, bounds.svgHeight - bounds.padBottom]];
  for (let t = -10; t <= 36.5; t += 0.5) {
    const ah = getSaturationHumidity(t);
    if (ah <= 40) {
      fillPoints.push([tempToSvgX(t), humToSvgY(ah)]);
    }
  }
  fillPoints.push([tempToSvgX(36.5), bounds.padTop]);
  fillPoints.push([bounds.padLeft, bounds.padTop]);
  const satFillD = `M ${fillPoints.map((p) => p.join(',')).join(' L ')} Z`;

  // Helper to format polygon points
  const formatPoly = (pts: [number, number][]) =>
    pts.map((p) => `${tempToSvgX(p[0])},${humToSvgY(p[1])}`).join(' ');

  // 1. Solar gains desired (Red)
  const zoneSolarPts = formatPoly([
    [-10, 0],
    [21.5, 0],
    [21.5 - 0.125 * 24, 24],
    [-10, 24],
  ]);

  // 2. Comfort range (Green)
  const zoneComfortPts = formatPoly([
    [21.5, 0],
    [27.5, 0],
    [27.5 - 0.125 * 24, 24],
    [21.5 - 0.125 * 24, 24],
  ]);

  // 3. Increased air speed - fan (Darker Orange)
  const zoneFanPts = formatPoly([
    [27.5, 0],
    [32.0, 0],
    [28.0, 24],
    [27.5 - 0.125 * 24, 24],
  ]);

  // 4. Increased air speed - window (Light Orange)
  const zoneWindowPts = formatPoly([
    [32.0, 0],
    [33.2, 0],
    [33.2 - (4.0 / 24.0) * 35, 35],
    [32.0 - (4.0 / 24.0) * 35, 35],
  ]);

  // 5. Night vent + thermal mass (Dark Charcoal)
  const zoneNightPts = formatPoly([
    [33.2, 0],
    [44.0, 0],
    [42.0, 21.0],
    [33.2 - (4.0 / 24.0) * 21.0, 21.0],
  ]);

  // Handle click on chart to pick coordinates
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = bounds.svgWidth / rect.width;
    const scaleY = bounds.svgHeight / rect.height;

    const svgX = clickX * scaleX;
    const svgY = clickY * scaleY;

    if (
      svgX >= bounds.padLeft &&
      svgX <= bounds.svgWidth - bounds.padRight &&
      svgY >= bounds.padTop &&
      svgY <= bounds.svgHeight - bounds.padBottom
    ) {
      const clickTemp = parseFloat(svgXToTemp(svgX).toFixed(1));
      let clickHum = parseFloat(svgYToHum(svgY).toFixed(1));

      const sat = getSaturationHumidity(clickTemp);
      if (clickHum > sat) clickHum = parseFloat(sat.toFixed(1));

      onChangePoint({ temp: clickTemp, hum: clickHum });
    }
  };

  const currentX = tempToSvgX(point.temp);
  const currentY = humToSvgY(point.hum);

  return (
    <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full h-full overflow-y-auto py-2 gap-2.5">
      {/* Top Banner Status */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 px-1">
        <div>
          <div className="text-[11px] font-mono text-emerald-400 tracking-wider flex items-center gap-1">
            <span>&gt;_</span> OLGYAY'S BIOCLIMATIC CHART &amp; FANGER'S PMV COMFORT RANGE
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            03 Bioclimatic Psychrometric Chart &amp; Passive Strategy Analysis
          </h2>
        </div>
        <div className="text-right font-mono text-[11px] text-zinc-500">
          <span>#slide-content-3</span>
          <span className="block text-[10px] text-zinc-600">Click graph or use sliders</span>
        </div>
      </div>

      {/* Psychrometric Interactive SVG Container - Rendered directly on background */}
      <div className="flex-1 w-full flex flex-col justify-between relative overflow-hidden cursor-crosshair min-h-[300px]">
        <svg
          ref={svgRef}
          onClick={handleSvgClick}
          className="w-full h-full"
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="saturationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>

            <clipPath id="satClip">
              <path d={satClipD} />
            </clipPath>
          </defs>

          {/* Background Grid System */}
          <g opacity="0.15" stroke="#71717a" strokeWidth="0.8" strokeDasharray="2,2">
            {tempGrid.map((t) => {
              const x = tempToSvgX(t);
              return (
                <line
                  key={`temp-grid-${t}`}
                  x1={x}
                  y1={bounds.padTop}
                  x2={x}
                  y2={bounds.svgHeight - bounds.padBottom}
                />
              );
            })}
            {humGrid.map((h) => {
              const y = humToSvgY(h);
              return (
                <line
                  key={`hum-grid-${h}`}
                  x1={bounds.padLeft}
                  y1={y}
                  x2={bounds.svgWidth - bounds.padRight}
                  y2={y}
                />
              );
            })}
          </g>

          {/* Zone Polygons Clipped strictly by 100% RH Saturation Boundary */}
          <g clipPath="url(#satClip)">
            {/* 1. Solar Gains Desired (Red) */}
            <polygon points={zoneSolarPts} fill="#EF4444" fillOpacity="0.85" />
            {/* 2. Comfort Range (Green) */}
            <polygon points={zoneComfortPts} fill="#22C55E" fillOpacity="0.9" />
            {/* 3. Increased Air Speed - Fan (Dark Orange) */}
            <polygon points={zoneFanPts} fill="#EA580C" fillOpacity="0.85" />
            {/* 4. Increased Air Speed - Window (Orange) */}
            <polygon points={zoneWindowPts} fill="#F97316" fillOpacity="0.85" />
            {/* 5. Night Vent + Thermal Mass (Dark Gray) */}
            <polygon points={zoneNightPts} fill="#3F3F46" fillOpacity="0.95" />
          </g>

          {/* Saturation / RH 100% Boundary Curve */}
          <path d={satCurveD} fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.9" />
          <path d={satFillD} fill="url(#saturationGrad)" />

          {/* Axis Lines */}
          <line
            x1={bounds.padLeft}
            y1={bounds.svgHeight - bounds.padBottom}
            x2={bounds.svgWidth - bounds.padRight}
            y2={bounds.svgHeight - bounds.padBottom}
            stroke="#a1a1aa"
            strokeWidth="1.5"
          />
          <line
            x1={bounds.svgWidth - bounds.padRight}
            y1={bounds.padTop}
            x2={bounds.svgWidth - bounds.padRight}
            y2={bounds.svgHeight - bounds.padBottom}
            stroke="#a1a1aa"
            strokeWidth="1.5"
          />

          {/* Axis Tick Marks and Values */}
          <g fontFamily="monospace" fontSize="10" fill="#a1a1aa">
            {tempGrid.map((t) => {
              const x = tempToSvgX(t);
              return (
                <text
                  key={`temp-tick-${t}`}
                  x={x}
                  y={bounds.svgHeight - bounds.padBottom + 20}
                  textAnchor="middle"
                >
                  {t}
                </text>
              );
            })}
            {humGrid.map((h) => {
              const y = humToSvgY(h);
              return (
                <text
                  key={`hum-tick-${h}`}
                  x={bounds.svgWidth - bounds.padRight + 15}
                  y={y + 3}
                  textAnchor="start"
                >
                  {h}
                </text>
              );
            })}
          </g>

          {/* Axis Titles */}
          <text
            x={410}
            y={470}
            textAnchor="middle"
            fill="#d4d4d8"
            fontFamily="monospace"
            fontSize="11"
            fontWeight="bold"
          >
            Dry bulb temperature [°C]
          </text>
          <text
            x={775}
            y={240}
            textAnchor="middle"
            fill="#d4d4d8"
            fontFamily="monospace"
            fontSize="11"
            fontWeight="bold"
            transform="rotate(90, 775, 240)"
          >
            Absolute humidity [g_water / kg_air]
          </text>

          {/* Crosshair indicator & marker */}
          <line
            x1={currentX}
            y1={bounds.padTop}
            x2={currentX}
            y2={bounds.svgHeight - bounds.padBottom}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="3,3"
            opacity="0.9"
          />
          <line
            x1={bounds.padLeft}
            y1={currentY}
            x2={bounds.svgWidth - bounds.padRight}
            y2={currentY}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="3,3"
            opacity="0.9"
          />
          <circle cx={currentX} cy={currentY} r="5.5" fill="#ffffff" stroke="#000000" strokeWidth="2" />
        </svg>

        {/* Floating Legend */}
        <div className="absolute bottom-3 left-4 sm:left-24 bg-black/85 backdrop-blur-md border border-zinc-800 rounded px-3 py-2 font-mono text-[10px] space-y-1">
          <div className="text-zinc-400 font-bold mb-1">LEGEND (STRATEGY ZONES):</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2.5 rounded-xs bg-[#22C55E]"></span>
              <span>Comfort range</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2.5 rounded-xs bg-[#EF4444]"></span>
              <span>Solar gains desired</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2.5 rounded-xs bg-[#F97316]"></span>
              <span>Air speed (window)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2.5 rounded-xs bg-[#EA580C]"></span>
              <span>Air speed (fan)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2.5 rounded-xs bg-[#3F3F46]"></span>
              <span>Night vent. + thermal mass</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls: Sliders for Temp and Humidity */}
      <div className="bg-[#141419] border border-zinc-800 p-2.5 rounded-lg font-mono text-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
        <div className="flex-1 flex items-center gap-3">
          <span className="text-zinc-400 text-[11px] whitespace-nowrap">Dry Bulb Temp (DBT):</span>
          <input
            type="range"
            min="-10"
            max="50"
            step="0.5"
            value={point.temp}
            onChange={(e) => onChangePoint({ ...point, temp: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <span className="text-white font-bold w-14 text-right">{point.temp.toFixed(1)} °C</span>
        </div>
        <div className="flex-1 flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-4">
          <span className="text-zinc-400 text-[11px] whitespace-nowrap">Abs. Humidity (AH):</span>
          <input
            type="range"
            min="0"
            max="35"
            step="0.5"
            value={point.hum}
            onChange={(e) => onChangePoint({ ...point, hum: parseFloat(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <span className="text-white font-bold w-16 text-right">{point.hum.toFixed(1)} g/kg</span>
        </div>
      </div>
    </div>
  );
};
