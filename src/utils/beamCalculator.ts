export type CalcMode = 'design' | 'verify';

export interface RebarSpec {
  id: string;
  label: string;
  imperial: string;
  db: number; // mm
  Ab: number; // mm^2
}

export const REBAR_CATALOG: RebarSpec[] = [
  { id: '3', label: 'No. 3', imperial: '3/8"', db: 9.53, Ab: 71 },
  { id: '4', label: 'No. 4', imperial: '1/2"', db: 12.70, Ab: 129 },
  { id: '5', label: 'No. 5', imperial: '5/8"', db: 15.88, Ab: 199 },
  { id: '6', label: 'No. 6', imperial: '3/4"', db: 19.05, Ab: 284 },
  { id: '7', label: 'No. 7', imperial: '7/8"', db: 22.23, Ab: 387 },
  { id: '8', label: 'No. 8', imperial: '1"', db: 25.40, Ab: 510 },
  { id: '9', label: 'No. 9', imperial: '1 1/8"', db: 28.65, Ab: 645 },
  { id: '10', label: 'No. 10', imperial: '1 1/4"', db: 32.26, Ab: 819 },
];

export interface RebarCandidate {
  bar: RebarSpec;
  numBars: number;
  AsProv: number;
  clearSpacing: number;
  fitsOneLayer: boolean;
  phiMn: number;
  utilizationPct: number;
  cumpleFlexion: boolean;
  cumpleDuctility: boolean;
  score: number;
  selected: boolean;
}

export interface BeamInputs {
  mode: CalcMode;
  L: number; // m
  fc: number; // MPa
  fy: number; // MPa
  gammaC: number; // kN/m^3
  wDeadAdd: number; // kN/m (Carga Muerta Adicional)
  wLive: number; // kN/m (Carga Viva)
  cover: number; // mm (Recubrimiento nominal)
  stirrupDia: number; // mm (Diámetro del estribo)
  // Sobrescritura opcional de sección en Modo Diseño
  manualDims: boolean;
  manualH: number; // mm
  manualB: number; // mm
  // Parámetros editables en Modo Verificación
  verifyH: number; // mm
  verifyB: number; // mm
  verifyBarId: string; // '3' .. '10'
  verifyNumBars: number;
}

export const CLASS_DEFAULT_INPUTS: BeamInputs = {
  mode: 'design',
  L: 5.0,
  fc: 28,
  fy: 420,
  gammaC: 24,
  wDeadAdd: 12.0,
  wLive: 10.0,
  cover: 40,
  stirrupDia: 10,
  manualDims: false,
  manualH: 450,
  manualB: 250,
  verifyH: 450,
  verifyB: 250,
  verifyBarId: '6',
  verifyNumBars: 3,
};

export interface BeamResults {
  bar: RebarSpec;

  // Paso 0: Predimensionamiento
  hMin: number; // L / 16 (mm)
  hAuto: number; // mm
  bCalc: number; // h / 2 (mm)
  bAuto: number; // mm
  h: number; // active h (mm)
  b: number; // active b (mm)
  hCumpleMin: boolean;

  // Paso 1: Cargas y Solicitaciones
  wSelf: number; // kN/m
  wDeadTotal: number; // kN/m
  wU: number; // kN/m
  reaction: number; // kN (RA = RB = Vmax)
  Mu: number; // kN·m

  // Paso 2: Peralte Efectivo Inicial y Acero Requerido
  dEst: number; // mm
  quadA: number;
  quadB: number;
  quadC: number;
  discriminant: number;
  sectionAdequateForSingleReinf: boolean;
  AsReq: number; // mm^2

  // Paso 3: Acero Longitudinal Mínimo (ACI 318-19 Sec. 9.6.1.2)
  AsMin1: number; // mm^2
  AsMin2: number; // mm^2
  AsMin: number; // mm^2
  AsDesignTarget: number; // max(AsReq, AsMin)

  // Paso 4: Propuesta Automática de Armado (o Armado de Verificación)
  candidates: RebarCandidate[];
  numBarsExact: number;
  numBars: number;
  AsProv: number; // mm^2
  cumpleAsMin: boolean;
  clearSpacing: number; // mm
  minRequiredSpacing: number; // mm
  cumpleSpacingSingleLayer: boolean;
  maxBarsOneLayer: number;

  // Paso 5: Peralte Efectivo Final y Bloque de Compresión
  d: number; // mm
  geometryValid: boolean;
  a: number; // mm

  // Paso 6: Momento Nominal y Verificación de Ductilidad (ACI 318-19 Sec. 9.3.3.1)
  z: number; // mm
  Mn: number; // kN·m
  beta1: number;
  c: number; // mm
  epsilonTy: number;
  epsilonT: number;
  phi: number;
  ductilityZone: 'traccion' | 'transicion' | 'compresion';
  cumpleDuctility: boolean;

  // Paso 7: Resistencia de Diseño y Eficiencia
  phiMn: number; // kN·m
  cumpleFlexion: boolean;
  utilizationPct: number; // %

  // Estado Global
  cumpleGlobal: boolean;
}

export function computeAutoDimensions(L_meters: number): {
  hMin: number;
  hAuto: number;
  bCalc: number;
  bAuto: number;
} {
  const safeL = Math.max(0.5, L_meters);
  const L_mm = safeL * 1000;
  const hMin = L_mm / 16; // ACI 318-19 Tabla 9.3.1.1 (simplemente apoyada)
  const hByL12 = Math.ceil((L_mm / 12) / 50) * 50;
  const hByMin = Math.ceil(hMin / 50) * 50;
  const hAuto = Math.max(250, hByL12, hByMin);
  const bCalc = hAuto / 2;
  const bAuto = Math.max(200, Math.ceil(bCalc / 50) * 50);
  return { hMin, hAuto, bCalc, bAuto };
}

function getBeta1(fc: number): number {
  if (fc <= 28) return 0.85;
  if (fc < 55) return 0.85 - (0.05 * (fc - 28)) / 7;
  return 0.65;
}

function evaluatePhi(epsilonT: number, fy: number): {
  phi: number;
  epsilonTy: number;
  ductilityZone: 'traccion' | 'transicion' | 'compresion';
  cumpleDuctility: boolean;
} {
  const Es = 200000; // MPa
  const epsilonTy = fy / Es;
  const effectiveTensionLimit = Math.max(0.005, epsilonTy + 0.003);

  let phi = 0.90;
  let ductilityZone: 'traccion' | 'transicion' | 'compresion' = 'traccion';

  if (epsilonT >= effectiveTensionLimit - 1e-7) {
    phi = 0.90;
    ductilityZone = 'traccion';
  } else if (epsilonT > epsilonTy) {
    phi = 0.65 + 0.25 * ((epsilonT - epsilonTy) / (effectiveTensionLimit - epsilonTy));
    ductilityZone = 'transicion';
  } else {
    phi = 0.65;
    ductilityZone = 'compresion';
  }

  const cumpleDuctility = epsilonT >= 0.005 - 1e-7 && ductilityZone === 'traccion';
  return { phi, epsilonTy, ductilityZone, cumpleDuctility };
}

function selectOptimalRebar(params: {
  b: number;
  h: number;
  fc: number;
  fy: number;
  cover: number;
  stirrupDia: number;
  Mu: number;
  AsDesignTarget: number;
}): {
  selectedBar: RebarSpec;
  selectedNumBars: number;
  candidates: RebarCandidate[];
} {
  const { b, h, fc, fy, cover, stirrupDia, Mu, AsDesignTarget } = params;
  const beta1 = getBeta1(fc);
  const availableWidth = b - 2 * cover - 2 * stirrupDia;

  const evaluated: RebarCandidate[] = [];

  for (const bar of REBAR_CATALOG) {
    const dCand = Math.max(40, h - cover - stirrupDia - bar.db / 2);
    const minReqSpacing = Math.max(25, bar.db);

    // Calcular As,req específico para el peralte de esta varilla
    const qA = fy / (1.7 * fc * b);
    const qB = dCand;
    const qC = (Mu * 1e6) / (0.90 * fy);
    const disc = qB * qB - 4 * qA * qC;
    const asReqBar = disc >= 0 ? (qB - Math.sqrt(disc)) / (2 * qA) : AsDesignTarget;

    const asMin1 = ((0.25 * Math.sqrt(fc)) / fy) * b * dCand;
    const asMin2 = (1.4 / fy) * b * dCand;
    const targetForBar = Math.max(asReqBar, asMin1, asMin2);

    const nNeeded = Math.max(2, Math.ceil(targetForBar / bar.Ab));

    // Evaluar nNeeded (y nNeeded + 1 si 2 barras quedan muy al límite >96% de capacidad)
    const countsToTry = new Set<number>([nNeeded]);
    if (nNeeded >= 2 && nNeeded <= 5) {
      countsToTry.add(nNeeded + 1);
    }

    for (const n of countsToTry) {
      if (n > 8) continue;

      const AsProv = n * bar.Ab;
      const clearSpacing =
        n > 1 ? (availableWidth - n * bar.db) / (n - 1) : availableWidth - bar.db;
      const fitsOneLayer =
        n === 1 ? availableWidth >= bar.db : clearSpacing >= minReqSpacing - 1e-6;

      const a = (AsProv * fy) / (0.85 * fc * b);
      const z = dCand - a / 2;
      const Mn = (AsProv * fy * z) / 1e6;
      const c = a / beta1;
      const epsilonT = c > 0 ? 0.003 * ((dCand - c) / c) : 0;
      const { phi, cumpleDuctility } = evaluatePhi(epsilonT, fy);
      const phiMn = phi * Mn;
      const cumpleFlexion = phiMn >= Mu - 1e-6;
      const utilizationPct = phiMn > 0 ? (Mu / phiMn) * 100 : 999;

      // Función de costo de ingeniería (menor puntaje = mejor opción constructiva y económica)
      let score = 0;

      // Penalizaciones fuertes si no cumple requisitos estructurales o constructivos
      if (!cumpleFlexion) score += 10000;
      if (!cumpleDuctility) score += 5000;
      if (!fitsOneLayer) score += 2000;

      // Desperdicio relativo de acero respecto al objetivo
      const wasteRatio = Math.max(0, (AsProv - targetForBar) / Math.max(1, targetForBar));
      score += wasteRatio * 100;

      // Preferir cantidad constructiva óptima entre 2 y 4 barras en una capa
      if (n > 4) score += (n - 4) * 12;

      // Penalizar espaciamiento estrecho (< 35 mm dificulta el paso del vibrador/agregado)
      if (fitsOneLayer && clearSpacing < 35) {
        score += (35 - clearSpacing) * 2.2;
      }

      // Penalizar margen de seguridad demasiado ajustado (> 96% de utilización)
      if (cumpleFlexion && utilizationPct > 96) {
        score += (utilizationPct - 96) * 6;
      }

      // Ligera preferencia por calibres estándar de vigas (No. 5 a No. 8) sobre varillas muy delgadas o muy gruesas
      const barNum = parseInt(bar.id, 10);
      if (barNum < 5) score += 8;
      if (barNum > 8) score += 10;

      evaluated.push({
        bar,
        numBars: n,
        AsProv,
        clearSpacing,
        fitsOneLayer,
        phiMn,
        utilizationPct,
        cumpleFlexion,
        cumpleDuctility,
        score,
        selected: false,
      });
    }
  }

  evaluated.sort((x, y) => x.score - y.score);
  const best = evaluated[0];
  if (best) {
    best.selected = true;
  }

  // Conservar un resumen limpio de las mejores opciones únicas por calibre (máx. 5 filas para mostrar en Paso 4)
  const uniqueByBar: RebarCandidate[] = [];
  const seenIds = new Set<string>();
  for (const cand of evaluated) {
    if (!seenIds.has(cand.bar.id)) {
      seenIds.add(cand.bar.id);
      uniqueByBar.push(cand);
    }
    if (uniqueByBar.length >= 5) break;
  }

  return {
    selectedBar: best ? best.bar : REBAR_CATALOG[3],
    selectedNumBars: best ? best.numBars : 3,
    candidates: uniqueByBar,
  };
}

export function calculateBeam(inputs: BeamInputs): BeamResults {
  const L = Math.max(0.5, inputs.L || 0.5);
  const fc = Math.max(17, inputs.fc || 21);
  const fy = Math.max(240, inputs.fy || 420);
  const gammaC = Math.max(10, inputs.gammaC || 24);
  const wDeadAdd = Math.max(0, inputs.wDeadAdd || 0);
  const wLive = Math.max(0, inputs.wLive || 0);
  const cover = Math.max(15, inputs.cover || 40);
  const stirrupDia = Math.max(6, inputs.stirrupDia || 10);

  // Paso 0: Predimensionamiento
  const { hMin, hAuto, bCalc, bAuto } = computeAutoDimensions(L);
  let h = hAuto;
  let b = bAuto;

  if (inputs.mode === 'design' && inputs.manualDims) {
    h = Math.max(150, inputs.manualH || hAuto);
    b = Math.max(120, inputs.manualB || bAuto);
  } else if (inputs.mode === 'verify') {
    h = Math.max(150, inputs.verifyH || hAuto);
    b = Math.max(120, inputs.verifyB || bAuto);
  }

  const hCumpleMin = h >= hMin - 1e-6;

  // Paso 1: Análisis de Cargas y Momento Último
  const wSelf = gammaC * (b / 1000) * (h / 1000);
  const wDeadTotal = wSelf + wDeadAdd;
  const wU = 1.2 * wDeadTotal + 1.6 * wLive;
  const reaction = (wU * L) / 2;
  const Mu = (wU * L * L) / 8;

  // Paso 2: Peralte Efectivo Inicial (referencia No. 6 para resolver cuadrática inicial) y As,req
  const refBar =
    inputs.mode === 'verify'
      ? REBAR_CATALOG.find((r) => r.id === inputs.verifyBarId) ?? REBAR_CATALOG[3]
      : REBAR_CATALOG[3]; // No. 6 (19.05 mm) como referencia inicial de pre-diseño

  const dEst = h - cover - stirrupDia - refBar.db / 2;
  const effectiveDEst = Math.max(1, dEst);

  const phiNominal = 0.90;
  const quadA = fy / (1.7 * fc * b);
  const quadB = effectiveDEst;
  const quadC = (Mu * 1e6) / (phiNominal * fy);
  const discriminant = quadB * quadB - 4 * quadA * quadC;
  const sectionAdequateForSingleReinf = dEst > 40 && discriminant >= 0;

  const AsReq = sectionAdequateForSingleReinf
    ? (quadB - Math.sqrt(discriminant)) / (2 * quadA)
    : Number.POSITIVE_INFINITY;

  // Paso 3: Acero Longitudinal Mínimo (ACI 318-19 Sec. 9.6.1.2)
  const AsMin1 = ((0.25 * Math.sqrt(fc)) / fy) * b * effectiveDEst;
  const AsMin2 = (1.4 / fy) * b * effectiveDEst;
  const AsMin = Math.max(AsMin1, AsMin2);
  const AsDesignTarget = Number.isFinite(AsReq) ? Math.max(AsReq, AsMin) : AsMin;

  // Paso 4: Propuesta Automática de Varilla Comercial (Modo Diseño) o Fija (Modo Verificación)
  let bar: RebarSpec;
  let numBars: number;
  let candidates: RebarCandidate[] = [];

  if (inputs.mode === 'design') {
    const selection = selectOptimalRebar({
      b,
      h,
      fc,
      fy,
      cover,
      stirrupDia,
      Mu,
      AsDesignTarget,
    });
    bar = selection.selectedBar;
    numBars = selection.selectedNumBars;
    candidates = selection.candidates;
  } else {
    bar = refBar;
    numBars = Math.max(1, Math.round(inputs.verifyNumBars || 1));
  }

  const numBarsExact = Number.isFinite(AsReq) ? AsDesignTarget / bar.Ab : 0;
  const AsProv = numBars * bar.Ab;

  // Paso 5: Peralte Efectivo Final (d) con el diámetro db seleccionado y Bloque de Compresión (a)
  const d = h - cover - stirrupDia - bar.db / 2;
  const geometryValid = d > 40;
  const effectiveD = Math.max(1, d);

  // Recalcular AsMin final con el peralte efectivo definitivo
  const AsMin1Final = ((0.25 * Math.sqrt(fc)) / fy) * b * effectiveD;
  const AsMin2Final = (1.4 / fy) * b * effectiveD;
  const AsMinFinal = Math.max(AsMin1Final, AsMin2Final);
  const cumpleAsMin = AsProv >= AsMinFinal - 1e-6;

  // Espaciamiento libre en 1 capa (ACI 318-19 Sec. 25.2.1)
  const minRequiredSpacing = Math.max(25, bar.db);
  const availableWidth = b - 2 * cover - 2 * stirrupDia;
  const clearSpacing =
    numBars > 1
      ? (availableWidth - numBars * bar.db) / (numBars - 1)
      : availableWidth - bar.db;
  const cumpleSpacingSingleLayer =
    numBars === 1
      ? availableWidth >= bar.db
      : clearSpacing >= minRequiredSpacing - 1e-6;
  const maxBarsOneLayer = Math.max(
    1,
    Math.floor((availableWidth + minRequiredSpacing) / (bar.db + minRequiredSpacing))
  );

  const a = (AsProv * fy) / (0.85 * fc * b);

  // Paso 6: Momento Nominal (Mn) y Verificación de Ductilidad (ACI 318-19 Sec. 9.3.3.1)
  const z = effectiveD - a / 2;
  const Mn = (AsProv * fy * z) / 1e6;
  const beta1 = getBeta1(fc);
  const c = a / beta1;
  const epsilonT = c > 0 ? 0.003 * ((effectiveD - c) / c) : 0;
  const { phi, epsilonTy, ductilityZone, cumpleDuctility } = evaluatePhi(epsilonT, fy);

  // Paso 7: Resistencia de Diseño (φMn) y Eficiencia
  const phiMn = phi * Mn;
  const cumpleFlexion = geometryValid && phiMn >= Mu - 1e-6;
  const utilizationPct = phiMn > 0 ? (Mu / phiMn) * 100 : 999;

  const cumpleGlobal =
    geometryValid &&
    cumpleFlexion &&
    cumpleDuctility &&
    cumpleAsMin &&
    (inputs.mode === 'verify' || sectionAdequateForSingleReinf);

  return {
    bar,
    hMin,
    hAuto,
    bCalc,
    bAuto,
    h,
    b,
    hCumpleMin,
    wSelf,
    wDeadTotal,
    wU,
    reaction,
    Mu,
    dEst,
    quadA,
    quadB,
    quadC,
    discriminant,
    sectionAdequateForSingleReinf,
    AsReq,
    AsMin1: AsMin1Final,
    AsMin2: AsMin2Final,
    AsMin: AsMinFinal,
    AsDesignTarget,
    candidates,
    numBarsExact,
    numBars,
    AsProv,
    cumpleAsMin,
    clearSpacing,
    minRequiredSpacing,
    cumpleSpacingSingleLayer,
    maxBarsOneLayer,
    d,
    geometryValid,
    a,
    z,
    Mn,
    beta1,
    c,
    epsilonTy,
    epsilonT,
    phi,
    ductilityZone,
    cumpleDuctility,
    phiMn,
    cumpleFlexion,
    utilizationPct,
    cumpleGlobal,
  };
}
