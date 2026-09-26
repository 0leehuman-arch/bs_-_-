import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

type VarOption = 'inc' | 'dec' | null;

interface VariableState {
  activity: VarOption;
  vascular: VarOption;
  food: VarOption;
  sweat: VarOption;
  clothing: VarOption;
  dbt: VarOption;
  velocity: VarOption;
  rh: VarOption;
  mrt: VarOption;
}

const BASE_TEMP = 37.0;

const tempImpacts: Record<keyof VariableState, { inc: number; dec: number }> = {
  activity: { inc: 0.6, dec: -0.5 },
  vascular: { inc: 0.5, dec: -0.5 },
  food: { inc: 0.4, dec: -0.3 },
  sweat: { inc: -0.7, dec: 0.6 },
  clothing: { inc: 0.5, dec: -0.5 },
  dbt: { inc: 0.7, dec: -0.7 },
  velocity: { inc: -0.6, dec: 0.5 },
  rh: { inc: 0.4, dec: -0.4 },
  mrt: { inc: 0.6, dec: -0.6 },
};

export const HeatBalanceDiagram: React.FC = () => {
  const [vars, setVars] = useState<VariableState>({
    activity: null,
    vascular: null,
    food: null,
    sweat: null,
    clothing: null,
    dbt: null,
    velocity: null,
    rh: null,
    mrt: null,
  });

  const toggleVariable = (key: keyof VariableState, val: 'inc' | 'dec') => {
    setVars((prev) => ({
      ...prev,
      [key]: prev[key] === val ? null : val,
    }));
  };

  const resetVariables = () => {
    setVars({
      activity: null,
      vascular: null,
      food: null,
      sweat: null,
      clothing: null,
      dbt: null,
      velocity: null,
      rh: null,
      mrt: null,
    });
  };

  // Calculate current body temperature
  let totalDelta = 0;
  (Object.keys(vars) as (keyof VariableState)[]).forEach((key) => {
    const selected = vars[key];
    if (selected && tempImpacts[key]) {
      totalDelta += tempImpacts[key][selected];
    }
  });

  let computed = BASE_TEMP + totalDelta;
  computed = Math.max(34.8, Math.min(40.2, computed));
  const currentTemp = parseFloat(computed.toFixed(1));

  // Determine chest badge color & status
  let badgeColorClass = 'bg-emerald-600 border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.35)]';
  let tempStatusLabel = '정상 열평형 (Normal)';
  if (currentTemp > 37.5) {
    badgeColorClass = 'bg-red-600 border-red-300 shadow-[0_0_25px_rgba(239,68,68,0.4)]';
    tempStatusLabel = '고체온 상태 (Heat Stress)';
  } else if (currentTemp < 36.5) {
    badgeColorClass = 'bg-blue-600 border-blue-300 shadow-[0_0_25px_rgba(59,130,246,0.4)]';
    tempStatusLabel = '저체온 상태 (Cold Stress)';
  }

  // Pointer position relative to 35.0°C ~ 40.0°C spectrum
  let pointerPercentage = ((currentTemp - 35.0) / 5.0) * 100;
  pointerPercentage = Math.max(2, Math.min(98, pointerPercentage));

  return (
    <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full h-full overflow-y-auto py-2">
      {/* TOP: Standing Male Silhouette Graphic with Dynamic Core Temperature Badge */}
      <div className="relative flex-1 min-h-[220px] sm:min-h-[260px] flex flex-col items-center justify-center py-2">
        <div className="relative w-40 sm:w-48 h-60 sm:h-72 flex justify-center items-center">
          {/* Precise Standing Male Silhouette SVG */}
          <svg
            viewBox="0 0 100 240"
            className="w-full h-full text-zinc-100 fill-current filter drop-shadow-xl opacity-95 transition-all duration-300"
          >
            {/* Head */}
            <path d="M50 8 C54.4 8 58 11.6 58 16 C58 20.4 54.4 24 50 24 C45.6 24 42 20.4 42 16 C42 11.6 45.6 8 50 8 Z" />
            {/* Neck */}
            <path d="M46.5 25 L53.5 25 L54.5 32 L45.5 32 Z" />
            {/* Upper Body / Jacket & Arms */}
            <path d="M32 33 C29 34 25.5 40 24 58 L22 98 C21 106 24 107 26 100 L28 62 L31 60 L31 128 L48 128 L48 76 L52 76 L52 128 L69 128 L69 60 L72 62 L74 100 C76 107 79 106 78 98 L76 58 C74.5 40 71 34 68 33 C60 30 40 30 32 33 Z" />
            {/* Trousers & Legs */}
            <path d="M32 129 L48 129 L47 220 L37 220 C35 220 34 215 34 204 L32 129 Z" />
            {/* Right Leg */}
            <path d="M52 129 L68 129 L66 204 C66 215 65 220 63 220 L53 220 L52 129 Z" />
            {/* Shoes */}
            <path d="M34 221 C34 221 30 227 28 228 C26 229 28 232 33 232 L46 232 L46 221 Z" />
            <path d="M54 221 L54 232 L67 232 C72 232 74 229 72 228 C70 227 66 221 66 221 Z" />
          </svg>

          {/* Dynamic Temperature Core Badge on Chest */}
          <div
            id="body-temp-badge"
            className={`absolute top-[28%] w-16 h-16 sm:w-20 sm:h-20 rounded-full ${badgeColorClass} text-white font-bold flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform -translate-y-1/2 border-2`}
          >
            <span
              id="badge-temp-value"
              className="text-base sm:text-lg font-extrabold tracking-tight font-mono"
            >
              {currentTemp.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* Vertical Dotted Axis Line */}
        <div className="w-px h-8 sm:h-12 border-l-2 border-dashed border-zinc-700 my-1"></div>

        {/* Status text */}
        <div className="text-[11px] font-mono text-zinc-400 mt-1">
          상태: <span className="text-white font-semibold">{tempStatusLabel}</span> (기준 체온: 37.0°C)
        </div>
      </div>

      {/* MIDDLE: Temperature Spectrum Bar (Pure Graphic Color Bar) */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 my-2 sm:my-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-1 px-1">
          <span>35.0°C (저체온)</span>
          <span className="text-zinc-300">37.0°C (정상)</span>
          <span>40.0°C (고체온)</span>
        </div>
        <div className="relative w-full h-7 sm:h-9 rounded-md temp-bar-gradient shadow-lg border border-zinc-800 p-0.5">
          {/* Dynamic Moving Pointer Line */}
          <div
            id="temp-slider-pointer"
            className="absolute top-0 bottom-0 w-2 bg-zinc-950 border-2 border-white shadow-2xl rounded-sm transform -translate-x-1/2 transition-all duration-300 pointer-events-none"
            style={{ left: `${pointerPercentage}%` }}
          >
            {/* Pointer Top Indicator */}
            <div className="w-3.5 h-3.5 bg-white rounded-full absolute -top-2 left-1/2 -translate-x-1/2 border border-black shadow"></div>
          </div>
        </div>
      </div>

      {/* BOTTOM: Control Variables Grid (Monochrome Theme) */}
      <div className="mt-2 pt-3 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 bg-zinc-900/40 p-4 rounded-xl">
        {/* LEFT COLUMN: Human Activity Variables (인체활동) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-200 tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-100 inline-block"></span>
              인체활동 변수
            </h3>
          </div>

          {/* 1. 활동량 */}
          <div className="flex items-center justify-between text-xs py-0.5">
            <span className="text-zinc-300 font-medium">활동량</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => toggleVariable('activity', 'inc')}
                id="btn-activity-inc"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.activity === 'inc'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                증가 ↑
              </button>
              <button
                type="button"
                onClick={() => toggleVariable('activity', 'dec')}
                id="btn-activity-dec"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.activity === 'dec'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                감소 ↓
              </button>
            </div>
          </div>

          {/* 2. 혈관 반응 */}
          <div className="flex items-center justify-between text-xs py-0.5">
            <span className="text-zinc-300 font-medium">혈관 반응</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => toggleVariable('vascular', 'inc')}
                id="btn-vascular-inc"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.vascular === 'inc'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                수축 ↑
              </button>
              <button
                type="button"
                onClick={() => toggleVariable('vascular', 'dec')}
                id="btn-vascular-dec"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.vascular === 'dec'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                확장 ↑
              </button>
            </div>
          </div>

          {/* 3. 식음료 섭취 */}
          <div className="flex items-center justify-between text-xs py-0.5">
            <span className="text-zinc-300 font-medium">식음료 섭취</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => toggleVariable('food', 'inc')}
                id="btn-food-inc"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.food === 'inc'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                섭취 ↑
              </button>
              <button
                type="button"
                onClick={() => toggleVariable('food', 'dec')}
                id="btn-food-dec"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.food === 'dec'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                섭취 ↓
              </button>
            </div>
          </div>

          {/* 4. 발한 (Sweating) */}
          <div className="flex items-center justify-between text-xs py-0.5">
            <span className="text-zinc-300 font-medium">발한 작용</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => toggleVariable('sweat', 'inc')}
                id="btn-sweat-inc"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.sweat === 'inc'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                증가 ↑
              </button>
              <button
                type="button"
                onClick={() => toggleVariable('sweat', 'dec')}
                id="btn-sweat-dec"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.sweat === 'dec'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                감소 ↓
              </button>
            </div>
          </div>

          {/* 5. 의복 (Clothing) */}
          <div className="flex items-center justify-between text-xs py-0.5">
            <span className="text-zinc-300 font-medium">의복 착용</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => toggleVariable('clothing', 'inc')}
                id="btn-clothing-inc"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.clothing === 'inc'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                착용 ↑
              </button>
              <button
                type="button"
                onClick={() => toggleVariable('clothing', 'dec')}
                id="btn-clothing-dec"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.clothing === 'dec'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                탈의 ↓
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Environmental Variables (환경변수) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-200 tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block"></span>
              환경변수
            </h3>
          </div>

          {/* 1. 건구온도 DBT */}
          <div className="flex items-center justify-between text-xs py-0.5">
            <span className="text-zinc-300 font-medium">건구온도 (DBT)</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => toggleVariable('dbt', 'inc')}
                id="btn-dbt-inc"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.dbt === 'inc'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                상승 ↑
              </button>
              <button
                type="button"
                onClick={() => toggleVariable('dbt', 'dec')}
                id="btn-dbt-dec"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.dbt === 'dec'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                하강 ↓
              </button>
            </div>
          </div>

          {/* 2. 기류속도 v */}
          <div className="flex items-center justify-between text-xs py-0.5">
            <span className="text-zinc-300 font-medium">기류속도 (v)</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => toggleVariable('velocity', 'inc')}
                id="btn-velocity-inc"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.velocity === 'inc'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                증가 ↑
              </button>
              <button
                type="button"
                onClick={() => toggleVariable('velocity', 'dec')}
                id="btn-velocity-dec"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.velocity === 'dec'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                감소 ↓
              </button>
            </div>
          </div>

          {/* 3. 상대습도 RH */}
          <div className="flex items-center justify-between text-xs py-0.5">
            <span className="text-zinc-300 font-medium">상대습도 (RH)</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => toggleVariable('rh', 'inc')}
                id="btn-rh-inc"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.rh === 'inc'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                상승 ↑
              </button>
              <button
                type="button"
                onClick={() => toggleVariable('rh', 'dec')}
                id="btn-rh-dec"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.rh === 'dec'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                하강 ↓
              </button>
            </div>
          </div>

          {/* 4. 평균복사온도 MRT */}
          <div className="flex items-center justify-between text-xs py-0.5">
            <span className="text-zinc-300 font-medium">평균복사온도 (MRT)</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => toggleVariable('mrt', 'inc')}
                id="btn-mrt-inc"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.mrt === 'inc'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                상승 ↑
              </button>
              <button
                type="button"
                onClick={() => toggleVariable('mrt', 'dec')}
                id="btn-mrt-dec"
                className={`var-btn px-3 py-1 rounded transition text-xs ${
                  vars.mrt === 'dec'
                    ? 'bg-white text-zinc-950 font-bold border border-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-medium border border-zinc-700'
                }`}
              >
                하강 ↓
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={resetVariables}
              className="flex items-center gap-1.5 px-3 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-600 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>조건 초기화</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
