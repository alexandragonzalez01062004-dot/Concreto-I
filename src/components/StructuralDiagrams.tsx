import React, { useState } from 'react';
import { BeamInputs, BeamResults } from '../utils/beamCalculator';

interface StructuralDiagramsProps {
  inputs: BeamInputs;
  results: BeamResults;
}

export const StructuralDiagrams: React.FC<StructuralDiagramsProps> = ({
  inputs,
  results,
}) => {
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);

  // Formatters
  const fmt = (n: number, dec = 2) =>
    Number.isFinite(n) ? n.toFixed(dec) : '—';

  // Hover values along beam span
  const activeRatio = hoverRatio !== null ? hoverRatio : 0.5;
  const xPos = activeRatio * inputs.L;
  const Vx = results.reaction - results.wU * xPos;
  const Mx = (results.wU * xPos * (inputs.L - xPos)) / 2;

  // -------------------------------------------------------------------------
  // SVG 1: Structural Load Scheme Coordinates
  // -------------------------------------------------------------------------
  const s1W = 640;
  const s1H = 225;
  const beamX0 = 90;
  const beamX1 = 550;
  const beamSpanPx = beamX1 - beamX0;
  const beamY = 122;
  const beamThickness = 22;

  const numLoadArrows = 11;
  const loadArrowXs = Array.from(
    { length: numLoadArrows },
    (_, i) => beamX0 + (i * beamSpanPx) / (numLoadArrows - 1)
  );

  // -------------------------------------------------------------------------
  // SVG 2: Shear & Moment Diagrams Coordinates
  // -------------------------------------------------------------------------
  const s2W = 640;
  const s2H = 310;
  const chartX0 = 90;
  const chartX1 = 550;
  const chartSpan = chartX1 - chartX0;

  // Shear baseline
  const vZeroY = 78;
  const vAmp = 48; // +/- amplitude in px
  const vYStart = vZeroY - vAmp;
  const vYEnd = vZeroY + vAmp;
  const chartXMid = (chartX0 + chartX1) / 2;

  // Moment baseline
  const mZeroY = 185;
  const mAmp = 82; // positive downward in structural engineering convention
  const momentPoints = Array.from({ length: 61 }, (_, i) => {
    const t = i / 60;
    const x = chartX0 + t * chartSpan;
    const mNorm = 4 * t * (1 - t); // parabola 0..1..0
    const y = mZeroY + mNorm * mAmp;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const momentAreaPath = `M ${chartX0},${mZeroY} L ${momentPoints.join(' L ')} L ${chartX1},${mZeroY} Z`;
  const momentCurvePath = `M ${momentPoints.join(' L ')}`;

  const probeX = chartX0 + activeRatio * chartSpan;
  const probeVY = vZeroY - (1 - 2 * activeRatio) * vAmp;
  const probeMY = mZeroY + 4 * activeRatio * (1 - activeRatio) * mAmp;

  const handleChartPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * s2W;
    const ratio = Math.min(1, Math.max(0, (svgX - chartX0) / chartSpan));
    setHoverRatio(ratio);
  };

  // -------------------------------------------------------------------------
  // SVG 3: Cross Section + Strain Diagram (To Scale)
  // -------------------------------------------------------------------------
  const s3W = 640;
  const s3H = 360;
  const maxDrawW = 220;
  const maxDrawH = 240;

  const scale = Math.min(maxDrawW / results.b, maxDrawH / results.h);
  const drawW = results.b * scale;
  const drawH = results.h * scale;

  const secX0 = 95 + (maxDrawW - drawW) / 2;
  const secY0 = 54 + (maxDrawH - drawH) / 2;
  const secX1 = secX0 + drawW;
  const secY1 = secY0 + drawH;

  // Scaled geometry details
  const coverPx = Math.min(inputs.cover * scale, drawW * 0.3, drawH * 0.25);
  const stirrupPx = Math.max(2, inputs.stirrupDia * scale);
  const barRadiusPx = Math.max(3.5, (results.bar.db / 2) * scale);

  // Whitney block a and Neutral Axis c
  const aPx = Math.min(drawH, Math.max(0, results.a * scale));
  const cPx = Math.min(drawH, Math.max(0, results.c * scale));
  const dPx = Math.min(drawH - 6, Math.max(12, results.d * scale));

  // Rebar placement inside stirrup
  const innerLeft = secX0 + coverPx + stirrupPx;
  const innerRight = secX1 - coverPx - stirrupPx;
  const innerWidth = Math.max(barRadiusPx * 2, innerRight - innerLeft);
  const barCenterY = secY0 + dPx;

  // Arrange bars into 1 or 2 layers visually if needed
  const maxInRow = Math.max(1, results.maxBarsOneLayer);
  const row1Count = Math.min(results.numBars, maxInRow);
  const row2Count = Math.max(0, results.numBars - row1Count);

  const computeRowXs = (count: number) => {
    if (count <= 0) return [];
    if (count === 1) return [(innerLeft + innerRight) / 2];
    const firstCenter = innerLeft + barRadiusPx + 1;
    const lastCenter = innerRight - barRadiusPx - 1;
    const usable = Math.max(0, lastCenter - firstCenter);
    return Array.from(
      { length: count },
      (_, idx) => firstCenter + (idx * usable) / (count - 1)
    );
  };

  const row1Xs = computeRowXs(row1Count);
  const row2Xs = computeRowXs(row2Count);
  const row2Y = barCenterY - Math.max(barRadiusPx * 2.6, 18);

  // Strain diagram geometry (to the right of cross-section)
  const strainX0 = 430;
  const strainWidth = 140;
  const strainTopY = secY0;
  const strainNaY = secY0 + Math.min(drawH * 0.92, Math.max(10, cPx));
  const strainSteelY = secY0 + dPx;

  // Normalize horizontal strain offsets so both eps_c = 0.003 and eps_t fit cleanly
  const epsC = 0.003;
  const epsT = Math.max(0.0005, results.epsilonT);
  const maxEps = Math.max(epsC, epsT, 0.008);
  const epsCPx = Math.max(22, (epsC / maxEps) * (strainWidth * 0.45));
  const epsTPx = Math.min(
    strainWidth * 0.72,
    Math.max(18, (epsT / maxEps) * (strainWidth * 0.65))
  );

  const strainFillColor = results.cumpleDuctility ? '#C1E1C1' : '#FFB7B2';
  const strainStrokeColor = results.cumpleDuctility ? '#1E4D2B' : '#7A1F1F';

  return (
    <div className="space-y-6">
      {/* 1. Esquema Estructural */}
      <section className="bg-white border border-[#E8E3DA] rounded-xl p-5 print-card print-break-inside-avoid">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-semibold text-[#2D3748]">
              1. Esquema Estructural y Cargas Últimas
            </h3>
            <p className="text-xs text-[#64748B]">
              Viga simplemente apoyada · Combinación última ACI 318-19 (1.2D + 1.6L)
            </p>
          </div>
          <div className="font-mono tabular-nums text-xs text-[#2D3748] bg-[#FDFBF7] border border-[#E8E3DA] px-3 py-1.5 rounded-lg">
            W<sub>u</sub> = {fmt(results.wU)} kN/m · L = {fmt(inputs.L)} m
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${s1W} ${s1H}`}
            className="w-full h-auto max-h-[240px]"
            role="img"
            aria-label="Esquema estructural de la viga simplemente apoyada con carga distribuida"
          >
            <defs>
              <marker
                id="arrow-down"
                viewBox="0 0 10 10"
                refX="5"
                refY="8"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M 0 1 L 5 9 L 10 1 z" fill="#2D3748" />
              </marker>
              <marker
                id="arrow-up"
                viewBox="0 0 10 10"
                refX="5"
                refY="2"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 9 L 5 1 L 10 9 z" fill="#1E4D2B" />
              </marker>
              <pattern
                id="hatch-support"
                width="6"
                height="6"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="0" x2="0" y2="6" stroke="#94A3B8" strokeWidth="1.2" />
              </pattern>
            </defs>

            {/* Distributed Load Envelope */}
            <rect
              x={beamX0}
              y={52}
              width={beamSpanPx}
              height={beamY - 52 - 6}
              fill="#A8D8EA"
              fillOpacity="0.35"
              stroke="#6FB8D4"
              strokeWidth="1.2"
            />
            <line
              x1={beamX0}
              y1={52}
              x2={beamX1}
              y2={52}
              stroke="#2D3748"
              strokeWidth="1.8"
            />
            <text
              x={(beamX0 + beamX1) / 2}
              y={40}
              textAnchor="middle"
              className="font-mono text-[13px] font-semibold"
              fill="#2D3748"
            >
              Wu = {fmt(results.wU)} kN/m (WD = {fmt(results.wDeadTotal)} · WL = {fmt(inputs.wLive)})
            </text>

            {/* Load Arrows */}
            {loadArrowXs.map((ax, idx) => (
              <line
                key={idx}
                x1={ax}
                y1={52}
                x2={ax}
                y2={beamY - 5}
                stroke="#2D3748"
                strokeWidth="1.3"
                markerEnd="url(#arrow-down)"
              />
            ))}

            {/* Beam Body */}
            <rect
              x={beamX0 - 6}
              y={beamY}
              width={beamSpanPx + 12}
              height={beamThickness}
              rx={2}
              fill="#E2E8F0"
              stroke="#2D3748"
              strokeWidth="1.8"
            />
            {/* Neutral centerline */}
            <line
              x1={beamX0}
              y1={beamY + beamThickness / 2}
              x2={beamX1}
              y2={beamY + beamThickness / 2}
              stroke="#64748B"
              strokeWidth="1"
              strokeDasharray="6 4"
            />
            <text
              x={(beamX0 + beamX1) / 2}
              y={beamY + 15}
              textAnchor="middle"
              className="font-mono text-[11px] font-medium"
              fill="#2D3748"
            >
              Sección b × h = {Math.round(results.b)} × {Math.round(results.h)} mm
            </text>

            {/* Left Pin Support (A) */}
            <polygon
              points={`${beamX0},${beamY + beamThickness} ${beamX0 - 11},${beamY + beamThickness + 16} ${beamX0 + 11},${beamY + beamThickness + 16}`}
              fill="#A8D8EA"
              stroke="#2D3748"
              strokeWidth="1.5"
            />
            <rect
              x={beamX0 - 15}
              y={beamY + beamThickness + 16}
              width={30}
              height={6}
              fill="url(#hatch-support)"
            />
            <line
              x1={beamX0 - 15}
              y1={beamY + beamThickness + 16}
              x2={beamX0 + 15}
              y2={beamY + beamThickness + 16}
              stroke="#2D3748"
              strokeWidth="1.4"
            />

            {/* Right Roller Support (B) */}
            <polygon
              points={`${beamX1},${beamY + beamThickness} ${beamX1 - 11},${beamY + beamThickness + 11} ${beamX1 + 11},${beamY + beamThickness + 11}`}
              fill="#A8D8EA"
              stroke="#2D3748"
              strokeWidth="1.5"
            />
            <circle
              cx={beamX1 - 6}
              cy={beamY + beamThickness + 14}
              r={2.5}
              fill="#FFFFFF"
              stroke="#2D3748"
              strokeWidth="1.2"
            />
            <circle
              cx={beamX1 + 6}
              cy={beamY + beamThickness + 14}
              r={2.5}
              fill="#FFFFFF"
              stroke="#2D3748"
              strokeWidth="1.2"
            />
            <rect
              x={beamX1 - 15}
              y={beamY + beamThickness + 17}
              width={30}
              height={6}
              fill="url(#hatch-support)"
            />
            <line
              x1={beamX1 - 15}
              y1={beamY + beamThickness + 17}
              x2={beamX1 + 15}
              y2={beamY + beamThickness + 17}
              stroke="#2D3748"
              strokeWidth="1.4"
            />

            {/* Reaction Arrows */}
            <line
              x1={beamX0}
              y1={beamY + beamThickness + 46}
              x2={beamX0}
              y2={beamY + beamThickness + 24}
              stroke="#1E4D2B"
              strokeWidth="2"
              markerEnd="url(#arrow-up)"
            />
            <text
              x={beamX0}
              y={beamY + beamThickness + 60}
              textAnchor="middle"
              className="font-mono text-[12px] font-semibold"
              fill="#1E4D2B"
            >
              RA = {fmt(results.reaction)} kN
            </text>

            <line
              x1={beamX1}
              y1={beamY + beamThickness + 46}
              x2={beamX1}
              y2={beamY + beamThickness + 24}
              stroke="#1E4D2B"
              strokeWidth="2"
              markerEnd="url(#arrow-up)"
            />
            <text
              x={beamX1}
              y={beamY + beamThickness + 60}
              textAnchor="middle"
              className="font-mono text-[12px] font-semibold"
              fill="#1E4D2B"
            >
              RB = {fmt(results.reaction)} kN
            </text>

            {/* Span Dimension Line */}
            <line
              x1={beamX0}
              y1={beamY + beamThickness + 34}
              x2={beamX1}
              y2={beamY + beamThickness + 34}
              stroke="#64748B"
              strokeWidth="1.2"
            />
            <line
              x1={beamX0}
              y1={beamY + beamThickness + 28}
              x2={beamX0}
              y2={beamY + beamThickness + 40}
              stroke="#64748B"
              strokeWidth="1.2"
            />
            <line
              x1={beamX1}
              y1={beamY + beamThickness + 28}
              x2={beamX1}
              y2={beamY + beamThickness + 40}
              stroke="#64748B"
              strokeWidth="1.2"
            />
            <rect
              x={(beamX0 + beamX1) / 2 - 48}
              y={beamY + beamThickness + 24}
              width={96}
              height={18}
              fill="#FFFFFF"
            />
            <text
              x={(beamX0 + beamX1) / 2}
              y={beamY + beamThickness + 37}
              textAnchor="middle"
              className="font-mono text-[12px] font-semibold"
              fill="#2D3748"
            >
              L = {fmt(inputs.L)} m
            </text>
          </svg>
        </div>
      </section>

      {/* 2. Diagramas de Cortante y Momento */}
      <section className="bg-white border border-[#E8E3DA] rounded-xl p-5 print-card print-break-inside-avoid">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-semibold text-[#2D3748]">
              2. Diagramas de Cortante (V) y Momento Flector (M)
            </h3>
            <p className="text-xs text-[#64748B]">
              Pasa el cursor sobre el diagrama para inspeccionar V(x) y M(x) en cualquier abscisa
            </p>
          </div>
          <div className="font-mono tabular-nums text-xs text-[#2D3748] bg-[#FDFBF7] border border-[#E8E3DA] px-3 py-1.5 rounded-lg">
            x = {fmt(xPos)} m · V(x) = {fmt(Vx)} kN · M(x) = {fmt(Mx)} kN·m
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${s2W} ${s2H}`}
            className="w-full h-auto max-h-[320px] cursor-crosshair select-none"
            onPointerMove={handleChartPointerMove}
            onPointerLeave={() => setHoverRatio(null)}
            role="img"
            aria-label="Diagramas de fuerza cortante y momento flector"
          >
            {/* Shear Title */}
            <text
              x={chartX0 - 12}
              y={22}
              textAnchor="start"
              className="text-[12px] font-semibold"
              fill="#2D3748"
            >
              Fuerza Cortante V (kN)
            </text>

            {/* Shear Positive Half */}
            <polygon
              points={`${chartX0},${vZeroY} ${chartX0},${vYStart} ${chartXMid},${vZeroY}`}
              fill="#A8D8EA"
              fillOpacity="0.55"
            />
            {/* Shear Negative Half */}
            <polygon
              points={`${chartXMid},${vZeroY} ${chartX1},${vYEnd} ${chartX1},${vZeroY}`}
              fill="#FFB7B2"
              fillOpacity="0.55"
            />

            {/* Shear Baseline */}
            <line
              x1={chartX0}
              y1={vZeroY}
              x2={chartX1}
              y2={vZeroY}
              stroke="#64748B"
              strokeWidth="1.2"
            />
            {/* Shear Curve */}
            <polyline
              points={`${chartX0},${vZeroY} ${chartX0},${vYStart} ${chartX1},${vYEnd} ${chartX1},${vZeroY}`}
              fill="none"
              stroke="#2D3748"
              strokeWidth="2"
            />
            {/* Shear Labels */}
            <text
              x={chartX0 - 8}
              y={vYStart + 4}
              textAnchor="end"
              className="font-mono text-[11px] font-semibold"
              fill="#1E3A5F"
            >
              +{fmt(results.reaction)}
            </text>
            <text
              x={chartX1 + 8}
              y={vYEnd + 4}
              textAnchor="start"
              className="font-mono text-[11px] font-semibold"
              fill="#7A1F1F"
            >
              -{fmt(results.reaction)}
            </text>
            <circle cx={chartXMid} cy={vZeroY} r={3.5} fill="#2D3748" />
            <text
              x={chartXMid}
              y={vZeroY - 8}
              textAnchor="middle"
              className="font-mono text-[10px]"
              fill="#64748B"
            >
              V = 0 (x = {fmt(inputs.L / 2)} m)
            </text>

            {/* Moment Title */}
            <text
              x={chartX0 - 12}
              y={168}
              textAnchor="start"
              className="text-[12px] font-semibold"
              fill="#2D3748"
            >
              Momento Flector M (kN·m)
            </text>

            {/* Moment Area & Curve */}
            <path d={momentAreaPath} fill="#E0BBE4" fillOpacity="0.55" />
            <path
              d={momentCurvePath}
              fill="none"
              stroke="#2D3748"
              strokeWidth="2"
            />
            {/* Moment Baseline */}
            <line
              x1={chartX0}
              y1={mZeroY}
              x2={chartX1}
              y2={mZeroY}
              stroke="#64748B"
              strokeWidth="1.2"
            />
            {/* Midspan peak guide */}
            <line
              x1={chartXMid}
              y1={mZeroY}
              x2={chartXMid}
              y2={mZeroY + mAmp}
              stroke="#64748B"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <circle cx={chartXMid} cy={mZeroY + mAmp} r={4} fill="#2D3748" />
            <text
              x={chartXMid}
              y={mZeroY + mAmp + 18}
              textAnchor="middle"
              className="font-mono text-[12px] font-semibold"
              fill="#2D3748"
            >
              Mu máx = +{fmt(results.Mu)} kN·m
            </text>

            {/* Interactive Crosshair Probe */}
            <line
              x1={probeX}
              y1={28}
              x2={probeX}
              y2={mZeroY + mAmp + 4}
              stroke="#2D3748"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity={hoverRatio !== null ? 0.75 : 0.3}
            />
            {hoverRatio !== null && (
              <>
                <circle
                  cx={probeX}
                  cy={probeVY}
                  r={4.5}
                  fill="#A8D8EA"
                  stroke="#2D3748"
                  strokeWidth="1.5"
                />
                <circle
                  cx={probeX}
                  cy={probeMY}
                  r={4.5}
                  fill="#E0BBE4"
                  stroke="#2D3748"
                  strokeWidth="1.5"
                />
              </>
            )}
          </svg>
        </div>
      </section>

      {/* 3. Sección Transversal y Diagrama de Deformaciones */}
      <section className="bg-white border border-[#E8E3DA] rounded-xl p-5 print-card print-break-inside-avoid">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-semibold text-[#2D3748]">
              3. Sección Transversal, Refuerzo y Bloque de Compresión (A Escala)
            </h3>
            <p className="text-xs text-[#64748B]">
              Geometría b × h · Recubrimiento r = {inputs.cover} mm · Estribo Ø{inputs.stirrupDia} mm · {results.numBars} Var. {results.bar.label}
            </p>
          </div>
          <div className="font-mono tabular-nums text-xs text-[#2D3748] bg-[#FDFBF7] border border-[#E8E3DA] px-3 py-1.5 rounded-lg">
            a = {fmt(results.a)} mm · c = {fmt(results.c)} mm · εt = {results.epsilonT.toFixed(4)}
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${s3W} ${s3H}`}
            className="w-full h-auto max-h-[360px]"
            role="img"
            aria-label="Sección transversal de concreto reforzado a escala con bloque de compresión y diagrama de deformaciones"
          >
            <defs>
              <pattern
                id="concrete-dots"
                width="14"
                height="14"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="3" cy="4" r="0.8" fill="#CBD5E1" />
                <circle cx="10" cy="11" r="0.7" fill="#CBD5E1" />
                <polygon points="8,3 9.5,5 7,5.5" fill="#E2E8F0" />
              </pattern>
            </defs>

            {/* Concrete Section Body */}
            <rect
              x={secX0}
              y={secY0}
              width={drawW}
              height={drawH}
              fill="#F7F4ED"
              stroke="#2D3748"
              strokeWidth="2"
            />
            <rect
              x={secX0}
              y={secY0}
              width={drawW}
              height={drawH}
              fill="url(#concrete-dots)"
            />

            {/* Whitney Compression Block 'a' */}
            <rect
              x={secX0}
              y={secY0}
              width={drawW}
              height={aPx}
              fill="#E0BBE4"
              fillOpacity="0.62"
              stroke="#6B46C1"
              strokeWidth="1"
            />
            <text
              x={secX0 + drawW / 2}
              y={secY0 + Math.max(13, aPx / 2 + 4)}
              textAnchor="middle"
              className="font-mono text-[10px] font-semibold"
              fill="#2D3748"
            >
              a = {fmt(results.a)} mm
            </text>

            {/* Neutral Axis Line 'c' */}
            <line
              x1={secX0 - 16}
              y1={secY0 + cPx}
              x2={strainX0 + strainWidth * 0.7}
              y2={secY0 + cPx}
              stroke="#64748B"
              strokeWidth="1.2"
              strokeDasharray="5 4"
            />
            <text
              x={secX0 + drawW + 10}
              y={secY0 + cPx - 4}
              textAnchor="start"
              className="font-mono text-[10px] font-medium"
              fill="#475569"
            >
              E.N. (c = {fmt(results.c)} mm)
            </text>

            {/* Stirrup Perimeter */}
            <rect
              x={secX0 + coverPx}
              y={secY0 + coverPx}
              width={Math.max(10, drawW - 2 * coverPx)}
              height={Math.max(10, drawH - 2 * coverPx)}
              rx={Math.max(4, barRadiusPx)}
              fill="none"
              stroke="#475569"
              strokeWidth={Math.max(1.8, stirrupPx)}
            />

            {/* Rebar Layer 1 */}
            {row1Xs.map((bx, i) => (
              <circle
                key={`r1-${i}`}
                cx={bx}
                cy={barCenterY}
                r={barRadiusPx}
                fill="#A8D8EA"
                stroke="#2D3748"
                strokeWidth="1.8"
              />
            ))}

            {/* Rebar Layer 2 (if bars exceed 1 layer capacity) */}
            {row2Xs.map((bx, i) => (
              <circle
                key={`r2-${i}`}
                cx={bx}
                cy={row2Y}
                r={barRadiusPx}
                fill="#A8D8EA"
                stroke="#2D3748"
                strokeWidth="1.8"
              />
            ))}

            {/* Dimension: Width b (top) */}
            <line
              x1={secX0}
              y1={secY0 - 16}
              x2={secX1}
              y2={secY0 - 16}
              stroke="#2D3748"
              strokeWidth="1.2"
            />
            <line
              x1={secX0}
              y1={secY0 - 21}
              x2={secX0}
              y2={secY0 - 11}
              stroke="#2D3748"
              strokeWidth="1.2"
            />
            <line
              x1={secX1}
              y1={secY0 - 21}
              x2={secX1}
              y2={secY0 - 11}
              stroke="#2D3748"
              strokeWidth="1.2"
            />
            <text
              x={(secX0 + secX1) / 2}
              y={secY0 - 23}
              textAnchor="middle"
              className="font-mono text-[11px] font-semibold"
              fill="#2D3748"
            >
              b = {Math.round(results.b)} mm
            </text>

            {/* Dimension: Total Height h (left) */}
            <line
              x1={secX0 - 26}
              y1={secY0}
              x2={secX0 - 26}
              y2={secY1}
              stroke="#2D3748"
              strokeWidth="1.2"
            />
            <line
              x1={secX0 - 31}
              y1={secY0}
              x2={secX0 - 21}
              y2={secY0}
              stroke="#2D3748"
              strokeWidth="1.2"
            />
            <line
              x1={secX0 - 31}
              y1={secY1}
              x2={secX0 - 21}
              y2={secY1}
              stroke="#2D3748"
              strokeWidth="1.2"
            />
            <text
              x={secX0 - 35}
              y={(secY0 + secY1) / 2}
              textAnchor="middle"
              transform={`rotate(-90 ${secX0 - 35} ${(secY0 + secY1) / 2})`}
              className="font-mono text-[11px] font-semibold"
              fill="#2D3748"
            >
              h = {Math.round(results.h)} mm
            </text>

            {/* Dimension: Effective Depth d (right of section) */}
            <line
              x1={secX1 + 20}
              y1={secY0}
              x2={secX1 + 20}
              y2={barCenterY}
              stroke="#2D3748"
              strokeWidth="1.2"
            />
            <line
              x1={secX1 + 15}
              y1={secY0}
              x2={secX1 + 25}
              y2={secY0}
              stroke="#2D3748"
              strokeWidth="1.2"
            />
            <line
              x1={secX1 + 15}
              y1={barCenterY}
              x2={secX1 + 25}
              y2={barCenterY}
              stroke="#2D3748"
              strokeWidth="1.2"
            />
            <text
              x={secX1 + 32}
              y={(secY0 + barCenterY) / 2 + 4}
              textAnchor="start"
              className="font-mono text-[11px] font-semibold"
              fill="#2D3748"
            >
              d = {fmt(results.d)} mm
            </text>

            {/* Cover & Steel Summary Callout (bottom) */}
            <text
              x={(secX0 + secX1) / 2}
              y={secY1 + 22}
              textAnchor="middle"
              className="font-mono text-[11px] font-semibold"
              fill="#2D3748"
            >
              {results.numBars} Var. {results.bar.label} (As = {fmt(results.AsProv, 0)} mm²)
            </text>
            <text
              x={(secX0 + secX1) / 2}
              y={secY1 + 38}
              textAnchor="middle"
              className="font-mono text-[10px]"
              fill="#64748B"
            >
              r = {inputs.cover} mm · s_libre = {fmt(results.clearSpacing, 1)} mm
              {row2Count > 0 ? ' (2 capas)' : ''}
            </text>

            {/* Strain Distribution Diagram (Right Side) */}
            <text
              x={strainX0 + 25}
              y={26}
              textAnchor="middle"
              className="text-[12px] font-semibold"
              fill="#2D3748"
            >
              Deformaciones (ε)
            </text>

            {/* Vertical reference axis */}
            <line
              x1={strainX0}
              y1={strainTopY}
              x2={strainX0}
              y2={strainSteelY + 8}
              stroke="#2D3748"
              strokeWidth="1.5"
            />

            {/* Compression Strain Triangle (top to NA) */}
            <polygon
              points={`${strainX0},${strainTopY} ${strainX0 - epsCPx},${strainTopY} ${strainX0},${strainNaY}`}
              fill="#E0BBE4"
              fillOpacity="0.65"
              stroke="#2D3748"
              strokeWidth="1.4"
            />

            {/* Tension Strain Triangle (NA to d) */}
            <polygon
              points={`${strainX0},${strainNaY} ${strainX0 + epsTPx},${strainSteelY} ${strainX0},${strainSteelY}`}
              fill={strainFillColor}
              fillOpacity="0.7"
              stroke={strainStrokeColor}
              strokeWidth="1.4"
            />

            {/* Horizontal guides to steel */}
            <line
              x1={secX1 + 10}
              y1={barCenterY}
              x2={strainX0 + epsTPx + 8}
              y2={strainSteelY}
              stroke="#94A3B8"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Strain labels */}
            <text
              x={strainX0 - epsCPx - 4}
              y={strainTopY - 6}
              textAnchor="middle"
              className="font-mono text-[10px] font-semibold"
              fill="#2D3748"
            >
              εcu = 0.0030
            </text>
            <text
              x={strainX0 + epsTPx + 6}
              y={strainSteelY + 4}
              textAnchor="start"
              className="font-mono text-[11px] font-semibold"
              fill={strainStrokeColor}
            >
              εt = {results.epsilonT.toFixed(4)}
            </text>
            <text
              x={strainX0 + 8}
              y={strainSteelY + 22}
              textAnchor="start"
              className="font-mono text-[10px] font-medium"
              fill={strainStrokeColor}
            >
              {results.cumpleDuctility
                ? '≥ 0.005 (Dúctil, φ = 0.90)'
                : `< 0.005 (φ = ${results.phi.toFixed(2)})`}
            </text>
          </svg>
        </div>
      </section>
    </div>
  );
};
