/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Code2,
  Maximize2,
  Minimize2,
  Grid,
  Check,
  Copy,
  Info,
  Sliders,
  Terminal,
  Compass,
  Zap
} from 'lucide-react';
import { SLIDES_DATA, SlideMetadata } from './data/slidesData';
import { DiagramMockup } from './components/DiagramMockups';
import { HeatBalanceDiagram } from './components/HeatBalanceDiagram';
import { PassiveConditioningDiagram } from './components/PassiveConditioningDiagram';
import {
  BioclimaticChartDiagram,
  PMVPoint,
  getZoneInfo,
  calculateAdjustments,
} from './components/BioclimaticChartDiagram';
import {
  OccupantInterventionDiagram,
  OccupantState,
  computeThermalMetrics,
} from './components/OccupantInterventionDiagram';
import {
  AdaptiveComfortDiagram,
  AdaptiveComfortPoint,
  analyzeAdaptiveComfort,
} from './components/AdaptiveComfortDiagram';
import { AIEnvironmentDesignSlide } from './components/AIEnvironmentDesignSlide';

export default function App() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState<boolean>(false);
  const [pmvPoint, setPmvPoint] = useState<PMVPoint>({ temp: 24.0, hum: 8.0 });
  const [adaptivePoint, setAdaptivePoint] = useState<AdaptiveComfortPoint>({ trm: 25.0, top: 26.0 });
  const [occupantState, setOccupantState] = useState<OccupantState>({
    nightFlushing: false,
    equipmentOff: false,
    shadingDeployed: false,
    showSolar: true,
    showHeat: true,
    showWind: true,
  });

  const currentSlide: SlideMetadata = SLIDES_DATA[currentSlideIndex];
  const isSlide6 = currentSlide?.id === 6;
  const containerRef = useRef<HTMLDivElement>(null);
  const pmvZone = getZoneInfo(pmvPoint.temp, pmvPoint.hum);
  const pmvAdjs = calculateAdjustments(pmvPoint.temp, pmvPoint.hum);
  const occupantMetrics = computeThermalMetrics(occupantState);
  const adaptiveDiagnosis = analyzeAdaptiveComfort(adaptivePoint.trm, adaptivePoint.top);

  // Keyboard navigation support: [1-6], [ArrowLeft], [ArrowRight]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut interference if user is in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentSlideIndex((prev) => (prev < SLIDES_DATA.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        const targetIndex = parseInt(e.key, 10) - 1;
        if (targetIndex >= 0 && targetIndex < SLIDES_DATA.length) {
          setCurrentSlideIndex(targetIndex);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'g' || e.key === 'G') {
        setShowGrid((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track mouse coordinates for technical architectural feel
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseCoords({
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const copyContainerId = (idString: string) => {
    navigator.clipboard.writeText(idString);
    setCopiedId(idString);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-screen bg-[#0c0c0c] text-[#e0e0e0] overflow-hidden select-none"
    >
      {/* Top Header Bar: Clean monochrome aesthetic */}
      <header className="h-13 bg-[#111111] border-b border-[#222222] px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-white text-black flex items-center justify-center rounded text-xs font-bold font-mono">
            M
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-white">
              MONOCHROME DIAGRAM DECK
            </span>
            <span className="text-xs text-[#525252]">/</span>
            <span className="text-xs text-[#8a8a8a] hidden sm:inline font-mono">
              SYSTEM ARCHITECTURE SPECIFICATION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Coordinate HUD */}
          <div className="hidden md:flex items-center gap-2 text-[#737373] bg-[#171717] px-2.5 py-1 rounded border border-[#262626]">
            <Compass className="w-3.5 h-3.5 text-[#888888]" />
            <span>
              X: {String(mouseCoords.x).padStart(4, '0')} Y: {String(mouseCoords.y).padStart(4, '0')}
            </span>
          </div>

          {/* Slide Indicator */}
          <div className="text-[#a3a3a3] font-medium bg-[#171717] px-2.5 py-1 rounded border border-[#262626]">
            SLIDE <span className="text-white font-bold">{String(currentSlideIndex + 1).padStart(2, '0')}</span> / 06
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowGrid(!showGrid)}
              title="그리드 토글 (단축키: G)"
              className={`p-1.5 rounded transition-colors ${
                showGrid
                  ? 'bg-white/10 text-white border border-[#404040]'
                  : 'text-[#666666] hover:text-white hover:bg-[#1f1f1f]'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDevModal(true)}
              title="다이어그램 연동 가이드"
              className="p-1.5 rounded text-[#888888] hover:text-white hover:bg-[#1f1f1f] transition-colors"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              title="전체화면 토글 (단축키: F)"
              className="p-1.5 rounded text-[#888888] hover:text-white hover:bg-[#1f1f1f] transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left Area: Diagram & Interactive Content Display Area (Expands to 100% on Slide 6) */}
        <main
          onMouseMove={handleMouseMove}
          className={`h-full relative overflow-hidden bg-[#090909] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSlide6 ? 'w-full lg:w-full' : 'w-full lg:w-[73%] xl:w-[74%]'
          }`}
        >
          {/* Background grid overlay */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
              showGrid ? 'opacity-100 bg-tech-grid' : 'opacity-0'
            }`}
          />

          {/* Horizontal Slide Carousel Track for Slides 1-5 */}
          <div className="w-full h-full relative overflow-hidden">
            <div
              className="flex w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: `translateX(-${Math.min(currentSlideIndex, 4) * 100}%)`,
              }}
            >
              {SLIDES_DATA.slice(0, 5).map((slide) => (
                <div
                  key={slide.id}
                  id={`slide-content-${slide.id}`}
                  className="slide-content w-full h-full flex flex-col justify-between p-6 sm:p-8 shrink-0 relative overflow-hidden bg-[#090909]"
                >
                  {/* Slide Top Technical Meta Header */}
                  <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3 z-10">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1a1a1a] text-white border border-[#2b2b2b]">
                        0{slide.id}
                      </span>
                      <span className="text-xs font-mono tracking-wider text-[#888888]">
                        {slide.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyContainerId(`slide-content-${slide.id}`)}
                        className="flex items-center gap-1.5 text-[11px] font-mono text-[#777777] hover:text-white bg-[#141414] hover:bg-[#1f1f1f] px-2.5 py-1 rounded border border-[#242424] transition-colors cursor-pointer"
                        title="컨테이너 ID 복사"
                      >
                        {copiedId === `slide-content-${slide.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">ID 복사완료</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>#slide-content-{slide.id}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Main Display Center: Interactive Graphic Canvas for Slide 1, 2, 3, 4, 5 */}
                  <div className="flex-1 flex flex-col justify-between my-2 z-10 gap-3 min-h-0 overflow-hidden">
                    {slide.id === 1 ? (
                      /* Slide 01: heat balance */
                      <HeatBalanceDiagram />
                    ) : slide.id === 2 ? (
                      /* Slide 02: PMV comfort range */
                      <BioclimaticChartDiagram point={pmvPoint} onChangePoint={setPmvPoint} />
                    ) : slide.id === 3 ? (
                      /* Slide 03: Passive conditioning */
                      <PassiveConditioningDiagram />
                    ) : slide.id === 4 ? (
                      /* Slide 04: ATC comfort range */
                      <AdaptiveComfortDiagram point={adaptivePoint} onChangePoint={setAdaptivePoint} />
                    ) : (
                      /* Slide 05: Occupant intercention */
                      <OccupantInterventionDiagram state={occupantState} onChangeState={setOccupantState} />
                    )}
                  </div>

                  {/* Slide Bottom Technical Spec Line */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#666666] border-t border-[#1c1c1c] pt-3 z-10">
                    <div className="flex items-center gap-4">
                      <span>SCHEMA: {slide.schemaType}</span>
                      <span>CONTAINER: id="slide-content-{slide.id}"</span>
                    </div>
                    <div className="text-[#888888]">
                      PRESS [1-6] OR USE BOTTOM DOCK TO SWITCH
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Slide 6: AI-Assisted Thermal Environment Design (Expanding Over Full Space) */}
            <AnimatePresence>
              {isSlide6 && (
                <motion.div
                  key="slide-6-fullscreen"
                  id="slide-content-6"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 z-20 w-full h-full flex flex-col overflow-hidden bg-[#F1F5F9]"
                >
                  <AIEnvironmentDesignSlide />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Right Area: Fixed Sidebar Panel (Slides 1-5), smoothly collapses when on Slide 6 */}
        <aside
          className={`h-full bg-[#121212] flex flex-col justify-between overflow-y-auto z-10 relative transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSlide6
              ? 'w-0 lg:w-0 border-0 opacity-0 pointer-events-none p-0 overflow-hidden'
              : 'w-full lg:w-[27%] xl:w-[26%] border-t lg:border-t-0 lg:border-l border-[#242424] opacity-100'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 sm:p-7 flex-1 flex flex-col justify-between"
            >
              {currentSlide.id === 1 ? (
                /* Slide 01: Specialized GHO Style Minimalist Info */
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-5">
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <span className="text-xs font-mono font-medium text-zinc-400 tracking-wider uppercase">
                        {currentSlide.category}
                      </span>
                      <span className="font-mono text-xs text-white bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                        SLIDE 01
                      </span>
                    </div>

                    {/* Big Title (GHO Style) */}
                    <div>
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Body Temperature
                      </h1>
                      <p className="text-xs text-zinc-400 mt-1 font-medium">
                        건축설비 - 인체 열평형 및 환경 열교환 메커니즘
                      </p>
                    </div>

                    {/* Main Bold Narrative Paragraph */}
                    <div className="text-xs sm:text-sm font-semibold text-zinc-100 leading-relaxed space-y-2 pt-1 border-t border-zinc-800/80 pt-3">
                      <p>
                        Human body temperature is approximately 37.0°C and must be maintained within a narrow range of ±0.5°C.
                      </p>
                      <p className="text-zinc-300 font-medium text-xs">
                        The body continuously generates heat while sustaining vital activities such as respiration and blood circulation.
                      </p>
                      <p className="text-zinc-300 font-medium text-xs">
                        To maintain a stable body temperature, heat generated inside the body must balance with heat released to the environment.
                      </p>
                    </div>

                    {/* Sub-section Header */}
                    <div className="pt-2 pb-1 border-b border-zinc-800">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Heat Transfer Mechanisms
                      </h2>
                    </div>

                    {/* 4 Heat Transfer Mechanisms List */}
                    <div className="divide-y divide-zinc-800/90 text-xs">
                      {/* ① Evaporation */}
                      <div className="py-2.5 flex flex-col gap-1">
                        <div className="flex items-center justify-between font-bold text-zinc-100 text-xs">
                          <span>① Evaporation (증발)</span>
                        </div>
                        <p className="text-zinc-300 leading-normal">
                          Sweating → Heat is released to the outside as sweat evaporates.
                        </p>
                        <p className="text-zinc-500 text-[11px]">
                          → However, higher relative humidity reduces the evaporation rate.
                        </p>
                      </div>

                      {/* ② Respiration */}
                      <div className="py-2.5 flex flex-col gap-1">
                        <div className="flex items-center justify-between font-bold text-zinc-100 text-xs">
                          <span>② Respiration (호흡)</span>
                        </div>
                        <p className="text-zinc-300 leading-normal">
                          Exhaled air is generally warmer and moister than inhaled air.
                        </p>
                        <p className="text-zinc-500 text-[11px]">
                          → Heat and moisture are transferred externally through breathing.
                        </p>
                      </div>

                      {/* ③ Convection */}
                      <div className="py-2.5 flex flex-col gap-1">
                        <div className="flex items-center justify-between font-bold text-zinc-100 text-xs">
                          <span>③ Convection (대류)</span>
                        </div>
                        <p className="text-zinc-300 leading-normal">
                          Heat is exchanged with the air surrounding skin and clothing.
                        </p>
                        <p className="text-zinc-500 text-[11px]">
                          → Moving air removes the warm air layer near skin, causing a cooling effect.
                        </p>
                      </div>

                      {/* ④ Radiation */}
                      <div className="py-2.5 flex flex-col gap-1">
                        <div className="flex items-center justify-between font-bold text-zinc-100 text-xs">
                          <span>④ Radiation (복사)</span>
                        </div>
                        <p className="text-zinc-300 leading-normal">
                          Radiative energy is exchanged between the human body and surrounding surfaces.
                        </p>
                        <p className="text-zinc-500 text-[11px]">
                          → Indoors, skin temperature usually exceeds surrounding surfaces, resulting in net radiative heat loss.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className="pt-4 mt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono flex justify-between items-center">
                    <span>Building Environmental Systems</span>
                    <span>Slide 01</span>
                  </div>
                </div>
              ) : currentSlide.id === 2 ? (
                /* Slide 02: Bioclimatic Chart & PMV Analysis Info */
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
                      <div>
                        <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                          THERMAL ENVIRONMENT ANALYSIS
                        </div>
                        <h3 className="text-base font-bold text-white">
                          Thermal Diagnosis &amp; Passive Strategy
                        </h3>
                      </div>
                      <div className="bg-black/50 border border-zinc-800 rounded px-2 py-1 font-mono text-xs text-emerald-400 font-bold shrink-0">
                        {pmvPoint.temp.toFixed(1)}°C / {pmvPoint.hum.toFixed(1)} g/kg
                      </div>
                    </div>

                    {/* 1. Current Zone & Comfort Status Card */}
                    <div
                      className={`border rounded-lg p-3 space-y-1.5 transition-all ${
                        pmvZone.isComfort
                          ? 'bg-emerald-950/30 border-emerald-800/60'
                          : 'bg-amber-950/20 border-amber-800/50'
                      }`}
                    >
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex justify-between">
                        <span>1. COMFORT ZONE DIAGNOSIS</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pmvZone.isComfort
                              ? 'bg-emerald-500 text-black'
                              : 'bg-amber-500 text-black'
                          }`}
                        >
                          {pmvZone.isComfort ? 'COMFORT' : 'NON-COMFORT'}
                        </span>
                      </div>
                      <div
                        className={`text-sm font-bold ${
                          pmvZone.isComfort ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {pmvZone.name}
                      </div>
                      <div className="text-xs text-zinc-300 leading-relaxed font-normal">
                        {pmvZone.desc}
                      </div>
                    </div>

                    {/* 2. Adjustments Required Card */}
                    <div className="border border-zinc-800 rounded-lg p-3 bg-black/40 space-y-2">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                        2. REQUIRED ADJUSTMENTS FOR COMFORT
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                        <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800">
                          <span className="text-zinc-500 text-[10px] block">Temperature Adj:</span>
                          <span
                            className={`font-bold ${
                              pmvAdjs.tempAdj.includes('Optimal')
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {pmvAdjs.tempAdj}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800">
                          <span className="text-zinc-500 text-[10px] block">Humidity Adj:</span>
                          <span className="font-bold text-emerald-400">
                            {pmvAdjs.humAdj}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-400 leading-normal pt-1 border-t border-zinc-800/80 font-mono">
                        Target comfort parameters: 21.5°C – 27.5°C Effective Temp | 4.0 – 10.0 g/kg Absolute Humidity.
                      </div>
                    </div>

                    {/* 3. Architectural Strategy Mapping Card */}
                    <div className="border border-zinc-800 rounded-lg p-3 bg-black/40 space-y-1.5">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                        3. PASSIVE STRATEGY GUIDE
                      </div>
                      <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 leading-relaxed font-mono">
                        <strong
                          style={{ color: pmvZone.color }}
                          className="block mb-0.5"
                        >
                          {pmvZone.name}
                        </strong>
                        {pmvZone.strategy}
                      </div>
                    </div>

                    {/* Reference Info Footer */}
                    <div className="border-t border-zinc-800 pt-2 font-mono text-[10px] text-zinc-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>BASIS: Olgyay &amp; Carrier Psychrometrics</span>
                        <span className="text-emerald-400">PMV / PPD Model</span>
                      </div>
                      <div className="text-zinc-600">
                        Target Comfort Zone: 21.5°C - 27.5°C | 4.0 - 10.0 g/kg
                      </div>
                    </div>
                  </div>

                  {/* Target Container Box */}
                  <div className="mt-2 pt-2 border-t border-zinc-800">
                    <div className="bg-[#0a0a0a] border border-zinc-800 rounded p-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-zinc-400 mb-1 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3 h-3 text-zinc-400" />
                          &gt;_ MODULE INSERTION TARGET
                        </span>
                        <span className="text-emerald-400">READY</span>
                      </div>
                      <div className="text-zinc-500 text-[11px] mb-1.5">
                        Container mounted at id="slide-content-2"
                      </div>
                      <div className="bg-[#141414] p-1.5 rounded border border-zinc-800 text-[11px] text-[#38bdf8] flex items-center justify-between">
                        <code>document.getElementById('slide-content-2')</code>
                        <button
                          onClick={() => copyContainerId("document.getElementById('slide-content-2')")}
                          className="text-zinc-400 hover:text-white ml-2 shrink-0 cursor-pointer"
                          title="코드 복사"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentSlide.id === 3 ? (
                /* Slide 03: Passive Conditioning Study Info */
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <span className="text-xs font-mono font-medium text-zinc-400 tracking-wider uppercase">
                        03 PASSIVE CONDITIONING &amp; CLIMATE RESPONSE
                      </span>
                      <span className="font-mono text-xs text-white bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                        SLIDE 03
                      </span>
                    </div>

                    {/* Title Block */}
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                        Passive Conditioning &amp; Climate Response
                      </h1>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        Lisbon, Portugal Study (Fig. 4.11 Analysis)
                      </p>
                    </div>

                    {/* Section 1: Overview & Study Background */}
                    <div className="border-t border-zinc-800/80 pt-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-1.5">
                        OVERVIEW &amp; STUDY BACKGROUND
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                        One-click indoor climate analysis model for a residential space equipped with a ceiling fan in Lisbon, Portugal by Svenja Herb, Sam Wolk, and Christoph Reinhart.
                      </p>
                    </div>

                    {/* Section 2: Technical Specifications */}
                    <div className="border-t border-zinc-800/80 pt-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2 flex items-center justify-between">
                        <span>TECHNICAL SPECIFICATIONS</span>
                        <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <div className="bg-[#0f0f12] border border-zinc-800/90 rounded p-2.5 space-y-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1">
                          <span className="text-zinc-400">Location</span>
                          <span className="font-semibold text-white">Lisbon, Portugal</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1">
                          <span className="text-zinc-400">Evaluated Variables</span>
                          <span className="font-semibold text-white">WWR &amp; 4 Passive Strategies</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1">
                          <span className="text-zinc-400">Recommended WWR</span>
                          <span className="font-semibold text-white">Up to 50% (Max)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Climate Warning</span>
                          <span className="font-semibold text-white">WWR &lt; 40% Best Practice</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Key Presentation Insights */}
                    <div className="border-t border-zinc-800/80 pt-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2">
                        KEY PRESENTATION INSIGHTS
                      </div>
                      <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                        <li className="flex items-start gap-2">
                          <span className="text-zinc-500 font-bold">•</span>
                          <span>
                            <strong className="text-white">Strategy Matrix Expansion:</strong> Combining daytime ventilation, shading, night flushing, and thermal mass dramatically expands achievable WWR without mechanical AC.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-zinc-500 font-bold">•</span>
                          <span>
                            <strong className="text-white">Optimal Combination (50% WWR):</strong> Nighttime ventilation with dynamic external shading maintains thermal comfort up to 50% WWR across all orientations.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-zinc-500 font-bold">•</span>
                          <span>
                            <strong className="text-white">Climate Change Precaution:</strong> To offset future global warming and reduced night ventilation potential, avoiding WWR above 40% is strongly advised.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-zinc-500 font-bold">•</span>
                          <span>
                            <strong className="text-white">Practical Decision Utility:</strong> Delivers actionable, highly reliable climate response guidelines requiring zero simulation background.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Target Container Box */}
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <div className="bg-[#0a0a0a] border border-zinc-800 rounded p-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-zinc-400 mb-1 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3 h-3 text-zinc-400" />
                          &gt;_ MODULE INSERTION TARGET
                        </span>
                        <span className="text-[#35B94A]">READY</span>
                      </div>
                      <div className="text-zinc-500 text-[11px] mb-1.5">
                        Container mounted at id="slide-content-3"
                      </div>
                      <div className="bg-[#141414] p-1.5 rounded border border-zinc-800 text-[11px] text-[#38bdf8] flex items-center justify-between">
                        <code>document.getElementById('slide-content-3')</code>
                        <button
                          onClick={() => copyContainerId("document.getElementById('slide-content-3')")}
                          className="text-zinc-400 hover:text-white ml-2 shrink-0 cursor-pointer"
                          title="코드 복사"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentSlide.id === 5 ? (
                /* Slide 05: Occupant Intervention Info */
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
                      <div>
                        <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                          THERMAL COMFORT ANALYSIS
                        </div>
                        <h3 className="text-base font-bold text-white">
                          Comfort &amp; Physical Mechanisms
                        </h3>
                      </div>
                      <div className="bg-black/50 border border-zinc-800 rounded px-2 py-1 font-mono text-xs text-sky-400 font-bold shrink-0">
                        Top: {occupantMetrics.top.toFixed(1)}°C
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      Analysis of indoor Dry-Bulb Temperature (DBT) and Mean Radiant Temperature (MRT) based on occupant intervention strategies.
                    </p>

                    {/* Dynamic State Description Card */}
                    <div className="bg-[#121215] p-3 rounded-lg border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-300">Strategy Diagnosis</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            occupantMetrics.top <= 26.0
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : occupantMetrics.top <= 28.5
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {occupantMetrics.diagTag}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                        {occupantMetrics.diagText}
                      </p>
                    </div>

                    {/* 3 Interventions Thermal Impact Breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-semibold text-zinc-300 tracking-wider uppercase font-mono">
                        Physical Effects of Interventions
                      </h4>

                      {/* Item 1: Night Flushing */}
                      <div
                        className={`p-2.5 rounded-lg border transition-all ${
                          occupantState.nightFlushing
                            ? 'border-sky-500/50 bg-sky-950/20'
                            : 'border-zinc-800 bg-[#0e0e11]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-sky-400">① Night Flushing</span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {occupantState.nightFlushing ? 'Active Flushing' : 'Closed'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-normal">
                          Introduces cool nocturnal outdoor air to exhaust heat accumulated in the concrete floor slab (thermal mass) during the day. Resets structural temperature to suppress daytime Operative Temperature (T<sub>op</sub>) rise.
                        </p>
                      </div>

                      {/* Item 2: Turn Off Equipment */}
                      <div
                        className={`p-2.5 rounded-lg border transition-all ${
                          occupantState.equipmentOff
                            ? 'border-orange-500/50 bg-orange-950/20'
                            : 'border-zinc-800 bg-[#0e0e11]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-orange-400">② Turn Off Equipment</span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {occupantState.equipmentOff ? 'Power Off' : 'Active Heat'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-normal">
                          Cuts standby power and heat emissions from electronics (computers, lighting) to eliminate internal heat gains (Q<sub>internal</sub>), preventing direct rise in Dry-Bulb Temperature (DBT).
                        </p>
                      </div>

                      {/* Item 3: Deploy Shading */}
                      <div
                        className={`p-2.5 rounded-lg border transition-all ${
                          occupantState.shadingDeployed
                            ? 'border-amber-500/50 bg-amber-950/20'
                            : 'border-zinc-800 bg-[#0e0e11]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-amber-400">③ Deploy Shading</span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {occupantState.shadingDeployed ? 'Deployed' : 'Retracted'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-normal">
                          Proactively blocks and reflects solar radiation outside window glazing before penetration. Prevents indoor surface temperature rise, significantly reducing Mean Radiant Temperature (MRT) felt by occupants.
                        </p>
                      </div>
                    </div>

                    {/* Formula Card */}
                    <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/30 text-xs space-y-1">
                      <span className="font-bold text-blue-300">Operative Temperature Formula:</span>
                      <p className="font-mono text-blue-200 text-[11px]">
                        T<sub>operative</sub> = (DBT + MRT) / 2
                      </p>
                      <p className="text-[10px] text-zinc-400 pt-0.5 leading-normal">
                        * DBT: Dry-Bulb Temperature (Convection &amp; Internal Gain)<br />
                        * MRT: Mean Radiant Temperature (Shading &amp; Thermal Mass)
                      </p>
                    </div>

                    {/* Footer Citation */}
                    <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 space-y-0.5 font-mono">
                      <p>Based on: Givoni &amp; Olgyay Bioclimatic Model / Lisbon Overheating Study (Fig. 4.11 &amp; 4.22)</p>
                      <p>© Architectural Environmental Control Presentation Module</p>
                    </div>
                  </div>

                  {/* Target Container Box */}
                  <div className="mt-2 pt-2 border-t border-zinc-800">
                    <div className="bg-[#0a0a0a] border border-zinc-800 rounded p-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-zinc-400 mb-1 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3 h-3 text-zinc-400" />
                          &gt;_ MODULE INSERTION TARGET
                        </span>
                        <span className="text-emerald-400">READY</span>
                      </div>
                      <div className="text-zinc-500 text-[11px] mb-1.5">
                        Container mounted at id="slide-content-5"
                      </div>
                      <div className="bg-[#141414] p-1.5 rounded border border-zinc-800 text-[11px] text-[#38bdf8] flex items-center justify-between">
                        <code>document.getElementById('slide-content-5')</code>
                        <button
                          onClick={() => copyContainerId("document.getElementById('slide-content-5')")}
                          className="text-zinc-400 hover:text-white ml-2 shrink-0 cursor-pointer"
                          title="코드 복사"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentSlide.id === 4 ? (
                /* Slide 04: Adaptive Thermal Comfort Info */
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
                      <div>
                        <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                          REAL-TIME DIAGNOSIS
                        </div>
                        <h3 className="text-base font-bold text-white">
                          Adaptive Thermal Comfort
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono">
                          LIVE
                        </span>
                        <div className="bg-black/50 border border-zinc-800 rounded px-2 py-0.5 font-mono text-xs text-emerald-400 font-bold shrink-0">
                          {adaptivePoint.trm.toFixed(1)}°C / {adaptivePoint.top.toFixed(1)}°C
                        </div>
                      </div>
                    </div>

                    {/* Status Card */}
                    <div className="bg-[#121214] border border-zinc-800 rounded-lg p-3.5 space-y-1.5">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex justify-between">
                        <span>Comfort Status</span>
                        <span className="text-[10px] font-mono text-zinc-500">ASHRAE 55</span>
                      </div>
                      <div className={`text-lg font-bold transition-colors duration-300 ${adaptiveDiagnosis.badgeClass.split(' ')[0]}`}>
                        {adaptiveDiagnosis.badgeText}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                        {adaptiveDiagnosis.desc}
                      </p>
                    </div>

                    {/* AI Recommended Adjustment */}
                    <div className="bg-[#18181b] border border-zinc-800 rounded-lg p-3.5 relative overflow-hidden space-y-2">
                      <div className={`absolute top-0 left-0 w-1 h-full ${adaptiveDiagnosis.indicatorClass}`} />
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                        <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                          Required Adjustment
                        </h4>
                      </div>

                      <div className="space-y-1 pl-1">
                        <div className={`font-mono text-lg font-bold ${adaptiveDiagnosis.adjClass}`}>
                          {adaptiveDiagnosis.adjValue}
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                          {adaptiveDiagnosis.adjText}
                        </p>
                      </div>
                    </div>

                    {/* Technical Specifications */}
                    <div className="border-t border-zinc-800/80 pt-3">
                      <div className="text-[10px] text-zinc-500 font-mono mb-2 uppercase tracking-wider">
                        TECHNICAL SPECIFICATIONS
                      </div>
                      <div className="bg-[#0f0f12] border border-zinc-800/90 rounded p-2.5 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                          <span className="text-zinc-500">T_comf Formula</span>
                          <span className="text-zinc-200">0.31 × T_rm + 17.8</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-800/60 pb-1">
                          <span className="text-zinc-500">80% Limits</span>
                          <span className="text-zinc-200">T_comf ± 3.5°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">90% Limits</span>
                          <span className="text-zinc-200">T_comf ± 2.5°C</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Target Container Box */}
                  <div className="mt-2 pt-2 border-t border-zinc-800">
                    <div className="bg-[#0a0a0a] border border-zinc-800 rounded p-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-zinc-400 mb-1 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3 h-3 text-zinc-400" />
                          &gt;_ MODULE INSERTION TARGET
                        </span>
                        <span className="text-emerald-400">READY</span>
                      </div>
                      <div className="text-zinc-500 text-[11px] mb-1.5">
                        Container mounted at id="slide-content-4"
                      </div>
                      <div className="bg-[#141414] p-1.5 rounded border border-zinc-800 text-[11px] text-[#38bdf8] flex items-center justify-between">
                        <code>document.getElementById('slide-content-4')</code>
                        <button
                          onClick={() => copyContainerId("document.getElementById('slide-content-4')")}
                          className="text-zinc-400 hover:text-white ml-2 shrink-0 cursor-pointer"
                          title="코드 복사"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Slide 06: Standard Architectural Deck Info */
                <div>
                  {/* Category & Step Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222222]">
                    <div className="text-xs font-mono font-medium text-[#888888] tracking-wider uppercase">
                      {currentSlide.category}
                    </div>
                    <div className="font-mono text-xs text-white bg-[#1e1e1e] border border-[#2d2d2d] px-2 py-0.5 rounded">
                      SLIDE 0{currentSlide.id}
                    </div>
                  </div>

                  {/* Main Titles */}
                  <div className="mb-5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5 leading-snug">
                      {currentSlide.title}
                    </h1>
                    <p className="text-xs font-mono text-[#8a8a8a] tracking-tight">
                      {currentSlide.subtitle}
                    </p>
                  </div>

                  {/* Primary Description */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0] mb-2 font-mono">
                      개요 및 설명
                    </h3>
                    <p className="text-sm text-[#cccccc] leading-relaxed font-normal">
                      {currentSlide.description}
                    </p>
                  </div>

                  {/* Technical Specifications Matrix */}
                  <div className="mb-6 bg-[#0f0f0f] border border-[#222222] rounded-lg p-3.5">
                    <div className="text-xs font-mono text-[#888888] mb-2.5 font-medium flex items-center justify-between">
                      <span>TECHNICAL SPECIFICATIONS</span>
                      <Sliders className="w-3.5 h-3.5 text-[#666666]" />
                    </div>
                    <div className="space-y-2">
                      {currentSlide.specs.map((spec, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs border-b border-[#1a1a1a] pb-1.5 last:border-0 last:pb-0"
                        >
                          <span className="text-[#808080]">{spec.label}</span>
                          <span className="font-mono text-[#e5e5e5] text-right font-medium">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Architectural Points */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a0a0a0] mb-2.5 font-mono">
                      핵심 아키텍처 포인트
                    </h3>
                    <ul className="space-y-2">
                      {currentSlide.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-[#bbbbbb] leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/70 mt-1.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Developer Integration Slot Guide Box */}
                  <div className="mt-4 pt-4 border-t border-[#222222]">
                    <div className="bg-[#0a0a0a] border border-[#222222] rounded p-3 text-xs font-mono">
                      <div className="flex items-center justify-between text-[#888888] mb-1.5 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3 h-3 text-[#a0a0a0]" />
                          MODULE INSERTION TARGET
                        </span>
                        <span className="text-emerald-400">READY</span>
                      </div>
                      <div className="text-[#999999] text-[11px] leading-tight break-all mb-2">
                        {currentSlide.devNote}
                      </div>
                      <div className="bg-[#141414] p-2 rounded border border-[#242424] text-[11px] text-[#e0e0e0] flex items-center justify-between">
                        <code>document.getElementById('slide-content-{currentSlide.id}')</code>
                        <button
                          onClick={() => copyContainerId(`document.getElementById('slide-content-${currentSlide.id}')`)}
                          className="text-[#888888] hover:text-white ml-2 shrink-0"
                          title="코드 복사"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>

      {/* 
        REQUIREMENT:
        [하단 네비게이션]
        1. 화면 하단 중앙에 총 6개의 슬라이드 이동 네비게이션 버튼을 배치 (화살표 제외, 슬라이드 번호 버튼만 배치)
        2. 네비게이션 버튼 크기는 너무 크지 않게 깔끔하고 컴팩트한 모던 버튼 스타일
        3. 각 버튼의 텍스트 표기: [01 다이어그램], [02 다이어그램], [03 다이어그램], [04 다이어그램], [05 다이어그램], [06 다이어그램]
        4. 현재 활성화된(선택된) 페이지의 네비게이션 버튼은 하이라이트(흰색 배경에 검은 글자) 처리
      */}
      <nav
        aria-label="Slide Navigation"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center max-w-[95vw]"
      >
        <div className="bg-[#141414]/95 backdrop-blur-md p-1.5 rounded-lg border border-[#2b2b2b] shadow-2xl flex items-center gap-1.5 overflow-x-auto max-w-full">
          {SLIDES_DATA.map((slide, index) => {
            const isActive = currentSlideIndex === index;
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(index)}
                aria-current={isActive ? 'page' : undefined}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium tracking-tight rounded transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-md scale-[1.02]'
                    : 'text-[#9e9e9e] hover:text-white hover:bg-[#222222] border border-transparent'
                }`}
              >
                {slide.navLabel}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Developer Guide Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2b2b2b] rounded-lg max-w-lg w-full p-6 text-xs font-mono shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626] mb-4">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Code2 className="w-4 h-4 text-white" />
                <span>다이어그램 모듈화 및 확장 안내</span>
              </div>
              <button
                onClick={() => setShowDevModal(false)}
                className="text-[#888888] hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-[#cccccc]">
              <p className="leading-relaxed">
                각 슬라이드의 좌측 메인 영역에는 고유한 식별자(<code className="text-white">id="slide-content-1" ~ id="slide-content-6"</code>)가 부여되어 있습니다.
              </p>

              <div className="bg-[#0b0b0b] p-3 rounded border border-[#222222] space-y-2">
                <div className="text-[#888888] text-[11px]">// 예시 1: React 컴포넌트 삽입 시</div>
                <div className="text-white">
                  <code>{`// App.tsx 내부의 slide.id에 따라 분기 렌더링`}</code>
                </div>
                <div className="text-emerald-400">
                  <code>{`{slide.id === 1 && <MyArchitectureDiagram />}`}</code>
                </div>
              </div>

              <div className="bg-[#0b0b0b] p-3 rounded border border-[#222222] space-y-2">
                <div className="text-[#888888] text-[11px]">// 예시 2: 순수 JS / D3 / Mermaid 로드 시</div>
                <div className="text-white">
                  <code>const target = document.getElementById('slide-content-1');</code>
                </div>
                <div className="text-white">
                  <code>target.appendChild(myInteractiveSvgCanvas);</code>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowDevModal(false)}
                  className="bg-white text-black font-semibold px-4 py-1.5 rounded hover:bg-[#e0e0e0] transition-colors"
                >
                  확인 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
