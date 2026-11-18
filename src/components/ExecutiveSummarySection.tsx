import React from 'react';
import { CheckCircle2, AlertTriangle, BookOpen, Activity, ShieldCheck } from 'lucide-react';
import { BeamInputs, BeamResults } from '../utils/beamCalculator';

interface ExecutiveSummarySectionProps {
  inputs: BeamInputs;
  results: BeamResults;
}

const CriterionBadge: React.FC<{ ok: boolean | null; label: string }> = ({
  ok,
  label,
}) => {
  if (ok === null) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-[#475569]">
        {label}
      </span>
    );
  }
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#C1E1C1]/70 text-[#1E4D2B] text-xs font-semibold whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FFB7B2]/80 text-[#7A1F1F] text-xs font-semibold whitespace-nowrap">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
};

export const ExecutiveSummarySection: React.FC<ExecutiveSummarySectionProps> = ({
  inputs,
  results,
}) => {
  const fmt = (n: number, dec = 2) =>
    Number.isFinite(n) ? n.toFixed(dec) : '—';

  const epsLimit = Math.max(0.005, results.epsilonTy + 0.003);
  const reserveMargin = results.phiMn - results.Mu;
  const isEconomical =
    results.cumpleGlobal &&
    results.utilizationPct >= 65 &&
    results.utilizationPct <= 100;

  const summaryRows: Array<{
    param: string;
    symbol: string;
    value: string;
    unit: string;
    ok: boolean | null;
    status: string;
  }> = [
    {
      param: 'Sección transversal',
      symbol: 'b × h',
      value: `${Math.round(results.b)} × ${Math.round(results.h)}`,
      unit: 'mm',
      ok: results.hCumpleMin,
      status: results.hCumpleMin
        ? `Cumple (h ≥ ${fmt(results.hMin, 1)} mm)`
        : `h < h_min (${fmt(results.hMin, 1)} mm)`,
    },
    {
      param: 'Peralte efectivo',
      symbol: 'd',
      value: fmt(results.d),
      unit: 'mm',
      ok: results.geometryValid,
      status: results.geometryValid ? 'Geometría válida' : 'Peralte insuficiente',
    },
    {
      param: 'Carga última mayorada',
      symbol: 'Wu',
      value: fmt(results.wU),
      unit: 'kN/m',
      ok: null,
      status: 'Combinación 1.2D + 1.6L',
    },
    {
      param: 'Momento último actuante',
      symbol: 'Mu',
      value: fmt(results.Mu, 3),
      unit: 'kN·m',
      ok: null,
      status: 'Momento máximo en L/2',
    },
    {
      param: 'Cortante máximo en apoyos',
      symbol: 'Vu',
      value: fmt(results.reaction),
      unit: 'kN',
      ok: null,
      status: 'Reacción RA = RB',
    },
    {
      param: 'Acero longitudinal mínimo',
      symbol: 'As,min',
      value: fmt(results.AsMin),
      unit: 'mm²',
      ok: null,
      status: 'ACI 318-19 Sec. 9.6.1.2',
    },
    {
      param: 'Acero longitudinal requerido',
      symbol: 'As,req',
      value: results.sectionAdequateForSingleReinf ? fmt(results.AsReq) : 'N/A',
      unit: 'mm²',
      ok: results.sectionAdequateForSingleReinf,
      status: results.sectionAdequateForSingleReinf
        ? 'Equilibrio cuadrático'
        : 'Sección insuficiente (Δ < 0)',
    },
    {
      param: 'Calibre de varilla propuesto y cantidad',
      symbol: 'n · Var.',
      value: `${results.numBars} ${results.bar.label}`,
      unit: `db = ${results.bar.db.toFixed(2)} mm`,
      ok: results.cumpleSpacingSingleLayer,
      status: results.cumpleSpacingSingleLayer
        ? `1 capa OK (s = ${fmt(results.clearSpacing, 1)} mm)`
        : `Requiere 2 capas (s = ${fmt(results.clearSpacing, 1)} mm)`,
    },
    {
      param: 'Acero longitudinal provisto',
      symbol: 'As,prov',
      value: fmt(results.AsProv, 0),
      unit: 'mm²',
      ok: results.cumpleAsMin,
      status: results.cumpleAsMin ? 'Cumple (As,prov ≥ As,min)' : 'Menor a As,min',
    },
    {
      param: 'Bloque de compresión y eje neutro',
      symbol: 'a / c',
      value: `${fmt(results.a)} / ${fmt(results.c)}`,
      unit: 'mm',
      ok: null,
      status: `β1 = ${results.beta1.toFixed(2)}`,
    },
    {
      param: 'Deformación unitaria neta del acero',
      symbol: 'εt',
      value: results.epsilonT.toFixed(4),
      unit: 'mm/mm',
      ok: results.cumpleDuctility,
      status: results.cumpleDuctility
        ? `Cumple (≥ ${epsLimit.toFixed(4)})`
        : `Falla ductilidad (< ${epsLimit.toFixed(4)})`,
    },
    {
      param: 'Factor de reducción de resistencia',
      symbol: 'φ',
      value: results.phi.toFixed(2),
      unit: '—',
      ok: results.phi >= 0.9,
      status:
        results.ductilityZone === 'traccion'
          ? 'Controlada por tracción'
          : results.ductilityZone === 'transicion'
            ? 'Zona de transición'
            : 'Controlada por compresión',
    },
    {
      param: 'Momento nominal resistente',
      symbol: 'Mn',
      value: fmt(results.Mn),
      unit: 'kN·m',
      ok: null,
      status: `Brazo z = ${fmt(results.z)} mm`,
    },
    {
      param: 'Resistencia de diseño a flexión',
      symbol: 'φMn',
      value: fmt(results.phiMn),
      unit: 'kN·m',
      ok: results.cumpleFlexion,
      status: results.cumpleFlexion ? 'Cumple (φMn ≥ Mu)' : 'No cumple (φMn < Mu)',
    },
    {
      param: 'Porcentaje de eficiencia estructural',
      symbol: '% Uso',
      value: `${fmt(results.utilizationPct, 1)}%`,
      unit: '%',
      ok: results.cumpleFlexion,
      status: results.cumpleFlexion
        ? `Margen +${fmt(reserveMargin)} kN·m`
        : `Déficit ${fmt(Math.abs(reserveMargin))} kN·m`,
    },
  ];

  // Dynamic conclusion issues list
  const issues: string[] = [];
  if (!results.geometryValid) {
    issues.push('aumentar la altura h o ajustar el recubrimiento para obtener un peralte efectivo válido');
  }
  if (!results.hCumpleMin) {
    issues.push(`incrementar la altura h al menos hasta ${fmt(results.hMin, 1)} mm (L/16) para controlar deflexiones`);
  }
  if (!results.cumpleFlexion) {
    issues.push(
      inputs.mode === 'verify'
        ? `incrementar el número de barras (actualmente ${results.numBars} ${results.bar.label}) o aumentar el peralte h`
        : 'incrementar las dimensiones de la sección (b o h) o la resistencia del concreto f\'c'
    );
  }
  if (!results.cumpleAsMin) {
    issues.push(`aumentar el acero provisto por encima del mínimo normativo (${fmt(results.AsMin)} mm²)`);
  }
  if (!results.cumpleDuctility) {
    issues.push('aumentar la altura h o f\'c (o reducir la cuantía de acero) para garantizar εt ≥ 0.005 y falla dúctil');
  }
  if (!results.cumpleSpacingSingleLayer) {
    issues.push(
      `distribuir las ${results.numBars} barras en 2 capas o ampliar el ancho b para cumplir el espaciamiento libre mínimo`
    );
  }

  return (
    <section
      aria-label="Resumen Ejecutivo, Conclusión e Interpretación"
      className="bg-white border border-[#E8E3DA] rounded-xl p-6 space-y-6 print-card"
    >
      {/* Cabecera de la sección */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8E3DA]">
        <div>
          <h3 className="text-lg font-bold text-[#2D3748]">
            Resumen Ejecutivo, Conclusión e Interpretación
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Síntesis normativa ACI 318-19 y diagnóstico físico del comportamiento estructural
          </p>
        </div>
        <CriterionBadge
          ok={results.cumpleGlobal}
          label={results.cumpleGlobal ? 'DICTAMEN: APTO PARA CONSTRUCCIÓN' : 'DICTAMEN: REQUIERE AJUSTES'}
        />
      </div>

      {/* 1. Tabla de Valores Finales */}
      <div className="print-break-inside-avoid">
        <h4 className="text-sm font-bold text-[#2D3748] mb-3">
          1. Tabla de Valores Finales
        </h4>
        <div className="overflow-x-auto border border-[#E8E3DA] rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FDFBF7] border-b border-[#E8E3DA] text-[11px] font-semibold text-[#475569]">
                <th className="py-2.5 px-3">Parámetro</th>
                <th className="py-2.5 px-3">Símbolo</th>
                <th className="py-2.5 px-3 text-right">Valor Calculado</th>
                <th className="py-2.5 px-3">Unidad</th>
                <th className="py-2.5 px-3">Estado / Criterio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E3DA] text-xs">
              {summaryRows.map((row) => (
                <tr key={row.param} className="hover:bg-[#FDFBF7]/70 transition-colors">
                  <td className="py-2 px-3 font-medium text-[#2D3748]">{row.param}</td>
                  <td className="py-2 px-3 font-mono text-[#475569]">{row.symbol}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-[#2D3748]">
                    {row.value}
                  </td>
                  <td className="py-2 px-3 font-mono text-[#64748B]">{row.unit}</td>
                  <td className="py-2 px-3">
                    <CriterionBadge ok={row.ok} label={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Conclusión General */}
      <div
        className={`p-4 rounded-lg border print-break-inside-avoid ${
          results.cumpleGlobal
            ? 'bg-[#C1E1C1]/30 border-[#9AC79A]'
            : 'bg-[#FFB7B2]/30 border-[#E89892]'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck
            className={`w-4 h-4 shrink-0 ${
              results.cumpleGlobal ? 'text-[#1E4D2B]' : 'text-[#7A1F1F]'
            }`}
            aria-hidden="true"
          />
          <h4 className="text-sm font-bold text-[#2D3748]">
            2. Conclusión General del Diseño
          </h4>
        </div>
        {results.cumpleGlobal ? (
          <p className="text-xs sm:text-sm text-[#2D3748] leading-relaxed">
            La viga rectangular de sección{' '}
            <strong className="font-mono">{Math.round(results.b)} × {Math.round(results.h)} mm</strong>{' '}
            armada con{' '}
            <strong className="font-mono">
              {results.numBars} varillas {results.bar.label} (As,prov = {fmt(results.AsProv, 0)} mm²)
            </strong>{' '}
            es <strong>estructuralmente segura y apta para construcción</strong> bajo todos los requisitos del código ACI 318-19. La resistencia de diseño{' '}
            <strong className="font-mono">φMn = {fmt(results.phiMn)} kN·m</strong> supera al momento último actuante{' '}
            <strong className="font-mono">Mu = {fmt(results.Mu)} kN·m</strong> con un aprovechamiento del{' '}
            <strong className="font-mono">{fmt(results.utilizationPct, 1)}%</strong>, garantizando un diseño{' '}
            {isEconomical
              ? 'eficiente y económico sin sobredimensionamiento excesivo'
              : 'conservador con amplia reserva resistente'}
            {results.cumpleSpacingSingleLayer
              ? ' y una colocación holgada del refuerzo en una sola capa.'
              : ', aunque requiere acomodar el refuerzo en 2 capas por ancho limitado.'}
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-[#2D3748] leading-relaxed">
            La configuración actual de{' '}
            <strong className="font-mono">{Math.round(results.b)} × {Math.round(results.h)} mm</strong>{' '}
            con{' '}
            <strong className="font-mono">
              {results.numBars} varillas {results.bar.label}
            </strong>{' '}
            <strong>no cumple íntegramente los criterios del código ACI 318-19</strong> y no es apta para construcción sin modificaciones. Para corregir el diseño se recomienda:{' '}
            {issues.join('; ')}.
          </p>
        )}
      </div>

      {/* 3. Qué significan los resultados normativos */}
      <div className="print-break-inside-avoid">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-[#2D3748]" aria-hidden="true" />
          <h4 className="text-sm font-bold text-[#2D3748]">
            3. Qué significan los resultados normativos
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#2D3748]">
                Resistencia a flexión (φMn ≥ Mu)
              </span>
              <CriterionBadge
                ok={results.cumpleFlexion}
                label={results.cumpleFlexion ? 'CUMPLE' : 'NO CUMPLE'}
              />
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              {results.cumpleFlexion
                ? `La sección trabaja al ${fmt(results.utilizationPct, 1)}% de su capacidad de diseño, dejando un margen de seguridad adicional de +${fmt(reserveMargin)} kN·m por encima de las cargas ya mayoradas (1.2D + 1.6L).`
                : `La demanda supera la capacidad de diseño en ${fmt(Math.abs(reserveMargin))} kN·m (${fmt(results.utilizationPct, 1)}% de uso), indicando déficit de resistencia a flexión.`}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#2D3748]">
                Acero longitudinal mínimo (As,prov ≥ As,min)
              </span>
              <CriterionBadge
                ok={results.cumpleAsMin}
                label={results.cumpleAsMin ? 'CUMPLE' : 'NO CUMPLE'}
              />
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              {results.cumpleAsMin
                ? `Al proveer ${fmt(results.AsProv, 0)} mm² (mayor al mínimo de ${fmt(results.AsMin)} mm²), se garantiza que cuando el concreto inferior se agriete por tensión, el acero tenga capacidad suficiente para tomar la fuerza súbita y evitar un colapso instantáneo.`
                : `El acero provisto (${fmt(results.AsProv, 0)} mm²) es inferior al mínimo normativo (${fmt(results.AsMin)} mm²), lo que expone a la viga a una falla frágil repentina apenas se alcance el momento de agrietamiento del concreto.`}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#2D3748]">
                Factor de reducción de resistencia (φ)
              </span>
              <CriterionBadge
                ok={results.phi >= 0.9}
                label={`φ = ${results.phi.toFixed(2)}`}
              />
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              {results.ductilityZone === 'traccion'
                ? `El factor se mantiene en φ = 0.90 porque la deformación del acero (εt = ${results.epsilonT.toFixed(4)}) supera el límite de sección controlada por tracción (${epsLimit.toFixed(4)}), premiando la ductilidad de la viga.`
                : results.ductilityZone === 'transicion'
                  ? `El factor bajó a φ = ${results.phi.toFixed(2)} porque la sección cayó en la zona de transición (εty < εt < ${epsLimit.toFixed(4)}), penalizando la resistencia por baja ductilidad.`
                  : `El factor descendió al mínimo φ = 0.65 porque el acero ni siquiera alcanza su fluencia (εt ≤ ${results.epsilonTy.toFixed(4)}), penalizando severamente el diseño por falla controlada por compresión.`}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#E8E3DA] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#2D3748]">
                Espaciamiento libre entre barras
              </span>
              <CriterionBadge
                ok={results.cumpleSpacingSingleLayer}
                label={results.cumpleSpacingSingleLayer ? '1 CAPA OK' : '2 CAPAS REQ.'}
              />
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              {results.cumpleSpacingSingleLayer
                ? `El espacio libre horizontal es de ${fmt(results.clearSpacing, 1)} mm (superior al mínimo de ${fmt(results.minRequiredSpacing, 1)} mm), permitiendo que el concreto fresco y el agregado grueso pasen sin trabarse y evitando cangrejeras.`
                : `En una sola capa el espacio libre sería de ${fmt(results.clearSpacing, 1)} mm (< ${fmt(results.minRequiredSpacing, 1)} mm), lo cual obstruiría el paso del agregado generando cangrejeras. Se requiere colocar el armado en 2 capas (máx. ${results.maxBarsOneLayer} varillas por fila) o ensanchar b.`}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Cómo se comporta la viga bajo carga */}
      <div
        className={`p-4 rounded-lg border print-break-inside-avoid ${
          results.epsilonT >= epsLimit - 1e-7
            ? 'bg-[#A8D8EA]/25 border-[#8AC4DA]'
            : 'bg-[#FFB7B2]/25 border-[#E89892]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2D3748]" aria-hidden="true" />
            <h4 className="text-sm font-bold text-[#2D3748]">
              4. Cómo se comporta la viga bajo carga (Análisis de Deformación εt)
            </h4>
          </div>
          <span className="font-mono tabular-nums text-xs font-semibold text-[#2D3748]">
            εt = {results.epsilonT.toFixed(4)} vs. (εty + 0.003 = {epsLimit.toFixed(4)})
          </span>
        </div>

        {results.epsilonT >= epsLimit - 1e-7 ? (
          <p className="text-xs sm:text-sm text-[#2D3748] leading-relaxed">
            Dado que <strong className="font-mono">εt = {results.epsilonT.toFixed(4)} ≥ {epsLimit.toFixed(4)}</strong>, la sección está{' '}
            <strong>controlada por tensión</strong> y desarrollará un{' '}
            <strong>comportamiento dúctil</strong>. Ante cargas crecientes y antes de alcanzar el colapso, el acero inferior entrará ampliamente en fluencia (superando su deformación de fluencia{' '}
            <span className="font-mono">εty = {results.epsilonTy.toFixed(4)}</span>), produciendo deflexiones visibles y grietas progresivas en la zona inferior de tracción. Estas señales actúan como una{' '}
            <strong>advertencia temprana</strong> clara para los ocupantes antes de que la fibra superior de concreto alcance su deformación última de aplastamiento (<span className="font-mono">εcu = 0.003</span>).
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-[#2D3748] leading-relaxed">
            Dado que <strong className="font-mono">εt = {results.epsilonT.toFixed(4)} &lt; {epsLimit.toFixed(4)}</strong>, la sección se encuentra en{' '}
            <strong>{results.ductilityZone === 'transicion' ? 'zona de transición' : 'zona controlada por compresión'}</strong> y presenta riesgo de{' '}
            <strong>comportamiento frágil</strong>. Bajo cargas crecientes, el concreto superior podría aplastarse al alcanzar{' '}
            <span className="font-mono">εcu = 0.003</span> sin que el acero inferior haya fluido lo suficiente para generar deflexiones y agrietamiento visibles de aviso. Se recomienda{' '}
            <strong>aumentar el peralte h o la resistencia del concreto f&apos;c</strong> (o reducir la cantidad de acero en tracción) para devolver la sección al rango dúctil.
          </p>
        )}
      </div>
    </section>
  );
};
