import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { BeamInputs, BeamResults } from '../utils/beamCalculator';

interface CalculationMemoryProps {
  inputs: BeamInputs;
  results: BeamResults;
}

const StatusTag: React.FC<{ ok: boolean; okText?: string; failText?: string }> = ({
  ok,
  okText = 'CUMPLE',
  failText = 'NO CUMPLE',
}) => {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#C1E1C1] text-[#1E4D2B] font-semibold text-xs whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        {okText}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFB7B2] text-[#7A1F1F] font-semibold text-xs whitespace-nowrap shrink-0">
      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
      {failText}
    </span>
  );
};

export const CalculationMemory: React.FC<CalculationMemoryProps> = ({
  inputs,
  results,
}) => {
  const fmt = (n: number, dec = 2) =>
    Number.isFinite(n) ? n.toFixed(dec) : '—';

  const utilClamped = Math.min(100, Math.max(0, results.utilizationPct));

  return (
    <section className="bg-white border border-[#E8E3DA] rounded-xl p-6 print-card">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#E8E3DA]">
        <div>
          <h3 className="text-lg font-bold text-[#2D3748]">
            Memoria de Cálculo Paso a Paso (ACI 318-19)
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Modalidad:{' '}
            {inputs.mode === 'design'
              ? 'Modo Diseño (Automático)'
              : 'Modo Verificación de Sección Existente'}{' '}
            · Sistema Internacional (SI)
          </p>
        </div>
        <StatusTag
          ok={results.cumpleGlobal}
          okText="DISEÑO CUMPLE ACI 318-19"
          failText="REQUIERE AJUSTE DE SECCIÓN"
        />
      </div>

      <div className="space-y-5">
        {/* Paso 0: Predimensionamiento Automático */}
        <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] print-break-inside-avoid">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-bold text-[#2D3748]">
              Paso 0. Predimensionamiento Automático de la Sección
            </h4>
            <StatusTag
              ok={results.hCumpleMin}
              okText="h ≥ h_min CUMPLE"
              failText="h < h_min NO CUMPLE"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono tabular-nums text-[#2D3748]">
            <div>
              <span className="text-[#64748B] block font-sans">
                Altura mínima estimada (Tabla 9.3.1.1):
              </span>
              h<sub>min</sub> = L / 16 = {(inputs.L * 1000).toFixed(0)} / 16 ={' '}
              <strong>{fmt(results.hMin, 1)} mm</strong>
            </div>
            <div>
              <span className="text-[#64748B] block font-sans">
                {inputs.mode === 'verify'
                  ? 'Sección ingresada para verificación:'
                  : inputs.manualDims
                    ? 'Sección sobrescrita manualmente:'
                    : 'Sección comercial adoptada (b ≈ h/2):'}
              </span>
              h = <strong>{Math.round(results.h)} mm</strong> · b<sub>calc</sub> = h/2 ={' '}
              {fmt(results.h / 2, 1)} mm → b = <strong>{Math.round(results.b)} mm</strong>
            </div>
          </div>
        </div>

        {/* Paso 1: Análisis de Cargas y Momento Último */}
        <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] print-break-inside-avoid">
          <h4 className="text-sm font-bold text-[#2D3748] mb-2">
            Paso 1. Análisis de Cargas y Momento Último (M<sub>u</sub>)
          </h4>
          <div className="space-y-1.5 text-xs font-mono tabular-nums text-[#2D3748]">
            <div>
              W<sub>pp</sub> = γ<sub>c</sub> · b · h = {fmt(inputs.gammaC, 1)} ×{' '}
              {fmt(results.b / 1000, 2)} × {fmt(results.h / 1000, 2)} ={' '}
              <strong>{fmt(results.wSelf)} kN/m</strong>
            </div>
            <div>
              W<sub>D</sub> = W<sub>pp</sub> + D<sub>adic</sub> = {fmt(results.wSelf)} +{' '}
              {fmt(inputs.wDeadAdd)} = <strong>{fmt(results.wDeadTotal)} kN/m</strong>
            </div>
            <div>
              W<sub>u</sub> = 1.2 W<sub>D</sub> + 1.6 W<sub>L</sub> = 1.2(
              {fmt(results.wDeadTotal)}) + 1.6({fmt(inputs.wLive)}) ={' '}
              <strong>{fmt(results.wU)} kN/m</strong>
            </div>
            <div className="pt-1 flex flex-wrap gap-x-6 gap-y-1">
              <span>
                R<sub>A</sub> = R<sub>B</sub> = V<sub>máx</sub> = W<sub>u</sub>·L / 2 ={' '}
                <strong>{fmt(results.reaction)} kN</strong>
              </span>
              <span>
                M<sub>u</sub> = W<sub>u</sub>·L² / 8 ={' '}
                <strong className="bg-[#E0BBE4]/50 px-1.5 py-0.5 rounded">
                  {fmt(results.Mu, 3)} kN·m
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Paso 2: Peralte Efectivo Inicial y Acero Requerido */}
        <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] print-break-inside-avoid">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-bold text-[#2D3748]">
              Paso 2. Peralte Efectivo Inicial (d) y Acero Requerido (A<sub>s,req</sub>)
            </h4>
            {!results.sectionAdequateForSingleReinf && (
              <StatusTag ok={false} failText="SECCIÓN INSUFICIENTE (Δ < 0)" />
            )}
          </div>
          <div className="space-y-1.5 text-xs font-mono tabular-nums text-[#2D3748]">
            <div>
              d<sub>est</sub> = h − r − d<sub>e</sub> − d<sub>b,ref</sub>/2 ={' '}
              <strong>{fmt(results.dEst)} mm</strong>
            </div>
            <div className="text-[#64748B]">
              [ f<sub>y</sub> / (1.7 · f&apos;<sub>c</sub> · b) ] A<sub>s</sub>² − d · A
              <sub>s</sub> + [ M<sub>u</sub> / (φ · f<sub>y</sub>) ] = 0 &nbsp;(φ = 0.90)
            </div>
            <div>
              {results.quadA.toFixed(5)} A<sub>s</sub>² − {fmt(results.quadB)} A<sub>s</sub> +{' '}
              {fmt(results.quadC, 1)} = 0
            </div>
            <div>
              {results.sectionAdequateForSingleReinf ? (
                <>
                  A<sub>s,req</sub> ={' '}
                  <strong className="bg-[#A8D8EA]/45 px-1.5 py-0.5 rounded">
                    {fmt(results.AsReq)} mm²
                  </strong>
                  {inputs.mode === 'verify' && (
                    <span className="text-[#64748B] ml-2 font-sans">
                      (Referencia teórica para M<sub>u</sub>)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[#7A1F1F] font-sans font-semibold">
                  La sección es insuficiente para resistir M<sub>u</sub> como viga simplemente
                  reforzada. Aumenta h, b o f&apos;<sub>c</sub>.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Paso 3: Acero Longitudinal Mínimo */}
        <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] print-break-inside-avoid">
          <h4 className="text-sm font-bold text-[#2D3748] mb-2">
            Paso 3. Acero Longitudinal Mínimo (ACI 318-19 Sec. 9.6.1.2)
          </h4>
          <div className="space-y-1 text-xs font-mono tabular-nums text-[#2D3748]">
            <div>
              A<sub>s,min,1</sub> = (0.25 √f&apos;<sub>c</sub> / f<sub>y</sub>) · b · d ={' '}
              {fmt(results.AsMin1)} mm²
            </div>
            <div>
              A<sub>s,min,2</sub> = (1.4 / f<sub>y</sub>) · b · d = {fmt(results.AsMin2)} mm²
            </div>
            <div>
              A<sub>s,min</sub> = máx(A<sub>s,min,1</sub>, A<sub>s,min,2</sub>) ={' '}
              <strong>{fmt(results.AsMin)} mm²</strong>
              {' · '}A<sub>s,diseño</sub> = máx(A<sub>s,req</sub>, A<sub>s,min</sub>) ={' '}
              <strong>{fmt(results.AsDesignTarget)} mm²</strong>
            </div>
          </div>
        </div>

        {/* Paso 4: Propuesta Automática de Varilla Comercial */}
        <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] print-break-inside-avoid">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-bold text-[#2D3748]">
              Paso 4.{' '}
              {inputs.mode === 'design'
                ? 'Propuesta Automática de Varilla Comercial (Calibre y Cantidad)'
                : 'Armado Evaluado en Sección Existente'}
            </h4>
            <div className="flex items-center gap-2">
              <StatusTag
                ok={results.cumpleAsMin}
                okText="As,prov ≥ As,min"
                failText="As,prov < As,min"
              />
              <StatusTag
                ok={results.cumpleSpacingSingleLayer}
                okText="1 CAPA OK"
                failText="2 CAPAS REQ."
              />
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono tabular-nums text-[#2D3748]">
            <div>
              {inputs.mode === 'design' ? 'Selección automática óptima:' : 'Armado manual:'}{' '}
              <strong className="bg-[#C1E1C1]/70 px-1.5 py-0.5 rounded">
                {results.numBars} varillas {results.bar.label}
              </strong>{' '}
              (d<sub>b</sub> = {results.bar.db.toFixed(2)} mm · A<sub>b</sub> ={' '}
              {results.bar.Ab} mm²) → A<sub>s,prov</sub> ={' '}
              <strong>{fmt(results.AsProv, 0)} mm²</strong>
            </div>
            <div>
              Espaciamiento libre s<sub>libre</sub> = {fmt(results.clearSpacing, 1)} mm (mín.{' '}
              {fmt(results.minRequiredSpacing, 1)} mm)
            </div>

            {inputs.mode === 'design' && results.candidates.length > 0 && (
              <div className="pt-2">
                <span className="block font-sans text-[11px] font-semibold text-[#64748B] mb-1.5">
                  Alternativas comerciales evaluadas (No. 3 a No. 10 · criterio: A<sub>s</sub> ≥ A
                  <sub>s,diseño</sub>, 1 capa y mínimo desperdicio):
                </span>
                <div className="overflow-x-auto border border-[#E8E3DA] rounded-md bg-white">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#FDFBF7] border-b border-[#E8E3DA] text-[#64748B] font-sans">
                        <th className="py-1.5 px-2.5">Opción</th>
                        <th className="py-1.5 px-2.5 text-right">As,prov (mm²)</th>
                        <th className="py-1.5 px-2.5 text-right">s libre (mm)</th>
                        <th className="py-1.5 px-2.5 text-right">φMn (kN·m)</th>
                        <th className="py-1.5 px-2.5 text-right">% Uso</th>
                        <th className="py-1.5 px-2.5">Selección</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E3DA]">
                      {results.candidates.map((cand) => (
                        <tr
                          key={`${cand.bar.id}-${cand.numBars}`}
                          className={cand.selected ? 'bg-[#C1E1C1]/35 font-semibold' : ''}
                        >
                          <td className="py-1.5 px-2.5">
                            {cand.numBars} {cand.bar.label}
                          </td>
                          <td className="py-1.5 px-2.5 text-right">{cand.AsProv}</td>
                          <td className="py-1.5 px-2.5 text-right">
                            {cand.clearSpacing.toFixed(1)}
                          </td>
                          <td className="py-1.5 px-2.5 text-right">{cand.phiMn.toFixed(2)}</td>
                          <td className="py-1.5 px-2.5 text-right">
                            {cand.utilizationPct.toFixed(1)}%
                          </td>
                          <td className="py-1.5 px-2.5 font-sans">
                            {cand.selected
                              ? 'Óptima seleccionada'
                              : !cand.fitsOneLayer
                                ? 'No cabe en 1 capa'
                                : !cand.cumpleFlexion
                                  ? 'φMn < Mu'
                                  : 'Alternativa válida'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Paso 5: Peralte Efectivo Final y Bloque Equivalente */}
        <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] print-break-inside-avoid">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-bold text-[#2D3748]">
              Paso 5. Peralte Efectivo Final (d) y Bloque de Compresión (a)
            </h4>
            {!results.geometryValid && (
              <StatusTag ok={false} failText="PERALTE INSUFICIENTE" />
            )}
          </div>
          <div className="space-y-1.5 text-xs font-mono tabular-nums text-[#2D3748]">
            <div>
              d = h − r − d<sub>e</sub> − d<sub>b</sub>/2 = {Math.round(results.h)} −{' '}
              {inputs.cover} − {inputs.stirrupDia} − ({results.bar.db.toFixed(2)} / 2) ={' '}
              <strong className="bg-[#A8D8EA]/45 px-1.5 py-0.5 rounded">
                {fmt(results.d)} mm
              </strong>
            </div>
            <div>
              a = (A<sub>s,prov</sub> · f<sub>y</sub>) / (0.85 · f&apos;<sub>c</sub> · b) = (
              {fmt(results.AsProv, 0)} × {inputs.fy}) / (0.85 × {inputs.fc} ×{' '}
              {Math.round(results.b)}) = <strong>{fmt(results.a)} mm</strong>
            </div>
          </div>
        </div>

        {/* Paso 6: Momento Nominal y Verificación de Ductilidad */}
        <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] print-break-inside-avoid">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-bold text-[#2D3748]">
              Paso 6. Momento Nominal (M<sub>n</sub>) y Verificación de Ductilidad (ACI 318-19 Sec. 9.3.3.1)
            </h4>
            <StatusTag
              ok={results.cumpleDuctility}
              okText="εt ≥ 0.005 (φ = 0.90) CUMPLE"
              failText={`εt < 0.005 (φ = ${results.phi.toFixed(2)})`}
            />
          </div>
          <div className="space-y-1 text-xs font-mono tabular-nums text-[#2D3748]">
            <div>
              z = d − a/2 = {fmt(results.d)} − {fmt(results.a / 2)} ={' '}
              <strong>{fmt(results.z)} mm</strong> · M<sub>n</sub> = A<sub>s,prov</sub> · f
              <sub>y</sub> · z = <strong>{fmt(results.Mn)} kN·m</strong>
            </div>
            <div>
              β<sub>1</sub> = {results.beta1.toFixed(3)} · c = a / β<sub>1</sub> ={' '}
              {fmt(results.a)} / {results.beta1.toFixed(3)} = <strong>{fmt(results.c)} mm</strong>
            </div>
            <div>
              ε<sub>t</sub> = 0.003 · (d − c) / c = 0.003 · ({fmt(results.d)} −{' '}
              {fmt(results.c)}) / {fmt(results.c)} ={' '}
              <strong>{results.epsilonT.toFixed(4)}</strong> (
              {results.ductilityZone === 'traccion'
                ? 'Controlada por tracción · Falla dúctil'
                : results.ductilityZone === 'transicion'
                  ? 'Zona de transición · Ductilidad reducida'
                  : 'Controlada por compresión · Falla frágil'}
              )
            </div>
          </div>
        </div>

        {/* Paso 7: Resistencia de Diseño y Eficiencia */}
        <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] print-break-inside-avoid">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-bold text-[#2D3748]">
              Paso 7. Resistencia de Diseño (φM<sub>n</sub>) y Eficiencia Estructural
            </h4>
            <StatusTag
              ok={results.cumpleFlexion}
              okText="φMn ≥ Mu CUMPLE"
              failText="φMn < Mu NO CUMPLE"
            />
          </div>
          <div className="space-y-2 text-xs font-mono tabular-nums text-[#2D3748]">
            <div>
              φM<sub>n</sub> = {results.phi.toFixed(2)} × {fmt(results.Mn)} ={' '}
              <strong className="bg-[#C1E1C1]/70 px-1.5 py-0.5 rounded">
                {fmt(results.phiMn)} kN·m
              </strong>{' '}
              vs M<sub>u</sub> = <strong>{fmt(results.Mu, 3)} kN·m</strong>
            </div>
            <div>
              Capacidad utilizada: M<sub>u</sub> / (φM<sub>n</sub>) × 100 ={' '}
              <strong>{fmt(results.utilizationPct, 1)}%</strong>
            </div>
            <div className="w-full h-3 bg-[#E8E3DA] rounded-full overflow-hidden mt-1">
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${utilClamped}%`,
                  backgroundColor: results.cumpleFlexion ? '#C1E1C1' : '#FFB7B2',
                  borderRight: '2px solid #2D3748',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
