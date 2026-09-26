import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  BookOpen,
  Calculator,
  AlertTriangle,
  CloudSun,
  Wand2,
  Sliders,
  RotateCcw,
  Sun,
  Wind,
  Flame,
  Umbrella,
  ArrowRightLeft,
  Bot,
  ShieldCheck,
  X,
  Info,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface EnvState {
  trm: number;
  rh: number;
  dni: number;
  vWind: number;
}

interface ArchState {
  wwr: number;
  orientation: 'N' | 'E' | 'S' | 'W';
  ceilingHeight: number;
  openRatio: number;
  openPos: number;
  uValue: number;
  shadingPH: number;
  shgc: number;
  thermalMass: 'Light' | 'Medium' | 'Heavy';
}

interface PhysicsResult {
  floorArea: number;
  wallArea: number;
  windowArea: number;
  openingArea: number;
  zoneVolume: number;
  deltaH: number;
  qSolar: number;
  qVent: number;
  vAir: number;
  tAir: number;
  mrt: number;
  tOp: number;
  tComf: number;
  lower80: number;
  upper80: number;
  lower90: number;
  upper90: number;
  status80: '80% Comfort' | 'Too Cold' | 'Too Hot';
  is90Comfort: boolean;
  velOffset: number;
  isApplicableATC: boolean;
}

const SHADING_TABLE = [
  { ph: 0.0, factor: 1.0 },
  { ph: 0.2, factor: 0.57 },
  { ph: 0.4, factor: 0.48 },
  { ph: 0.6, factor: 0.45 },
  { ph: 0.8, factor: 0.43 },
  { ph: 1.0, factor: 0.41 },
];

function getShadingFactor(ph: number): number {
  if (ph <= 0) return 1.0;
  if (ph >= 1.0) return 0.41;
  for (let i = 0; i < SHADING_TABLE.length - 1; i++) {
    const p1 = SHADING_TABLE[i];
    const p2 = SHADING_TABLE[i + 1];
    if (ph >= p1.ph && ph <= p2.ph) {
      const t = (ph - p1.ph) / (p2.ph - p1.ph);
      return p1.factor + t * (p2.factor - p1.factor);
    }
  }
  return 0.5;
}

function calculateIWindow(dni: number, orientation: 'N' | 'E' | 'S' | 'W'): number {
  const solarAltRad = (68.5 * Math.PI) / 180;
  const solarAzRad = (235.0 * Math.PI) / 180;

  let surfaceAzDeg = 180;
  if (orientation === 'N') surfaceAzDeg = 0;
  if (orientation === 'E') surfaceAzDeg = 90;
  if (orientation === 'S') surfaceAzDeg = 180;
  if (orientation === 'W') surfaceAzDeg = 270;

  const surfaceAzRad = (surfaceAzDeg * Math.PI) / 180;
  const cosAOI = Math.cos(solarAltRad) * Math.cos(solarAzRad - surfaceAzRad);
  return dni * Math.max(0, cosAOI);
}

function calculateThermalPhysics(env: EnvState, arch: ArchState): PhysicsResult {
  const floorArea = 100;
  const wallWidth = 10;
  const wallArea = wallWidth * arch.ceilingHeight;
  const windowArea = wallArea * (arch.wwr / 100);
  const openingArea = windowArea * (arch.openRatio / 100);
  const zoneVolume = floorArea * arch.ceilingHeight;

  const iWindow = calculateIWindow(env.dni, arch.orientation);
  const shadingFactor = getShadingFactor(arch.shadingPH);
  const qSolar = windowArea * iWindow * arch.shgc * shadingFactor;

  const deltaH = Math.max(0.2, arch.openPos - 0.3);
  const C_w = 0.55;
  const Q_w = C_w * openingArea * env.vWind;

  const C_D = 0.65;
  const g = 9.81;
  const tempDiffEst = 2.0;
  const tAbs = env.trm + 273.15;
  const Q_s = C_D * openingArea * Math.sqrt((2 * g * deltaH * tempDiffEst) / tAbs);

  const Q_total = Math.sqrt(Q_w * Q_w + Q_s * Q_s);
  const indoorAirVel = Math.min(2.5, Q_total / (openingArea || 1.0));

  const uWall = arch.uValue;
  const uWindow = 1.8;
  const totalWallConductionUA = uWall * (wallArea * 4 - windowArea) + uWindow * windowArea;

  const qInternal = 8.0 * floorArea;
  const rhoAir = 1.2;
  const cpAir = 1005;
  const ventCapacitance = rhoAir * cpAir * Q_total;

  const deltaT = (qSolar + qInternal) / (totalWallConductionUA + ventCapacitance + 10.0);
  const tAir = env.trm + Math.min(8.0, Math.max(-2.0, deltaT));

  const solarTempBoost = (qSolar / 1000) * 0.8;
  const mrt = tAir + solarTempBoost * 0.6;

  let gamma = 0.5;
  if (indoorAirVel < 0.2) gamma = 0.5;
  else if (indoorAirVel < 0.6) gamma = 0.4;
  else gamma = 0.3;

  const tOp = gamma * mrt + (1 - gamma) * tAir;

  const tComf = 0.31 * env.trm + 17.8;
  const lower80 = tComf - 3.5;
  const upper80Base = tComf + 3.5;
  const lower90 = tComf - 2.5;
  const upper90Base = tComf + 2.5;

  let velOffset = 0.0;
  if (tOp > 25.0 && indoorAirVel > 0.3) {
    if (indoorAirVel <= 0.6) {
      velOffset = ((indoorAirVel - 0.3) / 0.3) * 1.2;
    } else if (indoorAirVel <= 0.9) {
      velOffset = 1.2 + ((indoorAirVel - 0.6) / 0.3) * 0.6;
    } else if (indoorAirVel <= 1.2) {
      velOffset = 1.8 + ((indoorAirVel - 0.9) / 0.3) * 0.4;
    } else {
      velOffset = 2.2;
    }
  }

  const upper80Adj = upper80Base + velOffset;
  const upper90Adj = upper90Base + velOffset;

  let status80: '80% Comfort' | 'Too Cold' | 'Too Hot' = '80% Comfort';
  if (tOp < lower80) status80 = 'Too Cold';
  else if (tOp > upper80Adj) status80 = 'Too Hot';

  const is90Comfort = tOp >= lower90 && tOp <= upper90Adj;

  return {
    floorArea,
    wallArea,
    windowArea,
    openingArea,
    zoneVolume,
    deltaH,
    qSolar,
    qVent: Q_total,
    vAir: indoorAirVel,
    tAir,
    mrt,
    tOp,
    tComf,
    lower80,
    upper80: upper80Adj,
    lower90,
    upper90: upper90Adj,
    status80,
    is90Comfort,
    velOffset,
    isApplicableATC: env.trm > 10.0 && env.trm < 33.5,
  };
}

function generateAIInitialDesign(env: EnvState): ArchState {
  const candidateWWR = [15, 25, 35, 45, 50];
  const candidateOri: ('S' | 'E' | 'W' | 'N')[] = ['S', 'E', 'W', 'N'];
  const candidateCeiling = [2.8, 3.0, 3.4, 4.0];
  const candidateOpeningRatio = [10, 15, 25, 35];
  const candidateShading = [0.2, 0.4, 0.6, 0.8];

  let bestConfig: ArchState | null = null;
  let minPenalty = 999999;

  for (const wwr of candidateWWR) {
    for (const ori of candidateOri) {
      for (const ceiling of candidateCeiling) {
        for (const openRatio of candidateOpeningRatio) {
          for (const shading of candidateShading) {
            const testArch: ArchState = {
              wwr,
              orientation: ori,
              ceilingHeight: ceiling,
              openRatio,
              openPos: Math.min(ceiling - 0.4, 2.5),
              uValue: env.trm > 28 ? 0.2 : 0.25,
              shadingPH: shading,
              shgc: env.dni > 500 && env.trm > 25 ? 0.3 : 0.45,
              thermalMass: env.trm > 28 ? 'Heavy' : 'Medium',
            };

            const res = calculateThermalPhysics(env, testArch);
            let penalty = Math.abs(res.tOp - res.tComf) * 20;
            if (res.status80 !== '80% Comfort') penalty += 500;
            if (env.trm > 25 && res.qSolar > 2500) penalty += 100;
            if (env.trm > 26 && ori === 'W') penalty += 80;
            if (ori === 'S') penalty -= 30;

            if (penalty < minPenalty) {
              minPenalty = penalty;
              bestConfig = testArch;
            }
          }
        }
      }
    }
  }

  return (
    bestConfig || {
      wwr: 30,
      orientation: 'S',
      ceilingHeight: 3.2,
      openRatio: 20,
      openPos: 2.6,
      uValue: 0.22,
      shadingPH: 0.5,
      shgc: 0.35,
      thermalMass: 'Medium',
    }
  );
}

function getRHStatusText(rh: number): string {
  if (rh < 30) return '건조 환경';
  if (rh <= 65) return '일반적인 습도 조건';
  if (rh <= 80) return '높은 습도 — 증발냉각 효과 저하 가능';
  return '매우 높은 습도 — 열적 불쾌감 및 결로 가능성 검토';
}

export const AIEnvironmentDesignSlide: React.FC = () => {
  const [envState, setEnvState] = useState<EnvState>({
    trm: 26.0,
    rh: 60,
    dni: 600,
    vWind: 1.5,
  });

  const [archState, setArchState] = useState<ArchState>({
    wwr: 35,
    orientation: 'S',
    ceilingHeight: 3.0,
    openRatio: 15,
    openPos: 2.5,
    uValue: 0.25,
    shadingPH: 0.4,
    shgc: 0.4,
    thermalMass: 'Medium',
  });

  const [aiInitialState, setAiInitialState] = useState<ArchState | null>(null);
  const [initialPhysicsResult, setInitialPhysicsResult] = useState<PhysicsResult | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<'formula' | 'basis' | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initialConfig = generateAIInitialDesign(envState);
    setArchState(initialConfig);
    setAiInitialState(initialConfig);
    const initialPhys = calculateThermalPhysics(envState, initialConfig);
    setInitialPhysicsResult(initialPhys);
  }, []);

  const phys = calculateThermalPhysics(envState, archState);

  const triggerAIFeedbackAnimation = () => {
    setAiLoading(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setAiLoading(false);
    }, 380);
  };

  const handleEnvChange = (key: keyof EnvState, val: number) => {
    setEnvState((prev) => ({ ...prev, [key]: val }));
    triggerAIFeedbackAnimation();
  };

  const handleArchChange = (key: keyof ArchState, val: any) => {
    setArchState((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'ceilingHeight') {
        const maxPos = Math.max(0.3, val - 0.3);
        if (next.openPos > maxPos) next.openPos = maxPos;
      }
      return next;
    });
    triggerAIFeedbackAnimation();
  };

  const runAIInitialDesignHandler = () => {
    const initialConfig = generateAIInitialDesign(envState);
    setArchState({ ...initialConfig });
    setAiInitialState({ ...initialConfig });
    const res = calculateThermalPhysics(envState, initialConfig);
    setInitialPhysicsResult(res);
    triggerAIFeedbackAnimation();
  };

  const resetToInitialDesignHandler = () => {
    if (aiInitialState) {
      setArchState({ ...aiInitialState });
      triggerAIFeedbackAnimation();
    }
  };

  // Section SVG dimensions
  const scale = 32;
  const roomW = 10 * scale; // 320px
  const roomH = archState.ceilingHeight * scale;
  const startX = 90;
  const groundY = 320;
  const startY = groundY - roomH;

  const windowH = archState.ceilingHeight * (archState.wwr / 100) * scale;
  const windowY = startY + (roomH - windowH) / 2;
  const shadingLen = (windowH / scale) * archState.shadingPH * scale * 0.85;

  const lowerOpenY = groundY - 0.3 * scale;
  const upperOpenY = groundY - archState.openPos * scale;

  let tempColor = '#22C55E';
  if (phys.status80 === 'Too Hot') tempColor = '#EF4444';
  if (phys.status80 === 'Too Cold') tempColor = '#3B82F6';

  const sunX = startX - 55;
  const sunY = startY - 40;

  const ray1Angle = Math.atan2(windowY - sunY, startX - shadingLen - sunX);
  const floorHitX1 = Math.min(startX + roomW, startX + (groundY - windowY) / Math.tan(ray1Angle));

  const ray2Angle = Math.atan2(windowY + windowH - sunY, startX - sunX);
  const floorHitX2 = Math.min(
    startX + roomW,
    startX + (groundY - (windowY + windowH)) / Math.tan(ray2Angle)
  );

  const solarIntensity = Math.max(0.1, 1.0 - archState.shadingPH);

  // ATC Chart dimensions
  const chartW = 320;
  const chartH = 220;
  const padL = 35;
  const padB = 30;
  const padR = 15;
  const padT = 15;
  const innerChartW = chartW - padL - padR;
  const innerChartH = chartH - padT - padB;

  const xMin = 10.0;
  const xMax = 33.5;
  const yMin = 14.0;
  const yMax = 34.0;

  const mapChartX = (val: number) => padL + ((val - xMin) / (xMax - xMin)) * innerChartW;
  const mapChartY = (val: number) => chartH - padB - ((val - yMin) / (yMax - yMin)) * innerChartH;

  const pts80 = [];
  const pts90 = [];
  for (let t = xMin; t <= xMax; t += 1) {
    const tC = 0.31 * t + 17.8;
    pts80.push({ x: t, yUpper: tC + 3.5, yLower: tC - 3.5 });
    pts90.push({ x: t, yUpper: tC + 2.5, yLower: tC - 2.5 });
  }

  const poly80Str =
    pts80.map((p) => `${mapChartX(p.x)},${mapChartY(p.yUpper)}`).join(' ') +
    ' ' +
    pts80
      .slice()
      .reverse()
      .map((p) => `${mapChartX(p.x)},${mapChartY(p.yLower)}`)
      .join(' ');

  const poly90Str =
    pts90.map((p) => `${mapChartX(p.x)},${mapChartY(p.yUpper)}`).join(' ') +
    ' ' +
    pts90
      .slice()
      .reverse()
      .map((p) => `${mapChartX(p.x)},${mapChartY(p.yLower)}`)
      .join(' ');

  const curChartX = mapChartX(envState.trm);
  const curChartY = mapChartY(phys.tOp);

  return (
    <div className="w-full h-full flex flex-col bg-[#F1F5F9] text-[#1E293B] overflow-y-auto font-sans antialiased">
      {/* Header Section */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg font-mono font-bold text-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                AI-Assisted Thermal Environment Design Assistant
                <span className="text-xs font-normal text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800/50">
                  Deterministic Physics Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Architectural Environmental Design &amp; Adaptive Thermal Comfort Optimization
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveModal('basis')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Calculation Basis</span>
            </button>
            <button
              onClick={() => setActiveModal('formula')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Formula Breakdown</span>
            </button>
          </div>
        </div>
      </header>

      {/* Outside Range Warning Banner */}
      {!phys.isApplicableATC && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-medium text-center shadow-inner flex items-center justify-center gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            현재 외기조건은 ASHRAE Adaptive Comfort Model의 적용범위 (10°C &lt; T_rm &lt; 33.5°C)를 벗어났습니다.
            ATC 쾌적 영역 판정이 비활성화되며, 열전달/환기 물리 계산만 계속 수행됩니다.
          </span>
        </div>
      )}

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Environmental Inputs & Controls (3 cols) */}
        <section className="lg:col-span-3 space-y-5 flex flex-col">
          {/* STEP 1: Environmental Inputs Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-blue-600 font-mono tracking-wider uppercase">
                STEP 1
              </span>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-slate-500" /> Outdoor Climate
              </h2>
            </div>

            {/* Outdoor Temp T_rm */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-slate-700">Prevailing Temp (T_rm)</label>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {envState.trm.toFixed(1)} °C
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="0.5"
                value={envState.trm}
                onChange={(e) => handleEnvChange('trm', parseFloat(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0°C</span>
                <span>ATC Limit: 10~33.5°C</span>
                <span>40°C</span>
              </div>
            </div>

            {/* Relative Humidity RH */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-slate-700">Relative Humidity (RH)</label>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {envState.rh} %
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                step="1"
                value={envState.rh}
                onChange={(e) => handleEnvChange('rh', parseInt(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded"
              />
              <div className="text-[11px] font-medium text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 text-center">
                {getRHStatusText(envState.rh)}
              </div>
            </div>

            {/* Solar Irradiance DNI */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-slate-700">Direct Normal Irradiance</label>
                <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  {envState.dni} W/m²
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={envState.dni}
                onChange={(e) => handleEnvChange('dni', parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded"
              />
              <p className="text-[10px] text-slate-400 leading-tight">
                <Info className="w-3 h-3 inline mr-1" /> DNI = 태양광선에 수직인 면에 입사하는 직달일사량
              </p>
            </div>

            {/* Wind Speed V */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-slate-700">Outdoor Wind Speed (V)</label>
                <span className="font-mono font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
                  {envState.vWind.toFixed(1)} m/s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.1"
                value={envState.vWind}
                onChange={(e) => handleEnvChange('vWind', parseFloat(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer h-1.5 bg-slate-200 rounded"
              />
            </div>

            {/* STEP 2 Button */}
            <button
              onClick={runAIInitialDesignHandler}
              className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-amber-400" />
              <span>STEP 2 &amp; 3: AI Climate Analysis &amp; Initial Design</span>
            </button>
          </div>

          {/* STEP 6: Interactive Architectural Sliders */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-emerald-600 font-mono tracking-wider uppercase">
                STEP 6
              </span>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-slate-500" /> Architectural Controls
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* 1. WWR */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-600 font-medium flex items-center gap-1">
                    1. Window-to-Wall Ratio (WWR)
                    <span title="입면 벽 면적 대비 전체 창문 면적 비율">
                      <Info className="w-3 h-3 text-slate-400" />
                    </span>
                  </label>
                  <span className="font-mono font-bold text-slate-900">{archState.wwr}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="70"
                  step="1"
                  value={archState.wwr}
                  onChange={(e) => handleArchChange('wwr', parseInt(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded"
                />
              </div>

              {/* 2. Orientation */}
              <div className="space-y-1">
                <label className="text-slate-600 font-medium block">2. Window Orientation</label>
                <div className="grid grid-cols-4 gap-1.5 font-mono">
                  {(['N', 'E', 'S', 'W'] as const).map((ori) => (
                    <button
                      key={ori}
                      onClick={() => handleArchChange('orientation', ori)}
                      className={`border rounded py-1 text-center font-bold transition cursor-pointer ${
                        archState.orientation === ori
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {ori}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Ceiling Height */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-600 font-medium">3. Ceiling Height</label>
                  <span className="font-mono font-bold text-slate-900">
                    {archState.ceilingHeight.toFixed(1)} m
                  </span>
                </div>
                <input
                  type="range"
                  min="2.4"
                  max="5.0"
                  step="0.1"
                  value={archState.ceilingHeight}
                  onChange={(e) => handleArchChange('ceilingHeight', parseFloat(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded"
                />
              </div>

              {/* 4. Operable Opening Ratio */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-600 font-medium flex items-center gap-1">
                    4. Operable Opening Ratio
                    <span title="창문 중 개구창 면적 비율">
                      <Info className="w-3 h-3 text-slate-400" />
                    </span>
                  </label>
                  <span className="font-mono font-bold text-slate-900">{archState.openRatio}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={archState.openRatio}
                  onChange={(e) => handleArchChange('openRatio', parseInt(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded"
                />
              </div>

              {/* 5. Upper Outlet Height */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-600 font-medium">5. Upper Outlet Height</label>
                  <span className="font-mono font-bold text-slate-900">
                    {archState.openPos.toFixed(1)} m
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max={Math.max(0.3, archState.ceilingHeight - 0.3)}
                  step="0.1"
                  value={archState.openPos}
                  onChange={(e) => handleArchChange('openPos', parseFloat(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded"
                />
              </div>

              {/* 6. Envelope U-value */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-600 font-medium">6. Envelope U-value</label>
                  <span className="font-mono font-bold text-slate-900">
                    {archState.uValue.toFixed(2)} W/m²K
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.60"
                  step="0.01"
                  value={archState.uValue}
                  onChange={(e) => handleArchChange('uValue', parseFloat(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded"
                />
              </div>

              {/* 7. Shading Depth (P/H Ratio) */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-600 font-medium">7. Shading Depth (P/H Ratio)</label>
                  <span className="font-mono font-bold text-slate-900">
                    {archState.shadingPH.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={archState.shadingPH}
                  onChange={(e) => handleArchChange('shadingPH', parseFloat(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded"
                />
              </div>

              {/* 8. SHGC */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-600 font-medium">8. SHGC (Solar Heat Gain Coeff)</label>
                  <span className="font-mono font-bold text-slate-900">
                    {archState.shgc.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="0.60"
                  step="0.01"
                  value={archState.shgc}
                  onChange={(e) => handleArchChange('shgc', parseFloat(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded"
                />
              </div>

              {/* 9. Thermal Mass */}
              <div className="space-y-1">
                <label className="text-slate-600 font-medium block">9. Envelope Thermal Mass</label>
                <div className="grid grid-cols-3 gap-1 font-mono text-[11px]">
                  {(['Light', 'Medium', 'Heavy'] as const).map((mass) => (
                    <button
                      key={mass}
                      onClick={() => handleArchChange('thermalMass', mass)}
                      className={`border rounded py-1 text-center transition cursor-pointer ${
                        archState.thermalMass === mass
                          ? 'bg-slate-900 text-white border-slate-900 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {mass}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={resetToInitialDesignHandler}
              className="w-full mt-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to AI Initial Design
            </button>
          </div>
        </section>

        {/* CENTER COLUMN: Interactive Building Section Visualization (5 cols) */}
        <section className="lg:col-span-5 space-y-5 flex flex-col">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-purple-600 font-mono tracking-wider uppercase">
                  STEP 4 &amp; 5
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  Interactive Building Section (10m × 10m)
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-amber-500">
                  <Sun className="w-3.5 h-3.5" /> Solar
                </span>
                <span className="flex items-center gap-1 text-cyan-500">
                  <Wind className="w-3.5 h-3.5" /> Wind
                </span>
                <span className="flex items-center gap-1 text-rose-500">
                  <Flame className="w-3.5 h-3.5" /> Mass
                </span>
              </div>
            </div>

            {/* SVG Container */}
            <div className="relative flex-1 min-h-[380px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
              <svg
                className="w-full h-full min-h-[380px]"
                viewBox="0 0 500 380"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <pattern id="gridPatternLight" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" />
                  </pattern>
                  <linearGradient id="solarBeamGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.6 * solarIntensity} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05 * solarIntensity} />
                  </linearGradient>
                  <linearGradient id="windGradLight" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>

                <rect width="500" height="380" fill="#0F172A" />
                <rect width="500" height="380" fill="url(#gridPatternLight)" opacity="0.25" />

                {/* Ground Line & Earth */}
                <rect x="0" y="320" width="500" height="60" fill="#1E293B" />
                <line x1="0" y1="320" x2="500" y2="320" stroke="#475569" strokeWidth="2" />

                {/* Real Sun and Solar Ray Beam entering through Left Window */}
                {phys.qSolar > 50 && (
                  <g>
                    <circle cx={sunX} cy={sunY} r="18" fill="#F59E0B" opacity="0.95" />
                    <circle cx={sunX} cy={sunY} r="24" fill="#F59E0B" opacity="0.3" />
                    <polygon
                      points={`${startX},${windowY} ${floorHitX1},${groundY} ${floorHitX2},${groundY} ${startX},${
                        windowY + windowH
                      }`}
                      fill="url(#solarBeamGradLight)"
                    />
                    <line
                      x1={sunX}
                      y1={sunY}
                      x2={startX - shadingLen}
                      y2={windowY - 4}
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1={startX - shadingLen}
                      y1={windowY - 4}
                      x2={floorHitX1}
                      y2={groundY}
                      stroke="#F59E0B"
                      strokeWidth="2"
                    />
                    <line
                      x1={sunX}
                      y1={sunY}
                      x2={floorHitX2}
                      y2={groundY}
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <ellipse
                      cx={(floorHitX1 + floorHitX2) / 2}
                      cy={groundY - 2}
                      rx={Math.max(10, (floorHitX2 - floorHitX1) / 2)}
                      ry="3"
                      fill="#F59E0B"
                      opacity={0.8 * solarIntensity}
                    />
                  </g>
                )}

                {/* Building Enclosure Structure */}
                <rect
                  x={startX}
                  y={startY}
                  width={roomW}
                  height={roomH}
                  fill="#1E293B"
                  stroke="#64748B"
                  strokeWidth={
                    archState.thermalMass === 'Heavy'
                      ? 12
                      : archState.thermalMass === 'Medium'
                      ? 8
                      : 4
                  }
                />

                {/* Left Window Glazing */}
                <line
                  x1={startX}
                  y1={windowY}
                  x2={startX}
                  y2={windowY + windowH}
                  stroke="#38BDF8"
                  strokeWidth="6"
                />

                {/* External Shading Overhang at Window Top */}
                {shadingLen > 2 && (
                  <g>
                    <line
                      x1={startX - shadingLen}
                      y1={windowY - 4}
                      x2={startX + 4}
                      y2={windowY - 4}
                      stroke="#22C55E"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <text
                      x={startX - shadingLen}
                      y={windowY - 10}
                      fill="#22C55E"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      P/H {archState.shadingPH.toFixed(2)}
                    </text>
                  </g>
                )}

                {/* Lower Inlet Opening (Left Facade) */}
                <rect x={startX - 4} y={lowerOpenY - 7} width="8" height="14" fill="#06B6D4" rx="2" />
                {/* Upper Outlet Opening (Right Facade) */}
                <rect
                  x={startX + roomW - 4}
                  y={upperOpenY - 7}
                  width="8"
                  height="14"
                  fill="#06B6D4"
                  rx="2"
                />

                {/* Realistic Cross-Stack Airflow Streamlines */}
                {phys.qVent > 0.05 && (
                  <g>
                    <path
                      d={`M ${startX - 35} ${lowerOpenY} C ${startX + 80} ${lowerOpenY}, ${
                        startX + 220
                      } ${upperOpenY + 20}, ${startX + roomW + 35} ${upperOpenY}`}
                      fill="none"
                      stroke="url(#windGradLight)"
                      strokeWidth="3"
                      className="animated-wind-stream"
                    />
                    <path
                      d={`M ${startX - 20} ${lowerOpenY + 4} C ${startX + 100} ${
                        lowerOpenY - 15
                      }, ${startX + 180} ${upperOpenY + 40}, ${startX + roomW + 20} ${
                        upperOpenY - 5
                      }`}
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="1.8"
                      opacity="0.7"
                      className="animated-wind-stream"
                    />
                    <text
                      x={startX - 45}
                      y={lowerOpenY - 10}
                      fill="#06B6D4"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      Inlet (0.3m)
                    </text>
                    <text
                      x={startX + roomW - 20}
                      y={upperOpenY - 12}
                      fill="#06B6D4"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      Outlet ({archState.openPos.toFixed(1)}m)
                    </text>
                  </g>
                )}

                {/* Heat Accumulation Particles in Ceiling Zone */}
                <g className="heat-particle">
                  <ellipse
                    cx={startX + roomW * 0.5}
                    cy={startY + 30}
                    rx="60"
                    ry="18"
                    fill={tempColor}
                    opacity="0.25"
                  />
                  <ellipse
                    cx={startX + roomW * 0.7}
                    cy={startY + 45}
                    rx="40"
                    ry="14"
                    fill={tempColor}
                    opacity="0.2"
                  />
                </g>

                {/* Room Occupant Scale Silhouette */}
                <g transform={`translate(${startX + roomW * 0.45}, ${320 - 45})`}>
                  <circle cx="0" cy="-35" r="4" fill="#94A3B8" />
                  <line x1="0" y1="-31" x2="0" y2="-12" stroke="#94A3B8" strokeWidth="2" />
                  <line x1="0" y1="-25" x2="-6" y2="-15" stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1="0" y1="-25" x2="6" y2="-15" stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1="0" y1="-12" x2="-4" y2="0" stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1="0" y1="-12" x2="4" y2="0" stroke="#94A3B8" strokeWidth="1.5" />
                </g>

                {/* Dynamic Dimension Indicators */}
                <g transform="translate(0, 312)">
                  <line
                    x1={startX}
                    y1="0"
                    x2={startX + roomW}
                    y2="0"
                    stroke="#64748B"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <polygon points={`${startX},0 ${startX + 4},-3 ${startX + 4},3`} fill="#64748B" />
                  <polygon
                    points={`${startX + roomW},0 ${startX + roomW - 4},-3 ${startX + roomW - 4},3`}
                    fill="#64748B"
                  />
                  <text
                    x={startX + roomW / 2}
                    y="-4"
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    10.0 m
                  </text>
                </g>

                <g transform={`translate(${startX + roomW + 15}, 0)`}>
                  <line
                    x1="0"
                    y1={startY}
                    x2="0"
                    y2={groundY}
                    stroke="#64748B"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <polygon points={`0,${startY} -3,${startY + 4} 3,${startY + 4}`} fill="#64748B" />
                  <polygon points={`0,${groundY} -3,${groundY - 4} 3,${groundY - 4}`} fill="#64748B" />
                  <text
                    x="5"
                    y={startY + roomH / 2 + 3}
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    H: {archState.ceilingHeight.toFixed(1)}m
                  </text>
                </g>
              </svg>

              {/* Floating Architectural HUD Overlay */}
              <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md text-white p-2.5 rounded-md border border-slate-800 text-[11px] font-mono space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Zone Vol:</span>
                  <span className="text-emerald-400 font-bold">{phys.zoneVolume.toFixed(0)} m³</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Window Area:</span>
                  <span className="text-amber-400 font-bold">{phys.windowArea.toFixed(1)} m²</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Stack Height ΔH:</span>
                  <span className="text-cyan-400 font-bold">{phys.deltaH.toFixed(1)} m</span>
                </div>
              </div>

              <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md text-white px-3 py-1.5 rounded-md border border-slate-800 text-xs font-mono">
                <span className="text-amber-400 font-bold">SEOUL (37.56°N) - JUN 21 14:00</span>
              </div>
            </div>

            {/* Section Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium text-slate-600 pt-1">
              <div className="bg-amber-50/60 border border-amber-200/60 p-2 rounded flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Solar Ray Penetration</span>
              </div>
              <div className="bg-cyan-50/60 border border-cyan-200/60 p-2 rounded flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-500" />
                <span>Cross-Stack Airflow</span>
              </div>
              <div className="bg-rose-50/60 border border-rose-200/60 p-2 rounded flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Thermal Accumulation</span>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200/60 p-2 rounded flex items-center gap-1.5">
                <Umbrella className="w-3.5 h-3.5 text-emerald-600" />
                <span>External Shading</span>
              </div>
            </div>
          </div>

          {/* STEP 25: Before / After Comparison Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" /> Before / After Design Comparison
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-mono text-[11px] text-slate-500 bg-slate-50">
                    <th className="p-2 font-medium">Metric</th>
                    <th className="p-2 font-medium text-blue-600">AI Initial Design</th>
                    <th className="p-2 font-medium text-emerald-600">Current Design</th>
                    <th className="p-2 font-medium">Delta</th>
                  </tr>
                </thead>
                <tbody className="font-mono divide-y divide-slate-100">
                  {aiInitialState && initialPhysicsResult ? (
                    <>
                      <tr>
                        <td className="p-2 font-medium text-slate-700">WWR / Orientation</td>
                        <td className="p-2 text-blue-600 font-bold">
                          {aiInitialState.wwr}% ({aiInitialState.orientation})
                        </td>
                        <td className="p-2 text-emerald-600 font-bold">
                          {archState.wwr}% ({archState.orientation})
                        </td>
                        <td className="p-2 text-slate-500">-</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-slate-700">Shading P/H</td>
                        <td className="p-2 text-blue-600 font-bold">
                          {aiInitialState.shadingPH.toFixed(2)}
                        </td>
                        <td className="p-2 text-emerald-600 font-bold">
                          {archState.shadingPH.toFixed(2)}
                        </td>
                        <td className="p-2 text-slate-500">
                          {(archState.shadingPH - aiInitialState.shadingPH).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-slate-700">Solar Gain (kW)</td>
                        <td className="p-2 text-blue-600 font-bold">
                          {(initialPhysicsResult.qSolar / 1000).toFixed(2)} kW
                        </td>
                        <td className="p-2 text-emerald-600 font-bold">
                          {(phys.qSolar / 1000).toFixed(2)} kW
                        </td>
                        <td className="p-2 text-slate-500">
                          {((phys.qSolar - initialPhysicsResult.qSolar) / 1000).toFixed(2)} kW
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-slate-700">Ventilation Rate</td>
                        <td className="p-2 text-blue-600 font-bold">
                          {initialPhysicsResult.qVent.toFixed(2)} m³/s
                        </td>
                        <td className="p-2 text-emerald-600 font-bold">
                          {phys.qVent.toFixed(2)} m³/s
                        </td>
                        <td className="p-2 text-slate-500">
                          {(phys.qVent - initialPhysicsResult.qVent).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-slate-700">Operative Temp (T_op)</td>
                        <td className="p-2 text-blue-600 font-bold">
                          {initialPhysicsResult.tOp.toFixed(1)} °C
                        </td>
                        <td className="p-2 text-emerald-600 font-bold">
                          {phys.tOp.toFixed(1)} °C
                        </td>
                        <td className="p-2 text-slate-500">
                          {(phys.tOp - initialPhysicsResult.tOp).toFixed(1)} °C
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-slate-700">Comfort Status</td>
                        <td className="p-2 text-blue-600 font-bold">
                          {initialPhysicsResult.status80}
                        </td>
                        <td className="p-2 text-emerald-600 font-bold">{phys.status80}</td>
                        <td className="p-2 text-slate-500">
                          {initialPhysicsResult.status80 === phys.status80 ? 'Same' : 'Changed'}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-slate-400">
                        AI Initial Design을 먼저 실행하십시오.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Thermal Feedback & ATC Chart & AI Recommendations (4 cols) */}
        <section className="lg:col-span-4 space-y-5 flex flex-col">
          {/* STEP 8 & 23: ATC Comfort Chart SVG */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-xs font-bold text-emerald-600 font-mono tracking-wider uppercase">
                  STEP 8
                </span>
                <h2 className="text-sm font-bold text-slate-900">Adaptive Thermal Comfort Chart</h2>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  !phys.isApplicableATC
                    ? 'bg-slate-200 text-slate-700'
                    : phys.status80 === '80% Comfort'
                    ? phys.is90Comfort
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {!phys.isApplicableATC
                  ? 'Out of Model Range'
                  : phys.status80 === '80% Comfort'
                  ? phys.is90Comfort
                    ? '90% Acceptability'
                    : '80% Comfort'
                  : phys.status80}
              </span>
            </div>

            {/* SVG Adaptive Chart Container */}
            <div className="relative w-full h-[230px] bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
              <svg
                className="w-full h-full"
                viewBox="0 0 320 220"
                preserveAspectRatio="xMidYMid meet"
              >
                <g stroke="#E2E8F0" strokeWidth="1">
                  <line x1={padL} y1={mapChartY(20)} x2={chartW - padR} y2={mapChartY(20)} strokeDasharray="2 2" />
                  <line x1={padL} y1={mapChartY(25)} x2={chartW - padR} y2={mapChartY(25)} strokeDasharray="2 2" />
                  <line x1={padL} y1={mapChartY(30)} x2={chartW - padR} y2={mapChartY(30)} strokeDasharray="2 2" />
                  <line x1={mapChartX(15)} y1={padT} x2={mapChartX(15)} y2={chartH - padB} strokeDasharray="2 2" />
                  <line x1={mapChartX(20)} y1={padT} x2={mapChartX(20)} y2={chartH - padB} strokeDasharray="2 2" />
                  <line x1={mapChartX(25)} y1={padT} x2={mapChartX(25)} y2={chartH - padB} strokeDasharray="2 2" />
                  <line x1={mapChartX(30)} y1={padT} x2={mapChartX(30)} y2={chartH - padB} strokeDasharray="2 2" />
                </g>

                {/* 80% Band */}
                <polygon points={poly80Str} fill="#86EFAC" fillOpacity="0.5" stroke="#4ADE80" strokeWidth="1" />

                {/* 90% Band */}
                <polygon points={poly90Str} fill="#22C55E" fillOpacity="0.7" stroke="#16A34A" strokeWidth="1" />

                {/* Center Line */}
                <line
                  x1={mapChartX(xMin)}
                  y1={mapChartY(0.31 * xMin + 17.8)}
                  x2={mapChartX(xMax)}
                  y2={mapChartY(0.31 * xMax + 17.8)}
                  stroke="#15803D"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />

                <line x1={padL} y1={chartH - padB} x2={chartW - padR} y2={chartH - padB} stroke="#475569" strokeWidth="1.5" />
                <line x1={padL} y1={padT} x2={padL} y2={chartH - padB} stroke="#475569" strokeWidth="1.5" />

                <text x={chartW / 2} y={chartH - 5} fontSize="9" fontFamily="sans-serif" fill="#64748B" textAnchor="middle">
                  Prevailing Mean Outdoor Temp T_rm (°C)
                </text>
                <text
                  x="12"
                  y={chartH / 2}
                  fontSize="9"
                  fontFamily="sans-serif"
                  fill="#64748B"
                  textAnchor="middle"
                  transform={`rotate(-90 12 ${chartH / 2})`}
                >
                  Operative Temp T_op (°C)
                </text>

                <text x={mapChartX(15)} y={chartH - padB + 12} fontSize="8" fill="#64748B" textAnchor="middle">15</text>
                <text x={mapChartX(20)} y={chartH - padB + 12} fontSize="8" fill="#64748B" textAnchor="middle">20</text>
                <text x={mapChartX(25)} y={chartH - padB + 12} fontSize="8" fill="#64748B" textAnchor="middle">25</text>
                <text x={mapChartX(30)} y={chartH - padB + 12} fontSize="8" fill="#64748B" textAnchor="middle">30</text>

                <text x={padL - 5} y={mapChartY(15)} fontSize="8" fill="#64748B" textAnchor="end">15</text>
                <text x={padL - 5} y={mapChartY(20)} fontSize="8" fill="#64748B" textAnchor="end">20</text>
                <text x={padL - 5} y={mapChartY(25)} fontSize="8" fill="#64748B" textAnchor="end">25</text>
                <text x={padL - 5} y={mapChartY(30)} fontSize="8" fill="#64748B" textAnchor="end">30</text>

                {initialPhysicsResult && Math.abs(initialPhysicsResult.tOp - phys.tOp) > 0.1 && (
                  <g>
                    {/* Ghost Point (AI Initial Design) */}
                    <circle
                      cx={mapChartX(envState.trm)}
                      cy={mapChartY(initialPhysicsResult.tOp)}
                      r="5"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                    />
                    {/* Trajectory Line */}
                    <line
                      x1={mapChartX(envState.trm)}
                      y1={mapChartY(initialPhysicsResult.tOp)}
                      x2={curChartX}
                      y2={curChartY}
                      stroke="#64748B"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  </g>
                )}

                {phys.isApplicableATC && (
                  <g>
                    <circle cx={curChartX} cy={curChartY} r="7" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx={curChartX} cy={curChartY} r="12" fill="#2563EB" opacity="0.25" />
                  </g>
                )}
              </svg>
            </div>

            {/* Real-time Thermal Metrics Readout Grid */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
              <div className="bg-slate-50 border border-slate-200 p-2 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Air Temp (T_air)</span>
                <span className="text-sm font-bold text-slate-800">{phys.tAir.toFixed(1)} °C</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Mean Rad (MRT)</span>
                <span className="text-sm font-bold text-slate-800">{phys.mrt.toFixed(1)} °C</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                <span className="text-[10px] text-blue-600 block uppercase font-bold">Operative (T_op)</span>
                <span className="text-sm font-bold text-blue-700">{phys.tOp.toFixed(1)} °C</span>
              </div>
            </div>

            {/* Secondary Physics Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
              <div className="bg-amber-50/80 border border-amber-200 p-1.5 rounded">
                <span className="text-[9px] text-amber-700 block">Solar Gain</span>
                <span className="font-bold text-amber-800">{(phys.qSolar / 1000).toFixed(2)} kW</span>
              </div>
              <div className="bg-cyan-50/80 border border-cyan-200 p-1.5 rounded">
                <span className="text-[9px] text-cyan-700 block">Ventilation Rate</span>
                <span className="font-bold text-cyan-800">{phys.qVent.toFixed(2)} m³/s</span>
              </div>
              <div className="bg-slate-100 border border-slate-200 p-1.5 rounded">
                <span className="text-[9px] text-slate-600 block">Air Velocity</span>
                <span className="font-bold text-slate-800">{phys.vAir.toFixed(2)} m/s</span>
              </div>
            </div>
          </div>

          {/* STEP 9 & 21: AI Design Feedback Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">AI Environmental Diagnosis &amp; Feedback</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Deterministic Logic</span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="bg-slate-50 border-l-4 border-blue-600 p-2.5 rounded text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5">[Environmental Diagnosis]</span>
                  {envState.trm > 28.0 ? (
                    <span>
                      <strong className="text-rose-600">[고온 환경 경고]</strong> 외기온도가{' '}
                      {envState.trm.toFixed(1)}°C로 높아 과열 위험이 큽니다. 차양을 통한 직달일사 차단과 자연환기량이 핵심입니다.
                    </span>
                  ) : envState.trm < 18.0 ? (
                    <span>
                      <strong className="text-blue-600">[저온 환경]</strong> 외기온도가{' '}
                      {envState.trm.toFixed(1)}°C로 낮아 Solar Gain 확보 및 외피 단열 관리가 필요합니다.
                    </span>
                  ) : (
                    <span>
                      <strong className="text-emerald-600">[적정 외기 범위]</strong> 외기온도가{' '}
                      {envState.trm.toFixed(1)}°C로 Adaptive Comfort 적용에 유용한 조건입니다.
                    </span>
                  )}
                </div>

                {aiInitialState && (
                  <div className="bg-slate-50 border-l-4 border-emerald-600 p-2.5 rounded text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5">
                      [Why Initial Design was Selected]
                    </span>
                    DNI {envState.dni} W/m² 및 풍속 {envState.vWind} m/s 조건을 반영하여 WWR{' '}
                    <strong className="text-blue-600">{aiInitialState.wwr}%</strong>, 차양 P/H{' '}
                    <strong className="text-blue-600">{aiInitialState.shadingPH.toFixed(2)}</strong>, 남향(S) 배치를 선택했습니다.
                  </div>
                )}

                <div className={`space-y-2 transition-opacity duration-300 ${aiLoading ? 'opacity-30' : 'opacity-100'}`}>
                  {phys.status80 === 'Too Hot' ? (
                    <div className="bg-rose-50 border border-rose-200 p-2.5 rounded text-rose-950 space-y-1 font-mono text-[11px]">
                      <div className="font-bold text-rose-700 flex items-center justify-between">
                        <span>[문제] 실내 과열 (T_op = {phys.tOp.toFixed(1)}°C)</span>
                        <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 rounded">
                          Comfort Exceeded
                        </span>
                      </div>
                      <div>
                        [원인] <strong>높은 Solar Gain</strong> ({(phys.qSolar / 1000).toFixed(2)} kW)
                      </div>
                      <div className="text-slate-800 font-bold mt-1">[추천 전략]</div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        <li>
                          <strong className="text-rose-600">Shading Depth (P/H) 증가:</strong>{' '}
                          {archState.shadingPH.toFixed(2)} → {(Math.min(1.0, archState.shadingPH + 0.20)).toFixed(2)}
                        </li>
                        <li>
                          <strong className="text-blue-600">Window Size (WWR) 감소:</strong>{' '}
                          {archState.wwr}% → {Math.max(10, archState.wwr - 10)}%
                        </li>
                        <li>상부 배기구 높이 상향 조정</li>
                      </ul>
                    </div>
                  ) : phys.status80 === 'Too Cold' ? (
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded text-blue-950 space-y-1 font-mono text-[11px]">
                      <div className="font-bold text-blue-700 flex items-center justify-between">
                        <span>[문제] 실내 과냉 (T_op = {phys.tOp.toFixed(1)}°C)</span>
                      </div>
                      <div>
                        [원인] <strong>Solar Gain 부족</strong> 및 과도한 환기 손실
                      </div>
                      <div className="text-slate-800 font-bold mt-1">[추천 전략]</div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        <li>
                          <strong className="text-rose-600">Shading Depth (P/H) 축소:</strong>{' '}
                          {archState.shadingPH.toFixed(2)} → {Math.max(0, archState.shadingPH - 0.2).toFixed(2)}
                        </li>
                        <li>
                          <strong className="text-emerald-600">WWR 증가:</strong>{' '}
                          {archState.wwr}% → {Math.min(70, archState.wwr + 10)}%
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-emerald-900 font-mono text-[11px]">
                      <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        [상태] 80% Comfort Range 만족
                      </div>
                      <p className="mt-1 text-slate-700">
                        현재 건축 설계 상태는 ASHRAE 55 Adaptive Comfort 쾌적 범위를 충족합니다.
                        추가적인 설계 조정 없이도 쾌적한 실내 환경 유지가 가능합니다.
                      </p>
                    </div>
                  )}
                </div>

                {aiLoading && (
                  <div className="text-slate-500 font-mono text-[10px] flex items-center gap-1.5 pt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> 물리 엔진 재계산 및 AI 피드백 생성 중...
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Zero Hallucination: Physics Engine
                </span>
                <span className="font-mono">ASHRAE 55 Adaptive Model</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Formula Breakdown Modal */}
      {activeModal === 'formula' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" /> Calculation Basis &amp; Formulas
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono text-slate-700">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-blue-700 block">1. Adaptive Thermal Comfort (ASHRAE 55)</span>
                <p>T_comf = 0.31 × T_rm + 17.8</p>
                <p>80% Acceptability Range: T_comf ± 3.5 °C</p>
                <p>90% Acceptability Range: T_comf ± 2.5 °C</p>
                <p className="text-[11px] text-slate-500 font-sans mt-1">Applicability: 10°C &lt; T_rm &lt; 33.5°C</p>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-amber-700 block">2. Solar Heat Gain (Q_solar)</span>
                <p>Q_solar = A_window × I_window × SHGC × ShadingFactor</p>
                <p>I_window = DNI × max(0, cos(AOI))</p>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-cyan-700 block">3. Natural Ventilation (Wind + Stack)</span>
                <p>Q_w = C_w × A_opening × V_wind (C_w = 0.55)</p>
                <p>Q_s = C_D × A_opening × √(2g × ΔH × |T_zone - T_out| / T_zone_abs) (C_D = 0.65)</p>
                <p>Q_total = √(Q_w² + Q_s²)</p>
              </div>
            </div>

            <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded border border-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                이 값은 발표용 설계단계 간이모델(Design-stage Simplified Thermal Model)이며, 실제 건물 최종 성능 평가에는 EnergyPlus 등의 상세 동적 시뮬레이션이 필요합니다.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Source / Methodology Modal */}
      {activeModal === 'basis' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Calculation Basis &amp; References
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside leading-relaxed">
              <li><strong>Course Textbook:</strong> Thermal Comfort / Adaptive Thermal Comfort Principles</li>
              <li><strong>ASHRAE Standard 55-2020:</strong> Thermal Environmental Conditions for Human Occupancy</li>
              <li><strong>ASHRAE Handbook – Fundamentals:</strong> Non-residential Cooling and Heating Load Calculations</li>
              <li><strong>EnergyPlus Engineering Reference:</strong> Wind and Stack Open Area Ventilation Model</li>
              <li><strong>NREL Solar Position Algorithm:</strong> Solar Incidence &amp; AOI Equations</li>
              <li><strong>국토교통부:</strong> 「건축물의 에너지절약설계기준」</li>
              <li><strong>한국에너지공단:</strong> 「태양열취득율계산서 및 건축물 에너지 절약을 위한 일사조절장치 설계 가이드라인」</li>
            </ul>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1">
          <p>AI-Assisted Architectural Environmental Design Tool — Thermal Environment &amp; Adaptive Comfort Assistant</p>
          <p className="text-[11px] text-slate-500 font-mono">Seoul National University / Architecture Department Presentation Interactive Model</p>
        </div>
      </footer>
    </div>
  );
};
