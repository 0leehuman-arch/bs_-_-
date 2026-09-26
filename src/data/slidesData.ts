export interface SlideMetadata {
  id: number;
  navLabel: string;
  category: string;
  title: string;
  subtitle: string;
  placeholderText?: string;
  narrativeParagraphs?: string[];
  mechanisms?: {
    num: string;
    name: string;
    desc: string;
    subNote: string;
  }[];
  description: string;
  specs: {
    label: string;
    value: string;
  }[];
  keyPoints: string[];
  devNote: string;
  schemaType: string;
}

export const SLIDES_DATA: SlideMetadata[] = [
  {
    id: 1,
    navLabel: "[01 heat balance]",
    category: "HUMAN THERMAL BALANCE",
    title: "01 heat balance",
    subtitle: "건축설비 - 인체 열평형 및 환경 열교환 메커니즘",
    narrativeParagraphs: [
      "Human body temperature is approximately 37.0°C and must be maintained within a narrow range of ±0.5°C.",
      "The body continuously generates heat while sustaining vital activities such as respiration and blood circulation.",
      "To maintain a stable body temperature, heat generated inside the body must balance with heat released to the environment."
    ],
    mechanisms: [
      {
        num: "①",
        name: "Evaporation (증발)",
        desc: "Sweating → Heat is released to the outside as sweat evaporates.",
        subNote: "→ However, higher relative humidity reduces the evaporation rate."
      },
      {
        num: "②",
        name: "Respiration (호흡)",
        desc: "Exhaled air is generally warmer and moister than inhaled air.",
        subNote: "→ Heat and moisture are transferred externally through breathing."
      },
      {
        num: "③",
        name: "Convection (대류)",
        desc: "Heat is exchanged with the air surrounding skin and clothing.",
        subNote: "→ Moving air removes the warm air layer near skin, causing a cooling effect."
      },
      {
        num: "④",
        name: "Radiation (복사)",
        desc: "Radiative energy is exchanged between the human body and surrounding surfaces.",
        subNote: "→ Indoors, skin temperature usually exceeds surrounding surfaces, resulting in net radiative heat loss."
      }
    ],
    description:
      "인체는 체온 37.0°C를 ±0.5°C 범위 내에서 엄격히 유지해야 합니다. 체내에서 생성되는 열과 환경으로 방출되는 열이 평형을 이루어야 쾌적한 열환경이 조성됩니다.",
    specs: [
      { label: "기준 심부체온", value: "37.0°C (±0.5°C Safe Range)" },
      { label: "열교환 매커니즘", value: "대류(C), 복사(R), 증발(E), 호흡(Res)" },
      { label: "인체 변수", value: "활동량, 혈관반응, 식음료, 발한, 착의량" },
      { label: "환경 4요소", value: "DBT(건구온도), v(풍속), RH(습도), MRT(복사)" }
    ],
    keyPoints: [
      "인체 열생산량 = 대류 + 복사 + 증발 + 호흡 방출량의 동적 균형",
      "상대습도(RH)가 높을수록 발한 증발 잠열 방출 효율 저하",
      "실내 표면온도(MRT)와 건구온도(DBT)의 상호작용에 따른 복사열 교환"
    ],
    devNote: "id=\"slide-content-1\" 컨테이너에 인체 열평형 대화형 그래픽 및 변수 시뮬레이터가 성공적으로 마운트되었습니다.",
    schemaType: "Building Environmental Thermal Model"
  },
  {
    id: 2,
    navLabel: "[02 PMV comfort range]",
    category: "BIOCLIMATIC PSYCHROMETRIC CHART",
    title: "02 PMV comfort range",
    subtitle: "Olgyay's Bioclimatic Chart & Fanger's PMV Comfort Range",
    description:
      "Current conditions are evaluated against Olgyay's bioclimatic psychrometric zones and Fanger's PMV comfort range to determine passive climate strategies.",
    specs: [
      { label: "Basis Model", value: "Olgyay & Carrier Psychrometrics" },
      { label: "Comfort Range", value: "21.5°C - 27.5°C | 4.0 - 10.0 g/kg" },
      { label: "Evaluation Index", value: "PMV / PPD & Slanted Effective Temp" },
      { label: "Target Container", value: "#slide-content-2" }
    ],
    keyPoints: [
      "Comfort Range: Current conditions are thermally comfortable without active HVAC intervention.",
      "Solar Gains Desired: Low temperature condition requiring passive solar heating or thermal insulation gains.",
      "Increased Air Speed (Fan/Window): Elevated airflow velocity provided by ceiling fans or natural cross-ventilation.",
      "Night Ventilation + Thermal Mass: Flushing the building with cool night air to discharge heat stored in structural high-mass elements."
    ],
    devNote: "Container mounted at id=\"slide-content-2\"",
    schemaType: "Bioclimatic PMV Analysis"
  },
  {
    id: 3,
    navLabel: "[03 Passive conditioning]",
    category: "PASSIVE CONDITIONING & CLIMATE RESPONSE",
    title: "03 Passive conditioning",
    subtitle: "Lisbon, Portugal Study (Fig. 4.11 Analysis)",
    description:
      "One-click indoor climate analysis model for a residential space equipped with a ceiling fan in Lisbon, Portugal by Svenja Herb, Sam Wolk, and Christoph Reinhart.",
    specs: [
      { label: "Location", value: "Lisbon, Portugal" },
      { label: "Evaluated Variables", value: "WWR & 4 Passive Strategies" },
      { label: "Recommended WWR", value: "Up to 50% (Max)" },
      { label: "Climate Warning", value: "WWR < 40% Best Practice" }
    ],
    keyPoints: [
      "Strategy Matrix Expansion: Combining daytime ventilation, shading, night flushing, and thermal mass dramatically expands achievable WWR without mechanical AC.",
      "Optimal Combination (50% WWR): Nighttime ventilation with dynamic external shading maintains thermal comfort up to 50% WWR across all orientations.",
      "Climate Change Precaution: To offset future global warming and reduced night ventilation potential, avoiding WWR above 40% is strongly advised.",
      "Practical Decision Utility: Delivers actionable, highly reliable climate response guidelines requiring zero simulation background."
    ],
    devNote: "Container mounted at id=\"slide-content-3\"",
    schemaType: "Fig 4.11 Sector Matrix & Spatial Model"
  },
  {
    id: 4,
    navLabel: "[04 ATC comfort range]",
    category: "ADAPTIVE THERMAL COMFORT",
    title: "04 ATC comfort range",
    subtitle: "ASHRAE 55 Occupant comfort limits (80%, 90% Acceptability) and real-time positional analysis.",
    description:
      "ASHRAE 55 Occupant comfort limits (80%, 90% Acceptability) and real-time positional analysis.",
    specs: [
      { label: "T_comf Formula", value: "0.31 × T_rm + 17.8" },
      { label: "80% Limits", value: "T_comf ± 3.5°C" },
      { label: "90% Limits", value: "T_comf ± 2.5°C" },
      { label: "Target Container", value: "#slide-content-4" }
    ],
    keyPoints: [
      "90% Acceptability Limits: Located within the optimal comfort range. The vast majority of occupants are thermally satisfied.",
      "80% Acceptability Limits: Located within the standard comfort range. Acceptable to at least 80% of the occupants.",
      "Overheating Risk: Temperature exceeds comfort limits. Increased airflow, shading deployment, or mechanical cooling is required.",
      "Underheating Risk: Temperature is below comfort limits. Increased solar gains or mechanical heating is required."
    ],
    devNote: "Container mounted at id=\"slide-content-4\"",
    schemaType: "ASHRAE 55 Adaptive Comfort Model"
  },
  {
    id: 5,
    navLabel: "[05 Occupant intercention]",
    category: "OCCUPANT INTERVENTION & THERMAL CONTROL",
    title: "05 Occupant intercention",
    subtitle: "Passive Thermal Control Strategy & Comfort Mechanisms",
    description:
      "Analysis of indoor Dry-Bulb Temperature (DBT) and Mean Radiant Temperature (MRT) based on occupant intervention strategies.",
    specs: [
      { label: "Model Basis", value: "Givoni & Olgyay Bioclimatic Model" },
      { label: "Study Reference", value: "Lisbon Overheating Study (Fig. 4.11 & 4.22)" },
      { label: "Formula", value: "Top = (DBT + MRT) / 2" },
      { label: "Target Container", value: "#slide-content-5" }
    ],
    keyPoints: [
      "① Night Flushing: Introduces cool nocturnal outdoor air to exhaust heat accumulated in the concrete floor slab (thermal mass) during the day. Resets structural temperature to suppress daytime Operative Temperature (Top) rise.",
      "② Turn Off Equipment: Cuts standby power and heat emissions from electronics (computers, lighting) to eliminate internal heat gains (Qinternal), preventing direct rise in Dry-Bulb Temperature (DBT).",
      "③ Deploy Shading: Proactively blocks and reflects solar radiation outside window glazing before penetration. Prevents indoor surface temperature rise, significantly reducing Mean Radiant Temperature (MRT) felt by occupants.",
      "Operative Temperature Formula: Top = (DBT + MRT) / 2 (DBT: Convection & Internal Gain | MRT: Shading & Thermal Mass)."
    ],
    devNote: "Container mounted at id=\"slide-content-5\"",
    schemaType: "Givoni & Olgyay Bioclimatic Model"
  },
  {
    id: 6,
    navLabel: "[06 AI-Assisted Thermal Environment Design]",
    category: "AI & COMPUTATIONAL DESIGN",
    title: "06 AI-Assisted Thermal Environment Design",
    subtitle: "Architectural Environmental Design & Adaptive Thermal Comfort Optimization",
    description:
      "Deterministic Physics Engine based AI assistant for climate analysis, passive design optimization, and ASHRAE 55 Adaptive Thermal Comfort.",
    specs: [
      { label: "Engine Type", value: "Deterministic Physics Engine" },
      { label: "Standard", value: "ASHRAE Standard 55-2020" },
      { label: "Container ID", value: "#slide-content-6" },
      { label: "Design Scope", value: "Solar, Ventilation, Mass & Shading" }
    ],
    keyPoints: [
      "Zero Hallucination: Grounded in validated thermodynamic & natural ventilation equations",
      "Interactive 3D/2D Building Section: Real-time solar ray tracing, cross-stack airflow streamlines, and thermal mass accumulation",
      "Dynamic Adaptive Thermal Comfort Chart: Instantaneous comfort band mapping and AI initial design comparison"
    ],
    devNote: "Mounted as full-screen immersive studio at id=\"slide-content-6\"",
    schemaType: "Deterministic Physics Engine & Adaptive Comfort"
  }
];
